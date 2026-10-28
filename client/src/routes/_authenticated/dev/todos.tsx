import { createFileRoute } from '@tanstack/react-router';
import { Dashboard } from '@/components/dashboard';
import { requireDevTools } from '@/lib/route-guards';

export const Route = createFileRoute('/_authenticated/dev/todos')({
  beforeLoad: () => {
    requireDevTools();
  },
  component: Dashboard,
});
