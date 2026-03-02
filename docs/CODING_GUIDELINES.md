# Regras e Padrões de Programação

Guia obrigatório para todos os desenvolvedores do projeto **Podóloga Sistema — Backend**.

---

## 📌 Princípios Gerais

1. **Clean Code** — código legível > código "inteligente"
2. **DRY** — Don't Repeat Yourself
3. **KISS** — Keep It Simple, Stupid
4. **YAGNI** — You Aren't Gonna Need It (não crie abstrações antes de precisar)
5. **Single Responsibility** — cada arquivo/função faz UMA coisa

---

## 🗂️ Organização de Pastas

```
src/
├── configs/       → Configurações (env, cors, database, etc.)
├── middlewares/    → Middlewares globais do Express
├── routes/        → Definição de rotas (apenas routing)
├── controllers/   → Recebe request, chama service, retorna response
├── services/      → Regras de negócio
├── repositories/  → Acesso a banco de dados
├── utils/         → Funções utilitárias puras
├── types/         → Interfaces e types globais
├── app.ts         → Montagem do Express
└── index.ts       → Start do servidor
```

### Regras de Pastas

- **Nunca** colocar lógica de negócio em controllers ou routes
- **Nunca** acessar banco direto no controller — sempre via repository
- Cada recurso pode ter sua própria subpasta dentro de `controllers/`, `services/`, etc.

---

## 📝 Nomenclatura

### Arquivos

| Tipo         | Padrão                      | Exemplo                   |
| ------------ | --------------------------- | ------------------------- |
| Rotas        | `recurso.routes.ts`         | `pacientes.routes.ts`     |
| Controllers  | `recurso.controller.ts`     | `pacientes.controller.ts` |
| Services     | `recurso.service.ts`        | `pacientes.service.ts`    |
| Repositories | `recurso.repository.ts`     | `pacientes.repository.ts` |
| Middlewares  | `nomeDescritivo.ts`         | `errorHandler.ts`         |
| Types        | `recurso.types.ts`          | `pacientes.types.ts`      |
| Config       | `nomeDescritivo.ts`         | `cors.ts`, `env.ts`       |

### Variáveis e Funções

- **camelCase** para variáveis e funções: `getPacienteById`
- **PascalCase** para interfaces e types: `Paciente`, `CreatePacienteDTO`
- **UPPER_SNAKE_CASE** para constantes e env: `PORT`, `NODE_ENV`
- **kebab-case** para URLs: `/api/pacientes`, `/api/agendamentos`

### Sufixos de Tipos

| Sufixo  | Uso                              | Exemplo             |
| ------- | -------------------------------- | ------------------- |
| `DTO`   | Data Transfer Object (entrada)   | `CreatePacienteDTO` |
| `Response` | Formato de resposta da API    | `PacienteResponse`  |

---

## 🏗️ Fluxo de uma Requisição

```
Request → Route → Controller → Service → Repository → Database
                                                    ↓
Response ← Route ← Controller ← Service ← Repository
```

### Responsabilidades

| Camada       | Responsabilidade                                        |
| ------------ | ------------------------------------------------------- |
| **Route**    | Define método HTTP e URL, direciona para controller     |
| **Controller** | Extrai dados do request, chama service, monta response |
| **Service**  | Regra de negócio, validações, orquestração              |
| **Repository** | CRUD no banco, queries, sem lógica de negócio         |

---

## ✅ TypeScript

### Obrigatório

- `strict: true` (já configurado no tsconfig)
- **Nunca** usar `any` — use `unknown` se necessário e faça type guard
- **Sempre** tipar parâmetros de funções e retornos
- Usar `interface` para objetos e `type` para unions/interseções
- Exportar types de cada módulo em `*.types.ts`

### Exemplo

```typescript
// ✅ BOM
interface Paciente {
  id: string;
  nome: string;
  telefone: string;
}

const getPacienteById = async (id: string): Promise<Paciente | null> => {
  // ...
};

// ❌ RUIM
const getPaciente = async (id: any): Promise<any> => {
  // ...
};
```

---

## 🛣️ Rotas

### Padrão de Endpoints

```
GET    /api/recurso          → Listar
GET    /api/recurso/:id      → Buscar por ID
POST   /api/recurso          → Criar
PUT    /api/recurso/:id      → Atualizar (completo)
PATCH  /api/recurso/:id      → Atualizar (parcial)
DELETE /api/recurso/:id      → Remover
```

### Padrão de Resposta

```typescript
// Sucesso
{
  status: "ok",
  data: { ... }
}

// Erro
{
  status: "error",
  message: "Descrição do erro"
}

// Lista com paginação
{
  status: "ok",
  data: [...],
  meta: {
    page: 1,
    limit: 20,
    total: 100
  }
}
```

### Status HTTP

| Código | Quando usar                                |
| ------ | ------------------------------------------ |
| 200    | Sucesso geral                              |
| 201    | Recurso criado                             |
| 204    | Sucesso sem conteúdo (DELETE)              |
| 400    | Request inválido (validação)               |
| 401    | Não autenticado                            |
| 403    | Sem permissão                              |
| 404    | Recurso não encontrado                     |
| 409    | Conflito (ex: email já cadastrado)         |
| 500    | Erro interno do servidor                   |

---

## 🔒 Segurança

- **Nunca** commitar `.env` (está no `.gitignore`)
- **Nunca** logar dados sensíveis (senhas, tokens)
- Usar `helmet` para headers de segurança (já configurado)
- Validar **todos** os inputs do usuário
- Sanitizar dados antes de queries no banco

---

## 📦 Imports

### Ordem dos Imports

```typescript
// 1. Módulos nativos do Node
import path from "path";

// 2. Dependências externas (npm)
import express from "express";

// 3. Configs
import { env } from "../configs";

// 4. Módulos internos
import { PacienteService } from "../services/pacientes.service";

// 5. Types
import type { Paciente } from "../types/pacientes.types";
```

- **Sempre** usar `import type` para importar apenas tipos
- **Sempre** usar aspas duplas `"` nos imports

---

## 💬 Commits

Seguir [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adicionar endpoint de pacientes
fix: corrigir validação de telefone
refactor: extrair lógica de agendamento para service
docs: atualizar README
chore: atualizar dependências
test: adicionar testes para pacientes.service
```

### Regras

- Mensagem em **português** e **minúsculo** (sem ponto final)
- Máximo de 72 caracteres na primeira linha
- Descrever **o que** e **por que**, não **como**

---

## 🔄 Git Flow

| Branch           | Propósito                    |
| ---------------- | ---------------------------- |
| `main`           | Produção (código estável)    |
| `develop`        | Desenvolvimento integrado    |
| `feature/nome`   | Nova funcionalidade          |
| `fix/nome`       | Correção de bug              |
| `refactor/nome`  | Refatoração                  |

---

## ⚠️ Checklist antes do Pull Request

- [ ] Código compila sem erros (`npm run lint`)
- [ ] Sem `any` no código
- [ ] Sem `console.log` de debug (usar logger quando implementado)
- [ ] Arquivo `.env.example` atualizado se adicionou nova variável
- [ ] Documentação atualizada se mudou endpoints
- [ ] Nome da branch segue o padrão
- [ ] Commit messages seguem Conventional Commits
