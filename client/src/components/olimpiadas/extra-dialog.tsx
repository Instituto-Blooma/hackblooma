import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { Plus } from 'lucide-react';
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
import type { DateInfo } from '@/lib/olimpiadas';
import { api } from '../../../../convex/_generated/api';

function toDateInfo(value: string): DateInfo {
  return value ? { status: 'confirmed', start: value } : { status: 'tbc' };
}

/** Olimpíada extra: one the menina adds herself; only she sees it. */
export function ExtraOlympiadDialog({ season }: { readonly season: number }) {
  const createExtra = useMutation(api.olimpiadas.createExtra);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [acronym, setAcronym] = useState('');
  const [area, setArea] = useState('');
  const [website, setWebsite] = useState('');
  const [deadline, setDeadline] = useState('');
  const [phaseDate, setPhaseDate] = useState('');

  const save = async () => {
    if (!name.trim()) {
      toast.error('Dê um nome para a olimpíada.');
      return;
    }
    try {
      const olympiadId = await createExtra({
        season,
        name,
        acronym: acronym || undefined,
        area: area || 'Outra',
        website: website || undefined,
        registrationDeadline: deadline ? toDateInfo(deadline) : undefined,
        firstPhaseDate: toDateInfo(phaseDate),
      });
      toast.success('Olimpíada extra adicionada. Só você vê.');
      setOpen(false);
      void navigate({ to: '/olimpiadas/$olympiadId', params: { olympiadId } });
    } catch {
      toast.error('Não foi possível adicionar.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus />
          Olimpíada extra
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">Adicionar olimpíada extra</DialogTitle>
          <DialogDescription>
            Para olimpíadas que não estão na lista oficial, como uma olimpíada da sua cidade. Só
            você vê.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="extra-name">Nome</Label>
            <Input id="extra-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="extra-acronym">Sigla (opcional)</Label>
            <Input
              id="extra-acronym"
              value={acronym}
              onChange={(e) => setAcronym(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="extra-area">Área</Label>
            <Input
              id="extra-area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="ex.: Matemática"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="extra-site">Site (opcional)</Label>
            <Input id="extra-site" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="extra-deadline">Prazo de inscrição</Label>
            <Input
              id="extra-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="extra-phase">Dia da prova</Label>
            <Input
              id="extra-phase"
              type="date"
              value={phaseDate}
              onChange={(e) => setPhaseDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
