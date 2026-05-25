import { z } from "zod";

// ──────────────────────────────────────────────
// WorkflowStatus enum — keep in sync with
// apps/textile-flow-svc/src/workflow/workflow-status.service.ts
// ──────────────────────────────────────────────
export enum WorkflowStatus {
  PENDING = "Pending",
  SENT = "Sent",
  RECEIVED = "Received",
  IN_DYEING = "In Dyeing",
  COMPLETED = "Completed",
  CANCELLED = "Cancelled",
}

// ──────────────────────────────────────────────
// Matches the Phase 1A WorkflowEvent Prisma model
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// CreateWorkflowEvent DTO
// ──────────────────────────────────────────────
export const CreateWorkflowEventSchema = z.object({
  entityType: z.string().min(1, "Entity type is required"),
  entityId: z.number().int().positive("Entity ID must be a positive integer"),
  event: z.string().min(1, "Event is required"),
  initialStatus: z.nativeEnum(WorkflowStatus),
});

export type CreateWorkflowEventDto = z.infer<typeof CreateWorkflowEventSchema>;
