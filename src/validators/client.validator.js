// src/validators/client.validator.js
import { z } from 'zod';

const addressSchema = z.object({
  street: z.string().trim().optional(),
  number: z.string().trim().optional(),
  postal: z.string().trim().optional(),
  city: z.string().trim().optional(),
  province: z.string().trim().optional(),
}).optional();

export const clientBodySchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  cif: z.string().trim().min(1, 'CIF is required').toUpperCase(),
  email: z.string().trim().email('Invalid email').toLowerCase().optional(),
  phone: z.string().trim().optional(),
  address: addressSchema,
});

export const createClientSchema = z.object({
  body: clientBodySchema,
});

export const updateClientSchema = z.object({
  body: clientBodySchema.partial(),
});
