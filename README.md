# Podóloga Sistema — Backend

API REST do sistema de gestão para consultório de podologia.

---

## 📋 Índice

- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Deploy](#deploy)
- [Convenções do Projeto](#convenções-do-projeto)
- [Documentação](#documentação)

---

## Tecnologias

| Tecnologia         | Versão | Descrição                              |
| ------------------ | ------ | -------------------------------------- |
| Node.js            | 18+    | Runtime JavaScript                     |
| TypeScript         | 5.x    | Superset tipado de JavaScript          |
| Express            | 5.x    | Framework HTTP                         |
| MySQL2             | 3.x    | Driver MySQL com suporte a Promises    |
| Zod                | 4.x    | Validação e parsing de schemas         |
| bcryptjs           | 3.x    | Hash de senhas                         |
| jsonwebtoken       | 9.x    | Geração e verificação de JWTs          |
| csrf-csrf          | 4.x    | Proteção CSRF (Double Submit Cookie)   |
| cookie-parser      | 1.x    | Parsing de cookies assinados           |
| express-rate-limit | 8.x    | Rate limiting in-memory                |
| Helmet             | 8.x    | Headers de segurança HTTP              |
| CORS               | 2.x    | Cross-Origin Resource Sharing          |
| Compression        | 1.x    | Compressão gzip de respostas           |
| Pino               | 10.x   | Logger estruturado de alta performance |
| dotenv             | 17.x   | Carregamento de variáveis .env         |

---

## Pré-requisitos

- **Node.js** >= 18
- **npm** >= 9
- **MySQL** >= 8.0 (ou serviço MySQL compatível)
- **Python** >= 3.10 (apenas para o script de deploy `build.py`)

---

## Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd podologa-sistema-back

# Instale as dependências
npm install

# Copie o arquivo de variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações
```

O servidor cria as tabelas automaticamente via migrations ao iniciar — não é necessário executar scripts SQL manualmente.

---

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz (use `.env.example` como referência):

| Variável                | Padrão                          | Obrigatória | Descrição                                       |
| ----------------------- | ------------------------------- | ----------- | ----------------------------------------------- |
| `NODE_ENV`              | `development`                   | Não         | Ambiente: `development` / `production` / `test` |
| `PORT`                  | `3333`                          | Não         | Porta do servidor HTTP                          |
| `CORS_ORIGIN`           | `http://localhost:5173`         | Não         | Origens permitidas (separar por vírgula)        |
| `DATABASE_URL`          | —                               | **Sim**     | URL de conexão MySQL (formato JDBC URL)         |
| `JWT_ACCESS_SECRET`     | —                               | **Sim**     | Secret para assinar access tokens JWT           |
| `JWT_REFRESH_SECRET`    | —                               | **Sim**     | Secret para assinar refresh tokens JWT          |
| `JWT_ACCESS_EXPIRES_IN` | `15m`                           | Não         | Expiração do access token (ex: `15m`, `1h`)     |
| `JWT_REFRESH_EXPIRES_IN`| `7d`                            | Não         | Expiração do refresh token (ex: `7d`, `30d`)    |
| `COOKIE_SECRET`         | —                               | **Sim**     | Secret para assinar cookies (HMAC)              |

**Formato do `DATABASE_URL`:**

```
mysql://usuario:senha@host:3306/nome_do_banco
```

**Exemplo de `.env` para desenvolvimento:**

```env
NODE_ENV=development
PORT=3333
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
DATABASE_URL=mysql://root:senha@localhost:3306/podologa
JWT_ACCESS_SECRET=troque-por-um-valor-longo-e-aleatorio
JWT_REFRESH_SECRET=outro-valor-longo-e-aleatorio
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
COOKIE_SECRET=outro-secret-para-cookies
```

> ⚠️ **Nunca** commite o arquivo `.env` — ele está no `.gitignore`. Use secrets do CI/CD em produção.

---

## Scripts Disponíveis

```bash
# Desenvolvimento (hot-reload com ts-node-dev)
npm run dev

# Verificar tipos TypeScript sem compilar
npm run lint

# Compilar TypeScript para JavaScript (saída em dist/)
npm run build

# Iniciar o servidor a partir do build compilado
npm start

# Build de produção para o Render (instala devDeps e compila)
npm run render-build
```

---

## Estrutura de Pastas

```
src/
├── config/              # Configurações da aplicação
│   ├── cors.ts          # Opções de CORS (dev/prod)
│   ├── env.ts           # Variáveis de ambiente validadas com Zod
│   ├── helmet.ts        # Configuração de headers de segurança
│   └── index.ts         # Barrel export
│
├── infra/               # Infraestrutura transversal
│   ├── database/
│   │   ├── db.ts        # Pool de conexões MySQL2
│   │   ├── migrate.ts   # Runner de migrations (DDL automático no start)
│   │   └── helpers.ts   # Utilitários de query
│   └── logger/
│       ├── logger.ts    # Instância do Pino
│       └── security.ts  # Funções de log de segurança/auditoria
│
├── middlewares/          # Middlewares globais do Express
│   ├── auth.middleware.ts       # Autenticação JWT via cookie HttpOnly
│   ├── rbac.middleware.ts       # Autorização por role (checkRole)
│   ├── csrf.middleware.ts       # Proteção CSRF (Double Submit Cookie)
│   ├── rateLimit.middleware.ts  # Rate limiting (login, api, sensitive)
│   ├── validation.middleware.ts # Validação de request com Zod
│   ├── correlationId.middleware.ts
│   ├── error.middleware.ts
│   ├── notFound.ts
│   └── index.ts
│
├── modules/              # Módulos de domínio (cada um = recurso da API)
│   ├── auth/             # Login, registro, refresh, logout, perfil
│   ├── patients/         # Pacientes
│   ├── appointments/     # Agendamentos
│   ├── anamneses/        # Anamneses
│   ├── clinical-evolutions/  # Evoluções clínicas
│   ├── pathologies/      # Patologias cadastradas
│   ├── evolution-pathologies/ # Patologias por evolução
│   ├── billing/          # Financeiro / cobranças
│   ├── professionals/    # Profissionais
│   ├── patient-professionals/ # Vínculo paciente ↔ profissional
│   ├── dashboard/        # Estatísticas (admin)
│   └── health/           # Health check
│
├── shared/               # Código compartilhado entre módulos
│   ├── errors/           # Classes de erro customizadas
│   └── utils/            # Funções utilitárias puras
│
├── types/                # Tipos e interfaces globais
│   ├── models.ts         # Tipos de domínio
│   └── express.d.ts      # Extensão de Request (req.user)
│
├── app.ts                # Montagem e configuração do Express
└── index.ts              # Ponto de entrada — inicia servidor e migrations
```

Cada módulo segue a estrutura:
```
modulo/
├── modulo.routes.ts       # Define endpoints e aplica middlewares
├── modulo.controller.ts   # Extrai dados do request, retorna response
├── modulo.service.ts      # Regras de negócio
├── modulo.repository.ts   # Queries no banco de dados
└── modulo.schema.ts       # Schemas Zod para validação
```

---

## Deploy

O projeto é hospedado no **AlwaysData** e usa o script `build.py` para automatizar todo o processo.

### Pré-requisitos de Deploy

- Python >= 3.10 instalado localmente
- Acesso SSH ao servidor AlwaysData configurado (`~/.ssh/config` ou chave SSH)
- Arquivo `.env` de produção preenchido na raiz do back-end
- Front-end (`podologa-sistema-front/`) presente no diretório pai

### Processo de Deploy

O script `build.py` executa os seguintes passos em ordem:

1. **Build do front-end** — `npm run build` no diretório `../podologa-sistema-front/`
2. **Cópia do front-end compilado** — copia `podologa-sistema-front/dist/` para `dist/client/` no back-end
3. **Build do back-end** — `npm run build` compila TypeScript para `dist/`
4. **Empacotamento** — gera `deploy.zip` com `dist/`, `node_modules/`, `package.json`, `package-lock.json` e `.env`
5. **Envio via SCP** — faz upload do pacote para `$HOME/www/` no servidor AlwaysData
6. **Execução remota** — roda `deploy.sh` via SSH no servidor, que descompacta e organiza os arquivos

```bash
# Na raiz do back-end
python3 build.py
```

O script pedirá interativamente o host SSH do servidor AlwaysData (ex: `ssh-podologia-anapaula.alwaysdata.net`).

### Após o Deploy

Após o envio, **reinicie o app no painel do AlwaysData** para carregar a nova versão.

Na inicialização, o servidor executa automaticamente as migrations de banco de dados (`runMigrations`) criando ou atualizando as tabelas necessárias.

### Deploy no Render (alternativo)

O script `render-build` está configurado para builds no Render:

```bash
npm run render-build   # instala devDependencies e compila TypeScript
npm start              # inicia o servidor a partir de dist/
```

Configure as variáveis de ambiente diretamente no painel do Render.

---

## Autenticação

A API usa **JWT com cookies HttpOnly** — não há header `Authorization: Bearer`. O fluxo é:

1. `POST /api/auth/login` — retorna `access_token` e `refresh_token` via cookies `Set-Cookie`
2. Todas as rotas protegidas leem o `access_token` do cookie automaticamente
3. `POST /api/auth/refresh` — renova o `access_token` usando o `refresh_token`
4. Mutações protegidas exigem o header `X-CSRF-Token` (obtido em `POST /api/auth/login` ou `refresh`)

---

## Convenções do Projeto

Consulte [docs/CODING_GUIDELINES.md](docs/CODING_GUIDELINES.md) para as regras completas de programação do time.

**Resumo rápido:**

- TypeScript strict mode sempre ativado
- Nomes de arquivos em `camelCase` (ex: `auth.service.ts`)
- Rotas em `kebab-case` (ex: `/api/patients`, `/api/clinical-evolutions`)
- Cada módulo segue: **Routes → Controller → Service → Repository + Schema**
- Sem `any` — tipar tudo explicitamente
- Commits seguem [Conventional Commits](https://www.conventionalcommits.org/)

---

## Documentação

| Documento                                                              | Descrição                              |
| ---------------------------------------------------------------------- | -------------------------------------- |
| [CODING_GUIDELINES.md](docs/CODING_GUIDELINES.md)                     | Regras e padrões de programação        |
| [API.md](docs/API.md)                                                  | Documentação dos endpoints da API      |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md)                               | Arquitetura e decisões técnicas        |
| [SECURITY_VALIDATION_RATE_RBAC.md](docs/SECURITY_VALIDATION_RATE_RBAC.md) | Segurança, validação, rate limit e RBAC |

---

## Licença

ISC — Grupo PI IV GTI
