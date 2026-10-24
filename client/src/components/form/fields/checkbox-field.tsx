import { useId } from 'react';
import type { CheckedState } from '@radix-ui/react-checkbox';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useFieldContext } from '../core/form-hook';
import type { FieldViewProps } from '../core/form-types';
import { FieldWrapper } from './field-wrapper';
import { fieldErrorMessage } from '../core/errors';
import { cn } from '@/lib/utils';

type CheckboxFieldViewProps = FieldViewProps & {
  changeListener?: (value: boolean) => void;
};

export function CheckboxFieldView({
  label,
  description,
  disabled,
  className,
  changeListener,
  'data-testid': dataTestId,
}: CheckboxFieldViewProps) {
  const field = useFieldContext<boolean>();
  const generatedId = useId();
  const id = dataTestId ?? generatedId;
  const error = fieldErrorMessage(field.state.meta.errors, field.state.meta.errorMap);

  return (
    <FieldWrapper
      description={description}
      error={error}
      className={className}
      hideLabel
      data-testid={dataTestId}
    >
      <div className={cn('flex items-center gap-2', className)}>
        <Checkbox
          id={id}
          checked={field.state.value ?? false}
          disabled={disabled}
          data-testid={dataTestId}
          onCheckedChange={(checked: CheckedState) => {
            const nextValue = checked === true;
            field.handleChange(nextValue);
            changeListener?.(nextValue);
          }}
        />
        {label ? (
          <Label htmlFor={id} className="font-normal">
            {label}
          </Label>
        ) : null}
      </div>
    </FieldWrapper>
  );
}
