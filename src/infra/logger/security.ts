import { logger } from "./logger";

const securityLogger = logger.child({ context: "security" });

interface SecurityEvent {
  event: string;
  userId?: string;
  ip?: string;
  route?: string;
  method?: string;
  meta?: Record<string, unknown>;
}

export function logSecurityEvent(entry: SecurityEvent): void {
  securityLogger.warn(entry, `SECURITY: ${entry.event}`);
}

export function logAuthAttempt(userId: string | undefined, success: boolean, ip: string): void {
  securityLogger.info(
    { event: success ? "auth_success" : "auth_failure", userId, ip },
    `Auth attempt: ${success ? "success" : "failure"}`,
  );
}

export function logRbacCheck(userId: string | undefined, route: string, method: string, allowed: string[]): void {
  securityLogger.debug({ event: "rbac_check", userId, route, method, allowed }, "RBAC check");
}

export function logRbacDenied(userId: string | undefined, route: string, method: string): void {
  securityLogger.warn(
    { event: "rbac_denied", userId, route, method },
    `RBAC denied: ${method} ${route}`,
  );
}

export { securityLogger };
