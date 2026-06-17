import { z } from "zod";

export const UpdateWashTypeDto = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).max(20).optional(),
  description: z.string().optional(),
});

export type UpdateWashTypeDtoType = z.infer<typeof UpdateWashTypeDto>;
