export const GUEST_EMPTY_PAGE = {
  page: [],
  isDone: true as const,
  continueCursor: '',
};

export const GUEST_PERMISSION = {
  allowed: false,
  reason: 'Not authenticated',
} as const;

export const GUEST_ONBOARDING_STATUS = {
  status: 'unknown' as const,
};

/**
 * Logout-safe empty list for tenant subscriptions. Convex refetches live
 * queries when the auth token is cleared, before React unmounts. Return empty
 * instead of throwing "Not authenticated".
 */
export function guestPaginatedList<T>(
  paginationOpts?: unknown
): T[] | { page: T[]; isDone: true; continueCursor: string } {
  if (paginationOpts) {
    return { page: [], isDone: true, continueCursor: '' };
  }
  return [];
}
