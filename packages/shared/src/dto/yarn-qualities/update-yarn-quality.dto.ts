import { z } from "zod";

export const UpdateYarnQualityDto = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).max(20).optional(),
  composition: z.string().optional(),
  count: z.string().optional(),
  description: z.string().optional(),
});

export type UpdateYarnQualityDtoType = z.infer<typeof UpdateYarnQualityDto>;
