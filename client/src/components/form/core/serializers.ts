import type { AnyFormApi, DeepKeys } from '@tanstack/react-form';
import { getIn, setIn } from './form-utils';
import type { AppFormApi } from './form-hook';

export type SerializeFn = (value: unknown) => unknown;
export type DeserializeFn = (value: unknown) => unknown;

export type FieldSerializer = {
  serialize?: SerializeFn;
  deserialize?: DeserializeFn;
};

type SerializerRegistry = Map<string, FieldSerializer>;

const registries = new WeakMap<AnyFormApi, SerializerRegistry>();

function getRegistry(form: AnyFormApi): SerializerRegistry {
  let registry = registries.get(form);
  if (!registry) {
    registry = new Map();
    registries.set(form, registry);
  }
  return registry;
}

export function registerFieldSerializer(
  form: AnyFormApi,
  name: string,
  serializer: FieldSerializer
): () => void {
  const registry = getRegistry(form);
  registry.set(name, serializer);
  return () => {
    if (registry.get(name) === serializer) {
      registry.delete(name);
    }
  };
}

function sortByPathDepth(paths: string[]): string[] {
  return [...paths].toSorted((left, right) => left.split('.').length - right.split('.').length);
}

export function deserializeValues<TValues extends Record<string, unknown>>(
  form: AppFormApi<TValues> | AnyFormApi,
  values: TValues
): TValues {
  const registry = getRegistry(form);
  let result = { ...values } as Record<string, unknown>;

  for (const name of sortByPathDepth([...registry.keys()])) {
    const { deserialize } = registry.get(name) ?? {};
    if (!deserialize) {
      continue;
    }
    const current = getIn(result, name);
    result = setIn(result, name, deserialize(current));
  }

  return result as TValues;
}

export function serializeValues<TValues extends Record<string, unknown>>(
  form: AppFormApi<TValues> | AnyFormApi,
  values: TValues
): TValues {
  const registry = getRegistry(form);
  let result = { ...values } as Record<string, unknown>;

  for (const name of sortByPathDepth([...registry.keys()])) {
    const { serialize } = registry.get(name) ?? {};
    if (!serialize) {
      continue;
    }
    const current = getIn(result, name);
    result = setIn(result, name, serialize(current));
  }

  return result as TValues;
}

export function clearSerializerRegistry(form: AnyFormApi): void {
  registries.delete(form);
}

export type { DeepKeys };
