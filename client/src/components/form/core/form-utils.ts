export function getIn(object: Record<string, unknown> | unknown, path: string): unknown {
  const segments = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let current: unknown = object;
  for (const segment of segments) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

export function setIn<T extends Record<string, unknown>>(
  object: T,
  path: string,
  value: unknown
): T {
  const segments = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  if (segments.length === 0) {
    return object;
  }

  const result = { ...object } as Record<string, unknown>;
  let current: Record<string, unknown> = result;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index]!;
    const next = current[segment];
    const cloned =
      next !== null && next !== undefined && typeof next === 'object' && !Array.isArray(next)
        ? { ...(next as Record<string, unknown>) }
        : Array.isArray(next)
          ? [...next]
          : /^\d+$/.test(segments[index + 1] ?? '')
            ? []
            : {};
    current[segment] = cloned;
    current = cloned as Record<string, unknown>;
  }

  current[segments[segments.length - 1]!] = value;
  return result as T;
}

export function joinFieldName(prefix: string | undefined, name: string): string {
  if (!prefix) {
    return name;
  }
  return `${prefix}${name}`;
}

type FieldWithBlurRevalidation = {
  state: {
    value: unknown;
    meta: {
      isTouched?: boolean;
    };
  };
  validate: (cause: 'blur') => unknown;
};

/** Clears stale onBlur errors after in-popover edits that do not blur the trigger. */
export function revalidateFieldAfterEdit(field: FieldWithBlurRevalidation): void {
  const valueAtSchedule = field.state.value;
  queueMicrotask(() => {
    if (field.state.value !== valueAtSchedule) {
      return;
    }
    if (!field.state.meta.isTouched) {
      return;
    }
    void field.validate('blur');
  });
}

const SENSITIVE_FIELD_PATTERN = /password|senha|token|secret|key/i;

export function isSensitiveFieldName(name: string): boolean {
  return SENSITIVE_FIELD_PATTERN.test(name);
}
