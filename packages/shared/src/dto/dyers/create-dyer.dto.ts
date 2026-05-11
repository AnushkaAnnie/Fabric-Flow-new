import { z } from 'zod';
import { gstinRegex } from '../index';

export const CreateDyerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required").max(20),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  contactNo: z.string().optional(),
  gstin: z
    .string()
    .length(15, 'GSTIN must be exactly 15 characters')
    .regex(gstinRegex, 'Invalid GSTIN format')
    .optional()
    .or(z.literal('')),
});
export type CreateDyerDto = z.infer<typeof CreateDyerSchema>;
