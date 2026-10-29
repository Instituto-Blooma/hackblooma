import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ORGANIZATION_NAME,
  DEFAULT_ORGANIZATION_SLUG,
  isOAuthAllowedStatus,
  pickFirstCreatedOrganization,
} from './onboarding';

describe('pickFirstCreatedOrganization', () => {
  it('returns null when there are no organizations', () => {
    expect(pickFirstCreatedOrganization([])).toBeNull();
  });

  it('returns the only organization', () => {
    const only = { _id: 'org-a', _creationTime: 200, name: 'Blooma' };
    expect(pickFirstCreatedOrganization([only])).toEqual(only);
  });

  it('returns the earliest created organization when several exist', () => {
    const later = { _id: 'org-b', _creationTime: 300, name: 'Second' };
    const first = { _id: 'org-a', _creationTime: 100, name: 'First' };
    const middle = { _id: 'org-c', _creationTime: 200, name: 'Middle' };

    expect(pickFirstCreatedOrganization([later, first, middle])).toEqual(first);
  });
});

describe('default organization', () => {
  it('uses Instituto Blooma when the app has to create the first group', () => {
    expect(DEFAULT_ORGANIZATION_NAME).toBe('Instituto Blooma');
    expect(DEFAULT_ORGANIZATION_SLUG).toBe('instituto-blooma');
  });
});

describe('OAuth onboarding gate', () => {
  it('allows Google sign-in for people who have not been invited yet', () => {
    expect(isOAuthAllowedStatus(undefined)).toBe(true);
    expect(isOAuthAllowedStatus('pending')).toBe(true);
    expect(isOAuthAllowedStatus('invited')).toBe(true);
    expect(isOAuthAllowedStatus('active')).toBe(true);
  });
});
