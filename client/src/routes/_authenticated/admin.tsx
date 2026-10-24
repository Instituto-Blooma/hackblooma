import { createFileRoute } from '@tanstack/react-router';
import { PlatformAdminPage } from '@/pages/platform-admin';

export const Route = createFileRoute('/_authenticated/admin')({
  component: PlatformAdminPage,
});
