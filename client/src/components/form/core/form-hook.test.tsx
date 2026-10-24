import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFormPersistence } from '../persistence/use-form-persistence';
import { useAppForm } from './form-hook';

type TestFormValues = {
  startDate: string;
  name: string;
};

const testDateSerializer = {
  serialize: (value: unknown) =>
    typeof value === 'string' && value ? `${value}T00:00:00.000Z` : null,
  deserialize: (value: unknown): string =>
    typeof value === 'string' ? value.replace(/T00:00:00\.000Z$/, '') : '',
};

function SubmitSerializationForm({
  onSubmit,
}: {
  onSubmit: (args: {
    value: TestFormValues;
    unserializedValues: TestFormValues;
  }) => void | Promise<void>;
}) {
  const form = useAppForm<TestFormValues>({
    defaultValues: {
      startDate: '2026-06-01',
      name: 'Ada',
    },
    onSubmit,
  });

  const { fields } = form;

  return (
    <form.FormShell>
      <fields.Text
        name="startDate"
        label="Start date"
        serialize={testDateSerializer.serialize}
        deserialize={testDateSerializer.deserialize}
        data-testid="field-start-date"
      />
      <fields.Text name="name" label="Name" data-testid="field-name" />
      <form.SubmitButton data-testid="submit">Submit</form.SubmitButton>
    </form.FormShell>
  );
}

const RESET_PERSISTENCE_ID = 'test-reset-form';
const pristineResetDefaults = { name: '' };

function ResetAfterPersistForm() {
  const form = useAppForm({
    defaultValues: pristineResetDefaults,
    resetValues: pristineResetDefaults,
    onSubmit: async () => {},
  });

  useFormPersistence(form, { id: RESET_PERSISTENCE_ID, debounceMs: 300 });

  const { fields } = form;

  return (
    <form.FormShell>
      <fields.Text name="name" label="Name" data-testid="field-reset-name" />
      <form.ResetButton data-testid="reset">Reset</form.ResetButton>
    </form.FormShell>
  );
}

describe('useAppForm onSubmit serialization', () => {
  it('passes serialized value and unserializedValues to onSubmit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<SubmitSerializationForm onSubmit={onSubmit} />);

    await user.click(screen.getByTestId('submit'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledOnce();
    });

    const args = onSubmit.mock.calls[0]?.[0];
    expect(args?.unserializedValues.startDate).toBe('2026-06-01');
    expect(args?.value.startDate).toBe('2026-06-01T00:00:00.000Z');
    expect(args?.unserializedValues.name).toBe('Ada');
    expect(args?.value.name).toBe('Ada');
  });
});

describe('ResetButton after persistence autosave', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('clears persisted draft values when reset is clicked after autosave', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<ResetAfterPersistForm />);

    const input = screen.getByTestId('field-reset-name');
    await user.type(input, 'Draft name');
    await vi.advanceTimersByTimeAsync(400);

    expect(window.localStorage.getItem(`form_data_${RESET_PERSISTENCE_ID}`)).toContain(
      'Draft name'
    );

    await user.click(screen.getByTestId('reset'));

    expect((input as HTMLInputElement).value).toBe('');
    expect(window.localStorage.getItem(`form_data_${RESET_PERSISTENCE_ID}`)).toBeNull();

    await vi.advanceTimersByTimeAsync(400);

    expect(window.localStorage.getItem(`form_data_${RESET_PERSISTENCE_ID}`)).toBeNull();
  });
});
