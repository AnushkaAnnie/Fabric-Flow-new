import { z } from 'zod';

export const UpdateYarnLotSchema = z.object({
  hfCode: z.string().min(1).optional(),
  description: z.string().optional(),
  millId: z.number().int().positive().optional(),
  count: z.string().optional(),
  qualityId: z.number().int().positive().optional(),
  numBags: z.number().int().positive().optional(),
  bagWeight: z.number().positive().optional(),
  ratePerKg: z.number().positive().optional(),
});

export type UpdateYarnLotDto = z.infer<typeof UpdateYarnLotSchema>;
