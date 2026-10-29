// Mutating tests change pending/invited state — reset fixtures before this spec runs.

import { waitForInvitationLink } from './helpers/email';
import {
  activateViaInvitationEmail,
  assertPendingInviteRow,
  checkRadixCheckbox,
  clickSendInvite,
  visitInvitationAccept,
  visitPlatformAdminProvisionedOrg,
} from './helpers/onboarding';

const IMMEDIATE_INVITE_EMAIL = 'e2e-immediate@example.com';

describe('Onboarding', () => {
  before(() => {
    cy.exec('pnpm run e2e:setup', { timeout: 120_000, failOnNonZeroExit: true });
  });

  describe('Onboarding gates', () => {
    it('shows pending user row on platform admin panel', () => {
      cy.loadE2eContext().then((ctx) => {
        visitPlatformAdminProvisionedOrg(ctx.orgAId);
        assertPendingInviteRow(ctx.pendingUserEmail);
      });
    });

    it('lets a pending user sign in without waiting for an invitation email', () => {
      cy.login('pending', { mode: 'fresh' });
      cy.get('[data-testid="button-user-menu"]').should('be.visible');
      cy.get('[data-testid="org-name-label"]').should('be.visible');
    });

    it('assigns a new Google user to the first created organization', () => {
      cy.login('unprovisioned', { mode: 'fresh' });
      cy.get('[data-testid="button-user-menu"]').should('be.visible');
      cy.get('[data-testid="org-name-label"]').should('be.visible');
    });
  });

  describe('Onboarding invitations', () => {
    beforeEach(() => {
      cy.exec('pnpm run e2e:setup', { timeout: 120_000, failOnNonZeroExit: true });
    });

    it('sends deferred invitation email and activates the invitee', () => {
      cy.loadE2eContext().then((ctx) => {
        visitPlatformAdminProvisionedOrg(ctx.orgAId);
        clickSendInvite(ctx.pendingUserEmail);

        waitForInvitationLink(ctx.pendingUserEmail).then((link) => {
          expect(link).to.include('/accept-invitation/');
        });

        activateViaInvitationEmail('pending');
        cy.get('[data-testid="org-name-label"]').should('contain', ctx.orgAName);
      });
    });

    it('shows invitation accept page for seeded invitation', () => {
      cy.loadE2eContext().then((ctx) => {
        visitInvitationAccept(ctx.invitationId);
        cy.get('[data-testid="accept-invitation-status"]').should('be.visible');
        cy.contains("You're Invited!").should('be.visible');
      });
    });

    it('delivers seeded invitation email to emulate Resend inbox', () => {
      cy.loadE2eContext().then((ctx) => {
        waitForInvitationLink(ctx.invitedUserEmail, ctx.invitationId).then((link) => {
          expect(link).to.include(ctx.invitationAcceptPath);
        });
      });
    });

    it('activates seeded invited user through inbox link and Google sign-in', () => {
      cy.loadE2eContext().then((ctx) => {
        activateViaInvitationEmail('invited', ctx.invitationId);
        cy.get('[data-testid="org-name-label"]').should('contain', ctx.orgAName);
      });
    });

    it('sends invitation immediately when provisioning with send invite checked', () => {
      cy.loadE2eContext().then((ctx) => {
        visitPlatformAdminProvisionedOrg(ctx.orgAId, { fresh: true });
        cy.get('[data-testid="input-provision-email"]').clear().type(IMMEDIATE_INVITE_EMAIL);
        checkRadixCheckbox('checkbox-send-invite');
        cy.get('[data-testid="button-provision-user"]').click();

        waitForInvitationLink(IMMEDIATE_INVITE_EMAIL).then((link) => {
          expect(link).to.include('/accept-invitation/');
        });

        cy.contains(IMMEDIATE_INVITE_EMAIL).should('be.visible');
        cy.contains('[data-testid="provisioned-user-row"]', IMMEDIATE_INVITE_EMAIL).within(() => {
          cy.contains('invited').should('be.visible');
        });
      });
    });
  });
});
