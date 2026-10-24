import type { ReactNode } from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { clearFormPersistence } from '../persistence/use-form-persistence';
import { useFormApiContext } from '../core/form-api-context';

type ResetButtonProps = ButtonProps & {
  children: ReactNode;
  /** Override the persistence key cleared on reset (defaults to registered `useFormPersistence` id). */
  clearPersistenceId?: string;
};

export function ResetButton({ children, onClick, clearPersistenceId, ...props }: ResetButtonProps) {
  const { form, resetValues, persistenceIdRef } = useFormApiContext();

  return (
    <Button
      type="button"
      variant="outline"
      {...props}
      onClick={(event) => {
        const persistenceKey = clearPersistenceId ?? persistenceIdRef.current;
        if (persistenceKey) {
          clearFormPersistence(persistenceKey);
        }
        form.skipNextPersistenceSaveRef.current = true;
        form.reset(resetValues);
        onClick?.(event);
      }}
    >
      {children}
    </Button>
  );
}
