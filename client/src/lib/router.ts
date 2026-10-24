import { createRouter } from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';
import type { RouterAuthContext } from '@/lib/router-auth-context';

export const router = createRouter({
  routeTree,
  context: {
    auth: {
      isAuthenticated: false,
    },
  } satisfies RouterAuthContext,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
