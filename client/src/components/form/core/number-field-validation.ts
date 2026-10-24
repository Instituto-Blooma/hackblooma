import type { StandardSchemaV1 } from '@tanstack/react-form';
import type { ReactNode } from 'react';

const DEFAULT_REQUIRED_MESSAGE = 'Required';

type AdaptNumberFieldValidationOptions = {
  requiredMessage?: string;
  label?: ReactNode;
};

type StandardValidationResult =
  | { value: unknown }
  | { issues: ReadonlyArray<{ message: string; path?: readonly PropertyKey[] }> };

function isValidationResult(value: unknown): value is StandardValidationResult {
  return typeof value === 'object' && value !== null && ('value' in value || 'issues' in value);
}

function getStandardValidator(validation: StandardSchemaV1) {
  return validation['~standard'].validate.bind(validation['~standard']);
}

function validationSucceeded(result: StandardValidationResult): boolean {
  return !('issues' in result) || result.issues.length === 0;
}

function runStandardValidation(
  validation: StandardSchemaV1,
  value: unknown
): StandardValidationResult {
  const result = getStandardValidator(validation)(value);
  if (result instanceof Promise) {
    throw new Error('Async Standard Schema validation is not supported for number fields');
  }
  if (!isValidationResult(result)) {
    throw new Error('Unexpected Standard Schema validation result');
  }
  return result;
}

function resolveRequiredMessage(options: AdaptNumberFieldValidationOptions): string {
  if (options.requiredMessage) {
    return options.requiredMessage;
  }
  if (typeof options.label === 'string' && options.label.trim()) {
    return `${options.label} is required`;
  }
  return DEFAULT_REQUIRED_MESSAGE;
}

function schemaAcceptsValue(validation: StandardSchemaV1, value: unknown): boolean {
  return validationSucceeded(runStandardValidation(validation, value));
}

export function adaptNumberFieldValidation(
  validation: StandardSchemaV1 | undefined,
  options: AdaptNumberFieldValidationOptions = {}
): StandardSchemaV1 | undefined {
  if (!validation) {
    return undefined;
  }

  const validate = (value: unknown) => runStandardValidation(validation, value);
  const acceptsUndefined = schemaAcceptsValue(validation, undefined);
  const acceptsNull = schemaAcceptsValue(validation, null);

  if (acceptsUndefined) {
    return validation;
  }

  const requiredMessage = resolveRequiredMessage(options);

  return {
    '~standard': {
      version: 1,
      vendor: 'convexplate',
      validate: (value: unknown) => {
        if (value === undefined) {
          if (acceptsNull) {
            return validate(null);
          }
          return { issues: [{ message: requiredMessage, path: [] }] };
        }
        return validate(value);
      },
    },
  };
}
