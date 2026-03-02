# Arquitetura do Sistema

## Visão Geral

O backend segue uma **arquitetura em camadas** (layered architecture), separando responsabilidades de forma clara e testável.

---

## Diagrama de Camadas

```
┌─────────────────────────────────┐
│          HTTP Client            │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│        Middlewares               │  helmet, cors, morgan, compression
│        (segurança, logs)         │  errorHandler, notFound
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│          Routes                  │  Define endpoints e métodos HTTP
│          (src/routes/)           │  Apenas routing, sem lógica
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│        Controllers               │  Extrai dados do request
│        (src/controllers/)        │  Chama services
│                                  │  Retorna response formatada
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│         Services                 │  Regras de negócio
│         (src/services/)          │  Validações
│                                  │  Orquestração entre repositórios
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│       Repositories               │  CRUD no banco de dados
│       (src/repositories/)        │  Queries e operações de dados
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│         Database                 │  PostgreSQL / MySQL / etc.
└─────────────────────────────────┘
```

---

## Decisões Técnicas

### Express 5.x

Utilizamos Express 5 como framework HTTP por ser amplamente adotado, ter grande ecossistema e suporte nativo a async/await.

### TypeScript Strict

O `tsconfig.json` está configurado com `strict: true` e checks adicionais:
- `noUncheckedIndexedAccess` — segurança em acessos por index
- `noImplicitReturns` — funções sempre retornam explicitamente
- `noUnusedLocals` / `noUnusedParameters` — sem código morto

### Configuração Centralizada

Todas as variáveis de ambiente são carregadas e tipadas em `src/configs/env.ts`. Nenhum módulo acessa `process.env` diretamente — **sempre** importar de `configs`.

### CORS

A configuração de CORS em `src/configs/cors.ts` diferencia automaticamente entre:
- **Development**: aceita qualquer origem (facilita desenvolvimento local)
- **Production**: aceita apenas origens explícitas definidas em `CORS_ORIGIN`

### Segurança

- **Helmet** configura automaticamente headers de segurança (X-Frame-Options, CSP, etc.)
- **Compression** reduz o tamanho das respostas HTTP via gzip

### Logging

- **Development**: Morgan formato `dev` (colorido, curto)
- **Production**: Morgan formato `combined` (Apache-style, completo para análise)

---

## Padrões de Código

### Barrel Exports

Cada pasta possui um `index.ts` que re-exporta seus módulos. Isso permite imports limpos:

```typescript
// ✅ Import limpo via barrel
import { env, corsOptions } from "./configs";

// ❌ Import direto (evitar)
import { env } from "./configs/env";
```

### Error Handling

Erros são centralizados no middleware `errorHandler`. Controllers e services devem lançar erros com `throw new Error()` ou erros customizados (a ser implementado conforme necessário).

---

## Próximos Passos

- [ ] Configurar banco de dados (ORM/Query Builder)
- [ ] Implementar autenticação JWT
- [ ] Adicionar validação de request (Zod ou Joi)
- [ ] Implementar módulo de pacientes
- [ ] Implementar módulo de agendamentos
- [ ] Configurar testes automatizados
- [ ] Configurar CI/CD
