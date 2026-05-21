import { z } from 'zod';

export const CreateYarnInwardSchema = z.object({
  receiptDate: z.string().optional(),
  millId: z.number().int().positive(),
  deliveryKnitterId: z.number().int().positive(),
  hfBatch: z.string().optional(),
  yarnCount: z.string().optional(),
  yarnQuality: z.string().optional(),
  rlVl: z.enum(['RL', 'VL']).optional(),
  description: z.string().optional(),
  numBags: z.number().int().positive().optional(),
  bagWeight: z.number().positive().optional(), // default 60 in service
  ratePerKg: z.number().positive(),
  cgstRate: z.number().min(0).optional(), // default 2.5
  sgstRate: z.number().min(0).optional(), // default 2.5
  purchaseAccount: z.string().optional(),
  remarks: z.string().optional(),
});

export type CreateYarnInwardDto = z.infer<typeof CreateYarnInwardSchema>;
