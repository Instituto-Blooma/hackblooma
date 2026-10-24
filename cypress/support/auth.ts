import type { E2eContext } from './e2e-context';
import { type E2ePersona, type LoginMode, resolvePersonaEmail } from './personas';

const AUTH_SURFACE_SELECTOR =
  '[data-testid="button-user-menu"], [data-testid="button-google-signin"]';
export const AUTH_LOADING_SELECTOR = '[data-testid="auth-loading"]';
const LOGIN_SCREEN_SELECTOR = '[data-testid="button-google-signin"]';
const CONVEX_AUTH_JWT_KEY = '__convexAuthJWT';
const CONVEX_AUTH_REFRESH_KEY = '__convexAuthRefreshToken';

interface MintedTokens {
  token: string;
  refreshToken: string;
}

function buildStorageNamespaces(convexUrl: string): string[] {
  const urls = new Set<string>([convexUrl]);
  if (convexUrl.includes('localhost')) {
    urls.add(convexUrl.replace('localhost', '127.0.0.1'));
  }
  if (convexUrl.includes('127.0.0.1')) {
    urls.add(convexUrl.replace('127.0.0.1', 'localhost'));
  }

  return [...urls].map((url) => url.replace(/[^a-zA-Z0-9]/g, ''));
}

export function seedAuthTokensInWindow(win: Window, tokens: MintedTokens) {
  const convexUrl = Cypress.env('convexUrl') as string;
  if (!convexUrl) {
    throw new Error('Cypress env convexUrl is not set');
  }

  for (const namespace of buildStorageNamespaces(convexUrl)) {
    win.localStorage.setItem(`${CONVEX_AUTH_JWT_KEY}_${namespace}`, tokens.token);
    win.localStorage.setItem(`${CONVEX_AUTH_REFRESH_KEY}_${namespace}`, tokens.refreshToken);
  }
}

function sessionCacheKey(sessionKey: string): string {
  const epoch = Cypress.env('sessionEpoch') as string | undefined;
  return epoch ? `${sessionKey}-${epoch}` : sessionKey;
}

function mintAuthTokens(email: string) {
  return cy.task<MintedTokens>('mintAuthToken', { email });
}

function visitWithFreshTokens(
  url: string,
  tokens: MintedTokens,
  visitOptions?: Partial<Cypress.VisitOptions>,
  onBeforeLoad?: (win: Window) => void
) {
  cy.visit(url, {
    ...visitOptions,
    onBeforeLoad(win) {
      seedAuthTokensInWindow(win, tokens);
      onBeforeLoad?.(win);
    },
  });
}

export function waitForAuthReady(validateSelector: string) {
  cy.get(AUTH_LOADING_SELECTOR, { timeout: 30000 }).should('not.exist');
  cy.get(LOGIN_SCREEN_SELECTOR).should('not.exist');
  cy.get(validateSelector, { timeout: 30000 }).should('exist');
}

function assertProgrammaticAuth(validateSelector: string) {
  waitForAuthReady(validateSelector);
  cy.get(validateSelector, { timeout: 30000 }).should('be.visible');
}

function resetEmulatedGoogleSession() {
  cy.clearCookies();
}

function clickEmulatedOAuthUser(email: string, displayName?: string) {
  cy.get('body').then(($body) => {
    const text = $body.text();
    if (text.includes(email)) {
      cy.contains(email, { timeout: 15000 }).click();
      return;
    }
    if (displayName && text.includes(displayName)) {
      cy.contains(displayName, { timeout: 15000 }).click();
      return;
    }
    throw new Error(`OAuth user not found: ${email}${displayName ? ` / ${displayName}` : ''}`);
  });
}

function completeEmulatedOAuth(email: string, displayName?: string) {
  cy.url({ timeout: 20000 }).should((url) => {
    expect(url).to.match(/4002|google-emulate|oauth/);
  });
  cy.url().then((url) => {
    if (url.includes(':4002')) {
      cy.origin(
        'http://localhost:4002',
        { args: { email, displayName } },
        ({ email: userEmail, displayName: userName }) => {
          cy.get('body').then(($body) => {
            const text = $body.text();
            if (text.includes(userEmail)) {
              cy.contains(userEmail, { timeout: 15000 }).click();
            } else if (userName && text.includes(userName)) {
              cy.contains(userName, { timeout: 15000 }).click();
            } else {
              throw new Error(`OAuth user not found: ${userEmail}`);
            }
          });
        }
      );
    } else {
      clickEmulatedOAuthUser(email, displayName);
    }
  });
  cy.url({ timeout: 20000 }).should('include', 'localhost:5173');
}

