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
- [Convenções do Projeto](#convenções-do-projeto)
- [Documentação](#documentação)

---

## Tecnologias

| Tecnologia   | Versão | Descrição                         |
| ------------ | ------ | --------------------------------- |
| Node.js      | 18+    | Runtime JavaScript                |
| TypeScript   | 5.x    | Superset tipado de JavaScript     |
| Express      | 5.x    | Framework HTTP                    |
| Helmet       | 8.x    | Headers de segurança              |
| CORS         | 2.x    | Cross-Origin Resource Sharing     |
| Morgan       | 1.x    | Logger HTTP                       |
| Compression  | 1.x    | Compressão gzip de respostas      |
| dotenv       | 17.x   | Carregamento de variáveis .env    |

---

## Pré-requisitos

- **Node.js** >= 18
- **npm** >= 9

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

---

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz (use `.env.example` como referência):

| Variável      | Padrão                                       | Descrição                                |
| ------------- | --------------------------------------------- | ---------------------------------------- |
| `NODE_ENV`    | `development`                                 | Ambiente: development / production / test |
| `PORT`        | `3333`                                        | Porta do servidor                        |
| `CORS_ORIGIN` | `http://localhost:5173,http://localhost:3000`  | Origens permitidas (separar por vírgula) |

---

## Scripts Disponíveis

```bash
# Desenvolvimento (hot-reload)
npm run dev

# Build para produção
npm run build

# Rodar build de produção
npm start

# Verificar tipos TypeScript
npm run lint
```

---

## Estrutura de Pastas

```
src/
├── configs/          # Configurações da aplicação
│   ├── cors.ts       # Config de CORS (dev/prod)
│   ├── env.ts        # Variáveis de ambiente tipadas
│   └── index.ts      # Barrel export
│
├── middlewares/       # Middlewares globais
│   ├── errorHandler.ts
│   ├── notFound.ts
│   └── index.ts
│
├── routes/           # Definição de rotas
│   ├── health.routes.ts
│   └── index.ts      # Registro centralizado
│
├── controllers/      # Lógica de controle (criar conforme necessário)
├── services/         # Regras de negócio (criar conforme necessário)
├── repositories/     # Acesso a dados (criar conforme necessário)
├── utils/            # Funções utilitárias (criar conforme necessário)
├── types/            # Tipos e interfaces globais (criar conforme necessário)
│
├── app.ts            # Criação e config do Express
└── index.ts          # Ponto de entrada (start do server)
```

---

## Convenções do Projeto

Consulte [docs/CODING_GUIDELINES.md](docs/CODING_GUIDELINES.md) para as regras completas de programação do time.

**Resumo rápido:**

- TypeScript strict mode sempre ativado
- Nomes de arquivos em `camelCase` (ex: `errorHandler.ts`)
- Rotas em `kebab-case` (ex: `/api/pacientes`)
- Cada módulo segue: **Routes → Controller → Service → Repository**
- Sem `any` — tipar tudo explicitamente
- Commits seguem [Conventional Commits](https://www.conventionalcommits.org/)

---

## Documentação

| Documento                                            | Descrição                            |
| ---------------------------------------------------- | ------------------------------------ |
| [CODING_GUIDELINES.md](docs/CODING_GUIDELINES.md)   | Regras e padrões de programação      |
| [API.md](docs/API.md)                                | Documentação dos endpoints da API    |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md)              | Arquitetura e decisões técnicas      |

---

## Endpoints Disponíveis

| Método | Rota           | Descrição            |
| ------ | -------------- | -------------------- |
| GET    | `/api/health`  | Status do servidor   |

---

## Licença

ISC — Grupo PI IV GTI
