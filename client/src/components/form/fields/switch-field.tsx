import { useId } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useFieldContext } from '../core/form-hook';
import type { FieldViewProps } from '../core/form-types';
import { FieldWrapper } from './field-wrapper';
import { fieldErrorMessage } from '../core/errors';
import { cn } from '@/lib/utils';

type SwitchFieldViewProps = FieldViewProps & {
  changeListener?: (value: boolean) => void;
};

export function SwitchFieldView({
  label,
  description,
  disabled,
  className,
  changeListener,
  'data-testid': dataTestId,
}: SwitchFieldViewProps) {
  const field = useFieldContext<boolean>();
  const generatedId = useId();
  const id = dataTestId ?? generatedId;
  const error = fieldErrorMessage(field.state.meta.errors, field.state.meta.errorMap);

  return (
    <FieldWrapper description={description} error={error} hideLabel data-testid={dataTestId}>
      <div
        className={cn(
          'flex items-center justify-between gap-3 rounded-md border px-3 py-2',
          className
        )}
      >
        {label ? <Label htmlFor={id}>{label}</Label> : null}
        <Switch
          id={id}
          checked={field.state.value ?? false}
          disabled={disabled}
          data-testid={dataTestId}
          onCheckedChange={(checked) => {
            field.handleChange(checked);
            changeListener?.(checked);
          }}
        />
      </div>
    </FieldWrapper>
  );
}
