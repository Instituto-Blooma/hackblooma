import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { AlarmClock, PartyPopper, Users } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AWARD_LABELS, OUTCOME_LABELS, formatDateInfo, today as getToday } from '@/lib/olimpiadas';
import { api } from '../../../convex/_generated/api';

function daysLeftLabel(days: number) {
  if (days === 0) return 'fecha hoje';
  if (days === 1) return 'fecha amanhã';
  return `fecha em ${days} dias`;
}

export function EquipeAcompanhamentoPage() {
  const [today] = useState(getToday);
  const data = useQuery(api.equipe.acompanhamento, { today });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
            Acompanhamento
          </h1>
          <p className="mt-1 text-muted-foreground">
            Quem precisa de um empurrão e o que vale comemorar.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-lg">
                <AlarmClock className="h-5 w-5 text-primary" />
                Precisam de um empurrão
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Prazo de inscrição nos próximos 7 dias e ainda não marcaram "inscrita".
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {data?.nudges.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ninguém com prazo apertado agora. 🎉
                </p>
              ) : null}
              {data?.nudges.map((nudge) => (
                <Link
                  key={`${nudge.userId}-${nudge.olympiadId}`}
                  to="/equipe/meninas/$userId"
                  params={{ userId: nudge.userId }}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 hover-elevate"
                >
                  <span>
                    <span className="block font-medium">{nudge.name}</span>
                    <span className="block text-sm text-muted-foreground">
                      Inscrição · {nudge.acronym} ·{' '}
                      {formatDateInfo({ status: 'confirmed', start: nudge.deadline })}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
                      nudge.daysLeft <= 1
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-accent text-accent-foreground'
                    )}
                  >
                    {daysLeftLabel(nudge.daysLeft)}
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-lg">
                <PartyPopper className="h-5 w-5 text-primary" />
                Para comemorar
              </CardTitle>
              <p className="text-sm text-muted-foreground">Resultados anotados recentemente.</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {data?.celebrations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ainda não há resultados anotados. Eles aparecem aqui assim que as meninas
                  anotarem.
                </p>
              ) : null}
              {data?.celebrations.map((item) => (
                <Link
                  key={item._id}
                  to="/equipe/meninas/$userId"
                  params={{ userId: item.userId }}
                  className="block rounded-lg border p-3 hover-elevate"
                >
                  <span className="block font-medium">{item.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {item.acronym} · {item.phaseName} ·{' '}
                    {item.award ? AWARD_LABELS[item.award] : OUTCOME_LABELS[item.outcome]}
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <Users className="h-5 w-5 text-primary" />
              Meninas <span className="text-muted-foreground">({data?.roster.length ?? 0})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.roster.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma menina ainda.{' '}
                <Link to="/settings/members" className="font-medium text-primary underline">
                  Convide pelo e-mail
                </Link>
                .
              </p>
            ) : null}
            <div className="divide-y">
              {data?.roster.map((menina) => (
                <Link
                  key={menina._id}
                  to="/equipe/meninas/$userId"
                  params={{ userId: menina._id }}
                  className="flex items-center gap-3 py-3 hover:bg-muted/50"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={menina.image ?? undefined} />
                    <AvatarFallback>{menina.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{menina.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {menina.status === 'active' ? menina.email : 'Convite ainda não aceito'}
                    </span>
                  </span>
                  <span className="hidden gap-4 text-sm text-muted-foreground sm:flex">
                    <span>{menina.planned} vou participar</span>
                    <span>
                      {menina.registered} {menina.registered === 1 ? 'inscrita' : 'inscritas'}
                    </span>
                    <span>
                      {menina.medals} {menina.medals === 1 ? 'medalha' : 'medalhas'}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
