import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useFieldContext } from '../core/form-hook';
import type { FieldViewProps } from '../core/form-types';
import { revalidateFieldAfterEdit } from '../core/form-utils';
import { FieldWrapper } from './field-wrapper';
import { fieldErrorMessage } from '../core/errors';
import { useComboboxSearch, type SelectOption } from './combobox-utils';

export type { SelectOption };

type SelectFieldViewProps<TValue extends string = string> = FieldViewProps & {
  options: SelectOption<TValue>[];
  searchOptions?: (term: string) => Promise<SelectOption<TValue>[]>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  changeListener?: (value: TValue) => void;
};

export function SelectFieldView<TValue extends string = string>({
  label,
  description,
  disabled,
  className,
  options,
  searchOptions,
  placeholder,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.',
  changeListener,
  'data-testid': dataTestId,
}: SelectFieldViewProps<TValue>) {
  const field = useFieldContext<TValue>();
  const [open, setOpen] = useState(false);
  const error = fieldErrorMessage(field.state.meta.errors, field.state.meta.errorMap);
  const { searchTerm, setSearchTerm, visibleOptions, isSearching, resetSearch } = useComboboxSearch(
    { options, searchOptions }
  );

  const selectedLabel =
    options.find((option) => option.value === field.state.value)?.label ??
    visibleOptions.find((option) => option.value === field.state.value)?.label;

  return (
    <FieldWrapper
      label={label}
      description={description}
      error={error}
      className={className}
      data-testid={dataTestId}
    >
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            resetSearch();
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            data-testid={dataTestId}
            className={cn(
              'w-full justify-between font-normal',
              !selectedLabel && 'text-muted-foreground'
            )}
            onBlur={field.handleBlur}
          >
            {selectedLabel ?? placeholder ?? 'Select option...'}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchTerm}
              onValueChange={setSearchTerm}
              data-testid={dataTestId ? `${dataTestId}-search` : undefined}
            />
            <CommandList>
              <CommandEmpty>{isSearching ? 'Loading...' : emptyMessage}</CommandEmpty>
              <CommandGroup>
                {visibleOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      field.handleChange(option.value);
                      changeListener?.(option.value);
                      setOpen(false);
                      resetSearch();
                      revalidateFieldAfterEdit(field);
                    }}
                  >
                    <Check
                      className={cn(
                        field.state.value === option.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </FieldWrapper>
  );
}
