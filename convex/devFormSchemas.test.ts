import { describe, expect, it } from 'vitest';
import { validationErrorPayload, VALIDATION_ERROR_CODE } from './lib/forms';
import { devFormSchema } from './devFormSchemas';

const validDevForm = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '(11) 99988-7766',
  bio: 'Mathematician and writer',
  content: 'Ada invented the analytical engine notes.',
  age: 36,
  role: 'admin' as const,
  tags: ['frontend', 'backend'] as const,
  accessLevel: 'write' as const,
  channels: ['email', 'slack'] as const,
  notifyByEmail: true,
  notificationFrequency: 'instant' as const,
  acceptTerms: true as const,
  startDate: '2026-06-01T00:00:00.000Z',
  brandColor: '#FF5733',
  steps: [{ id: '1', label: 'Step one' }],
  isAdult: true as const,
};

describe('devFormSchema', () => {
  it('accepts valid input', () => {
    const result = devFormSchema.safeParse(validDevForm);
    expect(result.success).toBe(true);
  });

  it('rejects a short name', () => {
    const result = devFormSchema.safeParse({ ...validDevForm, name: 'A' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'name')).toBe(true);
    }
  });

  it('rejects an invalid email', () => {
    const result = devFormSchema.safeParse({ ...validDevForm, email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'email')).toBe(true);
    }
  });

  it('rejects a short bio', () => {
    const result = devFormSchema.safeParse({ ...validDevForm, bio: 'short' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'bio')).toBe(true);
    }
  });

  it('rejects short rich text content', () => {
    const result = devFormSchema.safeParse({ ...validDevForm, content: 'too short' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'content')).toBe(true);
    }
  });

  it('rejects age under 18', () => {
    const result = devFormSchema.safeParse({ ...validDevForm, age: 17, isAdult: false });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'age')).toBe(true);
    }
  });

  it('rejects an invalid access level', () => {
    const result = devFormSchema.safeParse({ ...validDevForm, accessLevel: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty steps array', () => {
    const result = devFormSchema.safeParse({ ...validDevForm, steps: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'steps')).toBe(true);
    }
  });

  it('rejects when terms are not accepted', () => {
    const result = devFormSchema.safeParse({ ...validDevForm, acceptTerms: false });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'acceptTerms')).toBe(true);
    }
  });

  it('rejects when isAdult is false', () => {
    const result = devFormSchema.safeParse({ ...validDevForm, isAdult: false });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'isAdult')).toBe(true);
    }
  });

  it('rejects when no tags are selected', () => {
    const result = devFormSchema.safeParse({ ...validDevForm, tags: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'tags')).toBe(true);
    }
  });

  it('rejects an invalid brand color', () => {
    const result = devFormSchema.safeParse({ ...validDevForm, brandColor: 'red' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'brandColor')).toBe(true);
    }
  });

  it('rejects an incomplete phone', () => {
    const result = devFormSchema.safeParse({ ...validDevForm, phone: '(11) 999' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'phone')).toBe(true);
    }
  });

  it('builds structured validation error payloads', () => {
    const result = devFormSchema.safeParse({
      name: 'A',
      email: 'bad',
      phone: '',
      bio: 'x',
      age: 10,
      role: 'member',
      tags: [],
      accessLevel: 'read',
      channels: [],
      notifyByEmail: false,
      notificationFrequency: null,
      acceptTerms: false,
      startDate: '',
      brandColor: '',
      steps: [],
      isAdult: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const payload = validationErrorPayload(result.error);
      expect(payload.code).toBe(VALIDATION_ERROR_CODE);
      expect(payload.fields.name).toBeTruthy();
      expect(payload.fields.email).toBeTruthy();
    }
  });
});
