import { z } from 'zod';

// ──────────────────────────────────────────────
// Mills
// ──────────────────────────────────────────────
export const CreateMillSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required').max(20),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export type CreateMillDto = z.infer<typeof CreateMillSchema>;

export const UpdateMillSchema = CreateMillSchema.partial();
export type UpdateMillDto = z.infer<typeof UpdateMillSchema>;

export const MillResponseSchema = CreateMillSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type MillResponse = z.infer<typeof MillResponseSchema>;

// ──────────────────────────────────────────────
// Knitters
// ──────────────────────────────────────────────
export const CreateKnitterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required').max(20),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});
export type CreateKnitterDto = z.infer<typeof CreateKnitterSchema>;

// ──────────────────────────────────────────────
// Yarn Lots
// ──────────────────────────────────────────────
export const CreateYarnLotSchema = z.object({
  lotNumber: z.string().min(1, 'Lot number is required'),
  millId: z.string().uuid(),
  yarnQualityId: z.string().uuid(),
  colourId: z.string().uuid(),
  grossWeight: z.number().positive(),
  netWeight: z.number().positive(),
  cones: z.number().int().positive(),
  receivedDate: z.string().datetime(),
  remarks: z.string().optional(),
});
export type CreateYarnLotDto = z.infer<typeof CreateYarnLotSchema>;

export const YarnLotResponseSchema = CreateYarnLotSchema.extend({
  id: z.string().uuid(),
  availableWeight: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type YarnLotResponse = z.infer<typeof YarnLotResponseSchema>;

// ──────────────────────────────────────────────
// Delivery Notes
// ──────────────────────────────────────────────
export const CreateDeliveryNoteSchema = z.object({
  dcNo: z.string().min(1),
  transferDcNo: z.string().optional(),
  knitterId: z.string().uuid(),
  deliveryDate: z.string().datetime(),
  remarks: z.string().optional(),
  items: z.array(
    z.object({
      yarnLotId: z.string().uuid(),
      sentWeight: z.number().positive(),
      cones: z.number().int().positive(),
    }),
  ),
});
export type CreateDeliveryNoteDto = z.infer<typeof CreateDeliveryNoteSchema>;

// ──────────────────────────────────────────────
// Knitter Programs
// ──────────────────────────────────────────────
export const CreateKnitterProgramSchema = z.object({
  programNo: z.string().min(1),
  memoNo: z.string().optional(),
  knitterId: z.string().uuid(),
  colourId: z.string().uuid(),
  yarnQualityId: z.string().uuid(),
  startDate: z.string().datetime(),
  expectedEndDate: z.string().datetime().optional(),
  remarks: z.string().optional(),
});
export type CreateKnitterProgramDto = z.infer<typeof CreateKnitterProgramSchema>;

// ──────────────────────────────────────────────
// Grey Fabric Lots
// ──────────────────────────────────────────────
export const CreateGreyFabricLotSchema = z.object({
  lotNumber: z.string().min(1),
  knitterProgramId: z.string().uuid(),
  receivedDate: z.string().datetime(),
  grossWeight: z.number().positive(),
  netWeight: z.number().positive(),
  rolls: z.number().int().positive(),
  remarks: z.string().optional(),
});
export type CreateGreyFabricLotDto = z.infer<typeof CreateGreyFabricLotSchema>;

// ──────────────────────────────────────────────
// Dyeing Programs
// ──────────────────────────────────────────────
export const CreateDyeingProgramSchema = z.object({
  programNo: z.string().min(1),
  dyerId: z.string().uuid(),
  colourId: z.string().uuid(),
  washTypeId: z.string().uuid(),
  startDate: z.string().datetime(),
  remarks: z.string().optional(),
});
export type CreateDyeingProgramDto = z.infer<typeof CreateDyeingProgramSchema>;

// ──────────────────────────────────────────────
// Audit Log
// ──────────────────────────────────────────────
export const AuditLogResponseSchema = z.object({
  id: z.string().uuid(),
  tableName: z.string(),
  recordId: z.string(),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  oldData: z.record(z.unknown()).nullable(),
  newData: z.record(z.unknown()).nullable(),
  performedBy: z.string(),
  performedAt: z.date(),
});
export type AuditLogResponse = z.infer<typeof AuditLogResponseSchema>;

// ──────────────────────────────────────────────
// Common
// ──────────────────────────────────────────────
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  });
