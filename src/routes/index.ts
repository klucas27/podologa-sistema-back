import { Router } from "express";
import { healthRouter } from "./health.routes";
import { patientRouter } from "./patient.routes";

const router = Router();

/**
 * Registro centralizado de todas as rotas da aplicação.
 * Cada módulo possui seu próprio arquivo de rotas.
 *
 * Padrão: router.use("/recurso", recursoRouter);
 */
router.use("/health", healthRouter);
router.use("/patients", patientRouter);

// Adicione novas rotas aqui:
// router.use("/agendamentos", agendamentosRouter);
// router.use("/auth", authRouter);

export { router };
