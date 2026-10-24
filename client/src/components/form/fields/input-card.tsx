import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type InputCardProps = {
  value?: unknown;
  active?: boolean;
  color?: string;
  disabled?: boolean;
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  className?: string;
  'data-testid'?: string;
};

export function InputCard({
  active = false,
  color,
  disabled = false,
  icon,
  title,
  description,
  className,
  'data-testid': dataTestId,
}: InputCardProps) {
  const accent = color ?? 'hsl(var(--primary))';
  const cardStyle: CSSProperties = active ? { borderColor: accent } : {};

  return (
    <div
      data-testid={dataTestId}
      data-active={active ? 'true' : 'false'}
      aria-disabled={disabled || undefined}
      style={cardStyle}
      className={cn(
        'flex h-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover-elevate',
        active ? 'bg-muted text-foreground' : 'border-border bg-card text-muted-foreground',
        className
      )}
    >
      {icon ? (
        <span
          aria-hidden
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-full text-primary-foreground',
            !active && 'bg-muted-foreground/40'
          )}
          style={active ? { backgroundColor: accent } : undefined}
        >
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        {title ? <span className="block text-sm font-medium text-foreground">{title}</span> : null}
        {description ? (
          <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
        ) : null}
      </span>
    </div>
  );
}
