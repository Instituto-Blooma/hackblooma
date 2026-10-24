import { createFileRoute } from '@tanstack/react-router';
import { AcceptInvitationPage } from '@/pages/accept-invitation';

export const Route = createFileRoute('/accept-invitation/$id')({
  component: AcceptInvitationPage,
});
