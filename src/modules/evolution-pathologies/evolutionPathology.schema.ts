import { z } from "zod";

const bodyPartEnum = z.enum(["right_foot", "left_foot", "right_hand", "left_hand"]);

export const evolutionPathologyParamSchema = z.object({
  evolutionId: z.string().uuid(),
  pathologyId: z.string().uuid(),
  bodyPart: bodyPartEnum,
});

export const createEvolutionPathologySchema = z.object({
  evolutionId: z.string().uuid(),
  pathologyId: z.string().uuid(),
  bodyPart: bodyPartEnum,
  notes: z.string().max(1000).optional().nullable(),
});
