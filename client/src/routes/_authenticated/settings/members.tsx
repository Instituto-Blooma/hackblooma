import { createFileRoute } from '@tanstack/react-router';
import { OrgSettingsMembersPage } from '@/pages/org-settings';

export const Route = createFileRoute('/_authenticated/settings/members')({
  component: OrgSettingsMembersPage,
});
