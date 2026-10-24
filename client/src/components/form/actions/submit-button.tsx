import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { useFormApi } from '../core/form-api-context';

type SubmitButtonProps = ButtonProps & {
  children: ReactNode;
};

export function SubmitButton({ children, disabled, ...props }: SubmitButtonProps) {
  const form = useFormApi();

  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button type="submit" disabled={disabled || isSubmitting} {...props}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : null}
          {children}
        </Button>
      )}
    </form.Subscribe>
  );
}
