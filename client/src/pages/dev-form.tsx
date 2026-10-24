import { useMutation } from 'convex/react';
import { Link } from '@tanstack/react-router';
import { Eye, Mail, MessageSquare, Paperclip, Pencil, Smartphone } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  applyServerErrors,
  clearFormPersistence,
  clearServerFieldError,
  colorFieldSerializer,
  dateFieldSerializer,
  FormArray,
  FormSection,
  FormStep,
  FormStepActions,
  FormStepHeader,
  FormStepper,
  getSubmitErrorMessage,
  jumpToFirstErrorStep,
  mergePersistedDefaults,
  useAppForm,
  useFormPersistence,
  useFormStep,
} from '@/components/form';
import { api } from '../../../convex/_generated/api';
import {
  devFormSchema,
  notificationFrequencySchema,
  stepItemSchema,
  stepsArrayCountSchema,
  type DevFormValues,
} from '../../../convex/devFormSchemas';

const FORM_ID = 'dev-form';

type DevFormDefaultValues = {
  name: string;
  email: string;
  phone: string;
  bio: string;
  content: string;
  age: number | undefined;
  role: 'admin' | 'member';
  tags: Array<'frontend' | 'backend' | 'design'>;
  accessLevel: 'read' | 'write';
  channels: Array<'email' | 'slack' | 'sms'>;
  notifyByEmail: boolean;
  notificationFrequency: 'instant' | 'daily' | 'weekly' | '';
  acceptTerms: boolean;
  startDate: string;
  brandColor: string;
  steps: Array<{ id: string; label: string }>;
  attachmentId: string | null;
  isAdult: boolean;
};

const pristineDevFormDefaults: DevFormDefaultValues = {
  name: '',
  email: '',
  phone: '',
  bio: '',
  content: '',
  age: undefined,
  role: 'member',
  tags: [],
  accessLevel: 'read',
  channels: [],
  notifyByEmail: false,
  notificationFrequency: '',
  acceptTerms: false,
  startDate: '',
  brandColor: '',
  steps: [{ id: '1', label: 'Step one' }],
  attachmentId: null,
  isAdult: false,
};

