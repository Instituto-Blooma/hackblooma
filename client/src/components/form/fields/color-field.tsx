import { useId, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useFieldContext } from '../core/form-hook';
import type { FieldViewProps } from '../core/form-types';
import { revalidateFieldAfterEdit } from '../core/form-utils';
import { FieldWrapper } from './field-wrapper';
import { fieldErrorMessage } from '../core/errors';

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

type ColorFieldViewProps = FieldViewProps & {
  placeholder?: string;
  changeListener?: (value: string) => void;
};

function isValidHex(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value);
}

function normalizeHex(value: unknown): string | null {
  if (typeof value !== 'string' || !isValidHex(value)) {
    return null;
  }
  return value.toUpperCase();
}

function displayColor(value: string | undefined): string {
  if (value && isValidHex(value)) {
    return value;
  }
  return '#000000';
}

export function ColorFieldView({
  label,
  description,
  disabled,
  className,
  placeholder = 'Pick a color',
  changeListener,
  'data-testid': dataTestId,
}: ColorFieldViewProps) {
  const field = useFieldContext<string>();
  const generatedId = useId();
  const id = dataTestId ?? generatedId;
  const [open, setOpen] = useState(false);
  const error = fieldErrorMessage(field.state.meta.errors, field.state.meta.errorMap);
  const fieldValue = field.state.value ?? '';
  const hasColor = isValidHex(fieldValue);
  const pickerColor = displayColor(fieldValue);

  const commitColor = (nextValue: string) => {
    field.handleChange(nextValue);
    changeListener?.(nextValue);
    revalidateFieldAfterEdit(field);
  };

  return (
    <FieldWrapper
      id={id}
      label={label}
      description={description}
      error={error}
      className={className}
      data-testid={dataTestId}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            data-testid={dataTestId}
            className={cn(
              'w-full justify-start text-left font-normal',
              !hasColor && 'text-muted-foreground'
            )}
            onBlur={field.handleBlur}
          >
            <span
              aria-hidden
              className="size-4 shrink-0 rounded-sm border border-border"
              style={{ backgroundColor: hasColor ? fieldValue : 'transparent' }}
            />
            {hasColor ? fieldValue.toUpperCase() : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[220px] space-y-3 p-3" align="start">
          <HexColorPicker
            color={pickerColor}
            onChange={(color) => {
              commitColor(color.toUpperCase());
            }}
            className="!w-full"
          />
          <Input
            id={id}
            value={fieldValue}
            placeholder="#FF5733"
            disabled={disabled}
            data-testid={dataTestId ? `${dataTestId}-hex` : undefined}
            onBlur={field.handleBlur}
            onChange={(event) => {
              const nextValue = event.target.value;
              field.handleChange(nextValue);
              if (isValidHex(nextValue)) {
                changeListener?.(nextValue.toUpperCase());
              }
              revalidateFieldAfterEdit(field);
            }}
          />
        </PopoverContent>
      </Popover>
    </FieldWrapper>
  );
}

export const colorFieldSerializer = {
  serialize: (value: unknown) => normalizeHex(value),
  deserialize: (value: unknown): string => (typeof value === 'string' ? value : ''),
};
