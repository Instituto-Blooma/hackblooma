import { ConvexError } from 'convex/values';
import { describe, expect, it } from 'vitest';
import {
  createOrganizationSchema,
  impersonationSchema,
  parseOrThrow,
  provisionUserSchema,
  VALIDATION_ERROR_CODE,
} from '../../convex/lib/forms';

describe('createOrganizationSchema', () => {
  it('accepts an empty slug and validates custom slugs', () => {
    expect(createOrganizationSchema.safeParse({ name: 'Acme Corp', slug: '' }).success).toBe(true);
    expect(
      createOrganizationSchema.safeParse({ name: 'Acme Corp', slug: 'acme-corp' }).success
    ).toBe(true);
    expect(
      createOrganizationSchema.safeParse({ name: 'Acme Corp', slug: 'Bad Slug' }).success
    ).toBe(false);
  });
});

describe('provisionUserSchema', () => {
  it('rejects invalid email and missing organization', () => {
    expect(
      provisionUserSchema.safeParse({
        organizationId: '',
        email: 'bad',
        role: 'member',
        sendInvite: false,
      }).success
    ).toBe(false);
  });
});

describe('impersonationSchema', () => {
  it('rejects an empty target user id', () => {
    expect(impersonationSchema.safeParse({ targetUserId: '' }).success).toBe(false);
  });
});

describe('parseOrThrow', () => {
  it('throws structured validation errors', () => {
    expect(() => parseOrThrow(createOrganizationSchema, { name: 'A', slug: 'Bad Slug' })).toThrow(
      ConvexError
    );

    try {
      parseOrThrow(createOrganizationSchema, { name: 'A', slug: 'Bad Slug' });
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError);
      const payload = (error as ConvexError<{ code: string; fields: Record<string, string> }>).data;
      expect(payload.code).toBe(VALIDATION_ERROR_CODE);
      expect(payload.fields.slug).toBeTruthy();
    }
  });
});
