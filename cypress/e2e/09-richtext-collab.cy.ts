import { fillRichText } from './helpers/form';

describe('Rich text collaboration', () => {
  it('opens the shared editor and syncs local edits into the Yjs log', () => {
    cy.login('orgAdmin');
    cy.visit('/dev/richtext-collab');
    cy.get('[data-testid="dev-richtext-collab-title"]').should('be.visible');
    cy.get('[data-testid="dev-richtext-collab-editor"]', { timeout: 20000 }).should('be.visible');
    fillRichText('dev-richtext-collab-editor', 'Hello from Cypress collab client');
    cy.get('[data-testid="dev-richtext-collab-editor"]')
      .find('[contenteditable="true"]')
      .should('contain.text', 'Hello from Cypress collab client');
    // Local typing must reach the shared Yjs log (version advances after push).
    cy.get('[data-testid="dev-richtext-collab-editor"]', { timeout: 20000 }).should(($el) => {
      const version = Number($el.attr('data-sync-version') ?? '0');
      expect(version).to.be.greaterThan(0);
    });
  });
});
