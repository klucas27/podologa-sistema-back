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
router.use("/appointments", appointmentRouter);
router.use("/clinical-evolutions", clinicalEvolutionRouter);
router.use("/pathologies", pathologyRouter);
router.use("/evolution-pathologies", evolutionPathologyRouter);
router.use("/billings", billingRouter);
router.use("/anamneses", anamnesisRouter);
router.use("/professionals", professionalRouter);

export { router };
