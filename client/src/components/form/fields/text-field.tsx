import { useId } from 'react';
import { Input } from '@/components/ui/input';
import { useFieldContext } from '../core/form-hook';
import type { FieldViewProps } from '../core/form-types';
import { FieldWrapper } from './field-wrapper';
import { fieldErrorMessage } from '../core/errors';

type TextFieldViewProps = FieldViewProps & {
  type?: React.ComponentProps<'input'>['type'];
  placeholder?: string;
  changeListener?: (value: string) => void;
};

export function TextFieldView({
  label,
  description,
  disabled,
  className,
  hideLabel,
  type = 'text',
  placeholder,
  changeListener,
  'data-testid': dataTestId,
}: TextFieldViewProps) {
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
      hideLabel={hideLabel}
      data-testid={dataTestId}
    >
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
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
