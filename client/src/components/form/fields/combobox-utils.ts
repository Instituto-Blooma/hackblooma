import { useEffect, useMemo, useState } from 'react';

export type SelectOption<TValue extends string = string> = {
  value: TValue;
  label: string;
};

export function filterSelectOptions<TValue extends string>(
  options: SelectOption<TValue>[],
  term: string
): SelectOption<TValue>[] {
  const normalized = term.trim().toLowerCase();
  if (!normalized) {
    return options;
  }
  return options.filter((option) => option.label.toLowerCase().includes(normalized));
}

type UseComboboxSearchOptions<TValue extends string> = {
  options: SelectOption<TValue>[];
  searchOptions?: (term: string) => Promise<SelectOption<TValue>[]>;
  debounceMs?: number;
};

export function useComboboxSearch<TValue extends string>({
  options,
  searchOptions,
  debounceMs = 300,
}: UseComboboxSearchOptions<TValue>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [asyncOptions, setAsyncOptions] = useState<SelectOption<TValue>[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const filteredStaticOptions = useMemo(
    () => filterSelectOptions(options, searchTerm),
    [options, searchTerm]
  );

  useEffect(() => {
    if (!searchOptions) {
      setAsyncOptions(null);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    const timeout = setTimeout(() => {
      void searchOptions(searchTerm)
        .then((results) => {
          if (!cancelled) {
            setAsyncOptions(results);
            setIsSearching(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setIsSearching(false);
          }
        });
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [debounceMs, searchOptions, searchTerm]);

  const visibleOptions = searchOptions ? (asyncOptions ?? options) : filteredStaticOptions;

  return {
    searchTerm,
    setSearchTerm,
    visibleOptions,
    isSearching,
    resetSearch: () => setSearchTerm(''),
  };
}
