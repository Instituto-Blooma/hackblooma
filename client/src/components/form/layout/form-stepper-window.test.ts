import { describe, expect, it } from 'vitest';
import { getVisibleStepWindow } from '../layout/form-stepper';

describe('getVisibleStepWindow', () => {
  it('returns the full range when total fits in maxShown', () => {
    expect(getVisibleStepWindow(3, 1, 5)).toEqual({ start: 0, end: 3 });
    expect(getVisibleStepWindow(3, 0, 3)).toEqual({ start: 0, end: 3 });
  });

  it('centers on current when possible', () => {
    expect(getVisibleStepWindow(10, 5, 3)).toEqual({ start: 4, end: 7 });
  });

  it('clamps at the start', () => {
    expect(getVisibleStepWindow(10, 0, 3)).toEqual({ start: 0, end: 3 });
    expect(getVisibleStepWindow(10, 1, 3)).toEqual({ start: 0, end: 3 });
  });

  it('clamps at the end', () => {
    expect(getVisibleStepWindow(10, 9, 3)).toEqual({ start: 7, end: 10 });
    expect(getVisibleStepWindow(10, 8, 3)).toEqual({ start: 7, end: 10 });
  });

  it('handles empty or non-positive inputs', () => {
    expect(getVisibleStepWindow(0, 0, 3)).toEqual({ start: 0, end: 0 });
    expect(getVisibleStepWindow(5, 2, 0)).toEqual({ start: 0, end: 0 });
  });
});
