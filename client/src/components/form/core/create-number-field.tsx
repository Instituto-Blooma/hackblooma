import { useMemo, type ComponentType, type ReactNode } from 'react';
import type { DeepKeys, StandardSchemaV1 } from '@tanstack/react-form';
import { createArrayItemField, createTypedField } from './create-field';
import type {
  ArrayItemFieldConfigProps,
  FieldViewProps,
  TypedFieldConfigProps,
} from './form-types';
import { adaptNumberFieldValidation } from './number-field-validation';

type NumberFieldViewProps = FieldViewProps & {
  requiredMessage?: string;
};

function useAdaptedNumberValidation(
  validation: StandardSchemaV1 | undefined,
  requiredMessage: string | undefined,
  label: ReactNode
) {
  return useMemo(
    () => adaptNumberFieldValidation(validation, { requiredMessage, label }),
    [validation, requiredMessage, label]
  );
}

export function createNumberTypedField<
  TValues extends Record<string, unknown>,
  TViewProps extends NumberFieldViewProps,
>(View: ComponentType<TViewProps>) {
  const TypedField = createTypedField<TValues, TViewProps>(View);

  function NumberField<TName extends DeepKeys<TValues>>(
    props: TypedFieldConfigProps<TValues, TName> &
      Omit<TViewProps, 'changeListener'> & { requiredMessage?: string }
  ) {
    const { validation, requiredMessage, label } = props;
    const adaptedValidation = useAdaptedNumberValidation(validation, requiredMessage, label);

    return <TypedField {...props} validation={adaptedValidation} />;
  }

  NumberField.displayName = `NumberField(${View.displayName ?? View.name ?? 'View'})`;
  return NumberField;
}

export function createNumberArrayItemField<
  TItem extends Record<string, unknown>,
  TViewProps extends NumberFieldViewProps,
>(View: ComponentType<TViewProps>) {
  const ArrayItemField = createArrayItemField<TItem, TViewProps>(View);

  function NumberField<TName extends keyof TItem & string>(
    props: ArrayItemFieldConfigProps<TItem, TName> &
      Omit<TViewProps, 'changeListener'> & { requiredMessage?: string }
  ) {
    const { validation, requiredMessage, label } = props;
    const adaptedValidation = useAdaptedNumberValidation(validation, requiredMessage, label);

    return <ArrayItemField {...props} validation={adaptedValidation} />;
  }

  NumberField.displayName = `NumberArrayItemField(${View.displayName ?? View.name ?? 'View'})`;
  return NumberField;
}
