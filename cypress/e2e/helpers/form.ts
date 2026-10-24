import { checkRadixCheckbox, selectComboboxOption, selectMultiComboboxOptions } from './ui';

function dismissOpenOverlays() {
  cy.get('body').type('{esc}');
}

export function assertDevFormStepVisible(stepIndex: number) {
  cy.get(`[data-step-index="${stepIndex}"]`).should('not.have.class', 'hidden');
}

export function waitForFormDraft(field: string, value: string, formId = 'dev-form') {
  cy.window()
    .its('localStorage')
    .invoke('getItem', `form_data_${formId}`)
    .should((raw) => {
      expect(raw).to.not.equal(null);
      const parsed = JSON.parse(String(raw)) as Record<string, unknown>;
      expect(parsed[field]).to.equal(value);
    });
}

export function fillRichText(testId: string, markdown: string) {
  // Prefer MDXEditor.setMarkdown (registered under Cypress) — Lexical contenteditable
  // does not reliably accept Cypress .type() or execCommand; setMarkdown drives
  // Lexical updates that sync into Yjs for collab editors.
  cy.get(`[data-testid="${testId}"]`, { timeout: 15000 })
    .find('[contenteditable="true"]')
    .should('be.visible');

  cy.window({ timeout: 10000 })
    .its(`__mdxEditors.${testId}`)
    .should('exist')
    .invoke('setMarkdown', markdown);

  cy.get(`[data-testid="${testId}"]`)
    .find('[contenteditable="true"]')
    .should(($el) => {
      expect($el.text()).to.include(markdown.slice(0, Math.min(markdown.length, 24)));
    });
}

export function fillDevFormStep0(overrides?: {
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  content?: string;
  age?: string;
}) {
  cy.get('[data-testid="dev-form-name"]')
    .clear()
    .type(overrides?.name ?? 'Ada Lovelace');
  cy.get('[data-testid="dev-form-email"]')
    .clear()
    .type(overrides?.email ?? 'ada@example.com');
  // IMask formats digits into (00) 00000-0000; type unmasked digits.
  cy.get('[data-testid="dev-form-phone"]')
    .clear()
    .type(overrides?.phone ?? '11999887766');
  cy.get('[data-testid="dev-form-bio"]')
    .clear()
    .type(overrides?.bio ?? 'Mathematician and writer');
  fillRichText(
    'dev-form-content',
    overrides?.content ?? 'Ada invented the analytical engine notes.'
  );
  cy.get('[data-testid="dev-form-age"]')
    .clear()
    .type(overrides?.age ?? '36');
}

export function pickCalendarDate(testId: string) {
  cy.get(`[data-testid="${testId}"]`).click();
  cy.get('[role="gridcell"] button:not([disabled])').first().click();
}

export function pickColor(testId: string, hex: string) {
  cy.get(`[data-testid="${testId}"]`).click();
  cy.get(`[data-testid="${testId}-hex"]`).clear().type(hex);
}

export function fillDevFormStep1(overrides?: {
  role?: 'Admin' | 'Member';
  tags?: string[];
  accessLevel?: 'read' | 'write';
  channels?: Array<'email' | 'slack' | 'sms'>;
  notify?: boolean;
  notificationFrequency?: 'Instant' | 'Daily' | 'Weekly';
  acceptTerms?: boolean;
  startDate?: string;
  brandColor?: string;
}) {
  const role = overrides?.role ?? 'Member';
  selectComboboxOption('dev-form-role', role, role.slice(0, 3));
  dismissOpenOverlays();

  selectMultiComboboxOptions('dev-form-tags', overrides?.tags ?? ['Frontend', 'Backend']);
  dismissOpenOverlays();

  if (overrides?.accessLevel === 'write') {
    cy.get('[data-testid="dev-form-access-level"]')
      .contains('Read and write')
      .click({ force: true });
  }

  const channels = overrides?.channels ?? ['email', 'slack'];
  for (const channel of channels) {
    cy.get(`[data-testid="dev-form-channels-${channel}"]`).click({ force: true });
  }
  if (overrides?.notify === true) {
    cy.get('[data-testid="dev-form-notify"]').click();
  }
  if (overrides?.notificationFrequency) {
    selectComboboxOption(
      'dev-form-notification-frequency',
      overrides.notificationFrequency,
      overrides.notificationFrequency.slice(0, 3)
    );
    dismissOpenOverlays();
  }
  if (overrides?.acceptTerms ?? true) {
    checkRadixCheckbox('dev-form-accept-terms');
  }

  pickCalendarDate('dev-form-start-date');
  dismissOpenOverlays();

  pickColor('dev-form-brand-color', overrides?.brandColor ?? '#FF5733');
  dismissOpenOverlays();

  cy.get('[data-testid="dev-form-brand-color"]').should('contain', '#FF5733');
  cy.get('[data-testid="dev-form-start-date"]').should('not.contain', 'Pick a date');
}

export function fillDevFormStepsArray() {
  cy.get('[data-testid="dev-form-steps-row-0"]').within(() => {
    cy.get('[data-testid="dev-form-step-id"]').clear().type('1');
    cy.get('[data-testid="dev-form-step-label"]').clear().type('Step one');
  });
}

export function advanceDevFormStep(expectedStepIndex?: number) {
  cy.get('[data-testid="dev-form-next"]').should('be.visible').click();
  if (expectedStepIndex !== undefined) {
    assertDevFormStepVisible(expectedStepIndex);
  }
}

export function clickDevFormHeaderStep(stepIndex: number) {
  cy.get(`[data-testid="form-step-header-step-${stepIndex}"]`).should('be.visible').click();
}

export function goToDevFormStep(stepIndex: number) {
  for (let index = 0; index < stepIndex; index += 1) {
    advanceDevFormStep();
  }
}

export function fillValidDevForm(email = 'ada@example.com') {
  fillDevFormStep0({ email });
  advanceDevFormStep(1);
  fillDevFormStep1();
  advanceDevFormStep(2);
  fillDevFormStepsArray();
}

export function submitDevForm() {
  cy.get('[data-testid="dev-form-submit"]').click();
}

export function assertDevFormSubmissionPayload(expected: {
  notifyByEmail: boolean;
  notificationFrequency: 'instant' | 'daily' | 'weekly' | null;
}) {
  cy.get('[data-testid="dev-form-last-submission"]')
    .should('have.attr', 'data-notify-by-email', String(expected.notifyByEmail))
    .should('have.attr', 'data-notification-frequency', expected.notificationFrequency ?? 'null');
}
