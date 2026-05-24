# Documentação da API

Base URL: `http://localhost:3333/api`

> Em produção, substitua pela URL do servidor (ex: `https://podologia-anapaula.alwaysdata.net/api`).

---

## Autenticação

A API usa **JWT armazenado em cookie HttpOnly**. Não é necessário enviar header `Authorization`.

- Após o login, o servidor define automaticamente os cookies `access_token` e `refresh_token`.
- Todas as requisições protegidas devem incluir esses cookies (enviados automaticamente pelo browser).
- Mutações protegidas (POST, PUT, PATCH, DELETE) exigem o header `X-CSRF-Token` com o valor retornado no login/refresh.

---

## Rotas Públicas

### Health Check

```
GET /api/health
```

**Response: `200 OK`**

```json
{
  "status": "ok",
  "timestamp": "2026-05-23T12:00:00.000Z",
  "uptime": 123.456
}
```

---

## Auth

### Login

```
POST /api/auth/login
```

**Body:**

```json
{
  "username": "admin",
  "password": "senha123"
}
```

**Response: `200 OK`**

```json
{
  "status": "ok",
  "data": {
    "csrfToken": "<token>",
    "user": {
      "userId": "uuid",
      "username": "admin",
      "role": "admin",
      "professionalId": null,
      "adminId": "uuid"
    }
  }
}
```

> Define cookies `access_token` e `refresh_token` (HttpOnly, Secure, SameSite=Strict).

---

### Registro

```
POST /api/auth/register
```

**Body:**

```json
{
  "username": "novo_usuario",
  "password": "senha123"
}
```

**Response: `201 Created`**

---

### Refresh Token

```
POST /api/auth/refresh
```

> Usa o cookie `refresh_token`. Retorna novo `access_token` via cookie e novo `csrfToken` no body.

**Response: `200 OK`**

```json
{
  "status": "ok",
  "data": { "csrfToken": "<token>" }
}
```

---

### Logout

```
POST /api/auth/logout
```

> Limpa os cookies de sessão.

**Response: `200 OK`**

---

### Dados do Usuário Autenticado

```
GET /api/auth/me
```

**Auth:** obrigatório

**Response: `200 OK`**

```json
{
  "status": "ok",
  "data": {
    "userId": "uuid",
    "username": "admin",
    "role": "admin",
    "professionalName": "Ana Paula",
    "workdayStart": "08:00",
    "workdayEnd": "18:00"
  }
}
```

---

### Alterar Senha

```
PATCH /api/auth/password
```

**Auth:** obrigatório | **CSRF:** obrigatório

**Body:**

```json
{
  "currentPassword": "senha_atual",
  "newPassword": "nova_senha"
}
```

**Response: `200 OK`**

---

### Alterar Horário de Trabalho

```
PATCH /api/auth/working-hours
```

**Auth:** obrigatório | **CSRF:** obrigatório

**Body:**

```json
{
  "workdayStart": "09:00",
  "workdayEnd": "17:00"
}
```

**Response: `200 OK`**

---

## Pacientes

> Todas as rotas abaixo exigem autenticação.

| Método   | Endpoint               | Descrição                              |
| -------- | ---------------------- | -------------------------------------- |
| `GET`    | `/api/patients`        | Listar pacientes (paginado)            |
| `GET`    | `/api/patients/:id`    | Buscar paciente por ID                 |
| `POST`   | `/api/patients`        | Criar paciente                         |
| `PATCH`  | `/api/patients/:id`    | Atualizar paciente (parcial)           |
| `DELETE` | `/api/patients/:id`    | Soft delete (marca como deletado)      |
| `DELETE` | `/api/patients/:id/force` | Hard delete (remove permanentemente)|

---

## Agendamentos

| Método   | Endpoint                   | Descrição                         |
| -------- | -------------------------- | --------------------------------- |
| `GET`    | `/api/appointments`        | Listar agendamentos               |
| `GET`    | `/api/appointments/:id`    | Buscar agendamento por ID         |
| `POST`   | `/api/appointments`        | Criar agendamento                 |
| `PATCH`  | `/api/appointments/:id`    | Atualizar agendamento             |
| `DELETE` | `/api/appointments/:id`    | Remover agendamento               |

---

## Anamneses

| Método   | Endpoint                | Descrição               |
| -------- | ----------------------- | ----------------------- |
| `GET`    | `/api/anamneses`        | Listar anamneses        |
| `GET`    | `/api/anamneses/:id`    | Buscar anamnese por ID  |
| `POST`   | `/api/anamneses`        | Criar anamnese          |
| `PATCH`  | `/api/anamneses/:id`    | Atualizar anamnese      |
| `DELETE` | `/api/anamneses/:id`    | Remover anamnese        |

