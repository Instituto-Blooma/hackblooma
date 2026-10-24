import { describe, expect, it } from 'vitest';
import { deserializeValues, registerFieldSerializer, serializeValues } from './serializers';

describe('serializers', () => {
  it('round-trips serialize and deserialize via the registry', () => {
    const form = {} as never;
    const unregister = registerFieldSerializer(form, 'startDate', {
      serialize: (value) => (typeof value === 'string' && value ? `${value}T00:00:00.000Z` : null),
      deserialize: (value) =>
        typeof value === 'string' ? value.replace(/T00:00:00\.000Z$/, '') : value,
    });

    const raw = { startDate: '2026-06-01', name: 'Ada' };
    const serialized = serializeValues(form, raw);
    expect(serialized.startDate).toBe('2026-06-01T00:00:00.000Z');

    const restored = deserializeValues(form, serialized);
    expect(restored.startDate).toBe('2026-06-01');
    expect(restored.name).toBe('Ada');

    unregister();
  });
});
