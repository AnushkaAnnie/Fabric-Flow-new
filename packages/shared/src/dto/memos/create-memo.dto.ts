import { z } from 'zod';

const MemoLineSchema = z
  .object({
    knittingLotId: z.number().int().positive(),
    sentWeight: z.number().positive(),
  })
  .describe('Memo lines for new knitting-based dyeing dispatch');

export const CreateMemoSchema = z.object({
  memoNo: z.number().int().positive().optional(),
  issueDate: z.string().optional(),
  dyerId: z.number().int().positive(),
  remarks: z.string().optional(),
  lines: z.array(MemoLineSchema).min(1),
});

export type CreateMemoDto = z.infer<typeof CreateMemoSchema>;
