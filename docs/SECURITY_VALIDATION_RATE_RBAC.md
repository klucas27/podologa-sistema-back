Summary: Refactor focada em validação (Zod), rate limiting (Redis + express-rate-limit) e RBAC com auditoria.

Mudanças Principais (Antes -> Depois):
1) Validação:
   Antes: validações ad-hoc ou ausentes por rota.
   Depois: src/middlewares/validation.middleware.ts (Zod-first) — todas as rotas devem usar validate({ body, params, query }).

2) Sanitização:
   Antes: respostas retornavam objetos sem sanitização.
   Depois: src/utils/sanitize.ts exporta sanitizeOutput() — aplicar antes de responder ao client.

3) Rate Limiting:
   Antes: src/middlewares/rateLimit.middleware.ts usava in-memory express-rate-limit.
   Depois: Redis-backed com limites separados: loginLimiter, apiLimiter, sensitiveLimiter.

4) RBAC e Auditoria:
   Antes: req.user minimal sem roles.
   Depois: src/types/express.d.ts tipa AuthUser com roles: string[]; auth.middleware.ts popula roles; src/middlewares/rbac.middleware.ts fornece checkRole(...) e grava auditoria em logs.txt via src/lib/audit.ts.

Validação de Input (detalhes):
 - O QUE: Uso de Zod como schema-first para body, params e query via validate() middleware.
 - POR QUE: validação centralizada evita inconsistências, garante tipos seguros e permite fail-fast com erros 400 estruturados.
 - Ameaças mitigadas (STRIDE): Tampering, Spoofing, Repudiation.

Como SQLi / NoSQLi / XSS explorariam ausência de validação:
 - SQLi: entrada não validada pode ser concatenada em queries permitindo injeção. Zod força formatos e tipos.
 - NoSQLi: filtros JSON malformados ou operadores Mongo enviados pelo cliente podem manipular consultas — schemas impedem objetos inesperados.
 - XSS: sem sanitização, dados armazenados podem conter scripts; ao renderizar no front sem limpeza, executa código. sanitizeOutput() ajuda a evitar isso.

Sanitização de saída: executar sanitizeOutput(result) antes de res.json(...).

Rate Limiting (detalhes):
 - O QUE: express-rate-limit com rate-limit-redis usando ioredis.
 - Limites:
   - Login: 5 req por 15 minutos
   - API geral: 100 req/min
   - Rotas sensíveis: 10 req/min
 - POR QUE: limites separados permitem proteção específica (login: brute-force; sensíveis: proteção extra).
 - Ameaças mitigadas (STRIDE): Denial of Service, Elevation of Privilege (brute-force).

RBAC (detalhes):
 - O QUE: checkRole(...roles) middleware reutilizável; req.user tipado com roles; auditoria de acessos.
 - POR QUE: centraliza verificação de autorização; facilita princípio do menor privilégio.
 - Ameaças mitigadas (STRIDE): Elevation of Privilege, Information Disclosure.

Escalação de privilégios:
 - Vertical: usuário normal executa ação de admin. Mitigação: checar checkRole('admin') e auditar.
 - Horizontal: usuário A age como usuário B. Mitigação: verificar ownership (req.user.userId === resource.ownerId) e roles apropriadas.

Como aplicar (guia rápido):
1. Adicionar validação Zod em cada rota: router.post('/login', loginLimiter, validate({ body: loginSchema }), handler)
2. Em handlers que retornam dados, executar res.json(sanitizeOutput(result)).
3. Proteger rotas administrativas: router.post('/user/promote', authMiddleware, checkRole('admin'), handler)
4. Aplicar sensitiveLimiter em endpoints sensíveis.

Futuras ações opcionais:
 - Instrumentar automaticamente validate() nas rotas existentes.
 - Adicionar testes de integração que verifiquem limites e RBAC.
