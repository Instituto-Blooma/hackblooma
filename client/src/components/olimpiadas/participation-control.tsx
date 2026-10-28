import { useMutation } from 'convex/react';
import { Check, CheckCheck, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Id } from '../../../../convex/_generated/dataModel';
import { api } from '../../../../convex/_generated/api';

type Status = 'planned' | 'registered' | null;

/** "Vou participar" → "Já me inscrevi" (CONTEXT.md, Participação). */
export function ParticipationControl({
  olympiadId,
  status,
  size = 'sm',
}: {
  readonly olympiadId: Id<'olympiads'>;
  readonly status: Status;
  readonly size?: 'sm' | 'default';
}) {
  const setParticipation = useMutation(api.olimpiadas.setParticipation);

  const change = async (next: 'planned' | 'registered' | 'none') => {
    try {
      await setParticipation({ olympiadId, status: next });
      if (next === 'planned') toast.success('Anotado! Vamos te lembrar do prazo de inscrição.');
      if (next === 'registered') toast.success('Inscrição confirmada. Boa prova!');
      if (next === 'none') toast('Tirei essa olimpíada da sua lista.');
    } catch {
      toast.error('Não foi possível salvar. Tente de novo.');
    }
  };

  if (status === null) {
    return (
      <Button size={size} onClick={() => change('planned')} data-testid="button-vou-participar">
        <Plus />
        Vou participar
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === 'planned' ? (
        <Button size={size} onClick={() => change('registered')} data-testid="button-inscrita">
          <CheckCheck />
          Já me inscrevi
        </Button>
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size={size} variant="outline">
            <Check />
            {status === 'planned' ? 'Vou participar' : 'Inscrita'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {status === 'registered' ? (
            <DropdownMenuItem onClick={() => change('planned')}>
              Ainda não me inscrevi
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onClick={() => change('none')}>
            <X className="mr-2 h-4 w-4" />
            Não vou mais participar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
