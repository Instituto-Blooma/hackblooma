import { useMemo, useState } from 'react';
import { Link, Navigate } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import { ArrowRight, NotebookPen, Trophy } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { EventRow } from '@/components/olimpiadas/event-row';
import { PushSetupCard } from '@/components/olimpiadas/push-setup';
import { ResultDialog } from '@/components/olimpiadas/result-dialog';
import { SchoolProfileForm } from '@/components/olimpiadas/school-profile-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { notificationsGranted } from '@/lib/push';
import { daysBetween, formatDateInfo, today as getToday } from '@/lib/olimpiadas';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

function PageTitle({ name }: { readonly name: string | null }) {
  const first = name?.split(' ')[0];
  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
        {first ? `Oi, ${first}!` : 'Oi!'}
      </h1>
      <p className="mt-1 text-muted-foreground">Seus próximos passos nas olimpíadas.</p>
    </div>
  );
}

export function ProximosPassosPage() {
  const me = useQuery(api.olimpiadas.me);
  const [today] = useState(getToday);
  const data = useQuery(api.olimpiadas.proximosPassos, me && !me.isEquipe ? { today } : 'skip');
  const dismissPushPrompt = useMutation(api.olimpiadas.dismissPushPrompt);
  const [pushHidden, setPushHidden] = useState(() => notificationsGranted());

  const groups = useMemo(() => {
    const upcoming = data?.upcoming ?? [];
    const week = [];
    const month = [];
    const later = [];
    const tbc = [];
    for (const event of upcoming) {
      if (event.date.status !== 'confirmed' || !event.date.start) {
        tbc.push(event);
        continue;
      }
      const days = daysBetween(today, event.date.start);
      if (days <= 7) week.push(event);
      else if (days <= 31) month.push(event);
      else later.push(event);
    }
    return [
      { title: 'Esta semana', events: week },
      { title: 'Nas próximas semanas', events: month },
      { title: 'Mais pra frente', events: later },
      { title: 'Datas a confirmar', events: tbc },
    ].filter((group) => group.events.length > 0);
  }, [data, today]);

  if (me === undefined) {
    return <AppShell>{null}</AppShell>;
  }
  if (me?.isEquipe) {
    return <Navigate to="/equipe" />;
  }

  const needsProfile = !me?.grade || !me?.schoolType;
  const showPush = !needsProfile && !me?.pushPromptDismissedAt && !pushHidden;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <PageTitle name={me?.name ?? null} />

        {needsProfile ? (
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div>
                <p className="font-serif text-lg font-semibold">Primeiro, conte sobre você</p>
                <p className="text-sm text-muted-foreground">
                  Assim a gente mostra primeiro as olimpíadas que são para você.
                </p>
              </div>
              <SchoolProfileForm grade={null} schoolType={null} submitLabel="Continuar" />
            </CardContent>
          </Card>
        ) : null}

        {showPush ? (
          <PushSetupCard
            onDone={() => {
              setPushHidden(true);
              void dismissPushPrompt();
            }}
          />
        ) : null}

        {!needsProfile && data && data.participationCount === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-start gap-3 pt-6">
              <Trophy className="h-8 w-8 text-primary" />
              <div>
                <p className="font-serif text-lg font-semibold">Escolha suas olimpíadas</p>
                <p className="text-sm text-muted-foreground">
                  Marque "vou participar" nas olimpíadas que você quer fazer. Os prazos e as provas
                  aparecem aqui.
                </p>
              </div>
              <Button asChild>
                <Link to="/olimpiadas">
                  Ver a lista de olimpíadas
                  <ArrowRight />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {data && data.toRecord.length > 0 ? (
          <section className="space-y-3">
            <h2 className="font-serif text-lg font-semibold">Como foi?</h2>
            {data.toRecord.map((event) => (
              <Card key={`${event.phaseId}`}>
                <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Foi em {formatDateInfo(event.date)}. Anote o seu resultado quando sair.
                    </p>
                  </div>
                  <ResultDialog
                    phaseId={event.phaseId as Id<'phases'>}
                    title={event.title}
                    existing={null}
                    trigger={
                      <Button variant="outline" size="sm">
                        <NotebookPen />
                        Anotar resultado
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            ))}
          </section>
        ) : null}

        {groups.map((group) => (
          <section key={group.title} className="space-y-3">
            <h2 className="font-serif text-lg font-semibold">{group.title}</h2>
            <div className="space-y-2">
              {group.events.map((event) => (
                <EventRow
                  key={`${event.kind}-${event.phaseId ?? event.olympiadId}`}
                  event={event}
                  today={today}
                />
              ))}
            </div>
          </section>
        ))}

        {data && data.participationCount > 0 && groups.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nada marcado para os próximos meses. Que tal olhar a temporada seguinte na lista de
            olimpíadas?
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}
