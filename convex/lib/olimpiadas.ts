import { v, type Infer } from 'convex/values';

/** Isomorphic olympiad domain rules (dates, eligibility, phases, avisos). Vocabulary: CONTEXT.md. */

export const GRADES = [
  { value: 'ef6', label: '6º ano (EF)' },
  { value: 'ef7', label: '7º ano (EF)' },
  { value: 'ef8', label: '8º ano (EF)' },
  { value: 'ef9', label: '9º ano (EF)' },
  { value: 'em1', label: '1ª série (EM)' },
  { value: 'em2', label: '2ª série (EM)' },
  { value: 'em3', label: '3ª série (EM)' },
] as const;

export type Grade = (typeof GRADES)[number]['value'];
export type SchoolType = 'publica' | 'particular';

export const gradeValidator = v.union(
  v.literal('ef6'),
  v.literal('ef7'),
  v.literal('ef8'),
  v.literal('ef9'),
  v.literal('em1'),
  v.literal('em2'),
  v.literal('em3')
);
export const schoolTypeValidator = v.union(v.literal('publica'), v.literal('particular'));

/** A date or period that may still be "a confirmar". Dates are `YYYY-MM-DD` in Brasília time. */
export const dateInfoValidator = v.object({
  status: v.union(v.literal('confirmed'), v.literal('tbc')),
  start: v.optional(v.string()),
  end: v.optional(v.string()),
  /** 1–12; used while status is `tbc`. */
  estimateMonth: v.optional(v.number()),
  /** Free text shown next to the date, e.g. "online" or "conforme categoria". */
  note: v.optional(v.string()),
});
export type DateInfo = Infer<typeof dateInfoValidator>;

export const eligibilityValidator = v.object({
  schoolTypes: v.optional(v.array(schoolTypeValidator)),
  minGrade: v.optional(gradeValidator),
  maxGrade: v.optional(gradeValidator),
  girlsOnly: v.optional(v.boolean()),
  inviteOnly: v.optional(v.boolean()),
  note: v.optional(v.string()),
});
export type Eligibility = Infer<typeof eligibilityValidator>;

export const awardValidator = v.union(
  v.literal('ouro'),
  v.literal('prata'),
  v.literal('bronze'),
  v.literal('mencao')
);
export type Award = Infer<typeof awardValidator>;

export const AWARD_LABELS: Record<Award, string> = {
  ouro: 'Medalha de ouro',
  prata: 'Medalha de prata',
  bronze: 'Medalha de bronze',
  mencao: 'Menção honrosa',
};

export const outcomeValidator = v.union(
  v.literal('advanced'),
  v.literal('not_advanced'),
  v.literal('final')
);
export type Outcome = Infer<typeof outcomeValidator>;

export const OUTCOME_LABELS: Record<Outcome, string> = {
  advanced: 'Passei para a próxima fase',
  not_advanced: 'Não passei desta vez',
  final: 'Era a última fase',
};

const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const;

export function monthName(month: number) {
  return MONTHS[month - 1] ?? '';
}

const BRASILIA_OFFSET_MS = 3 * 60 * 60 * 1000;

/** Today's date (`YYYY-MM-DD`) in Brasília, which has had no daylight saving since 2019. */
export function todayInBrasilia(now: number) {
  return new Date(now - BRASILIA_OFFSET_MS).toISOString().slice(0, 10);
}

export function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string) {
  const from = Date.parse(`${fromIso}T12:00:00Z`);
  const to = Date.parse(`${toIso}T12:00:00Z`);
  return Math.round((to - from) / 86_400_000);
}

/** The day used to place a date on the calendar; `null` while there is no confirmed day. */
export function confirmedDay(info: DateInfo | undefined) {
  if (!info || info.status !== 'confirmed' || !info.start) {
    return null;
  }
  return info.start;
}

/** Sort key for both confirmed and "a confirmar" dates (estimates sort to mid-month). */
export function sortKey(info: DateInfo | undefined, season: number) {
  if (!info) {
    return `${season}-99`;
  }
  if (info.start) {
    return info.start;
  }
  if (info.estimateMonth) {
    return `${season}-${String(info.estimateMonth).padStart(2, '0')}-15`;
  }
  return `${season}-99`;
}

function formatDay(isoDate: string, withYear: boolean) {
  const [year, month, day] = isoDate.split('-');
  return withYear ? `${day}/${month}/${year}` : `${day}/${month}`;
}

/** Human label in pt-BR, e.g. "19 a 20/06/2026", "a confirmar (deve ser em maio)". */
export function formatDateInfo(info: DateInfo | undefined) {
  if (!info) {
    return 'a confirmar';
  }
  if (info.status === 'tbc' || !info.start) {
    return info.estimateMonth
      ? `a confirmar (deve ser em ${monthName(info.estimateMonth)})`
      : 'a confirmar';
  }
  if (info.end && info.end !== info.start) {
    return `${formatDay(info.start, false)} a ${formatDay(info.end, true)}`;
  }
  return formatDay(info.start, true);
}

export function gradeIndex(grade: Grade) {
  return GRADES.findIndex((entry) => entry.value === grade);
}

export function gradeLabel(grade: Grade) {
  return GRADES.find((entry) => entry.value === grade)?.label ?? grade;
}

export type SchoolProfile = { grade?: Grade; schoolType?: SchoolType };

