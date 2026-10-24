import { createFileRoute } from '@tanstack/react-router';
import { DevTenantsPage } from '@/pages/dev-tenants';
import { requireDevTools } from '@/lib/route-guards';

export const Route = createFileRoute('/_authenticated/dev/tenants')({
  beforeLoad: () => {
    requireDevTools();
  },
  component: DevTenantsPage,
});
