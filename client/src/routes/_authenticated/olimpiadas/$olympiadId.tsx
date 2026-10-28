import { createFileRoute } from '@tanstack/react-router';
import { OlimpiadaPage } from '@/pages/olimpiada';
import type { Id } from '../../../../../convex/_generated/dataModel';

export const Route = createFileRoute('/_authenticated/olimpiadas/$olympiadId')({
  component: OlimpiadaRoute,
});

function OlimpiadaRoute() {
  const { olympiadId } = Route.useParams();
  return <OlimpiadaPage key={olympiadId} olympiadId={olympiadId as Id<'olympiads'>} />;
}
