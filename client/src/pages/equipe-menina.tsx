import { Link } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { ArrowLeft } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { DateText } from '@/components/olimpiadas/date-text';
import { HistoricoList, HistoricoSummary } from '@/components/olimpiadas/historico-list';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GRADES } from '@/lib/olimpiadas';
import type { Id } from '../../../convex/_generated/dataModel';
import { api } from '../../../convex/_generated/api';

export function EquipeMeninaPage({ userId }: { readonly userId: Id<'users'> }) {
  const data = useQuery(api.equipe.menina, { userId });

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/equipe">
            <ArrowLeft />
            Acompanhamento
          </Link>
        </Button>
        {data ? (
          <>
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={data.image ?? undefined} />
                <AvatarFallback>{data.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-serif text-2xl font-semibold">{data.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {[
                    data.email,
                    GRADES.find((grade) => grade.value === data.grade)?.label,
                    data.schoolType === 'publica'
                      ? 'Escola pública'
                      : data.schoolType === 'particular'
                        ? 'Escola particular'
                        : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg">Participações</CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                {data.participations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Ainda não escolheu olimpíadas.</p>
                ) : null}
                {data.participations.map((participation) => (
                  <div
                    key={participation._id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium">
                        {participation.acronym}{' '}
                        <span className="text-sm font-normal text-muted-foreground">
                          · Temporada {participation.season}
                        </span>
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        Inscrição até{' '}
                        <DateText date={participation.registrationDeadline} showNote={false} />
                      </span>
                    </span>
                    <span className="flex shrink-0 gap-1.5">
                      {participation.isExtra ? <Badge variant="secondary">Extra</Badge> : null}
                      <Badge
                        variant={participation.status === 'registered' ? 'default' : 'outline'}
                      >
                        {participation.status === 'registered' ? 'Inscrita' : 'Vou participar'}
                      </Badge>
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <section className="space-y-3">
              <h2 className="font-serif text-lg font-semibold">Histórico</h2>
              {data.historico.length > 0 ? (
                <>
                  <HistoricoSummary rows={data.historico} />
                  <HistoricoList rows={data.historico} />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum resultado anotado ainda.</p>
              )}
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
