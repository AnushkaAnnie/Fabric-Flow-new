import { z } from "zod";

// Matches the Phase 1A WorkflowEvent Prisma model
export const WorkflowEventSchema = z.object({
  id: z.number(),
  entityType: z.string(),
  entityId: z.number(),
  event: z.string(),
  oldStatus: z.string().nullable().optional(),
  newStatus: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type WorkflowEvent = z.infer<typeof WorkflowEventSchema>;
