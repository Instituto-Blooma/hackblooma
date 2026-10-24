describe('Shell & navigation', () => {
  beforeEach(() => {
    cy.login('orgAdmin');
  });

  it('shows the authenticated dashboard shell', () => {
    cy.visit('/');
    cy.contains('Welcome to your Dashboard!').should('be.visible');
    cy.get('[data-testid="button-user-menu"]').should('be.visible');
    cy.get('[data-testid="button-theme-toggle"]').should('be.visible');
    cy.get('[data-testid="org-name-label"]').should('contain', 'E2E Acme Corp');
    cy.get('[data-testid="org-switcher-trigger"]').should('not.exist');
  });

  it('renders 404 for unknown routes', () => {
    cy.visit('/does-not-exist', { failOnStatusCode: false });
    cy.contains('404 Page Not Found').should('be.visible');
  });

  it('toggles dark theme from the header menu', () => {
    cy.visit('/');
    cy.get('[data-testid="button-theme-toggle"]').click();
    cy.get('[data-testid="menu-theme-dark"]').should('be.visible').click();
    cy.window().its('localStorage').invoke('getItem', 'app-theme').should('eq', 'dark');
  });
});
