import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type FormSectionProps = {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <section className={cn('flex flex-col gap-4', className)}>
      {title ? <h3 className="text-base font-semibold">{title}</h3> : null}
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      {children}
    </section>
  );
}
