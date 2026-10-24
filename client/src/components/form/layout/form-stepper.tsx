import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { DeepKeys } from '@tanstack/react-form';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFormApi } from '../core/form-api-context';
import type { AppFormApi } from '../core/form-hook';
import { SubmitButton } from '../actions/submit-button';

export type StepConfigItem = {
  index: number;
  label: string;
  icon?: ReactNode;
};

type StepMeta = {
  index: number;
  label: string;
};

type FormStepContextValue<TValues extends Record<string, unknown>> = {
  currentStep: number;
  totalSteps: number;
  stepConfig: StepConfigItem[];
  fieldSteps: Partial<Record<DeepKeys<TValues>, number>>;
  registerField: (fieldName: DeepKeys<TValues>, stepIndex: number) => void;
  unregisterField: (fieldName: DeepKeys<TValues>) => void;
  registerStep: (index: number, label: string, icon?: ReactNode) => void;
  unregisterStep: (index: number) => void;
  goToStep: (stepIndex: number) => void;
  getStepFieldNames: (stepIndex: number) => DeepKeys<TValues>[];
};

const FormStepContext = createContext<FormStepContextValue<Record<string, unknown>> | null>(null);

export function useFormStep<
  TValues extends Record<string, unknown> = Record<string, unknown>,
>(): FormStepContextValue<TValues> {
  const context = useContext(FormStepContext);
  if (!context) {
    throw new Error('useFormStep must be used within FormStepper.');
  }
  return context as FormStepContextValue<TValues>;
}

/** Sliding window that keeps `current` visible, centered when possible. */
export function getVisibleStepWindow(
  total: number,
  current: number,
  maxShown: number
): { start: number; end: number } {
  if (total <= 0 || maxShown <= 0) {
    return { start: 0, end: 0 };
  }
  if (total <= maxShown) {
    return { start: 0, end: total };
  }
  const half = Math.floor(maxShown / 2);
  let start = current - half;
  start = Math.max(0, Math.min(start, total - maxShown));
  return { start, end: start + maxShown };
}

async function validateStepFields(
  form: AppFormApi<Record<string, unknown>>,
  fieldNames: string[]
): Promise<boolean> {
  await Promise.all(
    fieldNames.flatMap((fieldName) => [
      form.validateField(fieldName as never, 'change'),
      form.validateField(fieldName as never, 'blur'),
    ])
  );
  return !fieldNames.some((fieldName) => {
    const meta = form.getFieldMeta(fieldName as never);
    return Boolean(meta?.errors?.length);
  });
}

/** Validate steps in `[from, toExclusive)`. Returns the first failing step index, or null if all pass. */
export async function validateStepRange(
  form: AppFormApi<Record<string, unknown>>,
  getStepFieldNames: (stepIndex: number) => string[],
  from: number,
  toExclusive: number
): Promise<number | null> {
  for (let stepIndex = from; stepIndex < toExclusive; stepIndex += 1) {
    const isValid = await validateStepFields(form, getStepFieldNames(stepIndex));
    if (!isValid) {
      return stepIndex;
    }
  }
  return null;
}

type FormStepperProps = {
  initialStep?: number;
  children: ReactNode;
  className?: string;
};

export function FormStepper({ initialStep = 0, children, className }: FormStepperProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [fieldSteps, setFieldSteps] = useState<Partial<Record<string, number>>>({});
  const [stepMetaMap, setStepMetaMap] = useState<Record<number, StepMeta>>({});
  // Icons stay in a ref so inline JSX (`icon={<Icon />}`) never drives setState loops.
  const iconsRef = useRef<Record<number, ReactNode | undefined>>({});

  const registerField = useCallback((fieldName: string, stepIndex: number) => {
    setFieldSteps((previous) => ({ ...previous, [fieldName]: stepIndex }));
  }, []);

  const unregisterField = useCallback((fieldName: string) => {
    setFieldSteps((previous) => {
      const next = { ...previous };
      delete next[fieldName];
      return next;
    });
  }, []);

  const registerStep = useCallback((index: number, label: string, icon?: ReactNode) => {
    iconsRef.current[index] = icon;
    setStepMetaMap((previous) => {
      const existing = previous[index];
      if (existing?.label === label) {
        return previous;
      }
      return {
        ...previous,
        [index]: { index, label },
      };
    });
  }, []);

  const unregisterStep = useCallback((index: number) => {
    delete iconsRef.current[index];
    setStepMetaMap((previous) => {
      const next = { ...previous };
      delete next[index];
      return next;
    });
  }, []);

  const stepConfig = useMemo(
    () =>
      Object.values(stepMetaMap)
        .toSorted((left, right) => left.index - right.index)
        .map((step) => ({
          ...step,
          icon: iconsRef.current[step.index],
        })),
    [stepMetaMap]
  );

  const totalSteps = useMemo(() => {
    const configIndexes = stepConfig.map((step) => step.index);
    const fieldIndexes = Object.values(fieldSteps).filter(
      (index): index is number => index !== undefined
    );
    const allIndexes = [...configIndexes, ...fieldIndexes];
    if (allIndexes.length === 0) {
      return 0;
    }
    return Math.max(...allIndexes) + 1;
  }, [fieldSteps, stepConfig]);

  const getStepFieldNames = useCallback(
    (stepIndex: number): string[] =>
      Object.entries(fieldSteps)
        .filter(([, index]) => index === stepIndex)
        .map(([fieldName]) => fieldName),
    [fieldSteps]
  );

  const value = useMemo(
    () => ({
      currentStep,
      totalSteps,
      stepConfig,
      fieldSteps,
      registerField,
      unregisterField,
      registerStep,
      unregisterStep,
      goToStep: setCurrentStep,
      getStepFieldNames,
    }),
    [
      currentStep,
      fieldSteps,
      getStepFieldNames,
      registerField,
      registerStep,
      stepConfig,
      totalSteps,
      unregisterField,
      unregisterStep,
    ]
  );

  return (
    <FormStepContext.Provider value={value}>
      <div className={cn('flex flex-col gap-4', className)}>{children}</div>
    </FormStepContext.Provider>
  );
}

