declare namespace Express {
  interface AuthUser {
    userId: string;
    username: string;
    /** Roles assigned to the user (e.g. ['admin','manager']) */
    roles: string[];
  }

  interface Request {
    user?: AuthUser;
  }
}
