import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { BellRing, Share, SquarePlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  notificationsGranted,
  pushSupport,
  registerServiceWorker,
  subscribeToPush,
} from '@/lib/push';
import { api } from '../../../../convex/_generated/api';

/** Turns on notificações; on iPhone it first explains "Adicionar à Tela de Início". */
export function PushSetup({
  onDone,
  showSkip = true,
}: {
  readonly onDone?: () => void;
  readonly showSkip?: boolean;
}) {
  const publicKey = useQuery(api.push.publicKey);
  const subscribe = useMutation(api.push.subscribe);
  const [support] = useState(() => pushSupport());
  const [granted, setGranted] = useState(() => notificationsGranted());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void registerServiceWorker();
  }, []);

  const enable = async () => {
    if (!publicKey) {
      toast.error('As notificações ainda não foram configuradas pela Equipe Blooma.');
      return;
    }
    setBusy(true);
    try {
      const subscription = await subscribeToPush(publicKey);
      if (!subscription) {
        toast('Tudo bem! Os avisos continuam chegando por e-mail.');
        return;
      }
      await subscribe(subscription);
      setGranted(true);
      toast.success('Notificações ligadas neste aparelho.');
      onDone?.();
    } catch {
      toast.error('Não deu para ligar as notificações neste navegador.');
    } finally {
      setBusy(false);
    }
  };

  if (granted) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <BellRing className="h-4 w-4 text-primary" />
        As notificações estão ligadas neste aparelho.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {support === 'needs-home-screen' ? (
        <ol className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              1
            </span>
            <span>
              No Safari, toque em <Share className="inline h-4 w-4 align-text-bottom" />{' '}
              <strong>Compartilhar</strong>.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              2
            </span>
            <span>
              Escolha <SquarePlus className="inline h-4 w-4 align-text-bottom" />{' '}
              <strong>Adicionar à Tela de Início</strong>, abra o app pelo novo ícone e volte aqui
              para ligar as notificações.
            </span>
          </li>
        </ol>
      ) : null}
      {support === 'unsupported' ? (
        <p className="text-sm text-muted-foreground">
          Este navegador não mostra notificações. Sem problema: os avisos chegam por e-mail.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {support === 'supported' ? (
          <Button onClick={enable} disabled={busy} data-testid="button-ligar-notificacoes">
            <BellRing />
            Ligar notificações
          </Button>
        ) : null}
        {showSkip ? (
          <Button variant="ghost" onClick={onDone}>
            Agora não
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function PushSetupCard({ onDone }: { readonly onDone: () => void }) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="space-y-3 pt-6">
        <div>
          <p className="font-serif text-lg font-semibold">Quer receber avisos no celular?</p>
          <p className="text-sm text-muted-foreground">
            A gente avisa 7 dias e 1 dia antes de cada prazo e prova, e no dia em que sair o
            resultado. O e-mail continua chegando de qualquer jeito.
          </p>
        </div>
        <PushSetup onDone={onDone} />
      </CardContent>
    </Card>
  );
}
