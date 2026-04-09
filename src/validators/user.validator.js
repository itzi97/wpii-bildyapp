import { z } from 'zod';

// Register POST /api/user/register
export const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Must be a valid email')
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
});

// Login POST /api/user/login
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Must be a valid email')
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string({ required_error: 'Password is required' })
})

// Email validation PUT /api/user/validation
export const emailValidationSchema = z.object({
  code: z
    .string({ required_error: 'Validation code is required' })
    .trim()
})

// Personal onboarding PUT /api/user/register
export const personalOnboardingSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  nif: z.string().trim().min(1, 'NIF is required')
})
