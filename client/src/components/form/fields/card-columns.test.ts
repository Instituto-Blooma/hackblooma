import { describe, expect, it } from 'vitest';
import { buildCardGridCss, clampCardColumns } from './card-columns';

describe('clampCardColumns', () => {
  it('defaults to optionCount when maxColumns is omitted', () => {
    expect(clampCardColumns(undefined, 4)).toBe(4);
  });

  it('never exceeds optionCount', () => {
    expect(clampCardColumns(6, 3)).toBe(3);
  });

  it('never goes below 1', () => {
    expect(clampCardColumns(0, 3)).toBe(1);
    expect(clampCardColumns(2, 0)).toBe(1);
  });
});

describe('buildCardGridCss', () => {
  it('emits a fixed grid for numeric maxColumns', () => {
    expect(buildCardGridCss('card-grid-x', 2, 4)).toBe(
      '.card-grid-x{grid-template-columns:repeat(2,minmax(0,1fr));}'
    );
  });

  it('emits xs base + Tailwind breakpoint media rules', () => {
    const css = buildCardGridCss(
      'card-grid-x',
      {
        xs: 1,
        sm: 2,
        lg: 3,
      },
      5
    );
    expect(css).toBe(
      [
        '.card-grid-x{grid-template-columns:repeat(1,minmax(0,1fr));}',
        '@media (min-width: 640px){.card-grid-x{grid-template-columns:repeat(2,minmax(0,1fr));}}',
        '@media (min-width: 1024px){.card-grid-x{grid-template-columns:repeat(3,minmax(0,1fr));}}',
      ].join('')
    );
  });

  it('clamps breakpoint columns to optionCount', () => {
    const css = buildCardGridCss(
      'card-grid-x',
      {
        xs: 1,
        md: 4,
      },
      2
    );
    expect(css).toContain(
      '@media (min-width: 768px){.card-grid-x{grid-template-columns:repeat(2,minmax(0,1fr));}}'
    );
  });
});
