import type { E2eContext } from './e2e-context';

type FixturePersonaConfig = {
  emailKey: keyof E2eContext;
  displayName: string;
  sessionKey: string;
  path: string;
  validateSelector: string;
};

type StaticPersonaConfig = {
  email: string;
  displayName: string;
  sessionKey: string;
  path: string;
  validateSelector: string;
};

export const PERSONAS = {
  admin: {
    emailKey: 'adminEmail',
    displayName: 'Dev User',
    sessionKey: 'admin',
    path: '/',
    validateSelector: '[data-testid="button-user-menu"]',
  },
  platformAdmin: {
    emailKey: 'platformAdminEmail',
    displayName: 'Platform Admin',
    sessionKey: 'platform-admin',
    path: '/admin',
    validateSelector: '[data-testid="platform-admin-title"]',
  },
  orgAdmin: {
    emailKey: 'orgAAdminEmail',
    displayName: 'Org A Admin',
    sessionKey: 'org-admin',
    path: '/',
    validateSelector: '[data-testid="button-user-menu"]',
  },
  member: {
    emailKey: 'orgAMemberEmail',
    displayName: 'Org A Member',
    sessionKey: 'member',
    path: '/',
    validateSelector: '[data-testid="button-user-menu"]',
  },
  orgBAdmin: {
    emailKey: 'orgBAdminEmail',
    displayName: 'Org B Admin',
    sessionKey: 'org-b-admin',
    path: '/',
    validateSelector: '[data-testid="button-user-menu"]',
  },
  orgBMember: {
    emailKey: 'orgBMemberEmail',
    displayName: 'Org B Member',
    sessionKey: 'org-b-member',
    path: '/',
    validateSelector: '[data-testid="button-user-menu"]',
  },
  invited: {
    emailKey: 'invitedUserEmail',
    displayName: 'Invited User',
    sessionKey: 'invited-user',
    path: '/',
    validateSelector: '[data-testid="button-user-menu"]',
  },
  pending: {
    emailKey: 'pendingUserEmail',
    displayName: 'Pending User',
    sessionKey: 'pending-user',
    path: '/',
    validateSelector: '[data-testid="button-user-menu"]',
  },
  unprovisioned: {
    email: 'unprovisioned@example.com',
    displayName: 'Unprovisioned User',
    sessionKey: 'unprovisioned-user',
    path: '/',
    validateSelector: '[data-testid="button-user-menu"]',
  },
} as const satisfies Record<string, FixturePersonaConfig | StaticPersonaConfig>;

export type E2ePersona = keyof typeof PERSONAS;
export type LoginMode = 'session' | 'fresh' | 'attempt';

export function resolvePersonaEmail(
  persona: E2ePersona,
  ctx: E2eContext
): {
  email: string;
  displayName: string;
  sessionKey: string;
  path: string;
  validateSelector: string;
} {
  const config = PERSONAS[persona];
  if ('email' in config) {
    return config;
  }
  return {
    email: ctx[config.emailKey] as string,
    displayName: config.displayName,
    sessionKey: config.sessionKey,
    path: config.path,
    validateSelector: config.validateSelector,
  };
}
