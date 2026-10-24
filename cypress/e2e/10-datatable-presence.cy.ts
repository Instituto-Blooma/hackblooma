describe('Datatable presence (convex-presence channel)', () => {
  it('keeps the todos table interactive after presence migration', () => {
    cy.login('orgAdmin');
    cy.visit('/');
    cy.get('table', { timeout: 20000 }).should('be.visible');
    cy.fillDraftRowColumn('title', `Presence todo ${Date.now()}`);
    cy.submitDraftRow();
    cy.get('table tbody tr:not([data-row-id="__draft__"])', { timeout: 15000 }).should(
      'have.length.at.least',
      1
    );
  });
});
