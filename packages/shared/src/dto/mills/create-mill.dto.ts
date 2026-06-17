import { z } from 'zod';
import { gstinRegex } from '../constants';

const pincodeSchema = z
  .string()
  .regex(/^\d{6}$/, 'Pincode must be 6 digits')
  .optional()
  .or(z.literal(''));

export const CreateMillSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: pincodeSchema,
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  gstin: z
    .string()
    .length(15, 'GSTIN must be exactly 15 characters')
    .regex(gstinRegex, 'Invalid GSTIN format')
    .optional()
    .or(z.literal('')),
});
export type CreateMillDto = z.infer<typeof CreateMillSchema>;
