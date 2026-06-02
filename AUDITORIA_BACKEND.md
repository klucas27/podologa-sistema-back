# Auditoria Técnica — Backend (Podóloga Sistema)

Data: 2026-06-01
Escopo: `podologa-sistema-back` (Node.js + TypeScript + Express + MySQL/mysql2). Frontend (`podologa-sistema-front`) consultado apenas para validar integração.
Diretriz central: todas as datas/horas em `America/Sao_Paulo`, sem depender do horário do servidor.

Formato de cada item: **Problema · Local · Impacto · Correção**.
Ordenado por severidade (Crítico → Alto → Médio → Baixo).

---

## CRÍTICOS

### C1 — Quebra de isolamento entre consultórios (IDOR) em recursos clínicos e financeiros
- **Problema:** Os módulos `appointments`, `billing`, `anamneses`, `clinical-evolutions` e `evolution-pathologies` buscam, alteram e excluem registros apenas pelo `id`/`appointmentId`/`patientId`, sem validar se o recurso pertence ao `adminId` (ou ao profissional vinculado) do usuário autenticado. Também na criação: `appointment.create` aceita `patientId` e `billing.create` aceita `appointmentId` sem checar propriedade. Apenas `patients` e `professionals` aplicam escopo por tenant.
- **Local:** `src/modules/appointments/appointment.service.ts` e `.repository.ts`; `src/modules/billing/*`; `src/modules/anamneses/*`; `src/modules/clinical-evolutions/*`; `src/modules/evolution-pathologies/*`.
- **Impacto:** Segurança — qualquer usuário autenticado lê/edita/exclui prontuários e cobranças de outros consultórios conhecendo o id (dados clínicos sensíveis; risco LGPD).
- **Correção:** Aplicar escopo de propriedade em todas as leituras e escritas desses módulos, validando que o recurso pertence ao `adminId`/profissional do usuário antes de retornar ou alterar; na criação, confirmar que o `patientId`/`appointmentId` informado pertence ao mesmo tenant.

### C2 — Mass assignment e injeção de identificador no UPDATE
- **Problema:** `professional.update` e `anamnesis.update` repassam o `req.body` cru (sem validação) como mapa de colunas para `buildSet`, onde as chaves do objeto viram nomes de coluna entre crases. Permite (a) gravar colunas não previstas (ex.: `admin_id`, `is_active`, `professional_id`, `patient_id`) e (b) quebrar o escape do identificador caso a chave contenha crase (`toSnake` não remove caracteres especiais).
- **Local:** `src/modules/professionals/professional.service.ts` + `.repository.ts` (update); `src/modules/anamneses/anamnesis.service.ts` + `.repository.ts` (update); `src/infra/database/helpers.ts` (`buildSet`/`toSnake`).
- **Impacto:** Segurança — mass assignment, escalonamento de privilégio e injeção SQL via identificador.
- **Correção:** Validar com Zod (lista branca de campos) antes do update; em `buildSet`, aceitar apenas colunas de uma whitelist e rejeitar chaves desconhecidas ou com caracteres fora de `[a-z0-9_]`.

### C3 — Timezone depende do fuso do servidor (viola diretriz `America/Sao_Paulo`)
- **Problema:** O pool mysql2 não fixa a opção `timezone`, e não há `TZ`/`process.env.TZ` definido na aplicação nem no deploy. A estratégia atual ("valores de SP nos slots UTC do `Date`") só fica correta se o processo Node e a sessão MySQL estiverem em UTC. No AlwaysData (host francês, provável `Europe/Paris`) as colunas `DATETIME` (`scheduled_start`, `scheduled_end`, `actual_start_time`, `actual_end_time`) são gravadas e lidas com deslocamento de 1–3h.
- **Local:** `src/infra/database/db.ts`; `deploy.sh`; `build.py`; ausência de `TZ` no ambiente.
- **Impacto:** Bug de dados (horários de consulta errados) e violação direta da diretriz de timezone.
- **Correção:** Fixar `timezone: 'Z'` no pool mysql2, definir `TZ=UTC` no ambiente de produção e forçar `time_zone='+00:00'` na sessão de conexão; padronizar que toda gravação de `DATETIME` use o valor já em horário de SP, de forma determinística e independente do host.

