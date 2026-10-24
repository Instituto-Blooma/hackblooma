import {
  advanceDevFormStep,
  assertDevFormStepVisible,
  assertDevFormSubmissionPayload,
  clickDevFormHeaderStep,
  fillDevFormStep0,
  fillDevFormStep1,
  fillDevFormStepsArray,
  fillRichText,
  fillValidDevForm,
  pickCalendarDate,
  pickColor,
  submitDevForm,
  waitForFormDraft,
} from './helpers/form';
import { checkRadixCheckbox, selectComboboxOption } from './helpers/ui';

function assertStepHidden(stepIndex: number) {
  cy.get(`[data-step-index="${stepIndex}"]`).should('have.class', 'hidden');
}

describe('Dev form', () => {
  beforeEach(() => {
    cy.login('orgAdmin');
    cy.visit('/dev/form');
    cy.window().then((win) => {
      win.localStorage.removeItem('form_data_dev-form');
    });
    cy.get('[data-testid="dev-form-title"]').should('be.visible');
  });

  it('blocks Next on step 0 when fields are empty', () => {
    cy.get('[data-testid="dev-form-next"]').click();
    cy.get('[data-testid="dev-form-name"]').should('be.visible');
    cy.get('[data-testid="dev-form-name-error"]').should('be.visible');
    cy.get('[data-testid="dev-form-email-error"]').should('be.visible');
    cy.get('[data-testid="dev-form-phone-error"]').should('be.visible');
    cy.get('[data-testid="dev-form-bio-error"]').should('be.visible');
    cy.get('[data-testid="dev-form-content-error"]').should('be.visible');
    cy.get('[data-testid="dev-form-age-error"]').should('be.visible');
    assertStepHidden(1);
  });

  it('renders the step header with labels and numbered indicators', () => {
    cy.get('[data-testid="form-step-header"]').should('be.visible');
    cy.get('[data-testid="form-step-header-step-0"]').should('contain', 'Profile');
    cy.get('[data-testid="form-step-header-step-1"]').should('contain', 'Access');
    cy.get('[data-testid="form-step-header-step-2"]').should('contain', 'Extras');
    cy.get('[data-testid="form-step-header-step-0"]').should('have.attr', 'data-state', 'active');
  });

  it('blocks forward header jumps until previous steps are valid', () => {
    clickDevFormHeaderStep(2);
    cy.get('[data-testid="dev-form-name-error"]').should('be.visible');
    assertDevFormStepVisible(0);
    assertStepHidden(2);

    fillDevFormStep0();
    clickDevFormHeaderStep(2);
    assertDevFormStepVisible(1);
    assertStepHidden(2);
    cy.get('[data-testid="dev-form-accept-terms"]').should('be.visible');
  });

  it('allows jumping back via the step header', () => {
    fillDevFormStep0();
    advanceDevFormStep(1);
    fillDevFormStep1();
    advanceDevFormStep(2);
    assertDevFormStepVisible(2);

    clickDevFormHeaderStep(0);
    assertDevFormStepVisible(0);
    assertStepHidden(2);
    cy.get('[data-testid="form-step-header-step-0"]').should('have.attr', 'data-state', 'active');
    cy.get('[data-testid="form-step-header-step-1"]').should('have.attr', 'data-state', 'upcoming');
  });

  it('accepts rich text content on step 0', () => {
    fillDevFormStep0();
    cy.get('[data-testid="dev-form-content"]')
      .find('[contenteditable="true"]')
      .should('contain.text', 'analytical engine');
    fillRichText('dev-form-content', 'Updated collaborative-ready markdown body.');
    cy.get('[data-testid="dev-form-content"]')
      .find('[contenteditable="true"]')
      .should('contain.text', 'collaborative-ready');
  });

  it('blocks Next on step 1 when terms are not accepted', () => {
    fillDevFormStep0();
    advanceDevFormStep();
    fillDevFormStep1({ acceptTerms: false });
    cy.get('[data-testid="dev-form-next"]').click();
    cy.get('[data-testid="dev-form-accept-terms-error"]').should('be.visible');
    assertStepHidden(2);
  });

  it('filters role options when typing in the combobox', () => {
    fillDevFormStep0();
    advanceDevFormStep();
    cy.get('[data-testid="dev-form-role"]').click();
    cy.get('[data-testid="dev-form-role-search"]').type('adm');
    cy.contains('[role="option"]', 'Admin').click();
    cy.get('[data-testid="dev-form-role"]').should('contain', 'Admin');
  });

  it('shows a tags validation error when none are selected', () => {
    fillDevFormStep0();
    advanceDevFormStep();
    checkRadixCheckbox('dev-form-accept-terms');
    pickCalendarDate('dev-form-start-date');
    cy.get('[data-testid="dev-form-next"]').click();
    cy.get('[data-testid="dev-form-tags-error"]').should('be.visible');
  });

  it('picks a brand color from the color field', () => {
    fillDevFormStep0();
    advanceDevFormStep();
    pickColor('dev-form-brand-color', '#FF5733');
    cy.get('[data-testid="dev-form-brand-color"]').should('contain', '#FF5733');
  });

  it('removes a selected tag chip from the multi-select', () => {
    fillDevFormStep0();
    advanceDevFormStep();
    fillDevFormStep1({ tags: ['Frontend', 'Backend'] });
    cy.get('[data-testid="dev-form-tags-chip-frontend"]').find('button').click();
    cy.get('[data-testid="dev-form-tags"]').should('contain', 'Backend');
    cy.get('[data-testid="dev-form-tags-chip-frontend"]').should('not.exist');
  });

  it('shows a bio validation error for short text', () => {
    fillDevFormStep0({ bio: 'short' });
    cy.get('[data-testid="dev-form-next"]').click();
    cy.get('[data-testid="dev-form-bio-error"]').should('be.visible');
  });

  it('shows an email validation error for invalid input', () => {
    fillDevFormStep0({ email: 'not-an-email' });
    cy.get('[data-testid="dev-form-next"]').click();
    cy.get('[data-testid="dev-form-email-error"]').should('be.visible');
  });

  it('shows an age validation error when under 18', () => {
    fillDevFormStep0({ age: '16' });
    cy.get('[data-testid="dev-form-next"]').click();
    cy.get('[data-testid="dev-form-age-error"]').should('be.visible');
  });

  it('shows notification frequency only when email notifications are enabled', () => {
    fillDevFormStep0();
    advanceDevFormStep(1);

    cy.get('[data-testid="dev-form-notification-frequency"]').should('not.exist');

    cy.get('[data-testid="dev-form-notify"]').click({ force: true });
    cy.get('[data-testid="dev-form-notification-frequency"]').should('be.visible');

    selectComboboxOption('dev-form-notification-frequency', 'Daily', 'dai');
    cy.get('[data-testid="dev-form-notification-frequency"]').should('contain', 'Daily');

    cy.get('[data-testid="dev-form-notify"]').click({ force: true });
    cy.get('[data-testid="dev-form-notification-frequency"]').should('not.exist');

    cy.get('[data-testid="dev-form-notify"]').click({ force: true });
    cy.get('[data-testid="dev-form-notification-frequency"]').should('be.visible');
    cy.get('[data-testid="dev-form-notification-frequency"]').should('contain', 'Daily');
  });

  it('blocks Next on step 1 when notify is on but frequency is not selected', () => {
    fillDevFormStep0();
    advanceDevFormStep(1);
    fillDevFormStep1({ notify: true });
    cy.get('[data-testid="dev-form-next"]').click();
    cy.get('[data-testid="dev-form-notification-frequency-error"]').should('be.visible');
    assertStepHidden(2);
  });

  it('submits successfully with notification frequency when notify is on', () => {
    fillDevFormStep0();
    advanceDevFormStep(1);
    fillDevFormStep1({ notify: true, notificationFrequency: 'Instant' });
    advanceDevFormStep(2);
    fillDevFormStepsArray();
    submitDevForm();
    cy.contains('Form submitted successfully', { timeout: 10000 }).should('be.visible');
    assertDevFormSubmissionPayload({
      notifyByEmail: true,
      notificationFrequency: 'instant',
    });
  });

  it('submits successfully with notify off after frequency was selected', () => {
    fillDevFormStep0();
    advanceDevFormStep(1);
    fillDevFormStep1({ notify: true, notificationFrequency: 'Weekly' });
    cy.get('[data-testid="dev-form-notify"]').click({ force: true });
    cy.get('[data-testid="dev-form-notification-frequency"]').should('not.exist');
    cy.get('[data-testid="dev-form-notify"]').click({ force: true });
    cy.get('[data-testid="dev-form-notification-frequency"]').should('contain', 'Weekly');
    cy.get('[data-testid="dev-form-notify"]').click({ force: true });
    cy.get('[data-testid="dev-form-notification-frequency"]').should('not.exist');
    advanceDevFormStep(2);
    fillDevFormStepsArray();
    submitDevForm();
    cy.contains('Form submitted successfully', { timeout: 10000 }).should('be.visible');
    assertDevFormSubmissionPayload({
      notifyByEmail: false,
      notificationFrequency: null,
    });
  });

  it('updates the summary when the notify switch is toggled', () => {
    fillDevFormStep0();
    advanceDevFormStep(1);
    fillDevFormStep1({ notify: false });
    advanceDevFormStep(2);
    assertDevFormStepVisible(2);
    cy.get('[data-testid="dev-form-summary"]').should('contain', 'notifications off');
    cy.get('[data-testid="dev-form-back"]').click();
    assertDevFormStepVisible(1);
    cy.get('[data-testid="dev-form-notify"]').should('be.visible').click({ force: true });
    selectComboboxOption('dev-form-notification-frequency', 'Daily', 'dai');
    advanceDevFormStep(2);
    cy.get('[data-testid="dev-form-summary"]').should('contain', 'notifications on');
  });

  it('reflects radio card selection in the summary', () => {
    fillDevFormStep0();
    advanceDevFormStep(1);
    fillDevFormStep1();
    cy.get('[data-testid="dev-form-access-level"]').contains('Read only').click({ force: true });
    advanceDevFormStep(2);
    assertDevFormStepVisible(2);
    cy.get('[data-testid="dev-form-summary"]').should('contain', 'read');
    cy.get('[data-testid="dev-form-back"]').click();
    assertDevFormStepVisible(1);
    cy.get('[data-testid="dev-form-access-level"]')
      .contains('Read and write')
      .click({ force: true });
    advanceDevFormStep(2);
    cy.get('[data-testid="dev-form-summary"]').should('contain', 'write');
  });

  it('adds a row to the steps array', () => {
    fillDevFormStep0();
    advanceDevFormStep(1);
    fillDevFormStep1();
    advanceDevFormStep(2);
    cy.get('[data-testid="dev-form-steps-add"]').click();
    cy.get('[data-testid="dev-form-steps-row-1"]').should('be.visible');
  });

  it('shows array field validation for an invalid step label', () => {
    fillDevFormStep0();
    advanceDevFormStep(1);
    fillDevFormStep1();
    advanceDevFormStep(2);
    cy.get('[data-testid="dev-form-steps-row-0"]').within(() => {
      cy.get('[data-testid="dev-form-step-label"]').clear().type('x');
    });
    submitDevForm();
    cy.get('[data-testid="dev-form-step-label-error"]').should('be.visible');
  });

  it('clears array validation error when invalid row is removed', () => {
    fillDevFormStep0();
    advanceDevFormStep(1);
    fillDevFormStep1();
    advanceDevFormStep(2);
    cy.get('[data-testid="dev-form-steps-add"]').click();
    submitDevForm();
    cy.get('[data-testid="dev-form-steps-row-1"]').within(() => {
      cy.get('[data-testid="dev-form-step-id-error"]').should('be.visible');
    });
    cy.get('[data-testid="dev-form-steps-remove-1"]').click();
    cy.get('[data-testid="dev-form-steps-error"]').should('not.exist');
    cy.get('[data-testid="dev-form-step-id-error"]').should('not.exist');
  });

  it('derives isAdult from age via listenTo', () => {
    fillDevFormStep0({ age: '36' });
    advanceDevFormStep(1);
    fillDevFormStep1();
    advanceDevFormStep(2);
    assertDevFormStepVisible(2);
    cy.get('[data-testid="dev-form-is-adult"]').should('have.value', 'true');
    cy.get('[data-testid="dev-form-summary"]').should('contain', 'adult');
  });

  it('keeps isAdult in sync when age changes across steps', () => {
    fillDevFormStep0({ age: '36' });
    advanceDevFormStep(1);
    fillDevFormStep1();
    advanceDevFormStep(2);
    assertDevFormStepVisible(2);
    cy.get('[data-testid="dev-form-summary"]').should('contain', 'adult');

    // Step 0 stays mounted while on step 2 — edit age without navigating back so
    // step 1 field state (tags, start date, etc.) is not lost or re-filled.
    cy.get('[data-testid="dev-form-age"]').clear({ force: true }).type('20', { force: true });
    cy.get('[data-testid="dev-form-is-adult"]').should('have.value', 'true');
    cy.get('[data-testid="dev-form-summary"]').should('contain', 'adult');
  });

  it('shows the file upload field on the final step', () => {
    fillDevFormStep0();
    advanceDevFormStep(1);
    fillDevFormStep1();
    advanceDevFormStep(2);
    cy.get('[data-testid="dev-form-attachment"]').should('be.visible');
  });

  it('uploads a file and submits successfully', () => {
    fillDevFormStep0();
    advanceDevFormStep(1);
    fillDevFormStep1();
    advanceDevFormStep(2);
    fillDevFormStepsArray();
    cy.get('[data-testid="dev-form-attachment-input"]').selectFile('cypress/fixtures/sample.txt', {
      force: true,
    });
    cy.get('[data-testid="dev-form-attachment-link"]', { timeout: 10000 }).should('be.visible');
    submitDevForm();
    cy.contains('Form submitted successfully', { timeout: 10000 }).should('be.visible');
  });

  it('clears fields when reset is clicked', () => {
    fillDevFormStep0({ name: 'Reset Me' });
    cy.wait(600);
    cy.get('[data-testid="dev-form-reset"]').click();
    cy.get('[data-testid="dev-form-name"]').should('have.value', '');
  });

  it('restores persisted draft values after reload', () => {
    fillDevFormStep0({ name: 'Persisted Name' });
    waitForFormDraft('name', 'Persisted Name');
    cy.reload();
    cy.get('[data-testid="dev-form-title"]').should('be.visible');
    cy.get('[data-testid="dev-form-name"]', { timeout: 10000 }).should(
      'have.value',
      'Persisted Name'
    );
  });

  it('maps server field errors onto the email field', () => {
    fillValidDevForm('server-error@example.com');
    submitDevForm();
    cy.get('[data-testid="dev-form-email-error"]').should('be.visible');
    cy.contains('Email already taken').should('be.visible');
    cy.contains('Please fix the highlighted fields').should('be.visible');
    cy.get('[data-testid="dev-form-name"]').should('be.visible');
    assertStepHidden(2);
  });

  it('submits a valid form successfully', () => {
    fillValidDevForm();
    submitDevForm();
    cy.contains('Form submitted successfully', { timeout: 10000 }).should('be.visible');
  });
});
