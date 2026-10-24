import { FormWhen } from '../layout/form-when';
import { FormValue } from '../layout/form-value';
import { FormStepField } from '../layout/form-stepper';

export function createFormLayout<TValues extends Record<string, unknown>>() {
  return {
    When: FormWhen<TValues>,
    StepField: FormStepField<TValues>,
    Value: FormValue<TValues>,
  };
}

export type FormLayout<TValues extends Record<string, unknown>> = ReturnType<
  typeof createFormLayout<TValues>
>;
