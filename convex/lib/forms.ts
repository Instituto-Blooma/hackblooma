import { ConvexError } from 'convex/values';
import { z } from 'zod';

export const VALIDATION_ERROR_CODE = 'VALIDATION_ERROR';

export type ValidationErrorPayload = {
  code: typeof VALIDATION_ERROR_CODE;
  fields: Record<string, string>;
};

export function isValidationErrorPayload(value: unknown): value is ValidationErrorPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const payload = value as ValidationErrorPayload;
  return (
    payload.code === VALIDATION_ERROR_CODE &&
    typeof payload.fields === 'object' &&
    payload.fields !== null
  );
}

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.map(String).join('.');
    if (path && !fields[path]) {
      fields[path] = issue.message;
    }
  }
  return fields;
}

export function validationErrorPayload(error: z.ZodError): ValidationErrorPayload {
  return {
    code: VALIDATION_ERROR_CODE,
    fields: zodFieldErrors(error),
  };
}

export function parseOrThrow<T>(schema: z.ZodType<T>, args: unknown): T {
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    throw new ConvexError(validationErrorPayload(parsed.error));
  }
  return parsed.data;
}

export const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  slug: z
    .string()
    .trim()
    .refine((value) => value === '' || /^[a-z0-9-]+$/.test(value), {
      message: 'Slug must use lowercase letters, numbers, and hyphens',
    }),
});

export type CreateOrganizationValues = z.infer<typeof createOrganizationSchema>;

export const provisionUserSchema = z.object({
  organizationId: z.string().min(1, 'Organization is required'),
  email: z.email('Invalid email address'),
  role: z.enum(['admin', 'member']),
  sendInvite: z.boolean(),
});

export type ProvisionUserValues = z.infer<typeof provisionUserSchema>;

export const impersonationSchema = z.object({
  targetUserId: z.string().min(1, 'Target user ID is required'),
});

export type ImpersonationValues = z.infer<typeof impersonationSchema>;

export function slugifyOrganizationName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
