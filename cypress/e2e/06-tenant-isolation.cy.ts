describe('Tenant isolation', () => {
  it('Acme admin sees Acme todos only', () => {
    cy.loadE2eContext().then((ctx) => {
      cy.login('orgAdmin');
      cy.visit('/');
      cy.assertTodoVisible(ctx.orgATodoAlphaTitle);
      cy.assertTodoNotVisible(ctx.orgBTodoAlphaTitle);
    });
  });

  it('Beta admin sees Beta todos only', () => {
    cy.loadE2eContext().then((ctx) => {
      cy.login('orgBAdmin');
      cy.visit('/');
      cy.assertTodoVisible(ctx.orgBTodoAlphaTitle);
      cy.assertTodoNotVisible(ctx.orgATodoAlphaTitle);
    });
  });

  it('Acme member sees Acme todos only', () => {
    cy.loadE2eContext().then((ctx) => {
      cy.login('member');
      cy.visit('/');
      cy.assertTodoVisible(ctx.orgATodoAlphaTitle);
      cy.assertTodoNotVisible(ctx.orgBTodoAlphaTitle);
    });
  });

  it('shows tenant probe page with current org context', () => {
    cy.login('orgAdmin');
    cy.visit('/dev/tenants');
    cy.get('[data-testid="tenant-current-org-name"]').should('not.contain', 'none');
    cy.get('[data-testid="tenant-todo-row"]').should('have.length.at.least', 1);
  });

  it('cross-org server probe is denied for org admin', () => {
    cy.loadE2eContext().then((ctx) => {
      cy.login('orgAdmin');
      cy.visit('/dev/tenants');
      cy.get('input[placeholder="Other org ID"]').clear().type(ctx.orgBId);
      cy.get('input[placeholder="Other org todo ID"]').clear().type(ctx.orgBTodoAlphaId);
      cy.get('[data-testid="probe-other-org"]').click();
      cy.get('[data-testid="probe-result"]').should('contain', 'denied');
    });
  });

  it('platform admin sees correct data after org switch', () => {
    cy.loadE2eContext().then((ctx) => {
      cy.login('platformAdmin');
      cy.visit('/');
      cy.get('[data-testid="org-switcher-trigger"]').click();
      cy.get('[data-testid="org-switcher-menu"]').should('be.visible');
      cy.get(`[data-testid="org-switcher-option-${ctx.orgBSlug}"]`).click();
      cy.get('[data-testid="org-switcher-current"]').should('contain', ctx.orgBName);
      cy.assertTodoVisible(ctx.orgBTodoAlphaTitle);
      cy.assertTodoNotVisible(ctx.orgATodoAlphaTitle);
    });
  });
});
