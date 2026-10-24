describe('Auth flow', () => {
  before(() => {
    Cypress.session.clearAllSavedSessions();
  });

  it('signs in through emulated Google OAuth and lands on dashboard', () => {
    cy.login('admin', { mode: 'fresh' });
    cy.contains('Welcome to your Dashboard!').should('be.visible');
  });
});