### C4 — `created_at`/`updated_at` gerados pelo banco (CURRENT_TIMESTAMP), fora de SP
- **Problema:** Todas as tabelas usam `TIMESTAMP DEFAULT/ON UPDATE CURRENT_TIMESTAMP`, que depende do `time_zone` da sessão MySQL (fuso do servidor de banco), não de SP. O dashboard compara `created_at`/`paid_at` com intervalos calculados em SP, produzindo contagens, receitas e alertas incorretos próximo das viradas de dia.
- **Local:** `src/infra/database/migrate.ts` (todas as tabelas); `src/modules/dashboard/dashboard.service.ts`.
- **Impacto:** Bug de dados/relatórios; viola diretriz de timezone.
- **Correção:** Fixar a sessão do banco em UTC e tratar `created_at` de forma consistente com `nowSP()`, ou gravar `created_at`/`updated_at` pela aplicação (`nowSP`) em vez de depender do relógio do servidor de banco.

### C5 — Registro público cria conta admin sem restrição
- **Problema:** `POST /api/auth/register` é público e sempre cria usuário com role `admin` (novo tenant). Qualquer pessoa pode criar contas/admins ilimitados.
- **Local:** `src/modules/auth/auth.routes.ts`; `src/modules/auth/auth.service.ts` (`register`); `src/modules/index.ts`.
- **Impacto:** Segurança — criação não autorizada de contas, abuso, aumento de superfície e custo de recursos.
- **Correção:** Desabilitar o registro público ou protegê-lo (convite/seed único/feature flag); restringir a criação de admins em produção.

---

## ALTOS

### A1 — Ausência de validação Zod na maioria das rotas
- **Problema:** Apenas `patients` e `auth` usam o middleware `validate()`. `appointments`, `billing`, `anamneses`, `clinical-evolutions`, `evolution-pathologies`, `professionals` e `patient-professionals` recebem body/params/query sem validação de tipo, enum, tamanho ou formato. Entradas inválidas viram erro 500 do MySQL (enum/coluna) e habilitam o mass assignment do item C2.
- **Local:** as respectivas `*.routes.ts` desses módulos.
- **Impacto:** Bug, segurança e robustez.
- **Correção:** Criar schemas Zod (body/params/query) para todos os endpoints e aplicar `validate()`; validar UUID nos params, enums, e limites de tamanho coerentes com as colunas.

### A2 — Validações de cadastro de paciente fracas
- **Problema:** `email` aceita qualquer string (sem `.email()`) e sem limite de tamanho; `cpf` valida só 11 dígitos (sem dígito verificador); `maritalStatus` e `state` são string livre (não enum / não 2 letras); `dateOfBirth` é string sem validação de data.
- **Local:** `src/modules/patients/patient.schema.ts`.
- **Impacto:** Dados inconsistentes e erros 500 por estouro de coluna/enum inválido.
- **Correção:** Endurecer o schema — e-mail válido, `max` por campo conforme o DDL, enum de `maritalStatus`, `state` com 2 letras, validação de CPF e data válida.

### A3 — `sanitizeOutput` corrompe dados e desperdiça memória/CPU
- **Problema:** Faz escape de HTML (`& < > " '`) em todas as strings de toda resposta, recursivamente. Como o React já escapa na renderização, nomes como `O'Brien` chegam ao front como `O&#39;Brien` e são exibidos literalmente; além disso clona todo o grafo de objetos por requisição.
- **Local:** `src/shared/utils/sanitize.ts`; usado em todos os controllers.
- **Impacto:** Bug de dados/UX + performance (CPU e memória, relevante no limite de 500MB).
- **Correção:** Remover o escape na saída (confiar no escape do front e no `Content-Type: application/json`); se necessário, sanitizar na entrada, não na saída.

### A4 — `CORS_ORIGIN` sem esquema
- **Problema:** O valor de produção é hostname puro (`podologia-anapaula.alwaysdata.net`), sem `https://`. A comparação de origin do CORS exige o origin completo; em uso cross-origin real, falha.
- **Local:** `.env.example`; `src/config/cors.ts`.
- **Impacto:** Bug de integração (só "funciona" porque o front é servido same-origin).
- **Correção:** Definir `CORS_ORIGIN` com esquema completo (`https://...`), com suporte correto a múltiplas origens separadas por vírgula.

### A5 — devDependencies e `node_modules` completo vão para produção
- **Problema:** `render-build` usa `npm install --include=dev`; `build.py` empacota o `node_modules` inteiro (com `typescript`, `ts-node-dev`, `@types/*`) no zip enviado ao servidor.
- **Local:** `package.json` (scripts); `build.py`.
- **Impacto:** Performance/deploy — mais disco, memória e superfície, sem utilidade em runtime.
- **Correção:** Instalar produção com `--omit=dev` (ou `npm ci --omit=dev`) no servidor e não empacotar devDependencies; manter build separado do runtime.

---

## MÉDIOS

