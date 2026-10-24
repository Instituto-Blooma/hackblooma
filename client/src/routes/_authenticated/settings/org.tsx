import { createFileRoute } from '@tanstack/react-router';
import { OrgSettingsOrgPage } from '@/pages/org-settings';

export const Route = createFileRoute('/_authenticated/settings/org')({
  component: OrgSettingsOrgPage,
});
