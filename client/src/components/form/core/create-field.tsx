import { createContext, useContext, useEffect, type ComponentType } from 'react';
import type { DeepKeys, DeepValue, StandardSchemaV1 } from '@tanstack/react-form';
import { useAppFormContext } from './form-hook';
import { getIn, joinFieldName } from './form-utils';
import { registerFieldSerializer } from './serializers';
import { unsubscribeStore } from './store-utils';
import type {
  ArrayItemFieldConfigProps,
  FieldViewProps,
  TypedFieldConfigProps,
} from './form-types';

export type { FieldViewProps } from './form-types';

export type FormArrayPrefixContextValue = {
  prefix: string;
};

export const FormArrayPrefixContext = createContext<FormArrayPrefixContextValue | null>(null);

export function useFormArrayPrefix(): string | undefined {
  return useContext(FormArrayPrefixContext)?.prefix;
}

function resolveListenToPath(sourceName: string, arrayPrefix?: string, fullName?: string): string {
  if (sourceName.startsWith('thisGroup.') && arrayPrefix) {
    return joinFieldName(arrayPrefix, sourceName.replace('thisGroup.', ''));
  }
  if (sourceName.includes('.') || sourceName.includes('[')) {
    return sourceName;
  }
  if (fullName?.includes('.')) {
    const parentPrefix = fullName.slice(0, fullName.lastIndexOf('.') + 1);
    return `${parentPrefix}${sourceName}`;
  }
  return sourceName;
}

export type ListenToMap = Record<
  string,
  (otherValue: unknown, myValue: unknown, allValues: Record<string, unknown>) => unknown
>;

type ListenToEffectProps = {
  fullName: string;
  listenTo: ListenToMap;
  arrayPrefix?: string;
};

function syncListenToValues(
  form: ReturnType<typeof useAppFormContext>,
  fullName: string,
  listenTo: ListenToMap,
  arrayPrefix?: string
): void {
  const values = form.store.state.values as Record<string, unknown>;

  for (const [sourceName, callback] of Object.entries(listenTo)) {
    const sourcePath = resolveListenToPath(sourceName, arrayPrefix, fullName);
    const sourceValue = getIn(values, sourcePath);
    const currentValue = getIn(values, fullName);
    const nextValue = callback(sourceValue, currentValue, values);
    if (nextValue !== undefined && nextValue !== currentValue) {
      form.setFieldValue(fullName as never, nextValue as never);
    }
  }
}

function ListenToEffect({ fullName, listenTo, arrayPrefix }: ListenToEffectProps) {
  const form = useAppFormContext();

  useEffect(() => {
    syncListenToValues(form, fullName, listenTo, arrayPrefix);

    const subscription = form.store.subscribe(() => {
      syncListenToValues(form, fullName, listenTo, arrayPrefix);
    });

    return () => {
      unsubscribeStore(subscription);
    };
  }, [arrayPrefix, form, fullName, listenTo]);

  return null;
}

type InternalFieldConfig = {
  name: string;
  validation?: StandardSchemaV1;
  listenTo?: ListenToEffectProps['listenTo'];
  serialize?: (value: unknown) => unknown;
  deserialize?: (value: unknown) => unknown;
  changeListener?: (value: unknown) => void;
};

function FieldBinder<TViewProps extends FieldViewProps>({
  View,
  config,
  viewProps,
}: {
  View: ComponentType<TViewProps>;
  config: InternalFieldConfig;
  viewProps: Omit<TViewProps, 'changeListener'>;
}) {
  const form = useAppFormContext();
  const arrayPrefix = useFormArrayPrefix();
  const { name, validation, listenTo, serialize, deserialize, changeListener } = config;
  const fullName = joinFieldName(arrayPrefix, name);

  useEffect(() => {
    return registerFieldSerializer(form, fullName, { serialize, deserialize });
  }, [form, fullName, serialize, deserialize]);

  const validators = validation
    ? {
        onChange: validation,
        onBlur: validation,
        onSubmit: validation,
      }
    : undefined;

  return (
    <>
      {listenTo ? (
        <ListenToEffect fullName={fullName} listenTo={listenTo} arrayPrefix={arrayPrefix} />
      ) : null}
      <form.AppField name={fullName as never} validators={validators as never}>
        {() => (
          <View
            {...(viewProps as TViewProps)}
            changeListener={
              changeListener as TViewProps extends { changeListener?: infer C } ? C : never
            }
          />
        )}
      </form.AppField>
    </>
  );
}

export function createTypedField<
  TValues extends Record<string, unknown>,
  TViewProps extends FieldViewProps,
>(View: ComponentType<TViewProps>) {
  function TypedField<TName extends DeepKeys<TValues>>(
    props: TypedFieldConfigProps<TValues, TName> & Omit<TViewProps, 'changeListener'>
  ) {
    const { name, validation, listenTo, serialize, deserialize, changeListener, ...viewProps } =
      props;

    return (
      <FieldBinder
        View={View}
        config={{
          name,
          validation: validation as StandardSchemaV1 | undefined,
          listenTo: listenTo as ListenToEffectProps['listenTo'],
          serialize: serialize as ((value: unknown) => unknown) | undefined,
          deserialize: deserialize as ((value: unknown) => unknown) | undefined,
          changeListener: changeListener as ((value: unknown) => void) | undefined,
        }}
        viewProps={viewProps as unknown as Omit<TViewProps, 'changeListener'>}
      />
    );
  }

  TypedField.displayName = `TypedField(${View.displayName ?? View.name ?? 'View'})`;
  return TypedField;
}

export function createArrayItemField<
  TItem extends Record<string, unknown>,
  TViewProps extends FieldViewProps,
>(View: ComponentType<TViewProps>) {
  function ArrayItemField<TName extends keyof TItem & string>(
    props: ArrayItemFieldConfigProps<TItem, TName> & Omit<TViewProps, 'changeListener'>
  ) {
    const { name, validation, listenTo, serialize, deserialize, changeListener, ...viewProps } =
      props;

    return (
      <FieldBinder
        View={View}
        config={{
          name,
          validation: validation as StandardSchemaV1 | undefined,
          listenTo: listenTo as ListenToEffectProps['listenTo'],
          serialize: serialize as ((value: unknown) => unknown) | undefined,
          deserialize: deserialize as ((value: unknown) => unknown) | undefined,
          changeListener: changeListener as ((value: unknown) => void) | undefined,
        }}
        viewProps={viewProps as unknown as Omit<TViewProps, 'changeListener'>}
      />
    );
  }

  ArrayItemField.displayName = `ArrayItemField(${View.displayName ?? View.name ?? 'View'})`;
  return ArrayItemField;
}

export type { DeepKeys, DeepValue };
