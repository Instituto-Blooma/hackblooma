import { createFileRoute } from '@tanstack/react-router';
import { OrgSettingsTeamsPage } from '@/pages/org-settings';

export const Route = createFileRoute('/_authenticated/settings/teams')({
  component: OrgSettingsTeamsPage,
});
