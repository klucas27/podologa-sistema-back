import { AppError } from "./AppError";

export class ValidationError extends AppError {
  public readonly issues: unknown[];

  constructor(message = "Dados inválidos", issues: unknown[] = []) {
    super(message, 400);
    this.issues = issues;
  }
}
