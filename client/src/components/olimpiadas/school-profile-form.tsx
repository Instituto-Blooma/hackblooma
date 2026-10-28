import { useState } from 'react';
import { useMutation } from 'convex/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { GRADES, type Grade, type SchoolType } from '@/lib/olimpiadas';
import { api } from '../../../../convex/_generated/api';

/** Perfil escolar: série e tipo de escola, used for "Para você". */
export function SchoolProfileForm({
  grade,
  schoolType,
  onSaved,
  submitLabel = 'Salvar',
}: {
  readonly grade: Grade | null;
  readonly schoolType: SchoolType | null;
  readonly onSaved?: () => void;
  readonly submitLabel?: string;
}) {
  const updateSchoolProfile = useMutation(api.olimpiadas.updateSchoolProfile);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(grade);
  const [selectedSchool, setSelectedSchool] = useState<SchoolType | null>(schoolType);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!selectedGrade || !selectedSchool) {
      toast.error('Escolha a série e o tipo de escola.');
      return;
    }
    setSaving(true);
    try {
      await updateSchoolProfile({ grade: selectedGrade, schoolType: selectedSchool });
      toast.success('Perfil escolar salvo.');
      onSaved?.();
    } catch {
      toast.error('Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Em que série você está?</Label>
        <Select
          value={selectedGrade ?? undefined}
          onValueChange={(value) => setSelectedGrade(value as Grade)}
        >
          <SelectTrigger data-testid="select-grade">
            <SelectValue placeholder="Escolha a série" />
          </SelectTrigger>
          <SelectContent>
            {GRADES.map((entry) => (
              <SelectItem key={entry.value} value={entry.value}>
                {entry.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Sua escola é…</Label>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ['publica', 'Pública'],
              ['particular', 'Particular'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSelectedSchool(value)}
              className={cn(
                'rounded-md border px-3 py-2 text-sm hover-elevate',
                selectedSchool === value
                  ? 'border-primary bg-primary/10 font-medium text-primary'
                  : 'border-border'
              )}
              data-testid={`school-${value}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
        {submitLabel}
      </Button>
    </div>
  );
}
