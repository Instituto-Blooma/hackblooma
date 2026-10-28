import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { monthName, type DateInfo } from '@/lib/olimpiadas';

/** Edits a date that can be confirmed or "a confirmar" (with the probable month). */
export function DateInfoEditor({
  id,
  value,
  onChange,
}: {
  readonly id: string;
  readonly value: DateInfo;
  readonly onChange: (next: DateInfo) => void;
}) {
  const confirmed = value.status === 'confirmed';
  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="flex items-center gap-2">
        <Switch
          id={`${id}-confirmed`}
          checked={confirmed}
          onCheckedChange={(checked) =>
            onChange(
              checked
                ? { status: 'confirmed', start: value.start, end: value.end, note: value.note }
                : {
                    status: 'tbc',
                    estimateMonth: value.start
                      ? Number(value.start.slice(5, 7))
                      : value.estimateMonth,
                    note: value.note,
                  }
            )
          }
        />
        <Label htmlFor={`${id}-confirmed`}>{confirmed ? 'Data confirmada' : 'A confirmar'}</Label>
      </div>
      {confirmed ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor={`${id}-start`} className="text-xs">
              Dia (ou início)
            </Label>
            <Input
              id={`${id}-start`}
              type="date"
              value={value.start ?? ''}
              onChange={(event) => onChange({ ...value, start: event.target.value || undefined })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${id}-end`} className="text-xs">
              Até (opcional)
            </Label>
            <Input
              id={`${id}-end`}
              type="date"
              value={value.end ?? ''}
              onChange={(event) => onChange({ ...value, end: event.target.value || undefined })}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <Label className="text-xs">Mês provável</Label>
          <Select
            value={value.estimateMonth ? String(value.estimateMonth) : 'none'}
            onValueChange={(month) =>
              onChange({ ...value, estimateMonth: month === 'none' ? undefined : Number(month) })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Não sabemos ainda</SelectItem>
              {Array.from({ length: 12 }, (_, index) => (
                <SelectItem key={index + 1} value={String(index + 1)}>
                  <span className="capitalize">{monthName(index + 1)}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-1">
        <Label htmlFor={`${id}-note`} className="text-xs">
          Observação (opcional)
        </Label>
        <Input
          id={`${id}-note`}
          value={value.note ?? ''}
          placeholder="ex.: online, prorrogado"
          onChange={(event) => onChange({ ...value, note: event.target.value || undefined })}
        />
      </div>
    </div>
  );
}
