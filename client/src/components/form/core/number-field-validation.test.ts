import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { adaptNumberFieldValidation } from './number-field-validation';

function validate(schema: ReturnType<typeof adaptNumberFieldValidation>, value: unknown) {
  if (!schema) {
    throw new Error('Expected schema');
  }
  const result = schema['~standard'].validate(value);
  if (result instanceof Promise) {
    throw new Error('Expected synchronous validation result');
  }
  return result;
}

function issueMessage(result: {
  issues?: ReadonlyArray<{ message: string }>;
  value?: unknown;
}): string | undefined {
  return result.issues?.[0]?.message;
}

describe('adaptNumberFieldValidation', () => {
  it('shows a required message for empty required number fields', () => {
    const schema = adaptNumberFieldValidation(z.number().min(18), { label: 'Age' });

    const result = validate(schema, undefined);
    expect(issueMessage(result)).toBe('Age is required');
  });

  it('passes through min/max validation for numeric values', () => {
    const schema = adaptNumberFieldValidation(z.number().min(18).max(120), { label: 'Age' });

    const tooSmall = validate(schema, 17);
    expect(issueMessage(tooSmall)).toBe('Too small: expected number to be >=18');

    const valid = validate(schema, 36);
    expect('value' in valid && valid.value).toBe(36);
  });

  it('accepts undefined for optional number fields', () => {
    const schema = adaptNumberFieldValidation(z.number().optional());

    const result = validate(schema, undefined);
    expect('value' in result && result.value).toBe(undefined);
  });

  it('coerces undefined to null for nullable number fields', () => {
    const schema = adaptNumberFieldValidation(z.number().nullable());

    const result = validate(schema, undefined);
    expect('value' in result && result.value).toBe(null);
  });

  it('uses an explicit requiredMessage when provided', () => {
    const schema = adaptNumberFieldValidation(z.number(), {
      requiredMessage: 'Pick a quantity',
    });

    const result = validate(schema, undefined);
    expect(issueMessage(result)).toBe('Pick a quantity');
  });
});
