import { createFileRoute } from '@tanstack/react-router';
import { PerfilPage } from '@/pages/perfil';

export const Route = createFileRoute('/_authenticated/perfil')({
  component: PerfilPage,
});
