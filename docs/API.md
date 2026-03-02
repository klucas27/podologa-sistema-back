# Documentação da API

Base URL: `http://localhost:3333/api`

---

## Autenticação

> ⚠️ A ser implementado. Endpoints protegidos exigirão header `Authorization: Bearer <token>`.

---

## Endpoints

### Health Check

Verifica o status do servidor.

**Request:**

```
GET /api/health
```

**Response: `200 OK`**

```json
{
  "status": "ok",
  "timestamp": "2026-03-02T12:00:00.000Z",
  "uptime": 123.456
}
```

---

### Pacientes

> ⚠️ A ser implementado.

| Método | Endpoint              | Descrição              | Auth |
| ------ | --------------------- | ---------------------- | ---- |
| GET    | `/api/pacientes`      | Listar pacientes       | Sim  |
| GET    | `/api/pacientes/:id`  | Buscar paciente por ID | Sim  |
| POST   | `/api/pacientes`      | Criar paciente         | Sim  |
| PUT    | `/api/pacientes/:id`  | Atualizar paciente     | Sim  |
| DELETE | `/api/pacientes/:id`  | Remover paciente       | Sim  |

---

### Agendamentos

> ⚠️ A ser implementado.

| Método | Endpoint                  | Descrição                  | Auth |
| ------ | ------------------------- | -------------------------- | ---- |
| GET    | `/api/agendamentos`       | Listar agendamentos        | Sim  |
| GET    | `/api/agendamentos/:id`   | Buscar agendamento por ID  | Sim  |
| POST   | `/api/agendamentos`       | Criar agendamento          | Sim  |
| PUT    | `/api/agendamentos/:id`   | Atualizar agendamento      | Sim  |
| DELETE | `/api/agendamentos/:id`   | Remover agendamento        | Sim  |

---

## Padrão de Respostas

### Sucesso

```json
{
  "status": "ok",
  "data": { }
}
```

### Erro

```json
{
  "status": "error",
  "message": "Descrição do erro"
}
```

### Lista com Paginação

```json
{
  "status": "ok",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

---

## Códigos de Status

| Código | Significado                |
| ------ | -------------------------- |
| 200    | Sucesso                    |
| 201    | Recurso criado             |
| 204    | Sucesso sem conteúdo       |
| 400    | Request inválido           |
| 401    | Não autenticado            |
| 403    | Sem permissão              |
| 404    | Não encontrado             |
| 409    | Conflito                   |
| 500    | Erro interno do servidor   |
