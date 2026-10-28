import type { Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { authz } from '../authz';
import { isPlatformAdmin, orgScope, requireUserId } from './auth';
import { tenantsClient } from './tenantsClient';

/**
 * Equipe Blooma = platform admins plus Organization admins. Every other active member is a Menina.
 * Hackblooma runs a single Organization (CONTEXT.md, "Flagged ambiguities").
 */
export async function isEquipe(ctx: QueryCtx | MutationCtx, userId: Id<'users'>) {
  if (await isPlatformAdmin(ctx, userId)) {
    return true;
  }
  const organizations = await tenantsClient.listOrganizations(ctx, userId);
  for (const organization of organizations) {
    if (
      await authz
        .withTenant(organization._id)
        .hasRole(ctx, userId, 'admin', orgScope(organization._id))
    ) {
      return true;
    }
  }
  return false;
}

export async function requireEquipe(ctx: QueryCtx | MutationCtx) {
  const userId = await requireUserId(ctx);
  if (!(await isEquipe(ctx, userId))) {
    throw new Error('Só a Equipe Blooma pode fazer isso');
  }
  return userId;
}
