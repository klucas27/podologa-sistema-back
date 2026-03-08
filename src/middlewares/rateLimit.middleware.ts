import rateLimit from "express-rate-limit";

/**
 * Rate limit global: 500 requisições por IP a cada 15 minutos.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Muitas requisições. Tente novamente mais tarde.",
  },
});

/**
 * Rate limit para autenticação: 10 tentativas por IP a cada 15 minutos.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Muitas tentativas de login. Tente novamente mais tarde.",
  },
});
