import type { E2eContext } from '../../support/e2e-context';
import { type E2ePersona, resolvePersonaEmail } from '../../support/personas';
import { checkRadixCheckbox, selectProvisionOrg } from './ui';
import { waitForInvitationLink } from './email';

export function visitInvitationAccept(id: string) {
  cy.visit(`/accept-invitation/${id}`);
}

export function visitPlatformAdminProvisionedOrg(orgId: string, options?: { fresh?: boolean }) {
  if (options?.fresh) {
    cy.login('platformAdmin', { mode: 'fresh' });
    cy.visit('/admin');
  } else {
    cy.login('platformAdmin');
  }
  cy.get('[data-testid="platform-admin-title"]').should('be.visible');
  selectProvisionOrg(orgId);
}

export { checkRadixCheckbox, selectProvisionOrg };

export function assertPendingInviteRow(email: string) {
  cy.contains('[data-testid="provisioned-user-row"]', email)
    .should('be.visible')
    .within(() => {
      cy.contains('member · pending').should('be.visible');
      cy.get(`[data-testid="button-send-invite-${email}"]`).should('be.visible');
    });
}

export function clickSendInvite(email: string) {
  cy.contains('[data-testid="provisioned-user-row"]', email)
    .should('be.visible')
    .within(() => {
      cy.get(`[data-testid="button-send-invite-${email}"]`).should('be.visible').click();
    });
}

export function activateViaInvitationEmail(persona: E2ePersona, invitationId?: string) {
  cy.fixture('e2e-context.json').then((ctx: E2eContext) => {
    const { email } = resolvePersonaEmail(persona, ctx);
    cy.signOut();
    waitForInvitationLink(email, invitationId).then((link) => {
      cy.visit(link);
      cy.get('[data-testid="accept-invitation-status"]').should('be.visible');
      cy.login(persona, { mode: 'fresh' });
      cy.contains('Welcome to your Dashboard!', { timeout: 20000 }).should('be.visible');
      cy.get('[data-testid="button-user-menu"]').should('be.visible');
    });
  });
}
