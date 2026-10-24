import { useId, useMemo } from 'react';
import { buildCardGridCss, type MaxColumnsProp } from './card-columns';

/** Stable CSS class + stylesheet text for a responsive card grid. */
export function useCardGridCss(
  maxColumns: MaxColumnsProp | undefined,
  optionCount: number
): { scopeClass: string; css: string } {
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const scopeClass = `card-grid-${reactId}`;
  const css = useMemo(
    () => buildCardGridCss(scopeClass, maxColumns, optionCount),
    [scopeClass, maxColumns, optionCount]
  );
  return { scopeClass, css };
}
