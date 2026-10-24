import { cn } from '@/lib/utils';

const MARK_DOTS = [
  { cx: 50, cy: 50, r: 7.4 },
  { cx: 50, cy: 29.2, r: 4.3 },
  { cx: 64.7, cy: 35.3, r: 4.1 },
  { cx: 70.8, cy: 50, r: 4.3 },
  { cx: 64.7, cy: 64.7, r: 4.1 },
  { cx: 50, cy: 70.8, r: 4.3 },
  { cx: 35.3, cy: 64.7, r: 4.1 },
  { cx: 29.2, cy: 50, r: 4.3 },
  { cx: 35.3, cy: 35.3, r: 4.1 },
  { cx: 50, cy: 14.2, r: 3.3 },
  { cx: 62.4, cy: 17.6, r: 2.5 },
  { cx: 73.2, cy: 26.8, r: 3.4 },
  { cx: 82.4, cy: 37.6, r: 2.4 },
  { cx: 85.8, cy: 50, r: 3.2 },
  { cx: 82.4, cy: 62.4, r: 2.5 },
  { cx: 73.2, cy: 73.2, r: 3.4 },
  { cx: 62.4, cy: 82.4, r: 2.3 },
  { cx: 50, cy: 85.8, r: 3.2 },
  { cx: 37.6, cy: 82.4, r: 2.5 },
  { cx: 26.8, cy: 73.2, r: 3.4 },
  { cx: 17.6, cy: 62.4, r: 2.3 },
  { cx: 14.2, cy: 50, r: 3.2 },
  { cx: 17.6, cy: 37.6, r: 2.5 },
  { cx: 26.8, cy: 26.8, r: 3.4 },
  { cx: 37.6, cy: 17.6, r: 2.3 },
] as const;

type BloomaMarkProps = {
  className?: string;
};

export function BloomaMark({ className }: BloomaMarkProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn('shrink-0', className)}
      aria-hidden="true"
      fill="currentColor"
    >
      {MARK_DOTS.map((dot, index) => (
        <circle key={index} cx={dot.cx} cy={dot.cy} r={dot.r} />
      ))}
    </svg>
  );
}

type BloomaWordmarkProps = {
  className?: string;
  compact?: boolean;
};

export function BloomaWordmark({ className, compact = false }: BloomaWordmarkProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <BloomaMark className={cn(compact ? 'h-7 w-7' : 'h-9 w-9', 'text-foreground')} />
      <div className="leading-none">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Instituto
        </p>
        <p
          className={cn('font-serif font-semibold tracking-tight', compact ? 'text-lg' : 'text-xl')}
        >
          Blooma
        </p>
      </div>
    </div>
  );
}

const FIELD_DOTS = [
  { left: '8%', top: '12%', size: 14, color: 'hsl(50 100% 70%)' },
  { left: '18%', top: '78%', size: 22, color: 'hsl(130 55% 78%)' },
  { left: '86%', top: '18%', size: 18, color: 'hsl(286 90% 86%)' },
  { left: '78%', top: '72%', size: 12, color: 'hsl(239 98% 62%)' },
  { left: '48%', top: '8%', size: 8, color: 'hsl(50 100% 70%)' },
  { left: '92%', top: '48%', size: 10, color: 'hsl(191 70% 78%)' },
  { left: '6%', top: '48%', size: 9, color: 'hsl(286 90% 86%)' },
  { left: '62%', top: '88%', size: 16, color: 'hsl(50 100% 70%)' },
  { left: '32%', top: '90%', size: 7, color: 'hsl(239 98% 62%)' },
  { left: '70%', top: '6%', size: 6, color: 'hsl(130 55% 78%)' },
] as const;

type BloomaDotFieldProps = {
  className?: string;
};

export function BloomaDotField({ className }: BloomaDotFieldProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      {FIELD_DOTS.map((dot, index) => (
        <span
          key={index}
          className="absolute rounded-full opacity-80"
          style={{
            left: dot.left,
            top: dot.top,
            width: dot.size,
            height: dot.size,
            backgroundColor: dot.color,
          }}
        />
      ))}
    </div>
  );
}
