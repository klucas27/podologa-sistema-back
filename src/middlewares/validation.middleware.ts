import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ZodTypeAny, ZodSchema } from "zod";
import { ZodError } from "zod";

type InputSchemas = {
  body?: ZodSchema<unknown> | ZodTypeAny;
  params?: ZodSchema<unknown> | ZodTypeAny;
  query?: ZodSchema<unknown> | ZodTypeAny;
};

/**
 * Schema-first validation middleware using Zod.
 * Usage: validate({ body: schema, params: schema, query: schema })
 * Replaces ad-hoc validators and guarantees typed, parsed input on req.
 */
export function validate(schemas: InputSchemas): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.params) {
        const parsed = (schemas.params as ZodSchema<unknown>).parse(req.params);
        req.params = parsed as typeof req.params;
      }

      if (schemas.query) {
        const parsed = (schemas.query as ZodSchema<unknown>).parse(req.query);
        // Express query types are strings | string[] | ParsedQs; replace with typed object
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        req.query = parsed as unknown as NodeJS.Dict<string>;
      }

      if (schemas.body) {
        const parsed = (schemas.body as ZodSchema<unknown>).parse(req.body);
        req.body = parsed;
      }

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({ status: "error", message: "Invalid input", issues: err.issues });
        return;
      }

      next(err as Error);
    }
  };
}
