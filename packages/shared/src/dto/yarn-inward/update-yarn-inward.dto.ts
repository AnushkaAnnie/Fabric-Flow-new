import { z } from 'zod';

export const UpdateYarnInwardSchema = z.object({
  receiptDate: z.string().optional(),
  millId: z.number().int().positive().optional(),
  deliveryKnitterId: z.number().int().positive().optional(),
  hfBatch: z.string().optional(),
  yarnCount: z.string().optional(),
  yarnQuality: z.string().optional(),
  rlVl: z.enum(['RL', 'VL']).optional(),
  description: z.string().optional(),
  numBags: z.number().int().positive().optional(),
  bagWeight: z.number().positive().optional(),
  ratePerKg: z.number().positive().optional(),
  cgstRate: z.number().min(0).optional(),
  sgstRate: z.number().min(0).optional(),
  purchaseAccount: z.string().optional(),
  remarks: z.string().optional(),
  purchaseOrderId: z.string().optional(),
  millInvoiceNo:   z.string().optional(),
  millDcNo:        z.string().optional(),
  receivedWeight:  z.number().positive().optional(),
});

export type UpdateYarnInwardDto = z.infer<typeof UpdateYarnInwardSchema>;
