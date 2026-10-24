import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import type { ListenToMap } from './create-field';
import { useAppForm } from './form-hook';

type ListenToValues = {
  age: number | undefined;
  isAdult: boolean;
};

const isAdultListenTo: ListenToMap = {
  age: (age) => Number(age) >= 18,
};

function ListenToHarness({
  defaultValues,
  listenTo = isAdultListenTo,
}: {
  defaultValues: ListenToValues;
  listenTo?: ListenToMap;
}) {
  const form = useAppForm<ListenToValues>({
    defaultValues,
    onSubmit: async () => {},
  });

  const { fields } = form;

  return (
    <form.FormShell>
      <fields.Number name="age" label="Age" data-testid="field-age" />
      <fields.Hidden name="isAdult" listenTo={listenTo} data-testid="field-is-adult" />
    </form.FormShell>
  );
}

describe('listenTo cross-field reactions', () => {
  afterEach(() => {
    cleanup();
  });

  it('syncs derived value on mount when the source field is pre-set', async () => {
    render(<ListenToHarness defaultValues={{ age: 25, isAdult: false }} />);

    await waitFor(() => {
      expect((screen.getByTestId('field-is-adult') as HTMLInputElement).value).toBe('true');
    });
  });

  it('updates the derived field when the source field changes', async () => {
    const user = userEvent.setup();

    render(<ListenToHarness defaultValues={{ age: undefined, isAdult: false }} />);

    await user.type(screen.getByTestId('field-age'), '36');

    await waitFor(() => {
      expect((screen.getByTestId('field-is-adult') as HTMLInputElement).value).toBe('true');
    });
  });

  it('clears the derived field when the source drops below the threshold', async () => {
    const user = userEvent.setup();

    render(<ListenToHarness defaultValues={{ age: 25, isAdult: true }} />);

    await waitFor(() => {
      expect((screen.getByTestId('field-is-adult') as HTMLInputElement).value).toBe('true');
    });

    const ageInput = screen.getByTestId('field-age');
    await user.clear(ageInput);
    await user.type(ageInput, '17');

    await waitFor(() => {
      expect((screen.getByTestId('field-is-adult') as HTMLInputElement).value).toBe('false');
    });
  });

  it('skips update when the callback returns undefined', async () => {
    const user = userEvent.setup();
    const noopListenTo: ListenToMap = {
      age: () => undefined,
    };

    render(
      <ListenToHarness defaultValues={{ age: undefined, isAdult: false }} listenTo={noopListenTo} />
    );

    await user.type(screen.getByTestId('field-age'), '36');

    await waitFor(() => {
      expect((screen.getByTestId('field-age') as HTMLInputElement).value).toBe('36');
    });

    expect((screen.getByTestId('field-is-adult') as HTMLInputElement).value).toBe('false');
  });
});
