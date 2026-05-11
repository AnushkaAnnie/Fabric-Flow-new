import { z } from 'zod';

export const CreateYarnLotSchema = z.object({
  hfCode: z.string().min(1),
  description: z.string().optional(),
  millId: z.number().int().positive(),
  count: z.string().optional(),
  qualityId: z.number().int().positive().optional(),
  numBags: z.number().int().positive(),
  bagWeight: z.number().positive(),
  ratePerKg: z.number().positive(),
});

export type CreateYarnLotDto = z.infer<typeof CreateYarnLotSchema>;
