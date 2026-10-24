describe('Tenants UI', () => {
  beforeEach(() => {
    cy.login('orgAdmin');
  });

  it('shows members settings for org admin', () => {
    cy.visit('/settings/members');
    cy.contains('Organization settings').should('be.visible');
  });

  it('shows platform admin org list', () => {
    cy.login('platformAdmin');
    cy.visit('/admin');
    cy.get('[data-testid="platform-admin-title"]').should('be.visible');
    cy.get('[data-testid="platform-org-list"]').should('exist');
  });
});
