import type { ReactNode } from 'react';
import { useStore, type DeepKeys } from '@tanstack/react-form';
import { useFormApi } from '../core/form-api-context';
import { getIn } from '../core/form-utils';

type FormValueProps<TValues extends Record<string, unknown>> = {
  name?: DeepKeys<TValues>;
  labelFunction?: (values: TValues) => ReactNode;
  className?: string;
  'data-testid'?: string;
};

export function FormValue<TValues extends Record<string, unknown>>({
  name,
  labelFunction,
  className,
  'data-testid': dataTestId,
}: FormValueProps<TValues>) {
  const form = useFormApi<TValues>();
  const values = useStore(form.store, (state) => state.values as TValues);

  const content = labelFunction
    ? labelFunction(values)
    : name
      ? String(getIn(values, name) ?? '')
      : null;

  return (
    <div className={className} data-testid={dataTestId}>
      {content}
    </div>
  );
}
