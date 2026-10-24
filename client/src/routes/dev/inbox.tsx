import { createFileRoute } from '@tanstack/react-router';
import { DevInboxPage } from '@/pages/dev-inbox';
import { requireDevTools } from '@/lib/route-guards';

export const Route = createFileRoute('/dev/inbox')({
  beforeLoad: () => {
    requireDevTools();
  },
  component: DevInboxPage,
});
