import { Link } from '@tanstack/react-router';
import { CalendarClock, ClipboardCheck, PencilLine, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { daysBetween, type DateInfo } from '@/lib/olimpiadas';
import { DateText } from './date-text';

export type EventRowData = {
  kind: 'prazo' | 'fase' | 'divulgacao';
  olympiadId: string;
  acronym: string;
  name: string;
  title: string;
  date: DateInfo;
  participationStatus: 'planned' | 'registered' | null;
};

const KIND_META = {
  prazo: {
    icon: PencilLine,
    label: 'Prazo de inscrição',
    tone: 'bg-accent text-accent-foreground',
  },
  fase: { icon: ClipboardCheck, label: 'Prova', tone: 'bg-primary/10 text-primary' },
  divulgacao: {
    icon: Megaphone,
    label: 'Divulgação do resultado',
    tone: 'bg-secondary text-secondary-foreground',
  },
} as const;

function countdown(date: DateInfo, today: string) {
  if (date.status !== 'confirmed' || !date.start) {
    return null;
  }
  const days = daysBetween(today, date.start);
  if (days < 0) {
    const end = date.end ?? date.start;
    return daysBetween(today, end) >= 0 ? 'acontecendo agora' : null;
  }
  if (days === 0) return 'hoje';
  if (days === 1) return 'amanhã';
  return `em ${days} dias`;
}

export function EventRow({
  event,
  today,
}: {
  readonly event: EventRowData;
  readonly today: string;
}) {
  const meta = KIND_META[event.kind];
  const when = countdown(event.date, today);
  const urgent =
    event.date.status === 'confirmed' &&
    event.date.start !== undefined &&
    daysBetween(today, event.date.start) <= 7 &&
    daysBetween(today, event.date.start) >= -1;
  return (
    <Link
      to="/olimpiadas/$olympiadId"
      params={{ olympiadId: event.olympiadId }}
      className="flex items-start gap-3 rounded-lg border bg-card p-3 hover-elevate sm:p-4"
    >
      <span
        className={cn(
          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
          meta.tone
        )}
      >
        <meta.icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {meta.label}
        </span>
        <span className="block font-medium">
          {event.kind === 'prazo' ? `Inscrição · ${event.acronym}` : event.title}
        </span>
        <DateText date={event.date} className="mt-0.5 block text-sm text-muted-foreground" />
        {event.kind === 'prazo' && event.participationStatus === 'planned' ? (
          <span className="mt-1 block text-xs text-muted-foreground">
            Ainda falta marcar "já me inscrevi"
          </span>
        ) : null}
      </span>
      {when ? (
        <span
          className={cn(
            'flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
            urgent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}
        >
          <CalendarClock className="h-3 w-3" />
          {when}
        </span>
      ) : null}
    </Link>
  );
}
