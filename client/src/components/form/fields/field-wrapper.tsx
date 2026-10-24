import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type FieldWrapperProps = {
  id?: string;
  label?: ReactNode;
  description?: ReactNode;
  error?: string;
  className?: string;
  labelClassName?: string;
  hideLabel?: boolean;
  children: ReactNode;
  'data-testid'?: string;
};

export function FieldWrapper({
  id,
  label,
  description,
  error,
  className,
  labelClassName,
  hideLabel,
  children,
  'data-testid': dataTestId,
}: FieldWrapperProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && !hideLabel ? (
        <Label htmlFor={id} className={labelClassName}>
          {label}
        </Label>
      ) : null}
      {children}
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      {error ? (
        <p
          className="text-sm text-destructive"
          data-testid={dataTestId ? `${dataTestId}-error` : undefined}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
