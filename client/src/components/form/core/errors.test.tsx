import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearAllServerFieldErrors, clearServerFieldError, setServerFieldErrors } from './errors';
import { useAppForm } from './form-hook';

type Values = {
  name: string;
  email: string;
};

function Harness({
  onReady,
  onSubmit,
}: {
  onReady: (form: ReturnType<typeof useAppForm<Values>>) => void;
  onSubmit?: () => void | Promise<void>;
}) {
  const form = useAppForm<Values>({
    defaultValues: { name: 'Ada', email: 'ada@example.com' },
    onSubmit,
  });
  onReady(form);
  const { fields } = form;
  return (
    <form.FormShell>
      <fields.Text name="name" label="Name" />
      <fields.Text name="email" label="Email" />
      <form.SubmitButton data-testid="submit">Submit</form.SubmitButton>
    </form.FormShell>
  );
}

afterEach(() => {
  cleanup();
});

describe('setServerFieldErrors', () => {
  it('sets onSubmit errors for fields that have no field meta yet', () => {
    let form: ReturnType<typeof useAppForm<Values>> | undefined;
    render(<Harness onReady={(api) => (form = api)} />);

    expect(form).toBeDefined();
    expect(() => {
      setServerFieldErrors(form!, {
        email: 'Invalid email',
        name: 'Name is required',
      });
    }).not.toThrow();

    expect(form!.getFieldMeta('email')?.errorMap?.onSubmit).toBe('Invalid email');
    expect(form!.getFieldMeta('name')?.errorMap?.onSubmit).toBe('Name is required');
  });

  it('blocks later handleSubmit until server onSubmit errors are cleared', async () => {
    const onSubmit = vi.fn();
    let form: ReturnType<typeof useAppForm<Values>> | undefined;
    render(<Harness onReady={(api) => (form = api)} onSubmit={onSubmit} />);

    setServerFieldErrors(form!, { email: 'Invalid email' });
    expect(form!.state.canSubmit).toBe(false);

    await form!.handleSubmit();
    expect(onSubmit).not.toHaveBeenCalled();

    clearAllServerFieldErrors(form!);
    expect(form!.getFieldMeta('email')?.errorMap?.onSubmit).toBeUndefined();

    await form!.handleSubmit();
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});

describe('clearServerFieldError', () => {
  it('is a no-op when field meta is missing', () => {
    let form: ReturnType<typeof useAppForm<Values>> | undefined;
    render(<Harness onReady={(api) => (form = api)} />);

    expect(form).toBeDefined();
    expect(() => {
      clearServerFieldError(form!, 'email');
    }).not.toThrow();
  });
});
