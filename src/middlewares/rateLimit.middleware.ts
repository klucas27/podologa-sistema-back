import rateLimit from "express-rate-limit";

/** Login: 5 req per 15 minutes */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "error", message: "Muitas tentativas de login. Tente novamente mais tarde." },
});

/** API geral: 100 req per minute */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "error", message: "Too many requests. Try again later." },
});

/** Rotas sensíveis: 10 req per minute */
export const sensitiveLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "error", message: "Muitas requisições nesta rota sensível." },
});
