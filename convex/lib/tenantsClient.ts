import { Tenants } from '@djpanda/convex-tenants';
import { components } from '../_generated/api';
import { authz, tenantsPermissionMap } from '../authz';

export const TENANT_ROLE_HIERARCHY = { admin: 2, member: 1 } as const;
export const TENANT_VALID_ROLES = ['admin', 'member'] as const;
export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const tenantsClient = new Tenants(components.tenants, {
  authz,
  creatorRole: 'admin',
  permissionMap: tenantsPermissionMap,
  roleHierarchy: TENANT_ROLE_HIERARCHY,
  defaultInvitationExpiration: SEVEN_DAYS_MS,
});
