import type { FormEvent, MutableRefObject, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { clearAllServerFieldErrors } from './errors';
import { FormApiProvider } from './form-api-context';
import type { AppFormApi } from './form-hook';

export type FormShellProps = {
  children: ReactNode;
  className?: string;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
};

export function createFormShell<TValues extends Record<string, unknown>>(
  form: AppFormApi<TValues>,
  resetValues: TValues,
  persistenceIdRef: MutableRefObject<string | undefined>
) {
  const AppForm = form.AppForm;

  function FormShell({ children, className, onSubmit }: FormShellProps) {
    return (
      <AppForm>
        <FormApiProvider form={form} resetValues={resetValues} persistenceIdRef={persistenceIdRef}>
          <form
            className={cn('flex flex-col gap-4', className)}
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onSubmit?.(event);
              // Server/Zod errors live in errorMap.onSubmit and make canSubmit false.
              // Clear them before each attempt so handleSubmit can reach onSubmit again.
              clearAllServerFieldErrors(form);
              void form.handleSubmit();
            }}
          >
            {children}
          </form>
        </FormApiProvider>
      </AppForm>
    );
  }

  FormShell.displayName = 'FormShell';
  return FormShell;
}
