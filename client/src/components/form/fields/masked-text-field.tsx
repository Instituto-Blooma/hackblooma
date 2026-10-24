import { useCallback, useEffect, useId, useMemo, type Ref } from 'react';
import { useIMask } from 'react-imask';
import { Input } from '@/components/ui/input';
import { useFieldContext } from '../core/form-hook';
import type { FieldViewProps } from '../core/form-types';
import { FieldWrapper } from './field-wrapper';
import { fieldErrorMessage } from '../core/errors';

type MaskedTextFieldViewProps = FieldViewProps & {
  /** IMask pattern string, e.g. `(00) 00000-0000`. See https://imask.js.org/guide.html#masked-pattern */
  mask: string;
  placeholder?: string;
  changeListener?: (value: string) => void;
};

type MaskAcceptRef = {
  masked: { isComplete: boolean };
  unmaskedValue: string;
};

function maskFormatLabel(label: MaskedTextFieldViewProps['label']): string {
  return typeof label === 'string' && label.length > 0 ? label : 'Field';
}

export function MaskedTextFieldView({
  label,
  description,
  disabled,
  className,
  hideLabel,
  mask,
  placeholder,
  changeListener,
  'data-testid': dataTestId,
}: MaskedTextFieldViewProps) {
  const field = useFieldContext<string>();
  const generatedId = useId();
  const id = dataTestId ?? generatedId;
  const error = fieldErrorMessage(field.state.meta.errors, field.state.meta.errorMap);

  const maskOptions = useMemo(() => ({ mask, lazy: false }), [mask]);

  const handleAccept = useCallback(
    (newValue: string, maskRef: MaskAcceptRef) => {
      field.handleChange(newValue);
      changeListener?.(newValue);

      const isComplete = maskRef.masked.isComplete;
      const hasInput = maskRef.unmaskedValue.length > 0;
      const nextMaskError =
        !isComplete && hasInput ? `${maskFormatLabel(label)} must match format ${mask}` : undefined;

      field.setMeta((previous) => {
        const previousMaskError = (previous.errorMap as { onMask?: unknown } | undefined)?.onMask;
        if (previousMaskError === nextMaskError) {
          return previous;
        }
        return {
          ...previous,
          errorMap: {
            ...previous.errorMap,
            onMask: nextMaskError,
          },
        };
      });
    },
    [changeListener, field, label, mask]
  );

  const { ref, setValue } = useIMask(maskOptions, {
    onAccept: handleAccept,
    defaultValue: field.state.value ?? '',
  });

  useEffect(() => {
    setValue(field.state.value ?? '');
  }, [field.state.value, setValue]);

  return (
    <FieldWrapper
      id={id}
      label={label}
      description={description}
      error={error}
      className={className}
      hideLabel={hideLabel}
      data-testid={dataTestId}
    >
      <Input
        id={id}
        ref={ref as Ref<HTMLInputElement>}
        type="text"
        placeholder={placeholder}
        disabled={disabled}
        data-testid={dataTestId}
        onBlur={field.handleBlur}
      />
    </FieldWrapper>
  );
}
