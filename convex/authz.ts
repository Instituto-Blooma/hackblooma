import { Authz, definePermissions, defineRoles } from '@djpanda/convex-authz';
import {
  DEFAULT_TENANTS_PERMISSION_MAP,
  TENANTS_PERMISSIONS,
  TENANTS_ROLES,
} from '@djpanda/convex-tenants';
import { components } from './_generated/api';

const permissions = definePermissions(TENANTS_PERMISSIONS, {
  todos: { create: true, read: true, update: true, delete: true },
  settings: { view: true, manage: true },
  platform: { impersonate: true, manageAllOrgs: true },
});

const orgAdminTenantPermissions = {
  organizations: ['read', 'update'],
  members: ['add', 'remove', 'updateRole', 'suspend', 'unsuspend', 'list'],
  teams: [
    'create',
    'update',
    'delete',
    'addMember',
    'updateMemberRole',
    'removeMember',
    'list',
    'listMembers',
  ],
  invitations: ['create', 'cancel', 'resend', 'list'],
  permissions: ['grant', 'deny', 'viewLog'],
} as const;

const orgAdminAppPermissions = {
  todos: ['create', 'read', 'update', 'delete'],
  settings: ['view', 'manage'],
} as const;

const roles = defineRoles(permissions, TENANTS_ROLES, {
  admin: {
    ...orgAdminTenantPermissions,
    ...orgAdminAppPermissions,
  },
  member: {
    organizations: ['read'],
    members: ['list'],
    teams: ['list', 'listMembers'],
    invitations: ['list'],
    todos: ['create', 'read', 'update'],
    settings: ['view'],
  },
  platform_admin: {
    ...orgAdminTenantPermissions,
    ...orgAdminAppPermissions,
    platform: ['impersonate', 'manageAllOrgs'],
    organizations: ['create', 'read', 'update', 'delete'],
  },
});

export const authz = new Authz(components.authz, {
  permissions,
  roles,
  tenantId: 'saas-template',
});

export const tenantsPermissionMap = {
  ...DEFAULT_TENANTS_PERMISSION_MAP,
  createOrganization: 'platform:manageAllOrgs',
} as const;

export { permissions, roles };