/** "Quem pode participar" check. Invite-only olympiads are never "Para você" until invited. */
export function checkEligibility(eligibility: Eligibility | undefined, profile: SchoolProfile) {
  const reasons: string[] = [];
  if (!eligibility) {
    return { eligible: true, reasons };
  }
  if (eligibility.inviteOnly) {
    reasons.push('Só por convite');
  }
  if (eligibility.schoolTypes?.length && profile.schoolType) {
    if (!eligibility.schoolTypes.includes(profile.schoolType)) {
      reasons.push(
        eligibility.schoolTypes.includes('publica') ? 'Só escola pública' : 'Só escola particular'
      );
    }
  }
  if (profile.grade) {
    const current = gradeIndex(profile.grade);
    if (eligibility.minGrade && current < gradeIndex(eligibility.minGrade)) {
      reasons.push(`A partir do ${gradeLabel(eligibility.minGrade)}`);
    }
    if (eligibility.maxGrade && current > gradeIndex(eligibility.maxGrade)) {
      reasons.push(`Até o ${gradeLabel(eligibility.maxGrade)}`);
    }
  }
  return { eligible: reasons.length === 0, reasons };
}

/** Short tags describing "Quem pode participar". */
export function eligibilityTags(eligibility: Eligibility | undefined) {
  if (!eligibility) {
    return [];
  }
  const tags: string[] = [];
  if (eligibility.inviteOnly) tags.push('Por convite');
  if (eligibility.girlsOnly) tags.push('Só meninas');
  if (eligibility.schoolTypes?.length === 1) {
    tags.push(eligibility.schoolTypes[0] === 'publica' ? 'Escola pública' : 'Escola particular');
  }
  if (eligibility.minGrade && eligibility.maxGrade) {
    tags.push(`${gradeLabel(eligibility.minGrade)} até ${gradeLabel(eligibility.maxGrade)}`);
  } else if (eligibility.minGrade) {
    tags.push(`A partir do ${gradeLabel(eligibility.minGrade)}`);
  } else if (eligibility.maxGrade) {
    tags.push(`Até o ${gradeLabel(eligibility.maxGrade)}`);
  }
  return tags;
}

type PhaseLike = { _id: string; order: number };
type ResultLike = { phaseId: string; outcome: Outcome };

/** The first Fase is always visible; each later Fase appears once she passed the previous one. */
export function visiblePhases<P extends PhaseLike>(phases: P[], results: ResultLike[]) {
  const sorted = [...phases].toSorted((a, b) => a.order - b.order);
  const visible: P[] = [];
  for (const phase of sorted) {
    visible.push(phase);
    const result = results.find((entry) => entry.phaseId === phase._id);
    if (!result || result.outcome !== 'advanced') {
      break;
    }
  }
  return visible;
}

export const REMINDER_DAYS = [7, 1] as const;

export type AvisoKind = 'prazo' | 'fase' | 'divulgacao' | 'data_confirmada' | 'caminho';

type DueAvisoInput = {
  today: string;
  olympiad: {
    _id: string;
    acronym: string;
    name: string;
    registrationDeadline?: DateInfo;
  };
  participationStatus: 'planned' | 'registered';
  phases: Array<PhaseLike & { name: string; date: DateInfo; resultRelease?: DateInfo }>;
  results: ResultLike[];
};

export type DueAviso = {
  kind: AvisoKind;
  phaseId?: string;
  title: string;
  body: string;
  dedupeKey: string;
};

function inDaysLabel(days: number) {
  return days === 1 ? 'amanhã' : `em ${days} dias`;
}

/** Avisos that should go out today for one Participação (dedupe keys make this idempotent). */
export function dueAvisos(input: DueAvisoInput): DueAviso[] {
  const { today, olympiad } = input;
  const label = olympiad.acronym || olympiad.name;
  const due: DueAviso[] = [];

  const deadline = confirmedDay(input.olympiad.registrationDeadline);
  if (deadline && input.participationStatus === 'planned') {
    const days = daysBetween(today, deadline);
    if ((REMINDER_DAYS as readonly number[]).includes(days)) {
      due.push({
        kind: 'prazo',
        title: `${label}: a inscrição termina ${inDaysLabel(days)}`,
        body: `Já se inscreveu? Depois é só marcar "já me inscrevi" no app.`,
        dedupeKey: `prazo:${olympiad._id}:${days}`,
      });
    }
  }

  for (const phase of visiblePhases(input.phases, input.results)) {
    const start = confirmedDay(phase.date);
    if (start) {
      const days = daysBetween(today, start);
      if ((REMINDER_DAYS as readonly number[]).includes(days)) {
        due.push({
          kind: 'fase',
          phaseId: phase._id,
          title: `${label}: ${phase.name} ${inDaysLabel(days)}`,
          body: days === 1 ? 'Boa prova! Durma bem hoje.' : 'Bora revisar com calma esta semana.',
          dedupeKey: `fase:${phase._id}:${days}`,
        });
      }
    }
    const release = confirmedDay(phase.resultRelease);
    if (release && release === today) {
      due.push({
        kind: 'divulgacao',
        phaseId: phase._id,
        title: `${label}: saiu o resultado da ${phase.name}!`,
        body: 'Confira no site da olimpíada e anote o seu resultado no app.',
        dedupeKey: `divulgacao:${phase._id}`,
      });
    }
  }
  return due;
}
