import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDateInfo, type DateInfo } from '@/lib/olimpiadas';

/** A date or period; "a confirmar" dates get the selo and the probable month. */
export function DateText({
  date,
  className,
  showNote = true,
}: {
  readonly date: DateInfo | null | undefined;
  readonly className?: string;
  readonly showNote?: boolean;
}) {
  if (!date) {
    return <span className={cn('text-muted-foreground', className)}>sem data</span>;
  }
  if (date.status === 'tbc') {
    return (
      <span className={cn('inline-flex flex-wrap items-center gap-1.5', className)}>
        <Badge variant="outline" className="border-dashed font-medium text-muted-foreground">
          a confirmar
        </Badge>
        {date.estimateMonth ? (
          <span className="text-muted-foreground">
            {formatDateInfo(date).replace('a confirmar ', '').replace(/[()]/g, '')}
          </span>
        ) : null}
        {showNote && date.note ? (
          <span className="text-xs text-muted-foreground">· {date.note}</span>
        ) : null}
      </span>
    );
  }
  return (
    <span className={className}>
      {formatDateInfo(date)}
      {showNote && date.note ? (
        <span className="text-xs text-muted-foreground"> · {date.note}</span>
      ) : null}
    </span>
  );
}
