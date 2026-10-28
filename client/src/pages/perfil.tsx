import { useQuery } from 'convex/react';
import { AppShell } from '@/components/app-shell';
import { PushSetup } from '@/components/olimpiadas/push-setup';
import { SchoolProfileForm } from '@/components/olimpiadas/school-profile-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '../../../convex/_generated/api';

export function PerfilPage() {
  const me = useQuery(api.olimpiadas.me);

  return (
    <AppShell>
      <div className="mx-auto max-w-xl space-y-6">
        <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
          Perfil escolar e avisos
        </h1>
        {me && !me.isEquipe ? (
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Perfil escolar</CardTitle>
              <CardDescription>
                Usamos a sua série e o tipo de escola para mostrar o que é para você.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SchoolProfileForm
                key={`${me.grade}-${me.schoolType}`}
                grade={me.grade}
                schoolType={me.schoolType}
              />
            </CardContent>
          </Card>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Avisos</CardTitle>
            <CardDescription>
              Os avisos chegam por e-mail{me?.email ? ` (${me.email})` : ''}, aqui no app e, se você
              quiser, como notificação neste aparelho.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PushSetup showSkip={false} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
