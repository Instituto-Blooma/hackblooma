import type {
  DeepKeys,
  DeepValue,
  StandardSchemaV1,
  AppFieldExtendedReactFormApi,
} from '@tanstack/react-form';
import type { ReactNode, ComponentType, MouseEventHandler } from 'react';
import type { FormShellProps } from './form-shell';
import type { AppFormApi } from './form-hook';

export type TypedListenToMap<TValues, TName extends DeepKeys<TValues>> = Partial<{
  [K in DeepKeys<TValues>]: (
    otherValue: DeepValue<TValues, K>,
    myValue: DeepValue<TValues, TName>,
    allValues: TValues
  ) => DeepValue<TValues, TName> | undefined;
}>;

export type TypedFieldConfigProps<TValues, TName extends DeepKeys<TValues>> = {
  name: TName;
  validation?: StandardSchemaV1<DeepValue<TValues, TName>>;
  listenTo?: TypedListenToMap<TValues, TName>;
  serialize?: (value: DeepValue<TValues, TName>) => unknown;
  deserialize?: (value: unknown) => DeepValue<TValues, TName>;
  changeListener?: (value: DeepValue<TValues, TName>) => void;
};

export type ArrayItemListenToMap<TItem, TName extends keyof TItem & string> = Partial<{
  [K in keyof TItem & string]: (
    otherValue: TItem[K],
    myValue: TItem[TName],
    allValues: Record<string, unknown>
  ) => TItem[TName] | undefined;
}>;

export type ArrayItemFieldConfigProps<TItem, TName extends keyof TItem & string> = {
  name: TName;
  validation?: StandardSchemaV1<TItem[TName]>;
  listenTo?: ArrayItemListenToMap<TItem, TName>;
  serialize?: (value: TItem[TName]) => unknown;
  deserialize?: (value: unknown) => TItem[TName];
  changeListener?: (value: TItem[TName]) => void;
};

export type FieldViewProps = {
  id?: string;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
  hideLabel?: boolean;
  'data-testid'?: string;
};

export type BaseAppFormApi<TValues extends Record<string, unknown>> = AppFieldExtendedReactFormApi<
  TValues,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  Record<string, never>,
  {
    SubmitButton: ComponentType<{
      children: ReactNode;
      disabled?: boolean;
      'data-testid'?: string;
    }>;
    ResetButton: ComponentType<{
      children: ReactNode;
      'data-testid'?: string;
      clearPersistenceId?: string;
      onClick?: MouseEventHandler<HTMLButtonElement>;
    }>;
  }
>;

export type FormShellComponent = ComponentType<FormShellProps>;

export type AppFormSubmitArgs<TValues extends Record<string, unknown>, TSubmitValues = TValues> = {
  /** Serialized form values (field serializers applied) — pass to mutations */
  value: TSubmitValues;
  /** Raw form values before serialization */
  unserializedValues: TValues;
  formApi: AppFormApi<TValues>;
};
