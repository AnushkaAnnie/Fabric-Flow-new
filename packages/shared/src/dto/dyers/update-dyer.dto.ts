import { z } from "zod";

export const UpdateDyerDto = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).max(20).optional(),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export type UpdateDyerDtoType = z.infer<typeof UpdateDyerDto>;
