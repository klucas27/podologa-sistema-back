import { Router } from "express";
import { prisma, logger } from "../infra";
import { env } from "../config";
import { authMiddleware } from "../middlewares/auth.middleware";
import { doubleCsrfProtection } from "../middlewares/csrf.middleware";
import { checkRole } from "../middlewares/rbac.middleware";

// ── Health ────────────────────────────────────────
import { healthRouter } from "./health/health.routes";

// ── Auth ──────────────────────────────────────────
import { createAuthRepository } from "./auth/auth.repository";
import { createAuthService } from "./auth/auth.service";
import { createAuthController } from "./auth/auth.controller";
import { createAuthRoutes } from "./auth/auth.routes";

// ── Patients ──────────────────────────────────────
import { createPatientRepository } from "./patients/patient.repository";
import { createPatientService } from "./patients/patient.service";
import { createPatientController } from "./patients/patient.controller";
import { createPatientRoutes } from "./patients/patient.routes";

// ── Appointments ──────────────────────────────────
import { createAppointmentRepository } from "./appointments/appointment.repository";
import { createAppointmentService } from "./appointments/appointment.service";
import { createAppointmentController } from "./appointments/appointment.controller";
import { createAppointmentRoutes } from "./appointments/appointment.routes";

// ── Anamneses ─────────────────────────────────────
import { createAnamnesisRepository } from "./anamneses/anamnesis.repository";
import { createAnamnesisService } from "./anamneses/anamnesis.service";
import { createAnamnesisController } from "./anamneses/anamnesis.controller";
import { createAnamnesisRoutes } from "./anamneses/anamnesis.routes";

// ── Clinical Evolutions ──────────────────────────
import { createClinicalEvolutionRepository } from "./clinical-evolutions/clinicalEvolution.repository";
import { createClinicalEvolutionService } from "./clinical-evolutions/clinicalEvolution.service";
import { createClinicalEvolutionController } from "./clinical-evolutions/clinicalEvolution.controller";
import { createClinicalEvolutionRoutes } from "./clinical-evolutions/clinicalEvolution.routes";

// ── Pathologies ───────────────────────────────────
import { createPathologyRepository } from "./pathologies/pathology.repository";
import { createPathologyService } from "./pathologies/pathology.service";
import { createPathologyController } from "./pathologies/pathology.controller";
import { createPathologyRoutes } from "./pathologies/pathology.routes";

// ── Evolution Pathologies ─────────────────────────
import { createEvolutionPathologyRepository } from "./evolution-pathologies/evolutionPathology.repository";
import { createEvolutionPathologyService } from "./evolution-pathologies/evolutionPathology.service";
import { createEvolutionPathologyController } from "./evolution-pathologies/evolutionPathology.controller";
import { createEvolutionPathologyRoutes } from "./evolution-pathologies/evolutionPathology.routes";

// ── Billing ───────────────────────────────────────
import { createBillingRepository } from "./billing/billing.repository";
import { createBillingService } from "./billing/billing.service";
import { createBillingController } from "./billing/billing.controller";
import { createBillingRoutes } from "./billing/billing.routes";

// ── Professionals ─────────────────────────────────
import { createProfessionalRepository } from "./professionals/professional.repository";
import { createProfessionalService } from "./professionals/professional.service";
import { createProfessionalController } from "./professionals/professional.controller";
import { createProfessionalRoutes } from "./professionals/professional.routes";

// ── WhatsApp ──────────────────────────────────────
import { createWhatsappRepository } from "./whatsapp/whatsapp.repository";
import { createWhatsappService } from "./whatsapp/whatsapp.service";
import { createWhatsappController } from "./whatsapp/whatsapp.controller";
import { createWhatsappPublicRoutes, createWhatsappPrivateRoutes } from "./whatsapp/whatsapp.routes";

// ── Dashboard ─────────────────────────────────────
import { createDashboardController } from "./dashboard/dashboard.controller";
import { createDashboardRoutes } from "./dashboard/dashboard.routes";

// ── Patient Professionals ─────────────────────────
import { createPatientProfessionalRepository, createPatientProfessionalService, createPatientProfessionalRoutes } from "./patient-professionals";

// ═══════════════════════════════════════════════════
// Wiring: Repository → Service → Controller → Routes
// ═══════════════════════════════════════════════════

// Auth
const authRepo = createAuthRepository(prisma);
const authService = createAuthService(authRepo, env);
const authCtrl = createAuthController(authService, env);
const authRoutes = createAuthRoutes(authCtrl);

// Patient
const patientRepo = createPatientRepository(prisma);
const patientService = createPatientService(patientRepo);
const patientCtrl = createPatientController(patientService);
const patientRoutes = createPatientRoutes(patientCtrl);

