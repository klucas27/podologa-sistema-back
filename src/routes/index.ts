import { Router } from "express";
import { healthRouter } from "./health.routes";
import { patientRouter } from "./patient.routes";
import { authRouter } from "./auth.routes";
import { appointmentRouter } from "./appointment.routes";
import { clinicalEvolutionRouter } from "./clinicalEvolution.routes";
import { pathologyRouter } from "./pathology.routes";
import { evolutionPathologyRouter } from "./evolutionPathology.routes";
import { billingRouter } from "./billing.routes";
import { anamnesisRouter } from "./anamnesis.routes";
import { professionalRouter } from "./professional.routes";
import { dashboardRouter } from "./dashboard.routes";
import { authMiddleware } from "../middlewares/auth.middleware";
import { doubleCsrfProtection } from "../middlewares/csrf.middleware";

const router = Router();

/**
 * ── Rotas públicas ──────────────────────────────
 * Não exigem autenticação.
 */
router.use("/health", healthRouter);
router.use("/auth", authRouter);

/**
 * ── Rotas autenticadas + CSRF ───────────────────
 * Todas as rotas abaixo exigem:
 * 1. Cookie JWT válido (access_token) — authMiddleware
 * 2. Token CSRF válido no header X-CSRF-Token em POST/PUT/PATCH/DELETE — doubleCsrfProtection
 */
router.use(authMiddleware);
router.use(doubleCsrfProtection);

router.use("/patients", patientRouter);
router.use("/appointments", appointmentRouter);
router.use("/clinical-evolutions", clinicalEvolutionRouter);
router.use("/pathologies", pathologyRouter);
router.use("/evolution-pathologies", evolutionPathologyRouter);
router.use("/billings", billingRouter);
router.use("/anamneses", anamnesisRouter);
router.use("/professionals", professionalRouter);
router.use("/dashboard", dashboardRouter);

export { router };
