import { createFileRoute } from '@tanstack/react-router';
import { OlimpiadasPage } from '@/pages/olimpiadas';

export const Route = createFileRoute('/_authenticated/olimpiadas/')({
  component: OlimpiadasPage,
});
