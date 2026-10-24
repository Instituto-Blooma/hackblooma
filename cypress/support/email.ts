export type EmulatedEmail = {
  to?: string | string[];
  subject?: string;
  html?: string | null;
  text?: string | null;
};

function resendEmulateUrl() {
  return (Cypress.env('RESEND_EMULATE_URL') as string | undefined) ?? 'http://localhost:4003';
}

function recipientMatches(entry: EmulatedEmail, email: string) {
  const recipients = Array.isArray(entry.to) ? entry.to : entry.to ? [entry.to] : [];
  return recipients.some((recipient) => recipient.toLowerCase() === email.toLowerCase());
}

export function fetchEmails() {
  return cy
    .request({
      url: `${resendEmulateUrl()}/emails`,
      failOnStatusCode: false,
    })
    .then((response) => {
      const body = response.body as { data?: EmulatedEmail[] } | EmulatedEmail[];
      if (!Array.isArray(body) && Array.isArray(body.data)) {
        return body.data;
      }
      if (Array.isArray(body)) {
        return body;
      }
      return [];
    });
}

function findLatestEmail(
  messages: EmulatedEmail[],
  to: string,
  match?: (email: EmulatedEmail) => boolean
) {
  const matching = messages.filter((entry) => recipientMatches(entry, to));
  for (const message of matching.toReversed()) {
    if (!match || match(message)) {
      return message;
    }
  }
  return null;
}

declare global {
  namespace Cypress {
    interface Chainable {
      waitForEmail(
        to: string,
        options?: {
          timeout?: number;
          interval?: number;
          match?: (email: EmulatedEmail) => boolean;
        }
      ): Chainable<EmulatedEmail>;
    }
  }
}

Cypress.Commands.add(
  'waitForEmail',
  (
    to: string,
    options?: { timeout?: number; interval?: number; match?: (email: EmulatedEmail) => boolean }
  ) => {
    const timeout = options?.timeout ?? 20000;
    const interval = options?.interval ?? 500;
    const match = options?.match;
    const startedAt = Date.now();

    const poll = (): Cypress.Chainable<EmulatedEmail> =>
      fetchEmails().then<EmulatedEmail>((messages) => {
        const email = findLatestEmail(messages, to, match);
        if (email) {
          return cy.wrap(email, { log: false });
        }
        if (Date.now() - startedAt > timeout) {
          throw new Error(`Timed out waiting for email to ${to}`);
        }
        return cy.wait(interval, { log: false }).then(() => poll());
      });

    return poll();
  }
);
