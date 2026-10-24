import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useFieldContext } from '../core/form-hook';
import type { FieldViewProps } from '../core/form-types';
import { revalidateFieldAfterEdit } from '../core/form-utils';
import { FieldWrapper } from './field-wrapper';
import { fieldErrorMessage } from '../core/errors';
import { InputCard } from './input-card';
import type { MaxColumnsProp } from './card-columns';
import { useCardGridCss } from './use-card-grid-css';

export type RadioCardOption<TValue extends string = string> = {
  value: TValue;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  color?: string;
};

type RadioCardFieldViewProps<TValue extends string = string> = FieldViewProps & {
  options: RadioCardOption<TValue>[];
  /**
   * Max columns for the card grid.
   * Pass a number for a fixed layout, or a Tailwind breakpoint map
   * (`xs` / `sm` / `md` / `lg` / `xl`).
   */
  maxColumns?: MaxColumnsProp;
  color?: string;
  changeListener?: (value: TValue) => void;
};

export function RadioCardFieldView<TValue extends string = string>({
  label,
  description,
  disabled,
  className,
  options,
  maxColumns,
  color,
  changeListener,
  'data-testid': dataTestId,
}: RadioCardFieldViewProps<TValue>) {
  const field = useFieldContext<TValue>();
  const error = fieldErrorMessage(field.state.meta.errors, field.state.meta.errorMap);
  const { scopeClass, css } = useCardGridCss(maxColumns, options.length);

  const selectValue = (value: TValue) => {
    if (disabled) {
      return;
    }
    field.handleChange(value);
    field.handleBlur();
    changeListener?.(value);
    revalidateFieldAfterEdit(field);
  };

  return (
    <FieldWrapper
      label={label}
      description={description}
      error={error}
      className={className}
      data-testid={dataTestId}
    >
      <style>{css}</style>
      <div
        role="radiogroup"
        aria-label={typeof label === 'string' ? label : undefined}
        data-testid={dataTestId}
        className={cn('grid gap-2', scopeClass)}
      >
        {options.map((option) => {
          const active = field.state.value === option.value;
          const optionTestId = dataTestId ? `${dataTestId}-${option.value}` : undefined;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              data-testid={optionTestId}
              className={cn(
                'appearance-none border-0 bg-transparent p-0 text-left',
                disabled && 'pointer-events-none'
              )}
              onClick={() => selectValue(option.value)}
              onBlur={field.handleBlur}
            >
              <InputCard
                value={option.value}
                active={active}
                disabled={disabled}
                color={option.color ?? color}
                icon={option.icon}
                title={option.title}
                description={option.description}
              />
            </button>
          );
        })}
      </div>
    </FieldWrapper>
  );
}
