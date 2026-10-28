import { createFileRoute } from '@tanstack/react-router';
import { ProximosPassosPage } from '@/pages/proximos-passos';

export const Route = createFileRoute('/_authenticated/')({
  component: ProximosPassosPage,
});
