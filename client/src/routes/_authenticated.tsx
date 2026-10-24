import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { TenantsProvider, type TenantsAPI } from '@djpanda/convex-tenants/react';
import { useConvexAuth } from 'convex/react';
import { getRedirectPath } from '@/lib/route-guards';
import { api } from '../../../convex/_generated/api';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: getRedirectPath(location),
        },
      });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { isAuthenticated } = useConvexAuth();
  if (!isAuthenticated) {
    return null;
  }

  return (
    <TenantsProvider api={api.tenants as unknown as TenantsAPI}>
      <Outlet />
    </TenantsProvider>
  );
}
