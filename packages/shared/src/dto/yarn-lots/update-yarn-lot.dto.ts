import { z } from 'zod';

export const UpdateYarnLotSchema = z.object({
  hfCode: z.string().min(1).optional(),
  description: z.string().optional(),
  millId: z.number().int().positive().optional(),
  count: z.string().optional(),
  noOfBags: z.number().int().nonnegative().optional(),
  bagWeight: z.number().positive().optional(),
  totalWeight: z.number().positive().optional(),
  ratePerKg: z.number().nonnegative().optional(),
  cgstRate: z.number().nonnegative().optional(),
  sgstRate: z.number().nonnegative().optional(),
});

export type UpdateYarnLotDto = z.infer<typeof UpdateYarnLotSchema>;
