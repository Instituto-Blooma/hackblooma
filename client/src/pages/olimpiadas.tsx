import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { Search } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { DateText } from '@/components/olimpiadas/date-text';
import { ExtraOlympiadDialog } from '@/components/olimpiadas/extra-dialog';
import { ParticipationControl } from '@/components/olimpiadas/participation-control';
import { defaultSeason, SeasonPicker } from '@/components/olimpiadas/season-picker';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { areaColor, today as getToday } from '@/lib/olimpiadas';
import type { FunctionReturnType } from 'convex/server';
import { api } from '../../../convex/_generated/api';

type Row = NonNullable<FunctionReturnType<typeof api.olimpiadas.listForSeason>>['rows'][number];

function OlympiadCard({ row, showActions }: { readonly row: Row; readonly showActions: boolean }) {
  return (
    <Card className={cn('flex flex-col', !row.eligible && 'bg-muted/40')}>
      <CardContent className="flex flex-1 flex-col gap-3 pt-5">
        <div className="flex items-start justify-between gap-3">
          <Link
            to="/olimpiadas/$olympiadId"
            params={{ olympiadId: row._id }}
            className="min-w-0 hover:underline"
          >
            <p className="font-serif text-lg font-semibold leading-tight">{row.acronym}</p>
            <p className="text-sm text-muted-foreground">{row.name}</p>
          </Link>
          <span
            className={cn(
              'shrink-0 rounded-md px-2 py-0.5 text-xs font-medium',
              areaColor(row.area)
            )}
          >
            {row.area}
          </span>
        </div>
        <dl className="grid gap-1 text-sm">
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-muted-foreground">Inscrição até</dt>
            <dd>
              {row.registrationDeadline ? (
                <DateText date={row.registrationDeadline} showNote={false} />
              ) : (
                (row.registrationNote ?? '—')
              )}
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-muted-foreground">{row.firstPhase?.name ?? 'Prova'}</dt>
            <dd>
              <DateText date={row.firstPhase?.date} showNote={false} />
            </dd>
          </div>
        </dl>
        {row.tags.length || row.isExtra ? (
          <div className="flex flex-wrap gap-1.5">
            {row.isExtra ? <Badge variant="secondary">Olimpíada extra</Badge> : null}
            {row.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
        {!row.eligible && row.reasons.length ? (
          <p className="text-xs text-muted-foreground">
            Você não pode participar: {row.reasons.join(' · ').toLowerCase()}
          </p>
        ) : null}
        {showActions && (row.eligible || row.participationStatus) ? (
          <div className="mt-auto pt-1">
            <ParticipationControl olympiadId={row._id} status={row.participationStatus} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function OlimpiadasPage() {
  const [today] = useState(getToday);
  const me = useQuery(api.olimpiadas.me);
  const seasons = useQuery(api.olimpiadas.listSeasons);
  const [season, setSeason] = useState<number | null>(null);
  const activeSeason = season ?? defaultSeason(today, seasons);
  const data = useQuery(api.olimpiadas.listForSeason, { season: activeSeason });
  const [search, setSearch] = useState('');
  const [area, setArea] = useState<string | null>(null);
  const [onlyMine, setOnlyMine] = useState(false);
  const isEquipe = Boolean(me?.isEquipe);

  const areas = useMemo(
    () =>
      [...new Set((data?.rows ?? []).map((row) => row.area))].toSorted((a, b) => a.localeCompare(b)),
    [data]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.rows ?? []).filter((row) => {
      if (area && row.area !== area) return false;
      if (onlyMine && !row.participationStatus) return false;
      if (!term) return true;
      return `${row.acronym} ${row.name} ${row.area}`.toLowerCase().includes(term);
    });
  }, [data, search, area, onlyMine]);

  const paraVoce = isEquipe ? filtered : filtered.filter((row) => row.eligible);
  const outras = isEquipe ? [] : filtered.filter((row) => !row.eligible);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
              Olimpíadas
            </h1>
            <p className="mt-1 text-muted-foreground">
              {isEquipe
                ? 'A lista oficial que as meninas veem.'
                : 'Marque "vou participar" nas que você quer fazer.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SeasonPicker value={activeSeason} onChange={setSeason} />
            {!isEquipe ? <ExtraOlympiadDialog season={activeSeason} /> : null}
          </div>
        </div>

        {!isEquipe && data && !data.hasProfile ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Complete seu{' '}
            <Link to="/perfil" className="font-medium text-primary underline">
              perfil escolar
            </Link>{' '}
            para ver quais olimpíadas são para você.
          </p>
        ) : null}

        <div className="space-y-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, sigla ou área"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {!isEquipe ? (
              <button
                type="button"
                onClick={() => setOnlyMine(!onlyMine)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium',
                  onlyMine ? 'border-primary bg-primary text-primary-foreground' : 'bg-background'
                )}
              >
                Só as minhas
              </button>
            ) : null}
            {areas.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setArea(area === value ? null : value)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium',
                  area === value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-background'
                )}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <section className="space-y-3">
          {!isEquipe ? (
            <h2 className="font-serif text-lg font-semibold">
              Para você <span className="text-muted-foreground">({paraVoce.length})</span>
            </h2>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {paraVoce.map((row) => (
              <OlympiadCard key={row._id} row={row} showActions={!isEquipe} />
            ))}
          </div>
          {data && paraVoce.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma olimpíada encontrada.</p>
          ) : null}
        </section>

        {outras.length > 0 ? (
          <section className="space-y-3">
            <h2 className="font-serif text-lg font-semibold">
              Outras olimpíadas <span className="text-muted-foreground">({outras.length})</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              Por agora você não pode participar destas, mas vale conhecer. As "por convite" podem
              chegar pelo caminho de outra olimpíada.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {outras.map((row) => (
                <OlympiadCard key={row._id} row={row} showActions />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
