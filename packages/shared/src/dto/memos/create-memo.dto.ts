import { z } from 'zod';

const MemoLineSchema = z.object({
  yarnLotId: z.number().int().positive(),
  knitterId: z.number().int().positive(),
  yarnCount: z.string().optional(),
  dia: z.string().optional(),
  gg: z.string().optional(),
  loopLength: z.string().optional(),
  fabricName: z.string().optional(),
  fabricColour: z.string().optional(),
  expectedRolls: z.number().int().positive().optional(),
  preAssignedDyerId: z.number().int().positive().optional(),
});

export const CreateMemoSchema = z.object({
  issueDate: z.string().optional(),
  programmeRef: z.string().optional(),
  account: z.string().optional(),
  remarks: z.string().optional(),
  lines: z.array(MemoLineSchema).min(1, 'Memo must have at least one line'),
});
export type CreateMemoDto = z.infer<typeof CreateMemoSchema>;
