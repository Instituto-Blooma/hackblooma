import { useId } from 'react';
import { Input } from '@/components/ui/input';
import { useFieldContext } from '../core/form-hook';
import type { FieldViewProps } from '../core/form-types';
import { FieldWrapper } from './field-wrapper';
import { fieldErrorMessage } from '../core/errors';

type NumberFieldViewProps = FieldViewProps & {
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  requiredMessage?: string;
  changeListener?: (value: number | undefined) => void;
};

export function NumberFieldView({
  label,
  description,
  disabled,
  className,
  placeholder,
  min,
  max,
  step,
  changeListener,
  'data-testid': dataTestId,
}: NumberFieldViewProps) {
  const field = useFieldContext<number | undefined>();
  const generatedId = useId();
  const id = dataTestId ?? generatedId;
  const error = fieldErrorMessage(field.state.meta.errors, field.state.meta.errorMap);

  return (
    <FieldWrapper
      id={id}
      label={label}
      description={description}
      error={error}
      className={className}
      data-testid={dataTestId}
    >
      <Input
        id={id}
        type="number"
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        value={field.state.value ?? ''}
        disabled={disabled}
        data-testid={dataTestId}
        onBlur={field.handleBlur}
        onChange={(event) => {
          const raw = event.target.value;
          const nextValue = raw === '' ? undefined : Number(raw);
          field.handleChange(Number.isNaN(nextValue) ? undefined : nextValue);
          changeListener?.(Number.isNaN(nextValue) ? undefined : nextValue);
        }}
      />
    </FieldWrapper>
  );
}
