/**
 * Column layout for RadioCard / CheckboxCard grids.
 *
 * - `number` — fixed max columns at all breakpoints
 * - breakpoint map — Tailwind-style keys (`xs` / `sm` / `md` / `lg` / `xl`)
 *
 * Breakpoints use Tailwind's default min-widths (`sm` 640px, `md` 768px,
 * `lg` 1024px, `xl` 1280px). `xs` is the base layout (no media query).
 *
 * @example
 * maxColumns={2}
 * maxColumns={{ xs: 1, sm: 2, lg: 3 }}
 */
export type CardColumnBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type MaxColumnsProp = number | Partial<Record<CardColumnBreakpoint, number>>;

/** Tailwind default screen mins (px). `xs` is base — no media query. */
export const CARD_COLUMN_BREAKPOINTS: Record<Exclude<CardColumnBreakpoint, 'xs'>, string> = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
};

const BREAKPOINT_ORDER: Array<Exclude<CardColumnBreakpoint, 'xs'>> = ['sm', 'md', 'lg', 'xl'];

export function clampCardColumns(maxColumns: number | undefined, optionCount: number): number {
  if (optionCount <= 0) {
    return 1;
  }
  const effectiveMax = maxColumns ?? optionCount;
  return Math.max(1, Math.min(effectiveMax, optionCount));
}

/** Build scoped CSS for a card grid, including `@media` rules when `maxColumns` is a map. */
export function buildCardGridCss(
  scopeClass: string,
  maxColumns: MaxColumnsProp | undefined,
  optionCount: number
): string {
  const selector = `.${scopeClass}`;

  if (maxColumns === undefined || typeof maxColumns === 'number') {
    const cols = clampCardColumns(maxColumns, optionCount);
    return `${selector}{grid-template-columns:repeat(${cols},minmax(0,1fr));}`;
  }

  const base = clampCardColumns(maxColumns.xs ?? 1, optionCount);
  let css = `${selector}{grid-template-columns:repeat(${base},minmax(0,1fr));}`;

  for (const breakpoint of BREAKPOINT_ORDER) {
    const cols = maxColumns[breakpoint];
    if (typeof cols !== 'number') {
      continue;
    }
    const clamped = clampCardColumns(cols, optionCount);
    const query = CARD_COLUMN_BREAKPOINTS[breakpoint];
    css += `@media ${query}{${selector}{grid-template-columns:repeat(${clamped},minmax(0,1fr));}}`;
  }

  return css;
}
