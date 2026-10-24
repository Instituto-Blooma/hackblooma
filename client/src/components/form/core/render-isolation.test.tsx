import { useRef, type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useAppForm } from './form-hook';

function RenderCounter({ name, children }: { name: string; children: ReactNode }) {
  const renders = useRef(0);
  renders.current += 1;

  return (
    <div data-testid={`render-count-${name}`} data-renders={renders.current}>
      {children}
    </div>
  );
}

function IsolatedFieldsForm() {
  type IsolatedFormValues = {
    name: string;
    email: string;
  };

  const form = useAppForm<IsolatedFormValues>({
    defaultValues: {
      name: '',
      email: '',
    },
    onSubmit: async () => {},
  });

  const { fields } = form;

  return (
    <form.FormShell>
      <fields.Text name="name" label="Name" data-testid="field-name" />
      <RenderCounter name="email-field">
        <fields.Text name="email" label="Email" data-testid="field-email" />
      </RenderCounter>
    </form.FormShell>
  );
}

describe('form render isolation', () => {
  it('does not re-render sibling fields when one field value changes', async () => {
    const user = userEvent.setup();

    render(<IsolatedFieldsForm />);

    const emailCounter = screen.getByTestId('render-count-email-field');
    const initialEmailRenders = Number(emailCounter.getAttribute('data-renders'));

    const nameInput = screen.getByTestId('field-name');
    await user.type(nameInput, 'Ada');

    const finalEmailRenders = Number(emailCounter.getAttribute('data-renders'));
    expect(finalEmailRenders).toBe(initialEmailRenders);
  });
});
