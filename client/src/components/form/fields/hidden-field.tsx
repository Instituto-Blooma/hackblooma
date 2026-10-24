import { useFieldContext } from '../core/form-hook';
import type { FieldViewProps } from '../core/form-types';

type HiddenFieldViewProps = FieldViewProps;

export function HiddenFieldView({ 'data-testid': dataTestId }: HiddenFieldViewProps) {
  const field = useFieldContext<unknown>();

  return (
    <input
      type="hidden"
      value={String(field.state.value ?? '')}
      data-testid={dataTestId}
      readOnly
    />
  );
}
