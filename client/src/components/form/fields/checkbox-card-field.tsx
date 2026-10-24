import { cn } from '@/lib/utils';
import { useFieldContext } from '../core/form-hook';
import type { FieldViewProps } from '../core/form-types';
import { revalidateFieldAfterEdit } from '../core/form-utils';
import { FieldWrapper } from './field-wrapper';
import { fieldErrorMessage } from '../core/errors';
import { InputCard } from './input-card';
import type { RadioCardOption } from './radio-card-field';
import type { MaxColumnsProp } from './card-columns';
import { useCardGridCss } from './use-card-grid-css';

export type CheckboxCardOption<TValue extends string = string> = RadioCardOption<TValue>;

type CheckboxCardFieldViewProps<TValue extends string = string> = FieldViewProps & {
  options: CheckboxCardOption<TValue>[];
  /**
   * Max columns for the card grid.
   * Pass a number for a fixed layout, or a Tailwind breakpoint map
   * (`xs` / `sm` / `md` / `lg` / `xl`).
   */
  maxColumns?: MaxColumnsProp;
  /** Maximum number of selected options. Extra selections are ignored until one is cleared. */
  maxSelections?: number;
  color?: string;
  changeListener?: (value: TValue[]) => void;
};

export function CheckboxCardFieldView<TValue extends string = string>({
  label,
  description,
  disabled,
  className,
  options,
  maxColumns,
  maxSelections,
  color,
  changeListener,
  'data-testid': dataTestId,
}: CheckboxCardFieldViewProps<TValue>) {
  const field = useFieldContext<TValue[]>();
  const error = fieldErrorMessage(field.state.meta.errors, field.state.meta.errorMap);
  const { scopeClass, css } = useCardGridCss(maxColumns, options.length);
  const selectedValues = field.state.value ?? [];
  const atMax = maxSelections !== undefined && selectedValues.length >= maxSelections;

  const toggleValue = (value: TValue) => {
    if (disabled) {
      return;
    }

    const isSelected = selectedValues.includes(value);
    let nextValues: TValue[];

    if (isSelected) {
      nextValues = selectedValues.filter((current) => current !== value);
    } else if (atMax) {
      return;
    } else {
      nextValues = [...selectedValues, value];
    }

    field.handleChange(nextValues);
    field.handleBlur();
    changeListener?.(nextValues);
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
        role="group"
        aria-label={typeof label === 'string' ? label : undefined}
        data-testid={dataTestId}
        className={cn('grid gap-2', scopeClass)}
      >
        {options.map((option) => {
          const active = selectedValues.includes(option.value);
          const optionDisabled = Boolean(disabled || (atMax && !active));
          const optionTestId = dataTestId ? `${dataTestId}-${option.value}` : undefined;

          return (
            <button
              key={option.value}
              type="button"
              role="checkbox"
              aria-checked={active}
              disabled={optionDisabled}
              data-testid={optionTestId}
              className={cn(
                'appearance-none border-0 bg-transparent p-0 text-left',
                optionDisabled && 'pointer-events-none'
              )}
              onClick={() => toggleValue(option.value)}
              onBlur={field.handleBlur}
            >
              <InputCard
                value={option.value}
                active={active}
                disabled={optionDisabled}
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