// Appointment
const appointmentRepo = createAppointmentRepository(prisma);
const appointmentService = createAppointmentService(appointmentRepo);
const appointmentCtrl = createAppointmentController(appointmentService);
const appointmentRoutes = createAppointmentRoutes(appointmentCtrl);

// Anamnesis
const anamnesisRepo = createAnamnesisRepository(prisma);
const anamnesisService = createAnamnesisService(anamnesisRepo);
const anamnesisCtrl = createAnamnesisController(anamnesisService);
const anamnesisRoutes = createAnamnesisRoutes(anamnesisCtrl);

// Clinical Evolution
const clinicalEvolutionRepo = createClinicalEvolutionRepository(prisma);
const clinicalEvolutionService = createClinicalEvolutionService(clinicalEvolutionRepo);
const clinicalEvolutionCtrl = createClinicalEvolutionController(clinicalEvolutionService);
const clinicalEvolutionRoutes = createClinicalEvolutionRoutes(clinicalEvolutionCtrl);

// Pathology
const pathologyRepo = createPathologyRepository(prisma);
const pathologyService = createPathologyService(pathologyRepo);
const pathologyCtrl = createPathologyController(pathologyService);
const pathologyRoutes = createPathologyRoutes(pathologyCtrl);

// Evolution Pathology
const evolutionPathologyRepo = createEvolutionPathologyRepository(prisma);
const evolutionPathologyService = createEvolutionPathologyService(evolutionPathologyRepo);
const evolutionPathologyCtrl = createEvolutionPathologyController(evolutionPathologyService);
const evolutionPathologyRoutes = createEvolutionPathologyRoutes(evolutionPathologyCtrl);

// Billing
const billingRepo = createBillingRepository(prisma);
const billingService = createBillingService(billingRepo);
const billingCtrl = createBillingController(billingService);
const billingRoutes = createBillingRoutes(billingCtrl);

// Professional
const professionalRepo = createProfessionalRepository(prisma);
const professionalService = createProfessionalService(professionalRepo);
const professionalCtrl = createProfessionalController(professionalService);
const professionalRoutes = createProfessionalRoutes(professionalCtrl);

// WhatsApp
const whatsappRepo = createWhatsappRepository(prisma);
const whatsappService = createWhatsappService(whatsappRepo, env);
const whatsappCtrl = createWhatsappController(whatsappService, env);
const whatsappPublicRoutes = createWhatsappPublicRoutes(whatsappCtrl);
const whatsappPrivateRoutes = createWhatsappPrivateRoutes(whatsappCtrl);

// Dashboard
const dashboardCtrl = createDashboardController();
const dashboardRoutes = createDashboardRoutes(dashboardCtrl);

// Patient Professionals
const patientProfessionalRepo = createPatientProfessionalRepository(prisma);
const patientProfessionalService = createPatientProfessionalService({ patientProfessionalRepo });
const patientProfessionalRoutes = createPatientProfessionalRoutes(patientProfessionalService);

// ═══════════════════════════════════════════════════
// Mount all routes on main router
// ═══════════════════════════════════════════════════
const router = Router();

// Public routes
router.use("/health", healthRouter);
router.use("/auth", authRoutes);
router.use("/whatsapp", whatsappPublicRoutes);

// Authenticated + CSRF protected routes
router.use(authMiddleware);
router.use(doubleCsrfProtection);

router.use("/patients", patientRoutes);
router.use("/patients/:patientId/professionals", checkRole("admin"), patientProfessionalRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/clinical-evolutions", clinicalEvolutionRoutes);
router.use("/pathologies", pathologyRoutes);
router.use("/evolution-pathologies", evolutionPathologyRoutes);
router.use("/billings", billingRoutes);
router.use("/anamneses", anamnesisRoutes);
router.use("/professionals", professionalRoutes);
router.use("/dashboard", checkRole("admin"), dashboardRoutes);
router.use("/whatsapp", whatsappPrivateRoutes);

// ── WhatsApp message cleanup (30-day retention) ──
const MS_PER_DAY = 24 * 60 * 60 * 1000;

async function runWhatsappCleanup() {
  try {
    const deleted = await whatsappRepo.deleteOldMessageHistory();
    if (deleted > 0) {
      logger.info({ deleted }, "WhatsApp: histórico de contatos inativos removido");
    }
  } catch (err) {
    logger.error({ err }, "WhatsApp: erro ao executar limpeza de histórico");
  }
}

runWhatsappCleanup();
setInterval(runWhatsappCleanup, MS_PER_DAY);

export { router };
