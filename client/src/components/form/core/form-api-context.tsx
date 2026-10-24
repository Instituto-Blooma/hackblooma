import { createContext, useContext, useMemo, type MutableRefObject, type ReactNode } from 'react';
import type { AppFormApi } from './form-hook';

type FormApiContextValue<TValues extends Record<string, unknown>> = {
  form: AppFormApi<TValues>;
  resetValues: TValues;
  persistenceIdRef: MutableRefObject<string | undefined>;
};

const FormApiContext = createContext<FormApiContextValue<Record<string, unknown>> | null>(null);

export function FormApiProvider<TValues extends Record<string, unknown>>({
  form,
  resetValues,
  persistenceIdRef,
  children,
}: {
  form: AppFormApi<TValues>;
  resetValues: TValues;
  persistenceIdRef: MutableRefObject<string | undefined>;
  children: ReactNode;
}) {
  const value = useMemo(
    () =>
      ({
        form: form as AppFormApi<Record<string, unknown>>,
        resetValues: resetValues as Record<string, unknown>,
        persistenceIdRef,
      }) satisfies FormApiContextValue<Record<string, unknown>>,
    [form, persistenceIdRef, resetValues]
  );

  return <FormApiContext.Provider value={value}>{children}</FormApiContext.Provider>;
}

export function useFormApiContext<
  TValues extends Record<string, unknown> = Record<string, unknown>,
>(): FormApiContextValue<TValues> {
  const context = useContext(FormApiContext);
  if (!context) {
    throw new Error('useFormApiContext must be used within form.FormShell.');
  }
  return context as FormApiContextValue<TValues>;
}

export function useFormApi<
  TValues extends Record<string, unknown> = Record<string, unknown>,
>(): AppFormApi<TValues> {
  return useFormApiContext<TValues>().form;
}
