import { z } from 'zod';

export const IssueYarnSchema = z.object({
  knitterId: z.number().int().positive(),
  weight: z.number().positive(),
});

export type IssueYarnDto = z.infer<typeof IssueYarnSchema>;
