declare namespace Express {
  interface AuthUser {
    userId: string;
    username: string;
    role: "admin" | "professional";
    /** The admin userId this user belongs to (same as userId for admins) */
    adminId: string;
    /** Roles assigned to the user (e.g. ['admin','manager']) */
    roles: string[];
    /** The professional id linked to this user (null for admins) */
    professionalId: string | null;
  }

  interface Request {
    user?: AuthUser;
  }
}