---

## Evoluções Clínicas

| Método   | Endpoint                          | Descrição                       |
| -------- | --------------------------------- | ------------------------------- |
| `GET`    | `/api/clinical-evolutions`        | Listar evoluções clínicas       |
| `GET`    | `/api/clinical-evolutions/:id`    | Buscar evolução por ID          |
| `POST`   | `/api/clinical-evolutions`        | Criar evolução clínica          |
| `PATCH`  | `/api/clinical-evolutions/:id`    | Atualizar evolução              |
| `DELETE` | `/api/clinical-evolutions/:id`    | Remover evolução                |

---

## Patologias

| Método   | Endpoint                   | Descrição                |
| -------- | -------------------------- | ------------------------ |
| `GET`    | `/api/pathologies`         | Listar patologias        |
| `GET`    | `/api/pathologies/:id`     | Buscar patologia por ID  |
| `POST`   | `/api/pathologies`         | Criar patologia          |
| `PATCH`  | `/api/pathologies/:id`     | Atualizar patologia      |
| `DELETE` | `/api/pathologies/:id`     | Remover patologia        |

---

## Patologias por Evolução

| Método   | Endpoint                              | Descrição                              |
| -------- | ------------------------------------- | -------------------------------------- |
| `GET`    | `/api/evolution-pathologies`          | Listar vínculos evolução ↔ patologia  |
| `GET`    | `/api/evolution-pathologies/:id`      | Buscar vínculo por ID                  |
| `POST`   | `/api/evolution-pathologies`          | Criar vínculo                          |
| `DELETE` | `/api/evolution-pathologies/:id`      | Remover vínculo                        |

---

## Financeiro (Billings)

| Método   | Endpoint               | Descrição                  |
| -------- | ---------------------- | -------------------------- |
| `GET`    | `/api/billings`        | Listar cobranças           |
| `GET`    | `/api/billings/:id`    | Buscar cobrança por ID     |
| `POST`   | `/api/billings`        | Criar cobrança             |
| `PATCH`  | `/api/billings/:id`    | Atualizar cobrança         |
| `DELETE` | `/api/billings/:id`    | Remover cobrança           |

---

## Profissionais

| Método   | Endpoint                     | Descrição                      |
| -------- | ---------------------------- | ------------------------------ |
| `GET`    | `/api/professionals`         | Listar profissionais           |
| `GET`    | `/api/professionals/:id`     | Buscar profissional por ID     |
| `POST`   | `/api/professionals`         | Criar profissional             |
| `PATCH`  | `/api/professionals/:id`     | Atualizar profissional         |
| `DELETE` | `/api/professionals/:id`     | Remover profissional           |

---

## Vínculo Paciente ↔ Profissional

> Requer role `admin`.

| Método   | Endpoint                                          | Descrição                          |
| -------- | ------------------------------------------------- | ---------------------------------- |
| `GET`    | `/api/patients/:patientId/professionals`          | Listar profissionais do paciente   |
| `POST`   | `/api/patients/:patientId/professionals`          | Vincular profissional ao paciente  |
| `DELETE` | `/api/patients/:patientId/professionals/:profId`  | Desvincular profissional           |

---

## Dashboard

> Requer role `admin`.

| Método | Endpoint          | Descrição                                |
| ------ | ----------------- | ---------------------------------------- |
| `GET`  | `/api/dashboard`  | Estatísticas gerais do consultório       |

---

## Padrão de Respostas

### Sucesso — recurso único

```json
{
  "status": "ok",
  "data": { }
}
```

### Sucesso — lista com paginação

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

### Erro de validação (`400`)

```json
{
  "status": "error",
  "message": "Validation error",
  "errors": {
    "body": {
      "fieldName": ["Mensagem de erro"]
    }
  }
}
```

### Erro geral

```json
{
  "status": "error",
  "message": "Descrição do erro"
}
```

### Status HTTP

| Código | Quando usar                               |
| ------ | ----------------------------------------- |
| 200    | Sucesso geral                             |
| 201    | Recurso criado                            |
| 204    | Sucesso sem conteúdo (DELETE)             |
| 400    | Request inválido (falha de validação Zod) |
| 401    | Não autenticado (cookie ausente/expirado) |
| 403    | Sem permissão (role insuficiente)         |
| 404    | Recurso não encontrado                    |
| 409    | Conflito (ex: username já cadastrado)     |
| 429    | Rate limit excedido                       |
| 500    | Erro interno do servidor                  |


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
