import { z } from 'zod';

export const UpdateDyeingSchema = z.object({
  initialWeight: z.number().positive().optional(),
  finalWeight: z.number().positive().optional(),
  companyDcNo: z.string().optional(),
  dateGiven: z.string().optional(),
  washTypeId: z.number().int().positive().optional(),
  compacterId: z.number().int().positive().optional(),
  status: z.string().optional(),
});

export type UpdateDyeingDto = z.infer<typeof UpdateDyeingSchema>;
