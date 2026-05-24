# Arquitetura do Sistema

## Visão Geral

O backend segue uma **arquitetura modular em camadas** — cada recurso de domínio é encapsulado em um módulo próprio (`src/modules/<recurso>/`) com suas camadas internas isoladas. A infraestrutura transversal (banco, logger) vive em `src/infra/`.

O servidor também serve o front-end compilado a partir de `dist/client/`, funcionando como um único processo deployável.

---

## Diagrama de Camadas

```
+-----------------------------------------------------+
|                HTTP Client / Browser                |
+------------------------+----------------------------+
                         |
+------------------------v----------------------------+
|                 Middlewares Globais                  |
|  helmet · cors · apiLimiter · cookieParser          |
|  express.json · compression · correlationId         |
+------------------------+----------------------------+
                         |
+------------------------v----------------------------+
|              Router Central (/api)                  |
|  Rotas públicas: /health, /auth                     |
|  Rotas protegidas: authMiddleware + doubleCsrf      |
+------------------------+----------------------------+
                         |
+------------------------v----------------------------+
|           Módulos de Domínio (src/modules/)          |
|  Routes -> Controller -> Service -> Repository      |
|  + Schema Zod (validação de input)                  |
+------------------------+----------------------------+
                         |
+------------------------v----------------------------+
|            Infraestrutura (src/infra/)               |
|  MySQL2 Pool · Migrations DDL · Pino Logger         |
+------------------------+----------------------------+
                         |
+------------------------v----------------------------+
|              MySQL 8.0 (DATABASE_URL)               |
+-----------------------------------------------------+
```

---

## Módulos de Domínio

| Módulo                  | Rota base                           | Auth    | Role     |
| ----------------------- | ----------------------------------- | ------- | -------- |
| `health`                | `/api/health`                       | Não     | —        |
| `auth`                  | `/api/auth`                         | Parcial | —        |
| `patients`              | `/api/patients`                     | Sim     | qualquer |
| `appointments`          | `/api/appointments`                 | Sim     | qualquer |
| `anamneses`             | `/api/anamneses`                    | Sim     | qualquer |
| `clinical-evolutions`   | `/api/clinical-evolutions`          | Sim     | qualquer |
| `pathologies`           | `/api/pathologies`                  | Sim     | qualquer |
| `evolution-pathologies` | `/api/evolution-pathologies`        | Sim     | qualquer |
| `billing`               | `/api/billings`                     | Sim     | qualquer |
| `professionals`         | `/api/professionals`                | Sim     | qualquer |
| `patient-professionals` | `/api/patients/:id/professionals`   | Sim     | `admin`  |
| `dashboard`             | `/api/dashboard`                    | Sim     | `admin`  |

---

## Decisões Técnicas

### Express 5.x

Utilizamos Express 5 como framework HTTP. O `trust proxy` está ativado (`app.set("trust proxy", 1)`) para correta leitura de IPs quando rodando atrás de proxy reverso (AlwaysData / Render).

### TypeScript Strict

O `tsconfig.json` está configurado com `strict: true` e checks adicionais:

- `noUncheckedIndexedAccess` — segurança em acessos por índice
- `noImplicitReturns` — funções sempre retornam explicitamente
- `noUnusedLocals` / `noUnusedParameters` — sem código morto

### Configuração Centralizada com Zod

Todas as variáveis de ambiente são carregadas em `src/config/env.ts` e validadas com **Zod** na inicialização. Se alguma variável obrigatória estiver ausente ou inválida, o processo é encerrado com mensagem clara antes de conectar ao banco ou aceitar requisições. Nenhum módulo acessa `process.env` diretamente.

### Banco de Dados — MySQL2

O banco usa **MySQL 8.0** acessado via `mysql2/promise` com connection pool configurado para uso conservativo (máx. 5 conexões, adequado para VPS de 256 MB).

A conexão é configurada via `DATABASE_URL` no formato:

```
mysql://usuario:senha@host:3306/banco
```

### Migrations Automáticas

Ao iniciar (`src/index.ts`), o servidor executa `runMigrations()` que aplica os `CREATE TABLE IF NOT EXISTS` para todos os modelos. Não há migrations versionadas — as tabelas são criadas automaticamente se não existirem. A ordem de criação respeita as dependências de chave estrangeira.

### Autenticação — JWT + Cookie HttpOnly

- O `access_token` (15 min) e o `refresh_token` (7 dias) são armazenados em **cookies HttpOnly + Secure + SameSite=Strict + signed**.
- Nenhum token é exposto em respostas JSON ou headers de autorização.
- O `authMiddleware` lê `req.signedCookies["access_token"]`, verifica a assinatura JWT com `JWT_ACCESS_SECRET` e popula `req.user`.

### Proteção CSRF — Double Submit Cookie

Usando `csrf-csrf` com o padrão **Double Submit Cookie**:

- Um cookie `__csrf` (HttpOnly) contém o secret derivado do `access_token`.
- Um token CSRF é retornado no body do login/refresh e deve ser enviado pelo cliente no header `X-CSRF-Token` em mutações.
- O `sessionIdentifier` vincula o token CSRF ao access_token, invalidando-o automaticamente após refresh.

### CORS

A configuração em `src/config/cors.ts` diferencia:

- **Development**: aceita `localhost:3000` e `localhost:5173`
- **Production**: aceita apenas origens listadas em `CORS_ORIGIN`

### Rate Limiting

Implementado com `express-rate-limit` (store in-memory):

| Limiter            | Janela     | Máx. requests | Aplicado em                                          |
| ------------------ | ---------- | ------------- | ---------------------------------------------------- |
| `apiLimiter`       | 1 minuto   | 100           | Todas as rotas (`/api`)                              |
| `loginLimiter`     | 15 minutos | 30            | `/auth/login`, `/auth/register`, `/auth/refresh`     |
| `sensitiveLimiter` | 1 minuto   | 30            | Criação/alteração de dados sensíveis                 |

### Logging — Pino

Logger estruturado (JSON) com `pino`:

- **Development**: formato legível com `pino-pretty` (colorido, timestamp humano)
- **Production**: JSON puro para ingestão em sistemas de log
- **Redact automático**: `authorization`, `cookie`, `password` e `passwordHash` são substituídos por `[REDACTED]`

### Servir o Front-end

O servidor serve os arquivos estáticos do front-end a partir de `dist/client/`. Qualquer rota não reconhecida pela API retorna `dist/client/index.html`, permitindo que o roteamento client-side (React Router) funcione corretamente.

### RBAC

O `checkRole(...roles)` middleware verifica `req.user.role` contra os roles permitidos. Cada negação é registrada nos logs de segurança. Roles existentes: `admin`, `professional`.

---

## Padrões de Código

### Barrel Exports

Cada pasta possui um `index.ts` que re-exporta seus módulos:

```typescript
// ✅ Import limpo via barrel
import { env, corsOptions } from "./config";
import { authMiddleware, apiLimiter } from "./middlewares";

// ❌ Import direto (evitar fora do próprio módulo)
import { env } from "./config/env";
```

### Wiring de Dependências

As dependências de cada módulo são criadas e injetadas em `src/modules/index.ts` com o padrão factory:

```typescript
const repo    = createPatientRepository();
const service = createPatientService(repo);
const ctrl    = createPatientController(service);
const routes  = createPatientRoutes(ctrl);
```

Isso permite substituir implementações em testes sem DI container.

### Error Handling

Erros são centralizados no `errorHandler` middleware. Controllers e services lançam instâncias de classes de erro customizadas (`src/shared/errors/`) com status HTTP embutido. O middleware formata a resposta e evita vazar stack traces em produção.
