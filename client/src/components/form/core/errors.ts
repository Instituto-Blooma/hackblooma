import type { DeepKeys } from '@tanstack/react-form';
import { ConvexError } from 'convex/values';
import {
  VALIDATION_ERROR_CODE,
  type ValidationErrorPayload,
  isValidationErrorPayload,
} from '../../../../../convex/lib/forms';
import type { AppFormApi } from './form-hook';

export function fieldErrorMessage(
  errors: readonly unknown[],
  errorMap?: Partial<Record<string, unknown>>
): string | undefined {
  const first = errors[0];
  if (typeof first === 'string') {
    return first;
  }
  if (first && typeof first === 'object' && 'message' in first) {
    const message = (first as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }
  const onMask = errorMap?.onMask;
  if (typeof onMask === 'string') {
    return onMask;
  }
  const onSubmit = errorMap?.onSubmit;
  return typeof onSubmit === 'string' ? onSubmit : undefined;
}

/** Matches TanStack Form's defaultFieldMeta for never-mounted fields. */
const emptyFieldMeta = {
  isValidating: false,
  isTouched: false,
  isBlurred: false,
  isDirty: false,
  isPristine: true,
  isValid: true,
  isDefaultValue: true,
  errors: [] as unknown[],
  errorMap: {} as Record<string, unknown>,
  errorSourceMap: {} as Record<string, unknown>,
  _arrayVersion: 0,
};

export function clearServerFieldError<TValues extends Record<string, unknown>>(
  form: AppFormApi<TValues>,
  fieldName: DeepKeys<TValues>
): void {
  form.setFieldMeta(fieldName, (previous) => {
    // TanStack Form may pass undefined meta for fields that were never mounted.
    if (!previous?.errorMap?.onSubmit) {
      return previous ?? emptyFieldMeta;
    }
    const { onSubmit: _removed, ...restErrorMap } = previous.errorMap;
    return {
      ...previous,
      errorMap: restErrorMap,
    };
  });
}

/** Clears every field's server `onSubmit` error so TanStack Form can submit again. */
export function clearAllServerFieldErrors<TValues extends Record<string, unknown>>(
  form: AppFormApi<TValues>
): void {
  const fieldMeta = form.state.fieldMeta as Partial<
    Record<DeepKeys<TValues>, { errorMap?: unknown }>
  >;
  for (const fieldName of Object.keys(fieldMeta) as DeepKeys<TValues>[]) {
    clearServerFieldError(form, fieldName);
  }
}

export function setServerFieldErrors<TValues extends Record<string, unknown>>(
  form: AppFormApi<TValues>,
  fields: Partial<Record<DeepKeys<TValues>, string>> & Record<string, string>
): void {
  for (const [fieldName, message] of Object.entries(fields)) {
    form.setFieldMeta(fieldName as DeepKeys<TValues>, (previous) => {
      // TanStack Form may pass undefined meta for fields that were never mounted
      // (e.g. later survey steps). Spreading previous.errorMap without a fallback
      // throws and aborts submit error handling.
      const meta = previous ?? emptyFieldMeta;
      return {
        ...meta,
        errorMap: {
          ...meta.errorMap,
          onSubmit: message,
        },
        isTouched: true,
      };
    });
  }
}

function extractValidationPayload(error: unknown): ValidationErrorPayload | undefined {
  if (error instanceof ConvexError && isValidationErrorPayload(error.data)) {
    return error.data;
  }
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (isValidationErrorPayload(data)) {
      return data;
    }
  }
  return undefined;
}

export function applyServerErrors<TValues extends Record<string, unknown>>(
  form: AppFormApi<TValues>,
  error: unknown
): Partial<Record<DeepKeys<TValues>, string>> | null {
  const payload = extractValidationPayload(error);

  if (!payload || payload.code !== VALIDATION_ERROR_CODE) {
    return null;
  }

  setServerFieldErrors(form, payload.fields);

  return payload.fields as Partial<Record<DeepKeys<TValues>, string>>;
}

export function getSubmitErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof ConvexError) {
    if (typeof error.data === 'string') {
      return error.data;
    }
    if (isValidationErrorPayload(error.data)) {
      return 'Please fix the highlighted fields.';
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export type { DeepKeys };
