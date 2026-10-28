import { Link } from '@tanstack/react-router';
import { Medal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AWARD_LABELS, OUTCOME_LABELS, type Award, type Outcome } from '@/lib/olimpiadas';

type HistoricoRow = {
  _id: string;
  season: number;
  olympiadId: string;
  acronym: string;
  olympiadName: string;
  phaseName: string;
  outcome: Outcome;
  award: Award | null;
  score: string | null;
  notes: string | null;
};

const AWARD_TONE: Record<Award, string> = {
  ouro: 'bg-chart-2/25 text-foreground',
  prata: 'bg-muted text-foreground',
  bronze: 'bg-destructive/15 text-foreground',
  mencao: 'bg-secondary text-secondary-foreground',
};

export function HistoricoSummary({ rows }: { readonly rows: HistoricoRow[] }) {
  const count = (award: Award) => rows.filter((row) => row.award === award).length;
  const advanced = rows.filter((row) => row.outcome === 'advanced').length;
  const stats = [
    { label: 'Ouro', value: count('ouro') },
    { label: 'Prata', value: count('prata') },
    { label: 'Bronze', value: count('bronze') },
    { label: 'Menções', value: count('mencao') },
    { label: 'Fases passadas', value: advanced },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-3 text-center">
            <p className="font-serif text-2xl font-semibold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Histórico: Resultados grouped by Temporada. */
export function HistoricoList({ rows }: { readonly rows: HistoricoRow[] }) {
  const seasons = [...new Set(rows.map((row) => row.season))].toSorted((a, b) => b - a);
  return (
    <div className="space-y-6">
      {seasons.map((season) => (
        <section key={season} className="space-y-2">
          <h2 className="font-serif text-lg font-semibold">Temporada {season}</h2>
          {rows
            .filter((row) => row.season === season)
            .map((row) => (
              <Link
                key={row._id}
                to="/olimpiadas/$olympiadId"
                params={{ olympiadId: row.olympiadId }}
                className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3 hover-elevate"
              >
                <span className="min-w-0">
                  <span className="block font-medium">
                    {row.acronym} · {row.phaseName}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {OUTCOME_LABELS[row.outcome]}
                    {row.score ? ` · nota ${row.score}` : ''}
                  </span>
                  {row.notes ? (
                    <span className="mt-1 block text-xs text-muted-foreground">{row.notes}</span>
                  ) : null}
                </span>
                {row.award ? (
                  <span
                    className={cn(
                      'flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                      AWARD_TONE[row.award]
                    )}
                  >
                    <Medal className="h-3.5 w-3.5" />
                    {AWARD_LABELS[row.award]}
                  </span>
                ) : null}
              </Link>
            ))}
        </section>
      ))}
    </div>
  );
}
