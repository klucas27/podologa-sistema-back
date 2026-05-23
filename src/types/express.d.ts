declare namespace Express {
  interface AuthUser {
    userId: string;
    username: string;
    role: "admin" | "professional";
    professionalId: string | null;
    adminId: string;
  }

  interface Request {
    user?: AuthUser;
    rawBody?: Buffer;
  }
}
