import { z } from 'zod';

const DispatchLineSchema = z.object({
  greyFabricLotId: z.number().int().positive(),
});

export const CreateDyeingDispatchSchema = z.object({
  dispatchDate: z.string().optional(),
  dyerId: z.number().int().positive(),
  remarks: z.string().optional(),
  lines: z.array(DispatchLineSchema).min(1, 'At least one grey lot required'),
});

export type CreateDyeingDispatchDto = z.infer<typeof CreateDyeingDispatchSchema>;
