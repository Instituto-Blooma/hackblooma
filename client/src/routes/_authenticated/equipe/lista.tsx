import { createFileRoute } from '@tanstack/react-router';
import { EquipeListaPage } from '@/pages/equipe-lista';

export const Route = createFileRoute('/_authenticated/equipe/lista')({
  component: EquipeListaPage,
});
