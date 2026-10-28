import { todayInBrasilia } from '../../../convex/lib/olimpiadas';

export {
  AWARD_LABELS,
  GRADES,
  OUTCOME_LABELS,
  formatDateInfo,
  daysBetween,
  monthName,
  type Award,
  type DateInfo,
  type Grade,
  type Outcome,
  type SchoolType,
} from '../../../convex/lib/olimpiadas';

/** Today in Brasília (`YYYY-MM-DD`), computed on the client so queries stay deterministic. */
export function today() {
  return todayInBrasilia(Date.now());
}

export function currentYear() {
  return Number(today().slice(0, 4));
}

export const AREA_COLORS = [
  'bg-primary/10 text-primary',
  'bg-secondary text-secondary-foreground',
  'bg-accent text-accent-foreground',
  'bg-chart-3/15 text-foreground',
  'bg-chart-5/15 text-foreground',
] as const;

/** Stable color for an olympiad area, so "Química" always looks the same. */
export function areaColor(area: string) {
  let hash = 0;
  for (const char of area) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return AREA_COLORS[hash % AREA_COLORS.length];
}
