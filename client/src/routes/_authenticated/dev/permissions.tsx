import { createFileRoute } from '@tanstack/react-router';
import { DevPermissionsPage } from '@/pages/dev-permissions';
import { requireDevTools } from '@/lib/route-guards';

export const Route = createFileRoute('/_authenticated/dev/permissions')({
  beforeLoad: () => {
    requireDevTools();
  },
  component: DevPermissionsPage,
});
