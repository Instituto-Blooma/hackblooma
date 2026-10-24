import { redirect } from '@tanstack/react-router';
import { isDevToolsEnabled } from '@/lib/dev-tools';

export function getRedirectPath(location: { pathname: string; searchStr: string; hash: string }) {
  const search = location.searchStr ? `?${location.searchStr}` : '';
  return `${location.pathname}${search}${location.hash}`;
}

export function validateLoginSearch(search: Record<string, unknown>) {
  if (typeof search.redirect === 'string' && search.redirect.startsWith('/')) {
    return { redirect: search.redirect };
  }

  return {};
}

export function requireDevTools() {
  if (!isDevToolsEnabled()) {
    throw redirect({ to: '/' });
  }
}
