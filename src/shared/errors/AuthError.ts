import { AppError } from "./AppError";

export class AuthError extends AppError {
  constructor(message = "Não autenticado", statusCode = 401) {
    super(message, statusCode);
  }
}
