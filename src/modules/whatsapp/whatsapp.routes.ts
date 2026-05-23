import { Router } from "express";
import type { WhatsappController } from "./whatsapp.controller";

export function createWhatsappPublicRoutes(ctrl: WhatsappController): Router {
  const router = Router();
  router.get("/webhook", ctrl.verifyWebhook);
  router.post("/webhook", ctrl.receiveMessage);
  return router;
}

export function createWhatsappPrivateRoutes(ctrl: WhatsappController): Router {
  const router = Router();
  router.get("/status", ctrl.getStatus);
  router.get("/history", ctrl.getHistory);
  return router;
}
