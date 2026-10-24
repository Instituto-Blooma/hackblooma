import { lazy, Suspense, useEffect, useId, useState } from 'react';
import { useTheme } from '@/components/theme-provider';
import { useFieldContext } from '../core/form-hook';
import type { FieldViewProps } from '../core/form-types';
import { FieldWrapper } from './field-wrapper';
import { fieldErrorMessage } from '../core/errors';
import type { RichTextCollabUser } from './rich-text-editor';

const RichTextEditor = lazy(() => import('./rich-text-editor'));

type RichTextFieldViewProps = FieldViewProps & {
  placeholder?: string;
  changeListener?: (value: string) => void;
  collab?: {
    documentId: string;
    user: RichTextCollabUser;
  };
};

function useResolvedDarkMode(): boolean {
  const { theme } = useTheme();
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => setSystemDark(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return theme === 'dark' || (theme === 'system' && systemDark);
}

export function RichTextFieldView({
  label,
  description,
  disabled,
  className,
  placeholder,
  changeListener,
  collab,
  'data-testid': dataTestId,
}: RichTextFieldViewProps) {
  const field = useFieldContext<string>();
  const generatedId = useId();
  const id = dataTestId ?? generatedId;
  const error = fieldErrorMessage(field.state.meta.errors, field.state.meta.errorMap);
  const isDark = useResolvedDarkMode();

  return (
    <FieldWrapper
      id={id}
      label={label}
      description={description}
      error={error}
      className={className}
      data-testid={dataTestId}
    >
      <Suspense
        fallback={
          <div
            className="min-h-[160px] rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-muted-foreground"
            data-testid={dataTestId ? `${dataTestId}-loading` : undefined}
          >
            Loading editor…
          </div>
        }
      >
        <RichTextEditor
          value={field.state.value ?? ''}
          disabled={disabled}
          placeholder={placeholder}
          isDark={isDark}
          data-testid={dataTestId}
          collab={collab}
          onBlur={field.handleBlur}
          onChange={(nextValue) => {
            field.handleChange(nextValue);
            changeListener?.(nextValue);
          }}
        />
      </Suspense>
    </FieldWrapper>
  );
}