function performFreshOAuth(email: string, displayName?: string) {
  cy.visit('/');
  cy.get(AUTH_SURFACE_SELECTOR, { timeout: 20000 }).then(($el) => {
    if ($el.attr('data-testid') === 'button-user-menu') {
      cy.get('[data-testid="button-user-menu"]').click();
      cy.get('[data-testid="menu-signout"]').click();
      cy.get('[data-testid="button-google-signin"]', { timeout: 20000 }).should('be.visible');
    }
    cy.get('[data-testid="button-google-signin"]').click();
    completeEmulatedOAuth(email, displayName);
  });
}

function runProgrammaticSignIn(email: string, validateSelector: string, validatePath: string) {
  mintAuthTokens(email).then((tokens) => {
    visitWithFreshTokens(validatePath, tokens);
    assertProgrammaticAuth(validateSelector);
  });
}

function establishProgrammaticSession(
  email: string,
  sessionKey: string,
  validateSelector: string,
  validatePath: string,
  options?: { force?: boolean }
) {
  if (options?.force) {
    Cypress.session.clearAllSavedSessions();
  }

  cy.session(
    sessionCacheKey(sessionKey),
    () => {
      runProgrammaticSignIn(email, validateSelector, validatePath);
    },
    {
      validate() {
        mintAuthTokens(email).then((tokens) => {
          cy.task('verifyAuthSession', { token: tokens.token, expectedEmail: email });
        });
      },
      cacheAcrossSpecs: true,
    }
  );
}

function visitProgrammatically(
  url: string,
  email: string,
  sessionKey: string,
  validateSelector: string,
  validatePath: string
) {
  establishProgrammaticSession(email, sessionKey, validateSelector, validatePath);

  mintAuthTokens(email).then((tokens) => {
    visitWithFreshTokens(url, tokens);
  });

  cy.get(AUTH_LOADING_SELECTOR, { timeout: 30000 }).should('not.exist');
  cy.get('body').then(($body) => {
    if ($body.find(LOGIN_SCREEN_SELECTOR).length > 0) {
      establishProgrammaticSession(email, sessionKey, validateSelector, validatePath, {
        force: true,
      });
      mintAuthTokens(email).then((tokens) => {
        visitWithFreshTokens(url, tokens);
        assertProgrammaticAuth(validateSelector);
      });
      return;
    }
    assertProgrammaticAuth(validateSelector);
  });
}

declare global {
  namespace Cypress {
    interface Chainable {
      login(persona: E2ePersona, options?: { mode?: LoginMode }): Chainable<void>;
      signOut(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('signOut', () => {
  cy.visit('/');
  cy.get(AUTH_SURFACE_SELECTOR, { timeout: 20000 }).then(($el) => {
    if ($el.attr('data-testid') === 'button-user-menu') {
      cy.get('[data-testid="button-user-menu"]').click();
      cy.get('[data-testid="menu-signout"]').click();
      cy.get('[data-testid="button-google-signin"]', { timeout: 20000 }).should('be.visible');
    }
  });
});

Cypress.Commands.add('login', (persona: E2ePersona, options?: { mode?: LoginMode }) => {
  const mode = options?.mode ?? 'session';

  cy.fixture('e2e-context.json').then((ctx: E2eContext) => {
    const resolved = resolvePersonaEmail(persona, ctx);

    if (mode === 'attempt') {
      resetEmulatedGoogleSession();
      cy.visit('/');
      cy.get('[data-testid="button-google-signin"]', { timeout: 15000 }).click();
      completeEmulatedOAuth(resolved.email, resolved.displayName);
      return;
    }

    if (mode === 'fresh') {
      performFreshOAuth(resolved.email, resolved.displayName);
      cy.get('[data-testid="button-user-menu"]', { timeout: 20000 }).should('be.visible');
      return;
    }

    visitProgrammatically(
      resolved.path,
      resolved.email,
      resolved.sessionKey,
      resolved.validateSelector,
      resolved.path
    );
  });
});
