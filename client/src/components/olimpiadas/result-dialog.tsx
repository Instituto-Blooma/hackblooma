import { useState, type ReactNode } from 'react';
import { useMutation } from 'convex/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { AWARD_LABELS, OUTCOME_LABELS, type Award, type Outcome } from '@/lib/olimpiadas';
import type { Id } from '../../../../convex/_generated/dataModel';
import { api } from '../../../../convex/_generated/api';

type ExistingResult = {
  outcome: Outcome;
  award?: Award | null;
  score?: string | null;
  notes?: string | null;
};

const OUTCOMES: Outcome[] = ['advanced', 'not_advanced', 'final'];
const AWARDS: Award[] = ['ouro', 'prata', 'bronze', 'mencao'];

function Choice({
  selected,
  onClick,
  children,
}: {
  readonly selected: boolean;
  readonly onClick: () => void;
  readonly children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md border px-3 py-2 text-left text-sm transition-colors hover-elevate',
        selected ? 'border-primary bg-primary/10 font-medium text-primary' : 'border-border'
      )}
    >
      {children}
    </button>
  );
}

/** Anotar o Resultado de uma Fase. */
export function ResultDialog({
  phaseId,
  title,
  existing,
  trigger,
}: {
  readonly phaseId: Id<'phases'>;
  readonly title: string;
  readonly existing: ExistingResult | null;
  readonly trigger: ReactNode;
}) {
  const recordResult = useMutation(api.olimpiadas.recordResult);
  const deleteResult = useMutation(api.olimpiadas.deleteResult);
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(existing?.outcome ?? null);
  const [award, setAward] = useState<Award | null>(existing?.award ?? null);
  const [score, setScore] = useState(existing?.score ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!outcome) {
      toast.error('Conte como foi: passou de fase ou não?');
      return;
    }
    setSaving(true);
    try {
      await recordResult({
        phaseId,
        outcome,
        award: award ?? undefined,
        score: score || undefined,
        notes: notes || undefined,
      });
      toast.success(
        award || outcome === 'advanced'
          ? 'Que conquista! 🎉 Resultado anotado.'
          : 'Resultado anotado.'
      );
      setOpen(false);
    } catch {
      toast.error('Não foi possível salvar o resultado.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setOutcome(existing?.outcome ?? null);
          setAward(existing?.award ?? null);
          setScore(existing?.score ?? '');
          setNotes(existing?.notes ?? '');
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">Meu resultado</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Como foi?</Label>
            <div className="grid gap-2">
              {OUTCOMES.map((value) => (
                <Choice key={value} selected={outcome === value} onClick={() => setOutcome(value)}>
                  {OUTCOME_LABELS[value]}
                </Choice>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Ganhou medalha ou menção? (opcional)</Label>
            <div className="grid grid-cols-2 gap-2">
              {AWARDS.map((value) => (
                <Choice
                  key={value}
                  selected={award === value}
                  onClick={() => setAward(award === value ? null : value)}
                >
                  {AWARD_LABELS[value]}
                </Choice>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="result-score">Nota (opcional)</Label>
              <Input
                id="result-score"
                value={score}
                onChange={(event) => setScore(event.target.value)}
                placeholder="ex.: 14 de 20"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="result-notes">Anotações (opcional)</Label>
              <Textarea
                id="result-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="O que deu certo, o que estudar para a próxima…"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {existing ? (
            <Button
              variant="ghost"
              onClick={async () => {
                await deleteResult({ phaseId });
                setOpen(false);
              }}
            >
              Apagar resultado
            </Button>
          ) : (
            <span />
          )}
          <Button onClick={save} disabled={saving} data-testid="button-salvar-resultado">
            Salvar resultado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
