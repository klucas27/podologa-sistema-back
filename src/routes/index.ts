import { Router } from "express";
import { healthRouter } from "./health.routes";
import { patientRouter } from "./patient.routes";
import { authRouter } from "./auth.routes";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

/**
 * Registro centralizado de todas as rotas da aplicação.
 *
 * ── Rotas públicas ──────────────────────────────
 * Não exigem autenticação.
 */
router.use("/health", healthRouter);
router.use("/auth", authRouter);

/**
 * ── Rotas autenticadas ──────────────────────────
 * Todas as rotas abaixo exigem cookie JWT válido.
 */
router.use(authMiddleware);

router.use("/patients", patientRouter);

// Adicione novas rotas autenticadas aqui:
// router.use("/appointments", appointmentRouter);

export { router };
