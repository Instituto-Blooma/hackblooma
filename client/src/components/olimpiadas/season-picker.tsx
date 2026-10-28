import { useQuery } from 'convex/react';
import { cn } from '@/lib/utils';
import { api } from '../../../../convex/_generated/api';

/** Segmented control for the Temporadas the Equipe Blooma opened. */
export function SeasonPicker({
  value,
  onChange,
}: {
  readonly value: number;
  readonly onChange: (season: number) => void;
}) {
  const seasons = useQuery(api.olimpiadas.listSeasons);
  const options = [...(seasons ?? [value])].toSorted((a, b) => a - b);
  return (
    <div
      className="inline-flex rounded-lg border bg-muted p-1"
      role="tablist"
      aria-label="Temporada"
    >
      {options.map((season) => (
        <button
          key={season}
          type="button"
          role="tab"
          aria-selected={season === value}
          onClick={() => onChange(season)}
          className={cn(
            'rounded-md px-3 py-1 text-sm font-medium text-muted-foreground transition-colors',
            season === value && 'bg-background text-foreground shadow-sm'
          )}
        >
          Temporada {season}
        </button>
      ))}
    </div>
  );
}

/** Default Temporada: next year once most of this year is over (from October on). */
export function defaultSeason(today: string, seasons: number[] | undefined) {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  const preferred = month >= 10 ? year + 1 : year;
  if (!seasons || seasons.includes(preferred)) {
    return preferred;
  }
  return seasons.includes(year) ? year : (seasons[0] ?? year);
}