type FormStepProps = {
  index: number;
  label: string;
  icon?: ReactNode;
  title?: ReactNode;
  children: ReactNode;
};

export function FormStep({ index, label, icon, title, children }: FormStepProps) {
  const { currentStep, registerStep, unregisterStep } = useFormStep();
  const isActive = currentStep === index;

  // Registration may re-run when inline `icon={<Icon />}` identity changes; that only
  // refreshes a ref and bails on setState. Unregister stays on a separate effect so
  // icon churn cannot tear the step down and loop.
  useEffect(() => {
    registerStep(index, label, icon);
  }, [icon, index, label, registerStep]);

  useEffect(() => {
    return () => unregisterStep(index);
  }, [index, unregisterStep]);

  return (
    <div
      className={cn('flex flex-col gap-4', !isActive && 'hidden')}
      data-step-index={index}
      aria-hidden={!isActive}
    >
      {title ? <h3 className="text-lg font-medium">{title}</h3> : null}
      {children}
    </div>
  );
}

type FormStepFieldProps<TValues extends Record<string, unknown>> = {
  name: DeepKeys<TValues>;
  stepIndex: number;
  children: ReactNode;
};

export function FormStepField<TValues extends Record<string, unknown>>({
  name,
  stepIndex,
  children,
}: FormStepFieldProps<TValues>) {
  const { registerField, unregisterField } = useFormStep<TValues>();

  useEffect(() => {
    registerField(name, stepIndex);
    return () => unregisterField(name);
  }, [name, registerField, stepIndex, unregisterField]);

  return <>{children}</>;
}

type FormStepHeaderProps = {
  maxShownSteps?: number;
  className?: string;
  'data-testid'?: string;
};

