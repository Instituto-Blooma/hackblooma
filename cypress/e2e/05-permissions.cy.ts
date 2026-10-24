describe('Permissions demo page', () => {
  it('shows allowed create permission for org admin', () => {
    cy.login('orgAdmin');
    cy.visit('/dev/permissions');
    cy.get('[data-testid="permissions-debug-panel"]').should('contain', 'admin');
    cy.get('[data-testid="permission-todos-create"]')
      .should('not.contain', 'checking')
      .and('contain', 'allowed');
  });

  it('shows denied delete permission for org member', () => {
    cy.login('member');
    cy.visit('/dev/permissions');
    cy.get('[data-testid="permission-todos-delete"]').should('contain', 'denied');
    cy.get('[data-testid="permission-todos-delete-denied"]').should('exist');
  });

  it('shows denied settings manage permission for org member', () => {
    cy.login('member');
    cy.visit('/dev/permissions');
    cy.get('[data-testid="permission-settings-manage"]').should('contain', 'denied');
    cy.get('[data-testid="permission-settings-manage-denied"]').should('exist');
  });

  it('shows platform manage permission for platform admin', () => {
    cy.login('platformAdmin');
    cy.visit('/dev/permissions');
    cy.get('[data-testid="permission-platform-manage"]').should('contain', 'allowed');
  });
});
