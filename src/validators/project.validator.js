// src/validators/project.validator.js
import { z } from 'zod';

const addressSchema = z.object({
  street: z.string().trim().optional(),
  number: z.string().trim().optional(),
  postal: z.string().trim().optional(),
  city: z.string().trim().optional(),
  province: z.string().trim().optional(),
}).optional();

const projectBodySchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  projectCode: z.string().trim().min(1, 'Project code is required').toUpperCase(),
  client: z.string().min(1, 'Client ID is required'),
  address: addressSchema,
  email: z.string().trim().email('Invalid email').toLowerCase().optional(),
  notes: z.string().trim().optional(),
  active: z.boolean().optional(),
});

export const createProjectSchema = z.object({
  body: projectBodySchema,
});

export const updateProjectSchema = z.object({
  body: projectBodySchema.partial(),
});
