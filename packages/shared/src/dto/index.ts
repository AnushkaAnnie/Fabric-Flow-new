import { z } from "zod";

export const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;

// ──────────────────────────────────────────────
// Master Data
// ──────────────────────────────────────────────
export * from './mills';
export * from './knitters';
export * from './dyers';
export * from './compacters';

export const MillResponseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  code: z.string(),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  contactNo: z.string().optional(),
  gstin: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type MillResponse = z.infer<typeof MillResponseSchema>;

export const CreateColourSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required").max(20),
  hexCode: z.string().optional(),
  description: z.string().optional(),
});
export type CreateColourDto = z.infer<typeof CreateColourSchema>;
export const UpdateColourSchema = CreateColourSchema.partial();
export type UpdateColourDto = z.infer<typeof UpdateColourSchema>;

export const CreateWashTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required").max(20),
  description: z.string().optional(),
});
export type CreateWashTypeDto = z.infer<typeof CreateWashTypeSchema>;
export const UpdateWashTypeSchema = CreateWashTypeSchema.partial();
export type UpdateWashTypeDto = z.infer<typeof UpdateWashTypeSchema>;

export const CreateYarnQualitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required").max(20),
  composition: z.string().optional(),
  count: z.string().optional(),
  description: z.string().optional(),
});
export type CreateYarnQualityDto = z.infer<typeof CreateYarnQualitySchema>;
export const UpdateYarnQualitySchema = CreateYarnQualitySchema.partial();
export type UpdateYarnQualityDto = z.infer<typeof UpdateYarnQualitySchema>;

// ──────────────────────────────────────────────
// Yarn Lots
// ──────────────────────────────────────────────
export * from './yarn-lots/create-yarn-lot.dto';
export * from './yarn-lots/update-yarn-lot.dto';
export * from './yarn-lots/issue-yarn.dto';

// ──────────────────────────────────────────────
// Delivery Notes
// ──────────────────────────────────────────────
export const CreateDeliveryNoteSchema = z.object({
  dcNo: z.string().min(1),
  transferDcNo: z.string().optional(),
  knitterId: z.number().int().positive(),
  deliveryDate: z.string().datetime(),
  remarks: z.string().optional(),
  items: z.array(
    z.object({
      yarnLotId: z.number().int().positive(),
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
  knitterId: z.number().int().positive(),
  colourId: z.number().int().positive(),
  yarnQualityId: z.number().int().positive(),
  startDate: z.string().datetime(),
  expectedEndDate: z.string().datetime().optional(),
  remarks: z.string().optional(),
});
export type CreateKnitterProgramDto = z.infer<
  typeof CreateKnitterProgramSchema
>;

// ──────────────────────────────────────────────
// Grey Fabric Lots
// ──────────────────────────────────────────────
export const CreateGreyFabricLotSchema = z.object({
  lotNumber: z.string().min(1),
  knitterProgramId: z.number().int().positive(),
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
  dyerId: z.number().int().positive(),
  colourId: z.number().int().positive(),
  washTypeId: z.number().int().positive(),
  startDate: z.string().datetime(),
  remarks: z.string().optional(),
});
export type CreateDyeingProgramDto = z.infer<typeof CreateDyeingProgramSchema>;

// ──────────────────────────────────────────────
// Audit Log
// ──────────────────────────────────────────────
export const AuditLogResponseSchema = z.object({
  id: z.number().int().positive(),
  tableName: z.string(),
  recordId: z.string(),
  action: z.enum(["CREATE", "UPDATE", "DELETE"]),
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

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T,
) =>
  z.object({
    data: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  });
