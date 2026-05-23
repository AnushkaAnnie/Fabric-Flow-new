import { z } from "zod";

export const WorkflowStatusSchema = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export type WorkflowStatus = z.infer<typeof WorkflowStatusSchema>;

export const WorkflowEventSchema = z.object({
  id: z.number(),
  entityId: z.string(),
  entityType: z.string(),
  status: WorkflowStatusSchema,
  payload: z.record(z.any()).nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type WorkflowEvent = z.infer<typeof WorkflowEventSchema>;

export const CreateWorkflowEventSchema = z.object({
  entityId: z.string().min(1, "entityId is required"),
  entityType: z.string().min(1, "entityType is required"),
  initialStatus: WorkflowStatusSchema,
});

export type CreateWorkflowEventDto = z.infer<typeof CreateWorkflowEventSchema>;

export const UpdateWorkflowStatusSchema = z.object({
  status: WorkflowStatusSchema,
});

export type UpdateWorkflowStatusDto = z.infer<typeof UpdateWorkflowStatusSchema>;
