const DRAFT_ROW_SELECTOR = 'tfoot tr[data-row-id="__draft__"]';

declare global {
  namespace Cypress {
    interface Chainable {
      fillDraftRowColumn(columnId: string, value: string): Chainable<void>;
      submitDraftRow(): Chainable<void>;
      assertDatatableCellValue(columnId: string, value: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('fillDraftRowColumn', (columnId: string, value: string) => {
  cy.get(DRAFT_ROW_SELECTOR).should('exist');
  cy.get(`table thead [data-column-id="${columnId}"]`).scrollIntoView();
  const cell = `${DRAFT_ROW_SELECTOR} [data-column-id="${columnId}"]`;
  const editor = `${cell} [role="textbox"]`;

  cy.get('body').then(($body) => {
    if ($body.find(editor).length === 0) {
      cy.get(cell).scrollIntoView().dblclick({ force: true });
    }
  });

  cy.get(editor).should('exist').type(`${value}{enter}`, { force: true });

  cy.get(DRAFT_ROW_SELECTOR).find('[aria-label="Create row"]').should('not.be.disabled');
});

Cypress.Commands.add('submitDraftRow', () => {
  cy.get(DRAFT_ROW_SELECTOR)
    .find('[aria-label="Create row"]')
    .scrollIntoView()
    .should('not.be.disabled')
    .click({ force: true });
});

Cypress.Commands.add('assertDatatableCellValue', (columnId: string, value: string) => {
  cy.get(`table tbody tr:not([data-row-id="__draft__"]) [data-column-id="${columnId}"]`)
    .contains(value)
    .should('exist');
});

export {};
