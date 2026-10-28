import { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { EventRow } from '@/components/olimpiadas/event-row';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { monthName, today as getToday } from '@/lib/olimpiadas';
import { api } from '../../../convex/_generated/api';

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

const DOT = {
  prazo: 'bg-chart-2',
  fase: 'bg-primary',
  divulgacao: 'bg-chart-4',
} as const;

function iso(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function CalendarioPage() {
  const [today] = useState(getToday);
  const me = useQuery(api.olimpiadas.me);
  const [cursor, setCursor] = useState(() => ({
    year: Number(today.slice(0, 4)),
    month: Number(today.slice(5, 7)),
  }));
  const [everything, setEverything] = useState(false);
  const [selected, setSelected] = useState<string | null>(today);
  const showAll = everything || Boolean(me?.isEquipe);
  const events = useQuery(api.olimpiadas.calendar, { season: cursor.year, everything: showAll });

  const byDay = useMemo(() => {
    const map = new Map<string, NonNullable<typeof events>>();
    for (const event of events ?? []) {
      if (event.date.status !== 'confirmed' || !event.date.start) continue;
      const start = event.date.start;
      const end = event.date.end ?? start;
      // Multi-day periods show on every day they cover (capped to keep the grid readable).
      let day = start;
      for (let i = 0; i < 31 && day <= end; i += 1) {
        map.set(day, [...(map.get(day) ?? []), event]);
        const next = new Date(`${day}T12:00:00Z`);
        next.setUTCDate(next.getUTCDate() + 1);
        day = next.toISOString().slice(0, 10);
      }
    }
    return map;
  }, [events]);

  const tbcThisMonth = (events ?? []).filter(
    (event) => event.date.status === 'tbc' && event.date.estimateMonth === cursor.month
  );

  const firstWeekday = new Date(Date.UTC(cursor.year, cursor.month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(cursor.year, cursor.month, 0)).getUTCDate();
  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const move = (delta: number) => {
    const month = cursor.month + delta;
    const next =
      month < 1
        ? { year: cursor.year - 1, month: 12 }
        : month > 12
          ? { year: cursor.year + 1, month: 1 }
          : { year: cursor.year, month };
    setCursor(next);
    setSelected(null);
  };

  const selectedEvents = selected ? (byDay.get(selected) ?? []) : [];
  const monthEvents = (events ?? [])
    .filter((event) => event.date.start?.startsWith(iso(cursor.year, cursor.month, 1).slice(0, 7)))
    .toSorted((a, b) => a.sortKey.localeCompare(b.sortKey));

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
              Calendário
            </h1>
            <p className="mt-1 text-muted-foreground">
              {showAll
                ? 'Todas as olimpíadas da lista oficial.'
                : 'Só as olimpíadas que você vai fazer.'}
            </p>
          </div>
          {!me?.isEquipe ? (
            <div className="flex items-center gap-2">
              <Switch id="everything" checked={everything} onCheckedChange={setEverything} />
              <Label htmlFor="everything">Mostrar todas as olimpíadas</Label>
            </div>
          ) : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-xl border bg-card p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => move(-1)}
                aria-label="Mês anterior"
              >
                <ChevronLeft />
              </Button>
              <p className="font-serif text-lg font-semibold capitalize">
                {monthName(cursor.month)} {cursor.year}
              </p>
              <Button variant="ghost" size="icon" onClick={() => move(1)} aria-label="Próximo mês">
                <ChevronRight />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
              {WEEKDAYS.map((weekday) => (
                <div key={weekday} className="py-1">
                  {weekday}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, index) => {
                if (day === null) return <div key={`empty-${index}`} />;
                const key = iso(cursor.year, cursor.month, day);
                const dayEvents = byDay.get(key) ?? [];
                const kinds = [...new Set(dayEvents.map((event) => event.kind))];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelected(key)}
                    className={cn(
                      'flex aspect-square flex-col items-center justify-start gap-1 rounded-md p-1 text-sm transition-colors hover:bg-muted',
                      key === today && 'font-bold text-primary',
                      selected === key && 'bg-accent text-accent-foreground hover:bg-accent'
                    )}
                  >
                    <span>{day}</span>
                    <span className="flex gap-0.5">
                      {kinds.map((kind) => (
                        <span key={kind} className={cn('h-1.5 w-1.5 rounded-full', DOT[kind])} />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className={cn('h-2 w-2 rounded-full', DOT.prazo)} /> Prazo de inscrição
              </span>
              <span className="flex items-center gap-1">
                <span className={cn('h-2 w-2 rounded-full', DOT.fase)} /> Prova
              </span>
              <span className="flex items-center gap-1">
                <span className={cn('h-2 w-2 rounded-full', DOT.divulgacao)} /> Divulgação do
                resultado
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-serif text-lg font-semibold">
              {selected
                ? `${selected.slice(8, 10)}/${selected.slice(5, 7)}`
                : `Em ${monthName(cursor.month)}`}
            </h2>
            {(selected ? selectedEvents : monthEvents).map((event) => (
              <EventRow
                key={`${event.kind}-${event.phaseId ?? event.olympiadId}`}
                event={event}
                today={today}
              />
            ))}
            {(selected ? selectedEvents : monthEvents).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nada marcado {selected ? 'neste dia' : 'neste mês'}.
              </p>
            ) : null}
            {tbcThisMonth.length > 0 ? (
              <div className="space-y-2 pt-2">
                <p className="text-sm font-medium">
                  A confirmar, deve ser em {monthName(cursor.month)}
                </p>
                {tbcThisMonth.map((event) => (
                  <EventRow
                    key={`tbc-${event.kind}-${event.phaseId ?? event.olympiadId}`}
                    event={event}
                    today={today}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
