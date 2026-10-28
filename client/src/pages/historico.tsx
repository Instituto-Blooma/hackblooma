import { Link } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { Medal } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { HistoricoList, HistoricoSummary } from '@/components/olimpiadas/historico-list';
import { Button } from '@/components/ui/button';
import { api } from '../../../convex/_generated/api';

export function HistoricoPage() {
  const rows = useQuery(api.olimpiadas.historico);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
            Histórico
          </h1>
          <p className="mt-1 text-muted-foreground">
            Tudo o que você conquistou, temporada por temporada.
          </p>
        </div>
        {rows && rows.length > 0 ? (
          <>
            <HistoricoSummary rows={rows} />
            <HistoricoList rows={rows} />
          </>
        ) : null}
        {rows && rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
            <Medal className="h-8 w-8 text-primary" />
            <p className="max-w-sm text-sm text-muted-foreground">
              Quando você anotar o resultado de uma prova, ele aparece aqui. Cada fase conta!
            </p>
            <Button variant="outline" asChild>
              <Link to="/">Ver próximos passos</Link>
            </Button>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
