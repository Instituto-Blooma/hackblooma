import type { E2eContext } from '../../support/e2e-context';

export function selectComboboxOption(testId: string, optionLabel: string, searchTerm?: string) {
  cy.get(`[data-testid="${testId}"]`).click();
  if (searchTerm) {
    cy.get(`[data-testid="${testId}-search"]`).clear().type(searchTerm);
  }
  cy.contains('[role="option"]', optionLabel).click();
}

/** @deprecated Use selectComboboxOption — kept for existing call sites. */
export function selectRadixOption(testId: string, optionLabel: string) {
  selectComboboxOption(testId, optionLabel);
}

export function selectMultiComboboxOptions(testId: string, optionLabels: string[]) {
  cy.get(`[data-testid="${testId}"]`).click();
  for (const optionLabel of optionLabels) {
    cy.contains('[role="option"]', optionLabel).click();
  }
}

export function selectProvisionOrg(orgId: string) {
  cy.fixture('e2e-context.json').then((ctx: E2eContext) => {
    const orgName =
      orgId === ctx.orgAId ? ctx.orgAName : orgId === ctx.orgBId ? ctx.orgBName : undefined;

    cy.get('[data-testid="select-provision-org"]').click();
    if (orgName) {
      cy.get('[data-testid="select-provision-org-search"]').clear().type(orgName.slice(0, 4));
      cy.contains('[role="option"]', orgName).click();
    } else {
      cy.get('[role="option"]').first().click();
    }
  });
}

export function checkRadixCheckbox(testId: string) {
  cy.get(`[data-testid="${testId}"]`).then(($checkbox) => {
    if ($checkbox.attr('data-state') !== 'checked') {
      cy.wrap($checkbox).click();
    }
  });
  cy.get(`[data-testid="${testId}"]`).should('have.attr', 'data-state', 'checked');
}
