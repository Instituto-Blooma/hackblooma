import { useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useFieldContext } from '../core/form-hook';
import type { FieldViewProps } from '../core/form-types';
import { revalidateFieldAfterEdit } from '../core/form-utils';
import { FieldWrapper } from './field-wrapper';
import { fieldErrorMessage } from '../core/errors';

type DateFieldViewProps = FieldViewProps & {
  placeholder?: string;
  changeListener?: (value: string) => void;
};

function toIsoDate(value: Date | undefined): string | undefined {
  if (!value || !isValid(value)) {
    return undefined;
  }
  return value.toISOString();
}

function parseFieldDate(value: string | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
}

export function DateFieldView({
  label,
  description,
  disabled,
  className,
  placeholder = 'Pick a date',
  changeListener,
  'data-testid': dataTestId,
}: DateFieldViewProps) {
  const field = useFieldContext<string | undefined>();
  const [open, setOpen] = useState(false);
  const error = fieldErrorMessage(field.state.meta.errors, field.state.meta.errorMap);
  const selectedDate = parseFieldDate(field.state.value);

  return (
    <FieldWrapper
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
              !selectedDate && 'text-muted-foreground'
            )}
            onBlur={field.handleBlur}
          >
            <CalendarIcon />
            {selectedDate ? format(selectedDate, 'PPP') : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              const nextValue = toIsoDate(date);
              field.handleChange(nextValue ?? '');
              if (nextValue) {
                changeListener?.(nextValue);
              }
              revalidateFieldAfterEdit(field);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </FieldWrapper>
  );
}

export const dateFieldSerializer = {
  serialize: (value: unknown) =>
    toIsoDate(parseFieldDate(typeof value === 'string' ? value : undefined)) ?? null,
  deserialize: (value: unknown): string => (typeof value === 'string' ? value : ''),
};
