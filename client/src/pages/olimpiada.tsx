import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Lock,
  Medal,
  NotebookPen,
  Route as RouteIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/app-shell';
import { DateText } from '@/components/olimpiadas/date-text';
import { ParticipationControl } from '@/components/olimpiadas/participation-control';
import { ResultDialog } from '@/components/olimpiadas/result-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AWARD_LABELS, OUTCOME_LABELS, areaColor, today as getToday } from '@/lib/olimpiadas';
import type { Id } from '../../../convex/_generated/dataModel';
import { api } from '../../../convex/_generated/api';

export function OlimpiadaPage({ olympiadId }: { readonly olympiadId: Id<'olympiads'> }) {
  const data = useQuery(api.olimpiadas.get, { olympiadId });
  const me = useQuery(api.olimpiadas.me);
  const deleteExtra = useMutation(api.olimpiadas.deleteExtra);
  const navigate = useNavigate();
  const [today] = useState(getToday);
  const isEquipe = Boolean(me?.isEquipe);

  if (data === undefined) {
    return <AppShell>{null}</AppShell>;
  }
  if (data === null) {
    return (
      <AppShell>
        <p className="text-muted-foreground">Olimpíada não encontrada.</p>
      </AppShell>
    );
  }

  const { olympiad } = data;
  const canParticipate = !isEquipe && (data.eligible || data.participationStatus);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/olimpiadas">
            <ArrowLeft />
            Olimpíadas
          </Link>
        </Button>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn('rounded-md px-2 py-0.5 text-xs font-medium', areaColor(olympiad.area))}
            >
              {olympiad.area}
            </span>
            <Badge variant="outline">Temporada {olympiad.season}</Badge>
            {olympiad.isExtra ? (
              <Badge variant="secondary">Olimpíada extra · só você vê</Badge>
            ) : null}
            {olympiad.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="font-normal">
                {tag}
              </Badge>
            ))}
          </div>
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight">{olympiad.acronym}</h1>
            <p className="text-muted-foreground">{olympiad.name}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canParticipate ? (
              <ParticipationControl
                olympiadId={olympiad._id}
                status={data.participationStatus}
                size="default"
              />
            ) : null}
            {olympiad.website ? (
              <Button variant="ghost" asChild>
                <a href={olympiad.website} target="_blank" rel="noreferrer">
                  Site oficial
                  <ExternalLink />
                </a>
              </Button>
            ) : null}
          </div>
          {!isEquipe && !data.eligible && data.reasons.length ? (
            <p className="text-sm text-muted-foreground">
              Você não pode participar: {data.reasons.join(' · ').toLowerCase()}.
            </p>
          ) : null}
          {olympiad.eligibilityNote ? (
            <p className="text-sm text-muted-foreground">{olympiad.eligibilityNote}</p>
          ) : null}
        </div>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Prazo de inscrição
            </p>
            <p className="mt-1 text-lg font-medium">
              {olympiad.registrationDeadline ? (
                <DateText date={olympiad.registrationDeadline} />
              ) : (
                (olympiad.registrationNote ?? 'Sem prazo informado')
              )}
            </p>
            {olympiad.registrationDeadline && olympiad.registrationNote ? (
              <p className="text-sm text-muted-foreground">{olympiad.registrationNote}</p>
            ) : null}
          </CardContent>
        </Card>

        <section className="space-y-3">
          <h2 className="font-serif text-lg font-semibold">Fases</h2>
          <ol className="relative space-y-3 border-l-2 border-border pl-5">
            {data.phases.map((phase) => {
              const past =
                phase.date.status === 'confirmed' &&
                (phase.date.end ?? phase.date.start ?? '9999') < today;
              return (
                <li key={phase._id} className="relative">
                  <span
                    className={cn(
                      'absolute -left-[27px] top-4 h-3 w-3 rounded-full border-2 border-background',
                      phase.result ? 'bg-primary' : 'bg-muted-foreground/40'
                    )}
                  />
                  <Card>
                    <CardContent className="space-y-2 pt-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{phase.name}</p>
                          <DateText date={phase.date} className="text-sm text-muted-foreground" />
                        </div>
                        {!isEquipe && (data.participationStatus || phase.result) ? (
                          <ResultDialog
                            phaseId={phase._id}
                            title={`${phase.name} · ${olympiad.acronym}`}
                            existing={phase.result}
                            trigger={
                              <Button
                                variant={past && !phase.result ? 'default' : 'outline'}
                                size="sm"
                              >
                                <NotebookPen />
                                {phase.result ? 'Editar resultado' : 'Anotar resultado'}
                              </Button>
                            }
                          />
                        ) : null}
                      </div>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Divulgação do resultado: </span>
                        {phase.resultRelease ? (
                          <DateText date={phase.resultRelease} />
                        ) : (
                          <span className="text-muted-foreground">ainda sem data</span>
                        )}
                      </p>
                      {phase.result ? (
                        <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
                          {phase.result.award ? (
                            <span className="flex items-center gap-1 font-semibold text-primary">
                              <Medal className="h-4 w-4" />
                              {AWARD_LABELS[phase.result.award]}
                            </span>
                          ) : null}
                          <span>{OUTCOME_LABELS[phase.result.outcome]}</span>
                          {phase.result.score ? (
                            <span className="text-muted-foreground">
                              · nota {phase.result.score}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </li>
              );
            })}
            {data.hiddenPhaseCount > 0 ? (
              <li className="relative">
                <span className="absolute -left-[27px] top-3 h-3 w-3 rounded-full border-2 border-background bg-muted-foreground/20" />
                <p className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  {data.hiddenPhaseCount === 1
                    ? 'Mais 1 fase aparece aqui quando você passar nesta.'
                    : `Mais ${data.hiddenPhaseCount} fases aparecem aqui conforme você passar.`}
                </p>
              </li>
            ) : null}
          </ol>
        </section>

        {data.caminho.length > 0 || data.comesFrom.length > 0 ? (
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
              <RouteIcon className="h-5 w-5 text-primary" />
              Caminho
            </h2>
            {data.caminho.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Indo bem aqui, você pode chegar em:</p>
                {data.caminho.map((target) => (
                  <Link
                    key={target._id}
                    to="/olimpiadas/$olympiadId"
                    params={{ olympiadId: target._id }}
                    className="flex items-center justify-between rounded-lg border bg-card p-3 hover-elevate"
                  >
                    <span>
                      <span className="font-medium">{target.acronym}</span>{' '}
                      <span className="text-sm text-muted-foreground">{target.name}</span>
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            ) : null}
            {data.comesFrom.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Você chega aqui por:</p>
                {data.comesFrom.map((source) => (
                  <Link
                    key={source._id}
                    to="/olimpiadas/$olympiadId"
                    params={{ olympiadId: source._id }}
                    className="flex items-center justify-between rounded-lg border bg-card p-3 hover-elevate"
                  >
                    <span>
                      <span className="font-medium">{source.acronym}</span>{' '}
                      <span className="text-sm text-muted-foreground">{source.name}</span>
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {olympiad.isExtra ? (
          <Button
            variant="ghost"
            className="text-destructive"
            onClick={async () => {
              await deleteExtra({ olympiadId: olympiad._id });
              toast('Olimpíada extra apagada.');
              void navigate({ to: '/olimpiadas' });
            }}
          >
            Apagar esta olimpíada extra
          </Button>
        ) : null}
      </div>
    </AppShell>
  );
}
