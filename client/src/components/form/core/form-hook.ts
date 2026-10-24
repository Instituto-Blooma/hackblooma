import { useCallback, useMemo, useRef, type MutableRefObject } from 'react';
import { createFormHook, createFormHookContexts, type FormOptions } from '@tanstack/react-form';
import { createFormFields, type FormFields } from './create-fields';
import { createFormLayout, type FormLayout } from './create-layout';
import { createFormShell } from './form-shell';
import { ResetButton } from '../actions/reset-button';
import { SubmitButton } from '../actions/submit-button';
import { serializeValues } from './serializers';
import type { AppFormSubmitArgs, BaseAppFormApi, FormShellComponent } from './form-types';

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

const formHook = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {},
  formComponents: {
    SubmitButton,
    ResetButton,
  },
});

export const { useAppForm: useAppFormBase, withForm, useTypedAppFormContext } = formHook;

export type AppFormApi<TValues extends Record<string, unknown> = Record<string, unknown>> =
  BaseAppFormApi<TValues> & {
    FormShell: FormShellComponent;
    fields: FormFields<TValues>;
    layout: FormLayout<TValues>;
    resetToDefaults: () => void;
    registerPersistenceId: (id: string | undefined) => void;
    skipNextPersistenceSaveRef: MutableRefObject<boolean>;
  };

export function useAppFormContext<
  TValues extends Record<string, unknown> = Record<string, unknown>,
>(): AppFormApi<TValues> {
  return useFormContext() as unknown as AppFormApi<TValues>;
}

type BaseFormOptions<TValues extends Record<string, unknown>> = FormOptions<
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
  undefined
>;

export type UseAppFormOptions<
  TValues extends Record<string, unknown>,
  TSubmitValues = TValues,
> = Omit<BaseFormOptions<TValues>, 'onSubmit'> & {
  onSubmit?: (args: AppFormSubmitArgs<TValues, TSubmitValues>) => void | Promise<void>;
  resetValues?: TValues;
};

export function useAppForm<TValues extends Record<string, unknown>, TSubmitValues = TValues>(
  props: UseAppFormOptions<TValues, TSubmitValues>
): AppFormApi<TValues> {
  const formApiRef = useRef<AppFormApi<TValues> | null>(null);
  const onSubmitRef = useRef(props.onSubmit);
  onSubmitRef.current = props.onSubmit;
  const persistenceIdRef = useRef<string | undefined>(undefined);
  const skipNextPersistenceSaveRef = useRef(false);

  const resetValuesRef = useRef<TValues | null>(null);
  if (resetValuesRef.current === null) {
    resetValuesRef.current = (props.resetValues ?? props.defaultValues) as TValues;
  }

  const wrappedOnSubmit = useCallback(async ({ value }: { value: TValues }) => {
    const api = formApiRef.current;
    if (!api || !onSubmitRef.current) {
      return;
    }
    const unserializedValues = value;
    const serialized = serializeValues(api, unserializedValues) as unknown as TSubmitValues;
    await onSubmitRef.current({ value: serialized, unserializedValues, formApi: api });
  }, []);

  const { onSubmit: _userOnSubmit, resetValues: _resetValues, ...restProps } = props;
  const form = useAppFormBase({ ...restProps, onSubmit: wrappedOnSubmit });
  const fields = useMemo(() => createFormFields<TValues>(), []);
  const layout = useMemo(() => createFormLayout<TValues>(), []);
  const frozenResetValues = resetValuesRef.current;

  return useMemo(() => {
    const resetToDefaults = () => {
      skipNextPersistenceSaveRef.current = true;
      form.reset(frozenResetValues);
    };

    const registerPersistenceId = (id: string | undefined) => {
      persistenceIdRef.current = id;
    };

    const extended = Object.assign(form, {
      fields,
      layout,
      FormShell: createFormShell(form as AppFormApi<TValues>, frozenResetValues, persistenceIdRef),
      resetToDefaults,
      registerPersistenceId,
      skipNextPersistenceSaveRef,
    }) as AppFormApi<TValues>;

    formApiRef.current = extended;
    return extended;
  }, [form, fields, layout, frozenResetValues]);
}

export { FormApiProvider, useFormApi, useFormApiContext } from './form-api-context';
