import { useEffect, useRef } from 'react';
import type { AppFormApi } from '../core/form-hook';
import { isSensitiveFieldName, setIn } from '../core/form-utils';
import { deserializeValues } from '../core/serializers';
import { unsubscribeStore } from '../core/store-utils';

const STORAGE_PREFIX = 'form_data_';

type UseFormPersistenceOptions = {
  id: string;
  disabled?: boolean;
  debounceMs?: number;
};

function stripSensitiveValues<TValues extends Record<string, unknown>>(values: TValues): TValues {
  let result = { ...values } as Record<string, unknown>;
  const walk = (object: Record<string, unknown>, prefix = '') => {
    for (const [key, value] of Object.entries(object)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (isSensitiveFieldName(path)) {
        result = setIn(result, path, undefined);
        continue;
      }
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        walk(value as Record<string, unknown>, path);
      }
    }
  };
  walk(values);
  return result as TValues;
}

export function useFormPersistence<TValues extends Record<string, unknown>>(
  form: AppFormApi<TValues>,
  { id, disabled = false, debounceMs = 300 }: UseFormPersistenceOptions
): void {
  const restoredRef = useRef(false);
  const skipInitialSaveRef = useRef(true);

  useEffect(() => {
    if (disabled) {
      form.registerPersistenceId(undefined);
      return;
    }

    form.registerPersistenceId(id);
    return () => {
      form.registerPersistenceId(undefined);
    };
  }, [disabled, form, id]);

  useEffect(() => {
    if (disabled || restoredRef.current || typeof window === 'undefined') {
      return;
    }

    const storageKey = `${STORAGE_PREFIX}${id}`;
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) {
      restoredRef.current = true;
      return;
    }

    try {
      const parsed = JSON.parse(saved) as TValues;
      restoredRef.current = true;
      const frame = window.requestAnimationFrame(() => {
        form.reset(deserializeValues(form, parsed));
      });
      return () => {
        window.cancelAnimationFrame(frame);
      };
    } catch {
      window.localStorage.removeItem(storageKey);
      restoredRef.current = true;
    }
  }, [disabled, form, id]);

  useEffect(() => {
    if (disabled || typeof window === 'undefined') {
      return;
    }

    const storageKey = `${STORAGE_PREFIX}${id}`;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const subscription = form.store.subscribe(() => {
      if (skipInitialSaveRef.current) {
        skipInitialSaveRef.current = false;
        return;
      }

      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        if (form.skipNextPersistenceSaveRef.current) {
          form.skipNextPersistenceSaveRef.current = false;
          return;
        }
        const values = form.store.state.values as TValues;
        window.localStorage.setItem(storageKey, JSON.stringify(stripSensitiveValues(values)));
      }, debounceMs);
    });

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      unsubscribeStore(subscription);
    };
  }, [debounceMs, disabled, form, id]);
}

export function mergePersistedDefaults<TValues extends Record<string, unknown>>(
  id: string,
  defaults: TValues
): TValues {
  const persisted = getPersistedFormValues<TValues>(id);
  if (!persisted) {
    return defaults;
  }
  return { ...defaults, ...persisted };
}

export function clearFormPersistence(id: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(`${STORAGE_PREFIX}${id}`);
}

export function getPersistedFormValues<TValues extends Record<string, unknown>>(
  id: string
): TValues | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const saved = window.localStorage.getItem(`${STORAGE_PREFIX}${id}`);
  if (!saved) {
    return null;
  }
  try {
    return JSON.parse(saved) as TValues;
  } catch {
    return null;
  }
}
