import { useEffect, useMemo, type ReactNode } from 'react';
import type { DeepKeys, DeepValue, StandardSchemaV1 } from '@tanstack/react-form';
import { Button } from '@/components/ui/button';
import { useFormApi } from '../core/form-api-context';
import { FormArrayPrefixContext } from '../core/create-field';
import { createArrayItemFields, type ArrayItemFields } from '../core/create-fields';
import { fieldErrorMessage } from '../core/errors';
import { FieldWrapper } from '../fields/field-wrapper';
import { registerFieldSerializer } from '../core/serializers';
import type { AppFormApi } from '../core/form-hook';

type FormArrayProps<
  TValues extends Record<string, unknown>,
  TName extends DeepKeys<TValues>,
  TItem extends Record<string, unknown>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  min?: number;
  max?: number;
  defaultItem: TItem;
  validation?: StandardSchemaV1<DeepValue<TValues, TName>>;
  serialize?: (value: DeepValue<TValues, TName>) => unknown;
  deserialize?: (value: unknown) => DeepValue<TValues, TName>;
  children: ReactNode | ((fields: ArrayItemFields<TItem>) => ReactNode);
  className?: string;
  'data-testid'?: string;
};

export function FormArray<
  TValues extends Record<string, unknown>,
  TName extends DeepKeys<TValues>,
  TItem extends Record<string, unknown>,
>({
  name,
  label,
  description,
  min = 0,
  max,
  defaultItem,
  validation,
  serialize,
  deserialize,
  children,
  className,
  'data-testid': dataTestId,
}: FormArrayProps<TValues, TName, TItem>) {
  const form = useFormApi<TValues>();

  useEffect(() => {
    return registerFieldSerializer(form, name, {
      serialize: serialize as ((value: unknown) => unknown) | undefined,
      deserialize: deserialize as ((value: unknown) => unknown) | undefined,
    });
  }, [form, name, serialize, deserialize]);

  const itemFields = useMemo(() => createArrayItemFields<TItem>(), []);

  const validators = validation
    ? {
        onChange: validation,
        onBlur: validation,
        onSubmit: validation,
      }
    : undefined;

  const revalidateArray = () => {
    queueMicrotask(() => {
      void form.validateField(name, 'change');
      void form.validateField(name, 'submit');
    });
  };

  const renderedChildren = typeof children === 'function' ? children(itemFields) : children;

  return (
    <form.Field name={name} mode="array" validators={validators}>
      {(arrayField) => {
        const items = (arrayField.state.value as TItem[] | undefined) ?? [];
        const error = fieldErrorMessage(
          arrayField.state.meta.errors,
          arrayField.state.meta.errorMap
        );
        const canAdd = max === undefined || max === null || items.length < max;
        const canRemove = items.length > min;

        return (
          <FieldWrapper
            label={label}
            description={description}
            error={error}
            className={className}
            data-testid={dataTestId}
          >
            <div className="flex flex-col gap-4">
              {items.map((_, index) => (
                <div
                  key={`${name}-${index}`}
                  className="rounded-md border p-4"
                  data-testid={dataTestId ? `${dataTestId}-row-${index}` : undefined}
                >
                  <FormArrayPrefixContext.Provider value={{ prefix: `${name}[${index}].` }}>
                    {renderedChildren}
                  </FormArrayPrefixContext.Provider>
                  {canRemove ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      data-testid={dataTestId ? `${dataTestId}-remove-${index}` : undefined}
                      onClick={() => {
                        arrayField.removeValue(index);
                        revalidateArray();
                      }}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              ))}
              {canAdd ? (
                <Button
                  type="button"
                  variant="outline"
                  data-testid={dataTestId ? `${dataTestId}-add` : undefined}
                  onClick={() => arrayField.pushValue(defaultItem as never)}
                >
                  Add row
                </Button>
              ) : null}
            </div>
          </FieldWrapper>
        );
      }}
    </form.Field>
  );
}

export async function validateFormArrayField<TValues extends Record<string, unknown>>(
  form: AppFormApi<TValues>,
  name: DeepKeys<TValues>
): Promise<boolean> {
  await form.validateField(name, 'submit');
  const meta = form.getFieldMeta(name);
  return !(meta?.errors?.length || meta?.errorMap?.onSubmit);
}
