import { createFileRoute } from '@tanstack/react-router';
import { DevFormPage } from '@/pages/dev-form';
import { requireDevTools } from '@/lib/route-guards';

export const Route = createFileRoute('/_authenticated/dev/form')({
  beforeLoad: () => {
    requireDevTools();
  },
  component: DevFormPage,
});
