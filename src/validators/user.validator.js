import { z } from 'zod';

// Register POST /api/user/register
export const registerSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Must be a valid email')
      .transform((val) => val.toLowerCase().trim()),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
  })
});

// Login POST /api/user/login
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Must be a valid email')
      .transform((val) => val.toLowerCase().trim()),
    password: z
      .string({ required_error: 'Password is required' })
  })
});

// Email validation PUT /api/user/validation
export const emailValidationSchema = z.object({
  body: z.object({
    code: z
      .string({ required_error: 'Validation code is required' })
      .trim()
      .regex(/^\d{6}$/, 'Validation code must be exactly 6 digits')
  })
});

// Personal onboarding PUT /api/user/register
export const personalOnboardingSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name is required'),
    lastName: z.string().trim().min(1, 'Last name is required'),
    nif: z
      .string({ required_error: 'NIF is required' })
      .trim()
      .min(1, 'NIF is required')
      .min(8, 'NIF must be at least 8 characters')
  })
});

const addressSchema = z.object({
  street: z.string().trim().min(1, 'Street is required'),
  number: z.string().trim().min(1, 'Number is required'),
  postal: z.string().trim().min(1, 'Postal code is required'),
  city: z.string().trim().min(1, 'City is required'),
  province: z.string().trim().min(1, 'Province is required')
});

// Company onboarding PATCH /api/user/company (autofilled if freelance)
export const companyOnboardingSchema = z.object({
  body: z.discriminatedUnion('isFreelance', [
    z.object({
      isFreelance: z.literal(true)
    }),
    z.object({
      isFreelance: z.literal(false),
      name: z.string().trim().min(1, 'Company name is required'),
      cif: z.string().trim().min(1, 'CIF is required'),
      address: addressSchema
    })
  ])
});

// Refresh token POST /api/user/refresh
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string({ required_error: 'Refresh token is required' })
      .trim()
      .min(1, 'Refresh token is required')
  })
});

// Change password PUT /api/user/password
export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z
        .string({ required_error: 'Current password is required' })
        .min(8, 'Current password must be at least 8 characters'),
      newPassword: z
        .string({ required_error: 'New password is required' })
        .min(8, 'New password must be at least 8 characters')
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: 'New password must be different from current password',
      path: ['newPassword']
    })
});

// Invite teammate POST /api/user/invite
export const inviteUserSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Must be a valid email')
      .transform((val) => val.toLowerCase().trim()),
    name: z.string().trim().min(1, 'Name is required'),
    lastName: z.string().trim().min(1, 'Last name is required')
  })
});

// Delete user DELETE /api/user?soft=true
export const deleteUserSchema = z.object({
  query: z.object({
    soft: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true')
      .optional()
  })
});
