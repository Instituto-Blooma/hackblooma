import { createFileRoute } from '@tanstack/react-router';
import { CalendarioPage } from '@/pages/calendario';

export const Route = createFileRoute('/_authenticated/calendario')({
  component: CalendarioPage,
});
