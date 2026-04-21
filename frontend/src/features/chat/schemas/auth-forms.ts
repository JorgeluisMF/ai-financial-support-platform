import { z } from 'zod'

/** Login in modal (username or email + password) */
export const loginFormSchema = z.object({
  identifier: z.string().min(3, 'Minimum 3 characters'),
  password: z.string().min(6, 'Minimum 6 characters'),
})

export type LoginFormValues = z.infer<typeof loginFormSchema>

/** Step 1 — aligned with backend RegisterRequest profile fields */
export const registerStepOneSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  username: z.string().min(3).max(64),
  email: z.string().min(5).max(255).email('Invalid email'),
  phone: z.string().min(8).max(32),
  address: z.string().min(3).max(255),
  identification: z.string().min(4).max(64),
})

export type RegisterStepOneValues = z.infer<typeof registerStepOneSchema>

/** Full registration + password confirmation */
export const registerFullSchema = registerStepOneSchema
  .extend({
    password: z.string().min(6).max(128),
    confirmPassword: z.string().min(6).max(128),
    acceptedTerms: z.boolean(),
  })
  .refine((data) => data.acceptedTerms === true, {
    message: 'You must accept the terms.',
    path: ['acceptedTerms'],
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

export type RegisterFullValues = z.infer<typeof registerFullSchema>
