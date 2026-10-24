import { useId } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useFieldContext } from '../core/form-hook';
import type { FieldViewProps } from '../core/form-types';
import { FieldWrapper } from './field-wrapper';
import { fieldErrorMessage } from '../core/errors';

type TextareaFieldViewProps = FieldViewProps & {
  placeholder?: string;
  rows?: number;
  changeListener?: (value: string) => void;
};

export function TextareaFieldView({
  label,
  description,
  disabled,
  className,
  placeholder,
  rows,
  changeListener,
  'data-testid': dataTestId,
}: TextareaFieldViewProps) {
  const field = useFieldContext<string>();
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
      <Textarea
        id={id}
        placeholder={placeholder}
        rows={rows}
        value={field.state.value ?? ''}
        disabled={disabled}
        data-testid={dataTestId}
        onBlur={field.handleBlur}
        onChange={(event) => {
          const nextValue = event.target.value;
          field.handleChange(nextValue);
          changeListener?.(nextValue);
        }}
      />
    </FieldWrapper>
  );
}
