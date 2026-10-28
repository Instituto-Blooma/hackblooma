import { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import { CalendarPlus, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/app-shell';
import { DateInfoEditor } from '@/components/olimpiadas/date-info-editor';
import { DateText } from '@/components/olimpiadas/date-text';
import { defaultSeason, SeasonPicker } from '@/components/olimpiadas/season-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GRADES, today as getToday, type DateInfo, type Grade } from '@/lib/olimpiadas';
import type { Id } from '../../../convex/_generated/dataModel';
import { api } from '../../../convex/_generated/api';

type Row = FunctionReturnType<typeof api.equipe.listaOficial>[number];
type Eligibility = NonNullable<Row['eligibility']>;

type OlympiadDraft = {
  olympiadId?: Id<'olympiads'>;
  name: string;
  acronym: string;
  area: string;
  website: string;
  hasDeadline: boolean;
  registrationDeadline: DateInfo;
  registrationNote: string;
  eligibility: Eligibility;
  leadsTo: string[];
};

type PhaseDraft = {
  olympiadId: Id<'olympiads'>;
  phaseId?: Id<'phases'>;
  name: string;
  date: DateInfo;
  hasRelease: boolean;
  resultRelease: DateInfo;
};

function emptyOlympiad(): OlympiadDraft {
  return {
    name: '',
    acronym: '',
    area: '',
    website: '',
    hasDeadline: true,
    registrationDeadline: { status: 'tbc' },
    registrationNote: '',
    eligibility: {},
    leadsTo: [],
  };
}

function GradeSelect({
  label,
  value,
  onChange,
}: {
  readonly label: string;
  readonly value: Grade | undefined;
  readonly onChange: (grade: Grade | undefined) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Select
        value={value ?? 'any'}
        onValueChange={(next) => onChange(next === 'any' ? undefined : (next as Grade))}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Qualquer série</SelectItem>
          {GRADES.map((grade) => (
            <SelectItem key={grade.value} value={grade.value}>
              {grade.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function OlympiadDialog({
  draft,
  season,
  others,
  onClose,
}: {
  readonly draft: OlympiadDraft;
  readonly season: number;
  readonly others: Row[];
  readonly onClose: () => void;
}) {
  const saveOlympiad = useMutation(api.equipe.saveOlympiad);
  const [value, setValue] = useState(draft);
  const set = (patch: Partial<OlympiadDraft>) => setValue((current) => ({ ...current, ...patch }));
  const setEligibility = (patch: Partial<Eligibility>) =>
    set({ eligibility: { ...value.eligibility, ...patch } });
  const schoolTypes = value.eligibility.schoolTypes ?? [];

  const save = async () => {
    try {
      await saveOlympiad({
        olympiadId: value.olympiadId,
        season,
        name: value.name,
        acronym: value.acronym,
        area: value.area,
        website: value.website || undefined,
        registrationDeadline: value.hasDeadline ? value.registrationDeadline : undefined,
        registrationNote: value.registrationNote || undefined,
        eligibility: value.eligibility,
        leadsTo: value.leadsTo,
      });
      toast.success('Olimpíada salva.');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar.');
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {value.olympiadId ? `Editar ${draft.acronym}` : 'Nova olimpíada'}
          </DialogTitle>
          <DialogDescription>
            Ao confirmar uma data que estava "a confirmar", as meninas participantes recebem um
            aviso.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="o-name">Nome</Label>
            <Input id="o-name" value={value.name} onChange={(e) => set({ name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="o-acronym">Sigla</Label>
            <Input
              id="o-acronym"
              value={value.acronym}
              onChange={(e) => set({ acronym: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="o-area">Área</Label>
            <Input id="o-area" value={value.area} onChange={(e) => set({ area: e.target.value })} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="o-site">Site oficial</Label>
            <Input
              id="o-site"
              value={value.website}
              onChange={(e) => set({ website: e.target.value })}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="o-has-deadline"
                checked={value.hasDeadline}
                onCheckedChange={(checked) => set({ hasDeadline: checked === true })}
              />
              <Label htmlFor="o-has-deadline">Tem prazo de inscrição</Label>
            </div>
            {value.hasDeadline ? (
              <DateInfoEditor
                id="o-deadline"
                value={value.registrationDeadline}
                onChange={(registrationDeadline) => set({ registrationDeadline })}
              />
            ) : null}
            <div className="space-y-1">
              <Label htmlFor="o-reg-note" className="text-xs">
                Texto sobre a inscrição (opcional)
              </Label>
              <Input
                id="o-reg-note"
                value={value.registrationNote}
                placeholder="ex.: Por convite (via Jacob Palis)"
                onChange={(e) => set({ registrationNote: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3 sm:col-span-2">
            <p className="text-sm font-medium">Quem pode participar</p>
            <div className="flex flex-wrap gap-4">
              {(
                [
                  ['publica', 'Escola pública'],
                  ['particular', 'Escola particular'],
                ] as const
              ).map(([type, label]) => (
                <label key={type} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={schoolTypes.length === 0 || schoolTypes.includes(type)}
                    onCheckedChange={(checked) => {
                      const current =
                        schoolTypes.length === 0 ? ['publica', 'particular'] : schoolTypes;
                      const next = (
                        checked ? [...current, type] : current.filter((t) => t !== type)
                      ) as Array<'publica' | 'particular'>;
                      const unique = [...new Set(next)];
                      setEligibility({ schoolTypes: unique.length === 2 ? undefined : unique });
                    }}
                  />
                  {label}
                </label>
              ))}
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={Boolean(value.eligibility.girlsOnly)}
                  onCheckedChange={(checked) =>
                    setEligibility({ girlsOnly: checked === true || undefined })
                  }
                />
                Só meninas
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={Boolean(value.eligibility.inviteOnly)}
                  onCheckedChange={(checked) =>
                    setEligibility({ inviteOnly: checked === true || undefined })
                  }
                />
                Por convite
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <GradeSelect
                label="A partir de"
                value={value.eligibility.minGrade}
                onChange={(minGrade) => setEligibility({ minGrade })}
              />
              <GradeSelect
                label="Até"
                value={value.eligibility.maxGrade}
                onChange={(maxGrade) => setEligibility({ maxGrade })}
              />
            </div>
            <Input
              value={value.eligibility.note ?? ''}
              placeholder="Observação (opcional)"
              onChange={(e) => setEligibility({ note: e.target.value || undefined })}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <p className="text-sm font-medium">Caminho: ir bem aqui pode levar a…</p>
            <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
              {others
                .filter((other) => other._id !== value.olympiadId)
                .map((other) => {
                  const selected = value.leadsTo.includes(other.key);
                  return (
                    <button
                      key={other._id}
                      type="button"
                      onClick={() =>
                        set({
                          leadsTo: selected
                            ? value.leadsTo.filter((key) => key !== other.key)
                            : [...value.leadsTo, other.key],
                        })
                      }
                      className={
                        selected
                          ? 'rounded-full border border-primary bg-primary px-3 py-1 text-xs font-medium text-primary-foreground'
                          : 'rounded-full border px-3 py-1 text-xs font-medium'
                      }
                    >
                      {other.acronym}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PhaseDialog({
  draft,
  onClose,
}: {
  readonly draft: PhaseDraft;
  readonly onClose: () => void;
}) {
  const savePhase = useMutation(api.equipe.savePhase);
  const deletePhase = useMutation(api.equipe.deletePhase);
  const [value, setValue] = useState(draft);

  const save = async () => {
    try {
      await savePhase({
        olympiadId: value.olympiadId,
        phaseId: value.phaseId,
        name: value.name,
        date: value.date,
        resultRelease: value.hasRelease ? value.resultRelease : undefined,
      });
      toast.success('Fase salva.');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar.');
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {value.phaseId ? 'Editar fase' : 'Nova fase'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="p-name">Nome da fase</Label>
            <Input
              id="p-name"
              value={value.name}
              onChange={(e) => setValue({ ...value, name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Data da prova</Label>
            <DateInfoEditor
              id="p-date"
              value={value.date}
              onChange={(date) => setValue({ ...value, date })}
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox
                checked={value.hasRelease}
                onCheckedChange={(checked) => setValue({ ...value, hasRelease: checked === true })}
              />
              Divulgação do resultado
            </label>
            {value.hasRelease ? (
              <DateInfoEditor
                id="p-release"
                value={value.resultRelease}
                onChange={(resultRelease) => setValue({ ...value, resultRelease })}
              />
            ) : null}
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {value.phaseId ? (
            <Button
              variant="ghost"
              className="text-destructive"
              onClick={async () => {
                await deletePhase({ phaseId: value.phaseId! });
                onClose();
              }}
            >
              Apagar fase
            </Button>
          ) : (
            <span />
          )}
          <Button onClick={save}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EquipeListaPage() {
  const [today] = useState(getToday);
  const seasons = useQuery(api.olimpiadas.listSeasons);
  const [season, setSeason] = useState<number | null>(null);
  const activeSeason = season ?? defaultSeason(today, seasons);
  const rows = useQuery(api.equipe.listaOficial, { season: activeSeason });
  const openSeason = useMutation(api.equipe.openSeason);
  const deleteOlympiad = useMutation(api.equipe.deleteOlympiad);
  const [olympiadDraft, setOlympiadDraft] = useState<OlympiadDraft | null>(null);
  const [phaseDraft, setPhaseDraft] = useState<PhaseDraft | null>(null);
  const [search, setSearch] = useState('');
  const nextSeason = Math.max(...(seasons ?? [activeSeason])) + 1;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (rows ?? []).filter(
      (row) => !term || `${row.acronym} ${row.name} ${row.area}`.toLowerCase().includes(term)
    );
  }, [rows, search]);

  const tbcCount = (rows ?? []).reduce(
    (count, row) =>
      count +
      (row.registrationDeadline?.status === 'tbc' ? 1 : 0) +
      row.phases.filter((phase) => phase.date.status === 'tbc').length,
    0
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
              Lista oficial
            </h1>
            <p className="mt-1 text-muted-foreground">
              {rows ? `${rows.length} olimpíadas · ${tbcCount} datas a confirmar` : ' '}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SeasonPicker value={activeSeason} onChange={setSeason} />
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const copied = await openSeason({ year: nextSeason });
                  toast.success(
                    `Temporada ${nextSeason} aberta com ${copied} olimpíadas a confirmar.`
                  );
                  setSeason(nextSeason);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Não foi possível abrir.');
                }
              }}
            >
              <CalendarPlus />
              Abrir temporada {nextSeason}
            </Button>
            <Button size="sm" onClick={() => setOlympiadDraft(emptyOlympiad())}>
              <Plus />
              Nova olimpíada
            </Button>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar"
            className="pl-9"
          />
        </div>

        <div className="space-y-3">
          {filtered.map((row) => (
            <Card key={row._id}>
              <CardContent className="space-y-3 pt-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-serif text-lg font-semibold">
                      {row.acronym}{' '}
                      <span className="text-sm font-normal text-muted-foreground">
                        · {row.area}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">{row.name}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="font-normal">
                      {row.participantCount} {row.participantCount === 1 ? 'menina' : 'meninas'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Editar olimpíada"
                      onClick={() =>
                        setOlympiadDraft({
                          olympiadId: row._id,
                          name: row.name,
                          acronym: row.acronym,
                          area: row.area,
                          website: row.website ?? '',
                          hasDeadline: Boolean(row.registrationDeadline),
                          registrationDeadline: row.registrationDeadline ?? { status: 'tbc' },
                          registrationNote: row.registrationNote ?? '',
                          eligibility: row.eligibility ?? {},
                          leadsTo: row.leadsTo,
                        })
                      }
                    >
                      <Pencil />
                    </Button>
                    {row.participantCount === 0 ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Apagar olimpíada"
                        onClick={async () => {
                          if (
                            !window.confirm(`Apagar ${row.acronym} da temporada ${activeSeason}?`)
                          )
                            return;
                          try {
                            await deleteOlympiad({ olympiadId: row._id });
                          } catch (error) {
                            toast.error(
                              error instanceof Error ? error.message : 'Não foi possível apagar.'
                            );
                          }
                        }}
                      >
                        <Trash2 />
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <div className="rounded-md bg-muted/60 px-3 py-2">
                    <span className="text-muted-foreground">Inscrição até </span>
                    {row.registrationDeadline ? (
                      <DateText date={row.registrationDeadline} />
                    ) : (
                      (row.registrationNote ?? '—')
                    )}
                  </div>
                  {row.phases.map((phase) => (
                    <button
                      key={phase._id}
                      type="button"
                      className="rounded-md bg-muted/60 px-3 py-2 text-left hover-elevate"
                      onClick={() =>
                        setPhaseDraft({
                          olympiadId: row._id,
                          phaseId: phase._id,
                          name: phase.name,
                          date: phase.date,
                          hasRelease: Boolean(phase.resultRelease),
                          resultRelease: phase.resultRelease ?? { status: 'tbc' },
                        })
                      }
                    >
                      <span className="text-muted-foreground">{phase.name}: </span>
                      <DateText date={phase.date} />
                      <span className="block text-xs text-muted-foreground">
                        Resultado:{' '}
                        {phase.resultRelease ? (
                          <DateText date={phase.resultRelease} showNote={false} />
                        ) : (
                          'sem data'
                        )}
                      </span>
                    </button>
                  ))}
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-md border border-dashed px-3 py-2 text-left text-muted-foreground hover-elevate"
                    onClick={() =>
                      setPhaseDraft({
                        olympiadId: row._id,
                        name: `${row.phases.length + 1}ª fase`,
                        date: { status: 'tbc' },
                        hasRelease: false,
                        resultRelease: { status: 'tbc' },
                      })
                    }
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar fase
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
          {rows && rows.length === 0 ? (
            <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nenhuma olimpíada nesta temporada ainda.
            </p>
          ) : null}
        </div>

        {olympiadDraft ? (
          <OlympiadDialog
            draft={olympiadDraft}
            season={activeSeason}
            others={rows ?? []}
            onClose={() => setOlympiadDraft(null)}
          />
        ) : null}
        {phaseDraft ? <PhaseDialog draft={phaseDraft} onClose={() => setPhaseDraft(null)} /> : null}
      </div>
    </AppShell>
  );
}
