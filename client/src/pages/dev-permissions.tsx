import { Link } from '@tanstack/react-router';
import { usePermission, useTenantsData } from '@djpanda/convex-tenants/react';
import { useQuery } from 'convex/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '../../../convex/_generated/api';

function PermissionButton({
  testId,
  deniedTestId,
  label,
  allowed,
  isLoading,
}: {
  testId: string;
  deniedTestId?: string;
  label: string;
  allowed: boolean;
  isLoading: boolean;
}) {
  const showDenied = !isLoading && !allowed;

  return (
    <>
      <Button
        data-testid={testId}
        variant={allowed ? 'default' : 'outline'}
        disabled={!allowed || isLoading}
        className={allowed ? undefined : 'opacity-60'}
      >
        {label} {isLoading ? '(checking...)' : allowed ? '(allowed)' : '(denied)'}
      </Button>
      {showDenied && deniedTestId ? (
        <span data-testid={deniedTestId} className="sr-only">
          denied
        </span>
      ) : null}
    </>
  );
}

export function DevPermissionsPage() {
  const currentUser = useQuery(api.users.current, {});
  const isPlatformAdmin = useQuery(api.platform.isCurrentUserPlatformAdmin, {});
  const { currentOrganization, currentRole, isOrganizationsLoading } = useTenantsData();
  const permissionsLoading = isOrganizationsLoading || !currentOrganization?._id;

  const todosCreate = usePermission({
    organizationId: currentOrganization?._id,
    permission: 'todos:create',
    checkPermissionQuery: api.tenants.checkPermission,
  });
  const todosDelete = usePermission({
    organizationId: currentOrganization?._id,
    permission: 'todos:delete',
    checkPermissionQuery: api.tenants.checkPermission,
  });
  const membersList = usePermission({
    organizationId: currentOrganization?._id,
    permission: 'members:list',
    checkPermissionQuery: api.tenants.checkPermission,
  });
  const settingsManage = usePermission({
    organizationId: currentOrganization?._id,
    permission: 'settings:manage',
    checkPermissionQuery: api.tenants.checkPermission,
  });

  return (
    <div className="container space-y-6 px-4 py-8 md:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dev permissions</h1>
          <p className="text-sm text-muted-foreground">Permission probe page for e2e/dev.</p>
        </div>
        <Link to="/">
          <Button variant="outline">Dashboard</Button>
        </Link>
      </div>

      <Card data-testid="permissions-debug-panel">
        <CardHeader>
          <CardTitle>Current context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div>Email: {currentUser?.email ?? 'unknown'}</div>
          <div>Org: {currentOrganization?.name ?? 'none'}</div>
          <div>Role: {currentRole ?? 'none'}</div>
          <div>Platform admin: {String(isPlatformAdmin ?? false)}</div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <PermissionButton
          testId="permission-todos-create"
          label="Create todos"
          allowed={todosCreate.allowed}
          isLoading={permissionsLoading || todosCreate.isLoading}
        />
        <PermissionButton
          testId="permission-todos-delete"
          deniedTestId="permission-todos-delete-denied"
          label="Delete todos"
          allowed={todosDelete.allowed}
          isLoading={permissionsLoading || todosDelete.isLoading}
        />
        <PermissionButton
          testId="permission-members-list"
          label="List members"
          allowed={membersList.allowed}
          isLoading={permissionsLoading || membersList.isLoading}
        />
        <PermissionButton
          testId="permission-settings-manage"
          deniedTestId="permission-settings-manage-denied"
          label="Manage settings"
          allowed={settingsManage.allowed}
          isLoading={permissionsLoading || settingsManage.isLoading}
        />
        <Button
          data-testid="permission-platform-manage"
          variant={isPlatformAdmin ? 'default' : 'outline'}
          disabled={!isPlatformAdmin}
        >
          Platform manage {isPlatformAdmin ? '(allowed)' : '(denied)'}
        </Button>
      </div>
    </div>
  );
}
