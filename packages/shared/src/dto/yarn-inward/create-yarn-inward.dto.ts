import { z } from 'zod';

export const CreateYarnInwardSchema = z.object({
  receiptDate: z.string().optional(), // ISO date
  millId: z.number().int().positive(),
  hfBatch: z.string().optional(),
  yarnCount: z.string().optional(),
  yarnQuality: z.string().optional(),
  totalWeight: z.number().positive(),
  numBags: z.number().int().positive().optional(),
  ratePerKg: z.number().positive().optional(),
  purchaseAccount: z.string().optional(),
  remarks: z.string().optional(),
});
export type CreateYarnInwardDto = z.infer<typeof CreateYarnInwardSchema>;
