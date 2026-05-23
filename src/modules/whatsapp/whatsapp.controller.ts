import type { Request, Response, NextFunction } from "express";
import { logger } from "../../infra/logger";
import { webhookBodySchema } from "./whatsapp.schema";
import type { WhatsappService } from "./whatsapp.service";
import type { Env } from "../../config/env";

export function createWhatsappController(service: WhatsappService, envConfig: Env) {
  return {
    verifyWebhook(req: Request, res: Response): void {
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      if (mode === "subscribe" && token === envConfig.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
        res.status(200).send(challenge);
        return;
      }

      res.status(403).json({ status: "error", message: "Verification failed" });
    },

    receiveMessage(req: Request, res: Response): void {
      const rawBody = req.rawBody;
      const signature = req.headers["x-hub-signature-256"] as string | undefined;

      if (!rawBody || !signature) {
        res.status(400).json({ status: "error", message: "Missing body or signature" });
        return;
      }

      try {
        service.verifyWebhookSignature(rawBody, signature);
      } catch {
        res.status(401).json({ status: "error", message: "Invalid signature" });
        return;
      }

      // Respond immediately — Meta requires < 5 s
      res.sendStatus(200);

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawBody.toString("utf8"));
      } catch {
        logger.warn("WhatsApp webhook: failed to parse JSON body");
        return;
      }

      const result = webhookBodySchema.safeParse(parsed);
      if (!result.success) {
        logger.warn({ issues: result.error.issues }, "WhatsApp webhook: unexpected payload shape");
        return;
      }

      service.handleIncomingMessage(result.data).catch((err: unknown) => {
        logger.error({ err }, "WhatsApp webhook: unhandled error in handleIncomingMessage");
      });
    },

    getStatus(_req: Request, res: Response, next: NextFunction): void {
      try {
        const data = service.getStatus();
        res.status(200).json({ status: "ok", data });
      } catch (err) {
        next(err);
      }
    },

    async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const patientId = req.query["patientId"] as string | undefined;
        const page = req.query["page"] ? parseInt(req.query["page"] as string, 10) : 1;
        const limit = req.query["limit"] ? parseInt(req.query["limit"] as string, 10) : 20;
        const data = await service.getHistory({ patientId, page, limit });
        res.status(200).json({ status: "ok", data });
      } catch (err) {
        next(err);
      }
    },
  };
}

export type WhatsappController = ReturnType<typeof createWhatsappController>;
