import { useId } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useFieldContext } from '../core/form-hook';
import type { FieldViewProps } from '../core/form-types';
import { FieldWrapper } from './field-wrapper';
import { fieldErrorMessage } from '../core/errors';
import type { SelectOption } from './select-field';

type RadioGroupFieldViewProps = FieldViewProps & {
  options: SelectOption[];
  changeListener?: (value: string) => void;
};

export function RadioGroupFieldView({
  label,
  description,
  disabled,
  className,
  options,
  changeListener,
  'data-testid': dataTestId,
}: RadioGroupFieldViewProps) {
  const field = useFieldContext<string>();
  const groupId = useId();
  const error = fieldErrorMessage(field.state.meta.errors, field.state.meta.errorMap);

  return (
    <FieldWrapper
      label={label}
      description={description}
      error={error}
      className={className}
      data-testid={dataTestId}
    >
      <div data-testid={dataTestId}>
        <RadioGroup
          value={field.state.value}
          disabled={disabled}
          onValueChange={(value) => {
            field.handleChange(value);
            changeListener?.(value);
          }}
        >
          {options.map((option) => {
            const itemId = `${groupId}-${option.value}`;
            return (
              <div key={option.value} className="flex items-center gap-2">
                <RadioGroupItem id={itemId} value={option.value} />
                <Label htmlFor={itemId} className="font-normal">
                  {option.label}
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </div>
    </FieldWrapper>
  );
}
