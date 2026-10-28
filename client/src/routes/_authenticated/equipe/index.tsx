import { createFileRoute } from '@tanstack/react-router';
import { EquipeAcompanhamentoPage } from '@/pages/equipe-acompanhamento';

export const Route = createFileRoute('/_authenticated/equipe/')({
  component: EquipeAcompanhamentoPage,
});
