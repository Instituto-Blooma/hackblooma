import type { ReactNode } from 'react';
import { useStore } from '@tanstack/react-form';
import { useFormApi } from '../core/form-api-context';

type FormWhenProps<TValues extends Record<string, unknown>> = {
  when: (values: TValues) => boolean;
  children: ReactNode;
};

export function FormWhen<TValues extends Record<string, unknown>>({
  when,
  children,
}: FormWhenProps<TValues>) {
  const form = useFormApi<TValues>();
  const visible = useStore(form.store, (state) => when(state.values as TValues));
  return visible ? <>{children}</> : null;
}
