import type { E2eContext } from '../support/e2e-context';

describe('Todos', () => {
  beforeEach(() => {
    cy.loadE2eContext().then((ctx) => {
      cy.wrap(ctx).as('e2e');
    });
    cy.login('orgAdmin');
    cy.visit('/');
  });

  it('shows seeded todos in the table', () => {
    cy.get<E2eContext>('@e2e').then((ctx) => {
      cy.contains(ctx.todoAlphaTitle).should('be.visible');
      cy.contains(ctx.todoBetaTitle).should('be.visible');
    });
  });

  it('adds a todo from the table', () => {
    cy.uniqueLabel('E2E Todo').then((title) => {
      cy.contains('button', 'Add row').click();
      cy.fillDraftRowColumn('title', title);
      cy.submitDraftRow();
      cy.assertDatatableCellValue('title', title);
    });
  });

  it('applies done styling after toggling complete', () => {
    cy.get<E2eContext>('@e2e').then((ctx) => {
      cy.contains('tr', ctx.todoBetaTitle).within(() => {
        cy.contains(ctx.todoBetaTitle).should('not.have.class', 'line-through');
      });

      cy.contains('tr', ctx.todoBetaTitle)
        .find('[data-row-action-menu-trigger]')
        .click({ force: true });
      cy.contains('[role="menuitem"]', 'Toggle complete')
        .should('be.visible')
        .click({ force: true });

      cy.contains('tr', ctx.todoBetaTitle).within(() => {
        cy.contains(ctx.todoBetaTitle).should('have.class', 'line-through');
      });
    });
  });
});
