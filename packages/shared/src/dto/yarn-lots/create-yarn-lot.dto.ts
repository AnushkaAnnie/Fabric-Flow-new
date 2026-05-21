import { z } from 'zod';

export const CreateYarnLotSchema = z.object({
  hfCode: z.string().min(1),
  description: z.string().optional(),
  millId: z.number().int().positive(),
  count: z.string().optional(),
  noOfBags: z.number().int().nonnegative().optional(),
  bagWeight: z.number().positive().optional(),
  totalWeight: z.number().positive().optional(),
  ratePerKg: z.number().nonnegative().optional(),
  cgstRate: z.number().nonnegative().optional(),
  sgstRate: z.number().nonnegative().optional(),
});

export type CreateYarnLotDto = z.infer<typeof CreateYarnLotSchema>;
