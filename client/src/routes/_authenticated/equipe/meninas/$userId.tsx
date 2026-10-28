import { createFileRoute } from '@tanstack/react-router';
import { EquipeMeninaPage } from '@/pages/equipe-menina';
import type { Id } from '../../../../../../convex/_generated/dataModel';

export const Route = createFileRoute('/_authenticated/equipe/meninas/$userId')({
  component: EquipeMeninaRoute,
});

function EquipeMeninaRoute() {
  const { userId } = Route.useParams();
  return <EquipeMeninaPage userId={userId as Id<'users'>} />;
}
