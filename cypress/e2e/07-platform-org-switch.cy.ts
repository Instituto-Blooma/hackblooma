import type { E2eContext } from '../support/e2e-context';

describe('Platform admin organization switch', () => {
  it('shows org switcher and switches between companies', () => {
    cy.loadE2eContext().then((ctx) => {
      cy.login('platformAdmin');
      cy.visit('/');

      cy.get('[data-testid="org-switcher-trigger"]').should('be.visible');
      cy.get('[data-testid="org-switcher-current"]').should('not.be.empty');

      cy.get('[data-testid="org-switcher-current"]').then(($current) => {
        const currentName = $current.text().trim();
        const switchingToBeta = currentName.includes(ctx.orgAName);
        const targetName = switchingToBeta ? ctx.orgBName : ctx.orgAName;
        const targetSlug = switchingToBeta ? ctx.orgBSlug : ctx.orgASlug;
        const visibleTodo = switchingToBeta ? ctx.orgBTodoAlphaTitle : ctx.orgATodoAlphaTitle;
        const hiddenTodo = switchingToBeta ? ctx.orgATodoAlphaTitle : ctx.orgBTodoAlphaTitle;

        cy.get('[data-testid="org-switcher-trigger"]').click();
        cy.get('[data-testid="org-switcher-menu"]').should('be.visible');
        cy.get(`[data-testid="org-switcher-option-${targetSlug}"]`).click();

        cy.get('[data-testid="org-switcher-current"]').should('contain', targetName);
        cy.assertTodoVisible(visibleTodo);
        cy.assertTodoNotVisible(hiddenTodo);
      });
    });
  });
});

describe('Organization display for normal users', () => {
  it('shows company name without a switcher', () => {
    cy.loadE2eContext().then((ctx: E2eContext) => {
      cy.login('orgAdmin');
      cy.visit('/');

      cy.get('[data-testid="org-name-label"]').should('contain', ctx.orgAName);
      cy.get('[data-testid="org-switcher-trigger"]').should('not.exist');
    });
  });
});
