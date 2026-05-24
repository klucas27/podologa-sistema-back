# Segurança, Validação, Rate Limiting e RBAC

Guia de referência sobre as camadas de segurança implementadas no backend.

---

## 1. Validação de Input (Zod)

**O que é:** Todas as rotas que aceitam dados do cliente usam o middleware `validate()` com schemas **Zod** para validar `body`, `params` e `query` antes de chegar ao controller.

**Como funciona:**

```typescript
// Exemplo em uma rota
router.post(
  "/",
  sensitiveLimiter,
  validate({ body: createPatientSchema }),
  ctrl.create,
);
```

Em caso de falha de validação, o middleware retorna `400 Bad Request` com os erros estruturados — o handler nunca é chamado.

**Por que Zod:**
- Schema-first com inferência de tipos TypeScript automática
- Validação centralizada evita inconsistências entre rotas
- Fail-fast com erros 400 estruturados (campo a campo)

**Ameaças mitigadas (STRIDE):** Tampering, Spoofing, Repudiation

**Vulnerabilidades prevenidas:**

- **SQLi**: Zod força tipos e formatos, impedindo que strings arbitrárias cheguem às queries
- **NoSQLi**: schemas impedem objetos inesperados com operadores maliciosos
- **XSS**: dados com shape inválido são rejeitados antes do armazenamento

---

## 2. Sanitização de Saída

Antes de retornar dados ao cliente, use `sanitizeOutput(result)` de `src/shared/utils/` para remover campos sensíveis (ex: `password_hash`, campos internos) das respostas.

```typescript
res.json({ status: "ok", data: sanitizeOutput(result) });
```

---

## 3. Autenticação JWT — Cookie HttpOnly

**O que é:** JWT armazenado em cookie `HttpOnly + Secure + SameSite=Strict + signed`, nunca exposto em respostas JSON.

**Por que cookie em vez de header:**

| Propriedade       | Benefício                                          |
| ----------------- | -------------------------------------------------- |
| `HttpOnly`        | JS no browser não consegue ler o token (mitiga XSS)|
| `Secure`          | Só trafega em HTTPS (mitiga MITM)                  |
| `SameSite=Strict` | Não enviado em requests cross-site (mitiga CSRF)   |
| `signed`          | HMAC de integridade com `COOKIE_SECRET`            |

**Tokens:**

| Token           | Duração padrão | Variável de controle        |
| --------------- | -------------- | --------------------------- |
| `access_token`  | 15 minutos     | `JWT_ACCESS_EXPIRES_IN`     |
| `refresh_token` | 7 dias         | `JWT_REFRESH_EXPIRES_IN`    |

O `authMiddleware` popula `req.user` com `userId`, `username`, `role`, `professionalId` e `adminId`.

---

## 4. Proteção CSRF — Double Submit Cookie

**O que é:** Implementado com `csrf-csrf` (Double Submit Cookie Pattern).

**Fluxo:**

1. No login/refresh, o servidor gera um `csrfToken` derivado do `access_token` via `COOKIE_SECRET`
2. O token é retornado no body JSON e deve ser armazenado pelo cliente
3. Em toda mutação (POST, PUT, PATCH, DELETE), o cliente envia o token no header `X-CSRF-Token`
4. O servidor valida token ↔ secret do cookie `__csrf`

**Por que mesmo com SameSite=Strict:** defense-in-depth para navegadores que não suportem SameSite corretamente.

**Ameaça mitigada:** Cross-Site Request Forgery (CSRF)

---

## 5. Rate Limiting

**O que é:** `express-rate-limit` com store in-memory (adequado para instância única).

| Limiter            | Janela     | Máx. requests | Onde é aplicado                                      |
| ------------------ | ---------- | ------------- | ---------------------------------------------------- |
| `apiLimiter`       | 1 minuto   | 100           | Global — todas as rotas `/api`                       |
| `loginLimiter`     | 15 minutos | 30            | `POST /auth/login`, `/auth/register`, `/auth/refresh`|
| `sensitiveLimiter` | 1 minuto   | 30            | Criação e alteração de dados sensíveis               |

Respostas com rate limit excedido retornam `429 Too Many Requests`.

**Ameaças mitigadas (STRIDE):** Denial of Service, brute-force em login (Elevation of Privilege)

> **Nota:** O rate limiting in-memory é reiniciado com o processo. Para deployments com múltiplas instâncias ou maior resiliência, considere migrar para Redis com `rate-limit-redis`.

---

## 6. RBAC (Role-Based Access Control)

**O que é:** Autorização baseada em roles via `checkRole()` middleware.

**Roles disponíveis:**

| Role           | Descrição                                      |
| -------------- | ---------------------------------------------- |
| `admin`        | Acesso completo, incluindo dashboard e vínculos|
| `professional` | Acesso às funcionalidades clínicas             |

**Como usar:**

```typescript
// Proteger rota para admins apenas
router.use("/dashboard", checkRole("admin"), dashboardRoutes);

// Múltiplos roles permitidos
router.get("/resource", checkRole("admin", "professional"), ctrl.get);
```

Acessos negados retornam `403 Forbidden` e são registrados nos logs de segurança.

**Escalação de privilégios — como prevenir:**

- **Vertical** (usuário normal executa ação de admin): usar `checkRole("admin")` e auditar
- **Horizontal** (usuário A age como usuário B): verificar ownership no service (`req.user.userId === resource.ownerId` ou `req.user.adminId === resource.adminId`)

**Ameaças mitigadas (STRIDE):** Elevation of Privilege, Information Disclosure

---

## 7. Headers de Segurança — Helmet

O `helmet` é aplicado globalmente com configurações customizadas em `src/config/helmet.ts`, cobrindo:

- `Content-Security-Policy` — restringe origens de scripts, estilos e mídia
- `X-Frame-Options` — previne clickjacking
- `X-Content-Type-Options` — previne MIME sniffing
- `Strict-Transport-Security` — força HTTPS
- `Referrer-Policy` — controla vazamento de URL no referrer

---

## 8. Logging de Segurança

Eventos de segurança são registrados via `logSecurityEvent()` e `logRbacDenied()` em `src/infra/logger/security.ts`:

- Verificações RBAC (aprovadas e negadas)
- Tentativas de acesso não autorizado

Campos sensíveis (`authorization`, `cookie`, `password`, `passwordHash`) são **redacted automaticamente** pelo Pino com `[REDACTED]`.

---

## Guia Rápido — Como Proteger uma Nova Rota

```typescript
import { authMiddleware } from "../../middlewares/auth.middleware";
import { checkRole } from "../../middlewares/rbac.middleware";
import { doubleCsrfProtection } from "../../middlewares/csrf.middleware";
import { validate, sensitiveLimiter } from "../../middlewares";

// Rota autenticada com validação
router.get("/:id", validate({ params: idSchema }), ctrl.findById);

// Rota de criação com rate limit e CSRF
router.post(
  "/",
  sensitiveLimiter,
  doubleCsrfProtection,
  validate({ body: createSchema }),
  ctrl.create,
);

// Rota restrita a admins
router.delete(
  "/:id",
  checkRole("admin"),
  sensitiveLimiter,
  doubleCsrfProtection,
  validate({ params: idSchema }),
  ctrl.delete,
);
```

> O `authMiddleware` e `doubleCsrfProtection` já são aplicados globalmente para todas as rotas sob `/api` (exceto `/health` e `/auth`). Aplique-os explicitamente apenas em rotas que precisam de proteção fora desse escopo.
