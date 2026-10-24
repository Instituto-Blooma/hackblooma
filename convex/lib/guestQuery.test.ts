import { describe, expect, it } from 'vitest';
import {
  GUEST_EMPTY_PAGE,
  GUEST_ONBOARDING_STATUS,
  GUEST_PERMISSION,
  guestPaginatedList,
} from './guestQuery';

describe('logout-safe query guest returns', () => {
  it('returns an empty page so list subscriptions stay quiet', () => {
    expect(GUEST_EMPTY_PAGE).toEqual({
      page: [],
      isDone: true,
      continueCursor: '',
    });
  });

  it('returns a paginated empty list only when the caller asked for a page', () => {
    expect(guestPaginatedList()).toEqual([]);
    expect(guestPaginatedList({ numItems: 20, cursor: null })).toEqual({
      page: [],
      isDone: true,
      continueCursor: '',
    });
  });

  it('denies permission checks without throwing', () => {
    expect(GUEST_PERMISSION).toEqual({
      allowed: false,
      reason: 'Not authenticated',
    });
  });

  it('reports onboarding as unknown for a signed-out viewer', () => {
    expect(GUEST_ONBOARDING_STATUS).toEqual({ status: 'unknown' });
  });
});
