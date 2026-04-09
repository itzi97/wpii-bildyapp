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

const addressSchema = z.object({
  street: z.string().trim().min(1, 'Street is required'),
  number: z.string().trim().min(1, 'Number is required'),
  postal: z.string().trim().min(1, 'Postal code is required'),
  city: z.string().trim().min(1, 'City is required'),
  province: z.string().trim().min(1, 'Province is required')
});

// Company onboarding PATCH /api/user/company
export const companyOnboardingSchema = z.object({
  name: z.string().trim().min(1, 'Company name is required'),
  cif: z.string().trim().min(1, 'CIF is required'),
  address: addressSchema,
  isFreelance: z.boolean().default(false)
})