export function FormStepHeader({
  maxShownSteps,
  className,
  'data-testid': dataTestId = 'form-step-header',
}: FormStepHeaderProps) {
  const form = useFormApi();
  const { currentStep, totalSteps, stepConfig, goToStep, getStepFieldNames } = useFormStep();

  const currentConfigIndex = Math.max(
    0,
    stepConfig.findIndex((step) => step.index === currentStep)
  );
  const isWindowed = maxShownSteps !== undefined && stepConfig.length > maxShownSteps;
  const window = isWindowed
    ? getVisibleStepWindow(stepConfig.length, currentConfigIndex, maxShownSteps)
    : { start: 0, end: stepConfig.length };
  const visibleSteps = stepConfig.slice(window.start, window.end);

  const handleStepClick = (target: number) => {
    if (target === currentStep) {
      return;
    }
    if (target < currentStep) {
      goToStep(target);
      return;
    }
    void validateStepRange(form, getStepFieldNames, currentStep, target).then((failedStep) => {
      if (failedStep === null) {
        goToStep(target);
        return;
      }
      if (failedStep !== currentStep) {
        goToStep(failedStep);
      }
    });
  };

  if (stepConfig.length === 0) {
    return null;
  }

  return (
    <nav
      className={cn('flex flex-col gap-2', className)}
      data-testid={dataTestId}
      aria-label="Form steps"
    >
      {isWindowed ? (
        <p
          className="text-center text-sm text-muted-foreground"
          data-testid="form-step-header-progress"
          aria-live="polite"
        >
          {currentStep + 1}/{totalSteps}
        </p>
      ) : null}
      <ol className="flex w-full items-start justify-between gap-1">
        {visibleSteps.map((step, visibleIndex) => {
          const isActive = step.index === currentStep;
          const isCompleted = step.index < currentStep;
          const showConnector = visibleIndex < visibleSteps.length - 1;

          return (
            <li
              key={step.index}
              className={cn('flex min-w-0 flex-1 items-start', showConnector && 'relative')}
            >
              <button
                type="button"
                data-testid={`form-step-header-step-${step.index}`}
                data-state={isActive ? 'active' : isCompleted ? 'completed' : 'upcoming'}
                aria-current={isActive ? 'step' : undefined}
                className={cn(
                  'group flex w-full flex-col items-center gap-1.5 rounded-md px-1 py-1 text-center',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                )}
                onClick={() => handleStepClick(step.index)}
              >
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors',
                    isActive && 'border-primary bg-primary text-primary-foreground',
                    isCompleted && !isActive && 'border-primary bg-primary/10 text-primary',
                    !isActive &&
                      !isCompleted &&
                      'border-border bg-background text-muted-foreground group-hover:border-primary/50'
                  )}
                >
                  {step.icon ?? step.index + 1}
                </span>
                <span
                  className={cn(
                    'w-full truncate text-xs',
                    isActive ? 'font-medium text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
              </button>
              {showConnector ? (
                <span
                  aria-hidden
                  className={cn(
                    'pointer-events-none absolute left-[calc(50%+1rem)] right-[calc(-50%+1rem)] top-5 h-px -translate-y-1/2',
                    step.index < currentStep ? 'bg-primary' : 'bg-border'
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

type StepButtonProps = ButtonProps & { 'data-testid'?: string };

type FormStepActionsProps = {
  onFinished?: () => void;
  className?: string;
  submitButtonProps?: StepButtonProps & { children?: ReactNode };
  nextButtonProps?: StepButtonProps;
  backButtonProps?: StepButtonProps;
};

export function FormStepActions({
  onFinished,
  className,
  submitButtonProps,
  nextButtonProps,
  backButtonProps,
}: FormStepActionsProps) {
  const form = useFormApi();
  const { currentStep, goToStep, getStepFieldNames, totalSteps } = useFormStep();
  const lastStep = Math.max(0, totalSteps - 1);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {currentStep > 0 ? (
        <Button
          type="button"
          variant="outline"
          {...backButtonProps}
          onClick={() => goToStep(currentStep - 1)}
        >
          Back
        </Button>
      ) : null}
      {currentStep < lastStep ? (
        <Button
          type="button"
          {...nextButtonProps}
          onClick={() => {
            void validateStepRange(form, getStepFieldNames, currentStep, currentStep + 1).then(
              (failedStep) => {
                if (failedStep === null) {
                  goToStep(currentStep + 1);
                }
              }
            );
          }}
        >
          Next
        </Button>
      ) : (
        <SubmitButton {...submitButtonProps}>{onFinished ? 'Finish' : 'Submit'}</SubmitButton>
      )}
    </div>
  );
}

export async function jumpToFirstErrorStep<TValues extends Record<string, unknown>>(
  form: AppFormApi<TValues>,
  fieldSteps: Partial<Record<DeepKeys<TValues>, number>>,
  goToStep: (stepIndex: number) => void,
  fieldNames?: DeepKeys<TValues>[]
): Promise<void> {
  const names =
    fieldNames ??
    (Object.keys(fieldSteps) as DeepKeys<TValues>[]).filter((fieldName) => {
      const meta = form.getFieldMeta(fieldName);
      return Boolean(meta?.errors?.length || meta?.errorMap?.onSubmit);
    });

  const errorSteps = names
    .map((fieldName) => fieldSteps[fieldName])
    .filter((stepIndex): stepIndex is number => stepIndex !== undefined)
    .toSorted((left, right) => left - right);

  const firstErrorStep = errorSteps[0];
  if (firstErrorStep !== undefined) {
    goToStep(firstErrorStep);
  }
}

export function getFieldsByStep<TValues extends Record<string, unknown>>(
  fieldSteps: Partial<Record<DeepKeys<TValues>, number>>
): Record<number, DeepKeys<TValues>[]> {
  const result: Record<number, DeepKeys<TValues>[]> = {};

  for (const [fieldName, stepIndex] of Object.entries(fieldSteps)) {
    if (typeof stepIndex !== 'number') {
      continue;
    }
    const bucket = result[stepIndex] ?? [];
    bucket.push(fieldName as DeepKeys<TValues>);
    result[stepIndex] = bucket;
  }

  return result;
}
