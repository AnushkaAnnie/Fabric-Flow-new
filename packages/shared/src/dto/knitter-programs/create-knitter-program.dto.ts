import { z } from 'zod';

export const CreateKnitterProgramSchema = z.object({
  knitterId: z.number().int().positive(),
  yarnLotId: z.number().int().positive(),
  quantityUsed: z.number().positive(),
  greyWeight: z.number().positive(),
  numRolls: z.number().int().positive().optional(),
  dia: z.string().optional(),
  gg: z.string().optional(),
  loopLength: z.string().optional(),
  fabricName: z.string().optional(),
  fabricColour: z.string().optional(),
  programmeRef: z.string().optional(),
  preAssignedDyerId: z.number().int().positive().optional(),
  programDate: z.string().optional(),
});

export type CreateKnitterProgramDto = z.infer<typeof CreateKnitterProgramSchema>;
