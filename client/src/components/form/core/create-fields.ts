import { useMemo, type ComponentProps } from 'react';
import { CheckboxCardFieldView } from '../fields/checkbox-card-field';
import { CheckboxFieldView } from '../fields/checkbox-field';
import { ColorFieldView } from '../fields/color-field';
import { createArrayItemField, createTypedField } from './create-field';
import { createNumberArrayItemField, createNumberTypedField } from './create-number-field';
import { DateFieldView } from '../fields/date-field';
import { FileFieldView } from '../fields/file-field';
import { HiddenFieldView } from '../fields/hidden-field';
import { MultiSelectFieldView } from '../fields/multi-select-field';
import { NumberFieldView } from '../fields/number-field';
import { RadioCardFieldView } from '../fields/radio-card-field';
import { RadioGroupFieldView } from '../fields/radio-group-field';
import { SelectFieldView } from '../fields/select-field';
import { SwitchFieldView } from '../fields/switch-field';
import { RichTextFieldView } from '../fields/rich-text-field';
import { MaskedTextFieldView } from '../fields/masked-text-field';
import { TextFieldView } from '../fields/text-field';
import { TextareaFieldView } from '../fields/textarea-field';

export function createFormFields<TValues extends Record<string, unknown>>() {
  return {
    Text: createTypedField<TValues, ComponentProps<typeof TextFieldView>>(TextFieldView),
    MaskedText: createTypedField<TValues, ComponentProps<typeof MaskedTextFieldView>>(
      MaskedTextFieldView
    ),
    Textarea: createTypedField<TValues, ComponentProps<typeof TextareaFieldView>>(
      TextareaFieldView
    ),
    RichText: createTypedField<TValues, ComponentProps<typeof RichTextFieldView>>(
      RichTextFieldView
    ),
    Number: createNumberTypedField<TValues, ComponentProps<typeof NumberFieldView>>(
      NumberFieldView
    ),
    Select: createTypedField<TValues, ComponentProps<typeof SelectFieldView>>(SelectFieldView),
    MultiSelect: createTypedField<TValues, ComponentProps<typeof MultiSelectFieldView>>(
      MultiSelectFieldView
    ),
    Checkbox: createTypedField<TValues, ComponentProps<typeof CheckboxFieldView>>(
      CheckboxFieldView
    ),
    Switch: createTypedField<TValues, ComponentProps<typeof SwitchFieldView>>(SwitchFieldView),
    RadioGroup: createTypedField<TValues, ComponentProps<typeof RadioGroupFieldView>>(
      RadioGroupFieldView
    ),
    RadioCard: createTypedField<TValues, ComponentProps<typeof RadioCardFieldView>>(
      RadioCardFieldView
    ),
    CheckboxCard: createTypedField<TValues, ComponentProps<typeof CheckboxCardFieldView>>(
      CheckboxCardFieldView
    ),
    Hidden: createTypedField<TValues, ComponentProps<typeof HiddenFieldView>>(HiddenFieldView),
    Date: createTypedField<TValues, ComponentProps<typeof DateFieldView>>(DateFieldView),
    Color: createTypedField<TValues, ComponentProps<typeof ColorFieldView>>(ColorFieldView),
    File: createTypedField<TValues, ComponentProps<typeof FileFieldView>>(FileFieldView),
  };
}

export function createArrayItemFields<TItem extends Record<string, unknown>>() {
  return {
    Text: createArrayItemField<TItem, ComponentProps<typeof TextFieldView>>(TextFieldView),
    MaskedText: createArrayItemField<TItem, ComponentProps<typeof MaskedTextFieldView>>(
      MaskedTextFieldView
    ),
    Textarea: createArrayItemField<TItem, ComponentProps<typeof TextareaFieldView>>(
      TextareaFieldView
    ),
    Number: createNumberArrayItemField<TItem, ComponentProps<typeof NumberFieldView>>(
      NumberFieldView
    ),
    Select: createArrayItemField<TItem, ComponentProps<typeof SelectFieldView>>(SelectFieldView),
    Checkbox: createArrayItemField<TItem, ComponentProps<typeof CheckboxFieldView>>(
      CheckboxFieldView
    ),
    Switch: createArrayItemField<TItem, ComponentProps<typeof SwitchFieldView>>(SwitchFieldView),
    RadioGroup: createArrayItemField<TItem, ComponentProps<typeof RadioGroupFieldView>>(
      RadioGroupFieldView
    ),
    RadioCard: createArrayItemField<TItem, ComponentProps<typeof RadioCardFieldView>>(
      RadioCardFieldView
    ),
    CheckboxCard: createArrayItemField<TItem, ComponentProps<typeof CheckboxCardFieldView>>(
      CheckboxCardFieldView
    ),
    Hidden: createArrayItemField<TItem, ComponentProps<typeof HiddenFieldView>>(HiddenFieldView),
    Date: createArrayItemField<TItem, ComponentProps<typeof DateFieldView>>(DateFieldView),
    Color: createArrayItemField<TItem, ComponentProps<typeof ColorFieldView>>(ColorFieldView),
  };
}

export type FormFields<TValues extends Record<string, unknown>> = ReturnType<
  typeof createFormFields<TValues>
>;

export type ArrayItemFields<TItem extends Record<string, unknown>> = ReturnType<
  typeof createArrayItemFields<TItem>
>;

const fieldsCache = new WeakMap<object, FormFields<Record<string, unknown>>>();

export function getOrCreateFormFields<TValues extends Record<string, unknown>>(
  form: object
): FormFields<TValues> {
  const cached = fieldsCache.get(form);
  if (cached) {
    return cached as FormFields<TValues>;
  }
  const fields = createFormFields<TValues>() as FormFields<Record<string, unknown>>;
  fieldsCache.set(form, fields);
  return fields as FormFields<TValues>;
}

export function useMemoizedFormFields<
  TValues extends Record<string, unknown>,
>(): FormFields<TValues> {
  return useMemo(() => createFormFields<TValues>(), []);
}
