import { z } from 'zod';

export const UpdateReceivedWeightSchema = z.object({
  receivedWeight: z.number().positive(),
  receivedDate: z.string().optional(),
});

export type UpdateReceivedWeightDto = z.infer<typeof UpdateReceivedWeightSchema>;