function DevFormFields() {
  const submitDevForm = useMutation(api.devForm.submitDevForm);
  const { fieldSteps, goToStep } = useFormStep<DevFormDefaultValues>();
  const initialValues = useMemo(() => mergePersistedDefaults(FORM_ID, pristineDevFormDefaults), []);
  const [lastSubmission, setLastSubmission] = useState<Awaited<
    ReturnType<typeof submitDevForm>
  > | null>(null);

  const form = useAppForm<DevFormDefaultValues, DevFormValues>({
    defaultValues: initialValues,
    resetValues: pristineDevFormDefaults,
    onSubmit: async ({ value }) => {
      try {
        const result = await submitDevForm({
          ...value,
          notificationFrequency: value.notifyByEmail ? value.notificationFrequency : null,
        });
        setLastSubmission(result);
        toast.success('Form submitted successfully');
        clearFormPersistence(FORM_ID);
        form.resetToDefaults();
        goToStep(0);
      } catch (error) {
        const serverFields = applyServerErrors(form, error);
        if (serverFields) {
          toast.error(getSubmitErrorMessage(error, 'Failed to submit form'));
          await jumpToFirstErrorStep(
            form,
            fieldSteps,
            goToStep,
            Object.keys(serverFields) as Array<keyof DevFormDefaultValues & string>
          );
        } else {
          toast.error(getSubmitErrorMessage(error, 'Failed to submit form'));
        }
      }
    },
  });

  useFormPersistence(form, { id: FORM_ID });

  const { fields, layout } = form;

  return (
    <form.FormShell>
      <FormStepHeader />
      <FormStep index={0} label="Profile">
        <FormSection title="Basic info">
          <layout.StepField name="name" stepIndex={0}>
            <fields.Text
              name="name"
              label="Name"
              validation={devFormSchema.shape.name}
              data-testid="dev-form-name"
            />
          </layout.StepField>
          <layout.StepField name="email" stepIndex={0}>
            <fields.Text
              name="email"
              label="Email"
              type="email"
              validation={devFormSchema.shape.email}
              data-testid="dev-form-email"
              changeListener={() => clearServerFieldError(form, 'email')}
            />
          </layout.StepField>
          <layout.StepField name="phone" stepIndex={0}>
            <fields.MaskedText
              name="phone"
              label="Phone"
              mask="(00) 00000-0000"
              validation={devFormSchema.shape.phone}
              data-testid="dev-form-phone"
            />
          </layout.StepField>
          <layout.StepField name="bio" stepIndex={0}>
            <fields.Textarea
              name="bio"
              label="Bio"
              placeholder="Tell us about yourself"
              validation={devFormSchema.shape.bio}
              data-testid="dev-form-bio"
            />
          </layout.StepField>
          <layout.StepField name="content" stepIndex={0}>
            <fields.RichText
              name="content"
              label="Content"
              placeholder="Write some markdown…"
              validation={devFormSchema.shape.content}
              data-testid="dev-form-content"
            />
          </layout.StepField>
          <layout.StepField name="age" stepIndex={0}>
            <fields.Number
              name="age"
              label="Age"
              min={1}
              max={120}
              validation={devFormSchema.shape.age}
              data-testid="dev-form-age"
            />
          </layout.StepField>
        </FormSection>
      </FormStep>

      <FormStep index={1} label="Access">
        <FormSection title="Permissions">
          <layout.StepField name="role" stepIndex={1}>
            <fields.Select
              name="role"
              label="Role"
              validation={devFormSchema.shape.role}
              options={[
                { value: 'admin', label: 'Admin' },
                { value: 'member', label: 'Member' },
              ]}
              searchPlaceholder="Filter roles..."
              data-testid="dev-form-role"
            />
          </layout.StepField>
          <layout.StepField name="tags" stepIndex={1}>
            <fields.MultiSelect
              name="tags"
              label="Tags"
              validation={devFormSchema.shape.tags}
              options={[
                { value: 'frontend', label: 'Frontend' },
                { value: 'backend', label: 'Backend' },
                { value: 'design', label: 'Design' },
              ]}
              searchPlaceholder="Filter tags..."
              data-testid="dev-form-tags"
            />
          </layout.StepField>
          <layout.StepField name="accessLevel" stepIndex={1}>
            <fields.RadioCard
              name="accessLevel"
              label="Access level"
              maxColumns={{ xs: 1, sm: 2 }}
              validation={devFormSchema.shape.accessLevel}
              options={[
                {
                  value: 'read',
                  title: 'Read only',
                  description: 'View resources without making changes',
                  icon: <Eye className="size-5" />,
                },
                {
                  value: 'write',
                  title: 'Read and write',
                  description: 'View and edit resources',
                  icon: <Pencil className="size-5" />,
                },
              ]}
              data-testid="dev-form-access-level"
            />
          </layout.StepField>
          <layout.StepField name="channels" stepIndex={1}>
            <fields.CheckboxCard
              name="channels"
              label="Alert channels"
              description="Pick up to 2 channels"
              maxColumns={{ xs: 1, sm: 2, lg: 3 }}
              maxSelections={2}
              validation={devFormSchema.shape.channels}
              options={[
                {
                  value: 'email',
                  title: 'Email',
                  description: 'Send alerts to your inbox',
                  icon: <Mail className="size-5" />,
                },
                {
                  value: 'slack',
                  title: 'Slack',
                  description: 'Post to a workspace channel',
                  icon: <MessageSquare className="size-5" />,
                },
                {
                  value: 'sms',
                  title: 'SMS',
                  description: 'Text message notifications',
                  icon: <Smartphone className="size-5" />,
                },
              ]}
              data-testid="dev-form-channels"
            />
          </layout.StepField>
          <layout.StepField name="notifyByEmail" stepIndex={1}>
            <fields.Switch
              name="notifyByEmail"
              label="Email notifications"
              validation={devFormSchema.shape.notifyByEmail}
              data-testid="dev-form-notify"
            />
          </layout.StepField>
          <layout.When when={(values) => values.notifyByEmail}>
            <layout.StepField name="notificationFrequency" stepIndex={1}>
              <fields.Select
                name="notificationFrequency"
                label="Notification frequency"
                validation={notificationFrequencySchema}
                options={[
                  { value: 'instant', label: 'Instant' },
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                ]}
                searchPlaceholder="Filter frequency..."
                data-testid="dev-form-notification-frequency"
              />
            </layout.StepField>
          </layout.When>
          <layout.StepField name="acceptTerms" stepIndex={1}>
            <fields.Checkbox
              name="acceptTerms"
              label="Accept terms"
              validation={devFormSchema.shape.acceptTerms}
              data-testid="dev-form-accept-terms"
            />
          </layout.StepField>
          <layout.StepField name="startDate" stepIndex={1}>
            <fields.Date
              name="startDate"
              label="Start date"
              validation={devFormSchema.shape.startDate}
              serialize={dateFieldSerializer.serialize}
              deserialize={dateFieldSerializer.deserialize}
              data-testid="dev-form-start-date"
            />
          </layout.StepField>
          <layout.StepField name="brandColor" stepIndex={1}>
            <fields.Color
              name="brandColor"
              label="Brand color"
              validation={devFormSchema.shape.brandColor}
              serialize={colorFieldSerializer.serialize}
              deserialize={colorFieldSerializer.deserialize}
              data-testid="dev-form-brand-color"
            />
          </layout.StepField>
        </FormSection>
      </FormStep>

      <FormStep
        index={2}
        label="Extras"
        title="Steps and attachment"
        icon={<Paperclip className="size-4" />}
      >
        <layout.StepField name="steps" stepIndex={2}>
          <FormArray<DevFormDefaultValues, 'steps', { id: string; label: string }>
            name="steps"
            label="Workflow steps"
            min={1}
            defaultItem={{ id: '', label: '' }}
            validation={stepsArrayCountSchema}
            data-testid="dev-form-steps"
          >
            {(itemFields) => (
              <>
                <itemFields.Text
                  name="id"
                  label="Step ID"
                  validation={stepItemSchema.shape.id}
                  data-testid="dev-form-step-id"
                />
                <itemFields.Text
                  name="label"
                  label="Step label"
                  validation={stepItemSchema.shape.label}
                  data-testid="dev-form-step-label"
                />
              </>
            )}
          </FormArray>
        </layout.StepField>

        <layout.StepField name="isAdult" stepIndex={2}>
          <fields.Hidden
            name="isAdult"
            listenTo={{
              age: (age) => Number(age) >= 18,
            }}
            validation={devFormSchema.shape.isAdult}
            data-testid="dev-form-is-adult"
          />
        </layout.StepField>

        <fields.File
          name="attachmentId"
          label="Attachment"
          description="Optional file upload to Convex storage"
          data-testid="dev-form-attachment"
        />

        <layout.Value
          labelFunction={(values) => {
            if (!values.acceptTerms) {
              return 'Accept the terms to continue.';
            }
            const notify = values.notifyByEmail
              ? `notifications on (${values.notificationFrequency || '?'})`
              : 'notifications off';
            const adultStatus = values.isAdult ? 'adult' : 'minor';
            return `${values.name || 'Anonymous'} (${values.age ?? '?'} yrs, ${adultStatus}) · ${values.role}/${values.accessLevel} · ${values.steps?.length ?? 0} step(s) · ${notify}`;
          }}
          className="text-sm text-muted-foreground"
          data-testid="dev-form-summary"
        />
      </FormStep>

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        <form.ResetButton
          data-testid="dev-form-reset"
          onClick={() => {
            setLastSubmission(null);
            goToStep(0);
          }}
        >
          Reset
        </form.ResetButton>
        <FormStepActions
          backButtonProps={{ 'data-testid': 'dev-form-back' }}
          nextButtonProps={{ 'data-testid': 'dev-form-next' }}
          submitButtonProps={{ 'data-testid': 'dev-form-submit' }}
        />
      </div>
      {lastSubmission ? (
        <div
          data-testid="dev-form-last-submission"
          data-notify-by-email={String(lastSubmission.submitted.notifyByEmail)}
          data-notification-frequency={lastSubmission.submitted.notificationFrequency ?? 'null'}
          className="sr-only"
          aria-hidden
        />
      ) : null}
    </form.FormShell>
  );
}

export function DevFormPage() {
  return (
    <div className="container flex flex-col gap-6 px-4 py-8 md:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="dev-form-title">
            Dev form
          </h1>
          <p className="text-sm text-muted-foreground">
            Field-level validation showcase with shared Zod schemas (client and Convex).
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/">Dashboard</Link>
        </Button>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Form field showcase</CardTitle>
          <CardDescription>
            Exercises text, textarea, rich text, number, select, checkbox, switch, radio, date,
            color, file, array, hidden listenTo, stepper, persistence, and server errors.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormStepper>
            <DevFormFields />
          </FormStepper>
        </CardContent>
      </Card>
    </div>
  );
}