### M1 — Falta de RBAC admin no módulo `professionals`
- **Problema:** As rotas `/professionals` exigem apenas auth + CSRF, sem `checkRole("admin")`. Um usuário com role `professional` pode criar/editar/excluir profissionais e novos usuários do mesmo admin.
- **Local:** `src/modules/index.ts` (mount); `src/modules/professionals/professional.routes.ts`.
- **Impacto:** Segurança — escalonamento de privilégio horizontal.
- **Correção:** Exigir `checkRole("admin")` nas rotas de `professionals` (no mínimo nas de escrita).

### M2 — Serialização de datas inconsistente na leitura (off-by-one / horas erradas)
- **Problema:** `normalizeScheduledDate` assume "meio-dia UTC", válido apenas na escrita. Na leitura, mysql2 devolve `DATE` à meia-noite local e `DATETIME` em local, e os demais campos (`scheduledStart/End`, `actual*`, `paidAt`, `createdAt`) são serializados por `toISOString()` assumindo UTC. Sem o pool em UTC (C3), as datas chegam deslocadas ao front (inclusive `scheduledDate` com risco de pular um dia).
- **Local:** `src/modules/appointments/appointment.controller.ts`; serialização JSON padrão dos demais módulos.
- **Impacto:** Bug de timezone na API.
- **Correção:** Após corrigir C3, padronizar a mesma estratégia de serialização para todos os campos de data e remover suposições divergentes.

### M3 — Índices ausentes para filtros do dashboard
- **Problema:** Consultas por `billings.paid_at` (range), `patient.created_at` (range) e o join `anamnesis MAX(created_at)` por `patient_id` não têm índices de apoio.
- **Local:** `src/infra/database/migrate.ts`; `src/modules/dashboard/dashboard.service.ts`; `src/modules/patients/patient.repository.ts` (`attachAnamneses`).
- **Impacto:** Performance — full scan conforme o volume cresce.
- **Correção:** Adicionar índices em `billings(paid_at)`, `patient(created_at)` e `anamnesis(patient_id, created_at)`.

### M4 — Alvos de deploy/integração divergentes
- **Problema:** `vercel.json` aponta `/api` para Render (`onrender.com`); `build.py`/`deploy.sh` publicam no AlwaysData servindo o front em `dist/client` (same-origin). Três topologias diferentes; cookies `SameSite=Strict` + `credentials` podem não funcionar no cenário Vercel→Render (domínios distintos).
- **Local:** `vercel.json`; `build.py`; `deploy.sh`; `.env.example`.
- **Impacto:** Integração/segurança — autenticação quebrada conforme o ambiente.
- **Correção:** Escolher uma topologia única e alinhar CORS, cookies e destino de API; remover configurações do alvo não utilizado.

### M5 — Rate limit global aplicado a assets estáticos e SPA
- **Problema:** `apiLimiter` (100/min/IP) é registrado antes de `express.static` e do catch-all; cada asset/HTML conta no limite. Uma única página com muitos chunks pode atingir o teto e receber 429.
- **Local:** `src/app.ts`.
- **Impacto:** Bug/UX + performance.
- **Correção:** Aplicar o limiter apenas em `/api`, não nos arquivos estáticos.

### M6 — Logs de segurança excessivos por requisição
- **Problema:** `checkRole` registra `rbac_check` em nível `warn` a cada requisição protegida (dashboard, patient-professionals). Em produção (nível `info`) gera ruído e IO constante.
- **Local:** `src/middlewares/rbac.middleware.ts`; `src/infra/logger/security.ts`.
- **Impacto:** Performance (IO/log) e ruído.
- **Correção:** Rebaixar `rbac_check` para `debug` (ou logar apenas as negações) e reservar `warn` para eventos relevantes.

### M7 — Rate limit de login brando e comentários divergentes
- **Problema:** Comentários dizem "5 por 15min" e "10 por min", mas os valores reais são 30. Login a 30/15min é permissivo para força bruta.
- **Local:** `src/middlewares/rateLimit.middleware.ts`.
- **Impacto:** Segurança (força bruta) + manutenção.
- **Correção:** Alinhar comentários e reduzir o limite de login para um valor coerente com a intenção.

### M8 — Inconsistência de expiração de token (JWT × cookie × DB)
- **Problema:** O `.env.example` define `JWT_EXPIRES_IN` (nome divergente do esperado `JWT_ACCESS_EXPIRES_IN`, caindo no default 15m). A expiração do refresh no banco é calculada com `nowSP()` (slots de SP), enquanto o `exp` do JWT usa tempo real, divergindo ~3h.
- **Local:** `.env.example`; `src/config/env.ts`; `src/modules/auth/auth.service.ts` (`persistRefreshToken`).
- **Impacto:** Comportamento de expiração imprevisível.
- **Correção:** Corrigir os nomes das variáveis no env de produção e calcular `expires_at` do refresh a partir do mesmo instante real usado pelo JWT.

