import { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

type MultiSelectFieldViewProps<TValue extends string = string> = FieldViewProps & {
  options: SelectOption<TValue>[];
  searchOptions?: (term: string) => Promise<SelectOption<TValue>[]>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  maxSelections?: number;
  changeListener?: (value: TValue[]) => void;
};

export function MultiSelectFieldView<TValue extends string = string>({
  label,
  description,
  disabled,
  className,
  options,
  searchOptions,
  placeholder = 'Select options...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.',
  maxSelections,
  changeListener,
  'data-testid': dataTestId,
}: MultiSelectFieldViewProps<TValue>) {
  const field = useFieldContext<TValue[]>();
  const [open, setOpen] = useState(false);
  const error = fieldErrorMessage(field.state.meta.errors, field.state.meta.errorMap);
  const selectedValues = field.state.value ?? [];
  const { searchTerm, setSearchTerm, visibleOptions, isSearching, resetSearch } = useComboboxSearch(
    { options, searchOptions }
  );

  const optionByValue = new Map(options.map((option) => [option.value, option]));

  const toggleValue = (value: TValue) => {
    const isSelected = selectedValues.includes(value);
    let nextValues: TValue[];

    if (isSelected) {
      nextValues = selectedValues.filter((current) => current !== value);
    } else if (maxSelections !== undefined && selectedValues.length >= maxSelections) {
      return;
    } else {
      nextValues = [...selectedValues, value];
    }

    field.handleChange(nextValues);
    changeListener?.(nextValues);
    revalidateFieldAfterEdit(field);
  };

  const removeValue = (value: TValue) => {
    const nextValues = selectedValues.filter((current) => current !== value);
    field.handleChange(nextValues);
    changeListener?.(nextValues);
    revalidateFieldAfterEdit(field);
  };

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
              'h-auto min-h-10 w-full justify-between font-normal',
              selectedValues.length === 0 && 'text-muted-foreground'
            )}
            onBlur={field.handleBlur}
          >
            <span className="flex flex-1 flex-wrap gap-1">
              {selectedValues.length === 0
                ? placeholder
                : selectedValues.map((value) => {
                    const option = optionByValue.get(value);
                    return (
                      <Badge
                        key={value}
                        variant="secondary"
                        className="gap-1"
                        data-testid={dataTestId ? `${dataTestId}-chip-${value}` : undefined}
                      >
                        {option?.label ?? value}
                        <button
                          type="button"
                          className="rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          aria-label={`Remove ${option?.label ?? value}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            removeValue(value);
                          }}
                        >
                          <X />
                        </button>
                      </Badge>
                    );
                  })}
            </span>
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
                {visibleOptions.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => toggleValue(option.value)}
                    >
                      <Check className={cn(isSelected ? 'opacity-100' : 'opacity-0')} />
                      {option.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </FieldWrapper>
  );
}
