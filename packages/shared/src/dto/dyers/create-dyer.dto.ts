import { z } from 'zod';
import { gstinRegex, optionalString } from '../constants';

const pincodeSchema = optionalString(
  z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits')
);

export const CreateDyerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: pincodeSchema,
  email: optionalString(
    z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format')
  ),
  phone: optionalString(
    z.string().regex(/^[+]?[0-9][\s\-().0-9]{6,14}$/, 'Invalid phone number')
  ),
  gstin: optionalString(
    z.string()
      .length(15, 'GSTIN must be exactly 15 characters')
      .regex(gstinRegex, 'Invalid GSTIN format')
  ),
});
export type CreateDyerDto = z.infer<typeof CreateDyerSchema>;
