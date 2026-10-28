import { createFileRoute } from '@tanstack/react-router';
import { HistoricoPage } from '@/pages/historico';

export const Route = createFileRoute('/_authenticated/historico')({
  component: HistoricoPage,
});
