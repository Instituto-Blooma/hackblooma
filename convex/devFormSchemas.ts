import { z } from 'zod';

export const stepItemSchema = z.object({
  id: z.string().min(1, 'Step ID is required'),
  label: z.string().min(2, 'Step label must be at least 2 characters'),
});

export const stepsArrayCountSchema = z
  .array(z.object({ id: z.string(), label: z.string() }))
  .min(1, 'Add at least one step');

export const devFormTagSchema = z.enum(['frontend', 'backend', 'design']);

export const devFormChannelSchema = z.enum(['email', 'slack', 'sms']);

export const notificationFrequencySchema = z.enum(['instant', 'daily', 'weekly']);

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Enter a valid hex color (e.g. #FF5733)');

export const phoneSchema = z
  .string()
  .regex(/^\(\d{2}\) \d{5}-\d{4}$/, 'Phone must match format (00) 00000-0000');

export const devFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.email('Invalid email address'),
  phone: phoneSchema,
  bio: z.string().min(10, 'Bio must be at least 10 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  age: z.number().min(18, 'Must be at least 18').max(120, 'Age must be 120 or less'),
  role: z.enum(['admin', 'member']),
  tags: z.array(devFormTagSchema).min(1, 'Pick at least one tag'),
  accessLevel: z.enum(['read', 'write']),
  channels: z
    .array(devFormChannelSchema)
    .min(1, 'Pick at least one channel')
    .max(2, 'Pick at most 2 channels'),
  notifyByEmail: z.boolean(),
  notificationFrequency: z.union([z.null(), notificationFrequencySchema]),
  acceptTerms: z.literal(true, {
    message: 'You must accept the terms',
  }),
  startDate: z.string().min(1, 'Start date is required'),
  brandColor: hexColorSchema,
  steps: z.array(stepItemSchema).min(1, 'Add at least one step'),
  attachmentId: z.string().nullable().optional(),
  isAdult: z.literal(true, {
    message: 'Must be 18 or older',
  }),
});

export type DevFormValues = z.infer<typeof devFormSchema>;
