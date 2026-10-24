import { afterEach, describe, expect, it } from 'vitest';
import { isAllowlistedPlatformEmail } from './auth';
import { isOAuthAllowedStatus } from './onboarding';
import { FIRST_SETUP_ORG_NAME, FIRST_SETUP_ORG_SLUG } from '../testing/e2e';

const FIRST_SETUP_ADMIN_EMAILS = [
  'dev@example.com',
  'platform@example.com',
  'admin@example.com',
  'testuser@gmail.com',
];

describe('first-setup OAuth allowlist', () => {
  const previous = process.env.PLATFORM_ADMIN_EMAILS;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.PLATFORM_ADMIN_EMAILS;
    } else {
      process.env.PLATFORM_ADMIN_EMAILS = previous;
    }
  });

  it('allows the Google emulate first-setup personas when PLATFORM_ADMIN_EMAILS is unset', () => {
    delete process.env.PLATFORM_ADMIN_EMAILS;

    for (const email of FIRST_SETUP_ADMIN_EMAILS) {
      expect(isAllowlistedPlatformEmail(email)).toBe(true);
    }
    expect(isAllowlistedPlatformEmail('unprovisioned@example.com')).toBe(false);
  });

  it('still blocks unprovisioned emails when a custom allowlist is set', () => {
    process.env.PLATFORM_ADMIN_EMAILS = 'ops@startup.com';

    expect(isAllowlistedPlatformEmail('ops@startup.com')).toBe(true);
    expect(isAllowlistedPlatformEmail('unprovisioned@example.com')).toBe(false);
  });
});

describe('OAuth onboarding gate', () => {
  it('treats a seeded user with no onboarding status as blocked', () => {
    expect(isOAuthAllowedStatus(undefined)).toBe(false);
  });

  it('allows invited and active users', () => {
    expect(isOAuthAllowedStatus('invited')).toBe(true);
    expect(isOAuthAllowedStatus('active')).toBe(true);
  });
});

describe('first-setup organization', () => {
  it('uses a ready-to-use org that does not collide with e2e fixture slugs', () => {
    expect(FIRST_SETUP_ORG_NAME).toBe('Acme Corp');
    expect(FIRST_SETUP_ORG_SLUG).toBe('acme-corp');
    expect(FIRST_SETUP_ORG_SLUG).not.toBe('e2e-acme-corp');
    expect(FIRST_SETUP_ORG_SLUG).not.toBe('e2e-beta-corp');
  });
});
