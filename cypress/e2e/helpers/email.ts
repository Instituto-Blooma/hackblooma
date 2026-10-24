import type { EmulatedEmail } from '../../support/email';

const ACCEPT_INVITATION_LINK_PATTERN = /href="([^"]*\/accept-invitation\/[^"]+)"/;

export function parseAcceptInvitationLink(email: EmulatedEmail): string | null {
  const html = email.html ?? '';
  const match = html.match(ACCEPT_INVITATION_LINK_PATTERN);
  return match?.[1] ?? null;
}

export function hasAcceptInvitationLink(email: EmulatedEmail, invitationId?: string): boolean {
  const link = parseAcceptInvitationLink(email);
  if (!link) {
    return false;
  }
  if (!invitationId) {
    return true;
  }
  return link.includes(invitationId);
}

export function waitForInvitationLink(to: string, invitationId?: string) {
  return cy
    .waitForEmail(to, {
      match: (email) => hasAcceptInvitationLink(email, invitationId),
    })
    .then((email) => {
      const link = parseAcceptInvitationLink(email);
      if (!link) {
        throw new Error(`No accept-invitation link found for ${to}`);
      }
      return link;
    });
}