### M9 — `forceDelete` (hard delete em cascata) irreversível e exposto
- **Problema:** `DELETE /patients/:id/force` apaga fisicamente o paciente e todos os registros clínicos/financeiros vinculados (transação manual, em vez de FKs `ON DELETE`). Sem confirmação e sem restrição por role.
- **Local:** `src/modules/patients/patient.routes.ts`; `src/modules/patients/patient.repository.ts` (`forceDeleteCascade`).
- **Impacto:** Risco de perda definitiva de prontuário (retenção/LGPD).
- **Correção:** Restringir a admin, exigir confirmação explícita e preferir soft delete; reavaliar a necessidade de hard delete em prontuário.

---

## BAIXOS / OBSERVAÇÕES

### B1 — DDL duplicado e divergente
- **Problema:** Há duas fontes de schema: `migrate.ts` e `database/create_tables.sql` (este usa `TIMESTAMP(0)`/`DATETIME(0)`, aquele `TIMESTAMP`/`DATETIME`). Risco de drift.
- **Local:** `src/infra/database/migrate.ts`; `database/create_tables.sql`.
- **Impacto:** Manutenção/consistência.
- **Correção:** Manter uma única fonte de verdade (migrations versionadas) e remover a duplicada.

### B2 — Migrations executadas a cada boot, sem versionamento
- **Problema:** `runMigrations` roda todos os `CREATE TABLE IF NOT EXISTS` no start; não há versionamento nem suporte a `ALTER`.
- **Local:** `src/index.ts`; `src/infra/database/migrate.ts`.
- **Impacto:** Boot mais lento e ausência de evolução de schema.
- **Correção:** Adotar migrations versionadas e desacoplar do start em produção.

### B3 — Sem `engines`/pinning de Node
- **Problema:** `package.json` não fixa versão de Node; `@types/node` 25 sugere runtime muito recente.
- **Local:** `package.json`.
- **Impacto:** Reprodutibilidade/deploy.
- **Correção:** Declarar `engines.node` coerente com o runtime do AlwaysData.

### B4 — Listagens sem paginação
- **Problema:** `list` de pacientes/agendamentos/cobranças retorna todos os registros com relações aninhadas (paciente + anamnese + evoluções).
- **Local:** `*.repository.ts` (`findMany`/`findAll`).
- **Impacto:** Performance/memória conforme o volume cresce (crítico em 500MB).
- **Correção:** Adicionar paginação (limit/offset ou keyset) e limitar as relações retornadas por página.

### B5 — Seção "Arquivos" atualmente não aplicável
- **Problema:** Não há upload/armazenamento de arquivos (sem `multer`/`fs`/`base64`). As variáveis `WHATSAPP_*` existem no env mas não são consumidas por nenhum código.
- **Local:** `.env.example`; ausência de módulo de arquivos.
- **Impacto:** N/A hoje; configuração sem uso gera confusão.
- **Correção:** Remover variáveis não usadas; ao implementar fotos/laudos, usar armazenamento externo (não no banco e não em memória), com validação de tipo/tamanho e streaming — relevante para o limite de 500MB. Se o webhook do WhatsApp for ativado, validar a assinatura (`WHATSAPP_APP_SECRET`).

---

## Pontos positivos (já adequados)
- Queries com parâmetros (`?`) em quase todo o código — baixo risco de injeção por valor (exceção: identificadores em `buildSet`, ver C2).
- Helmet com CSP, HSTS, `frameguard`, `noSniff` bem configurados.
- Cookies de autenticação `HttpOnly` + `Secure` (prod) + `SameSite=Strict` + assinados; CSRF por double-submit; segredos de access/refresh separados.
- Rotação de refresh token com detecção de reuso (revoga todos os tokens do usuário ao detectar replay).
- Pool de conexões dimensionado (limite 5) e uso de transação no force delete.
- `.env` corretamente ignorado pelo Git (sem segredos versionados).

---

## Ordem sugerida de correção
1. C1 (IDOR) e C2 (mass assignment/injeção) — exposição de dados clínicos.
2. C3 e C4 — timezone determinístico (pool em UTC, `TZ=UTC`, sessão do banco em UTC).
3. C5 — fechar registro público.
4. A1/A2 — validação Zod em todas as rotas.
5. A3 — remover `sanitizeOutput` da saída.
6. Demais itens Altos e Médios conforme janela de deploy.
