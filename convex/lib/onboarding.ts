import { ConvexError } from 'convex/values';
import { components } from '../_generated/api';
import type { Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { authz } from '../authz';
import { bootstrapPlatformAdmin, orgScope } from './auth';
import { tenantsClient } from './tenantsClient';
import { findUsersByEmail, normalizeEmail } from './users';

type DbCtx = QueryCtx | MutationCtx;

export type OnboardingStatus = 'pending' | 'invited' | 'active';

export const DEFAULT_ORGANIZATION_NAME = 'Instituto Blooma';
export const DEFAULT_ORGANIZATION_SLUG = 'instituto-blooma';

export function isOAuthAllowedStatus(_status: OnboardingStatus | undefined): boolean {
  return true;
}

export function pickFirstCreatedOrganization<T extends { _id: string; _creationTime: number }>(
  organizations: T[]
): T | null {
  if (organizations.length === 0) {
    return null;
  }
  return organizations.reduce((earliest, organization) =>
    organization._creationTime < earliest._creationTime ? organization : earliest
  );
}

export function toUserId(userId: string): Id<'users'> {
  return userId as Id<'users'>;
}

export async function markUserPending(ctx: MutationCtx, userId: Id<'users'>) {
  await ctx.db.patch(userId, {
    onboardingStatus: 'pending',
    invitedAt: undefined,
    activatedAt: undefined,
  });
}

export async function markUserInvited(ctx: MutationCtx, userId: Id<'users'>) {
  await ctx.db.patch(userId, {
    onboardingStatus: 'invited',
    invitedAt: Date.now(),
  });
}

export async function markUserActive(ctx: MutationCtx, userId: Id<'users'>) {
  await ctx.db.patch(userId, {
    onboardingStatus: 'active',
    activatedAt: Date.now(),
  });
}

export async function resetUserOnboarding(ctx: MutationCtx, userId: Id<'users'>) {
  await ctx.db.patch(userId, {
    onboardingStatus: undefined,
    invitedAt: undefined,
    activatedAt: undefined,
  });
}

export function asInvitationList(
  result: Awaited<ReturnType<typeof tenantsClient.listInvitations>>
) {
  return Array.isArray(result) ? result : result.page;
}

export async function getFirstActiveInvitation(ctx: DbCtx, email: string) {
  const pendingInvitations = await tenantsClient.getPendingInvitations(ctx, normalizeEmail(email));
  return pendingInvitations.find((entry) => !entry.isExpired) ?? null;
}

export async function getPendingInvitationForOrg(
  ctx: DbCtx,
  organizationId: string,
  email: string
) {
  const normalized = normalizeEmail(email);
  const invitations = asInvitationList(
    await tenantsClient.listInvitations(ctx, organizationId, { status: 'pending' })
  );
  return (
    invitations.find(
      (invitation) => invitation.inviteeIdentifier === normalized && !invitation.isExpired
    ) ?? null
  );
}

export async function cancelPendingInvitationsForOrgEmail(
  ctx: MutationCtx,
  actorUserId: Id<'users'>,
  organizationId: string,
  email: string
) {
  const normalized = normalizeEmail(email);
  const invitations = asInvitationList(
    await tenantsClient.listInvitations(ctx, organizationId, { status: 'pending' })
  );
  for (const invitation of invitations) {
    if (invitation.inviteeIdentifier !== normalized) {
      continue;
    }
    try {
      await tenantsClient.cancelInvitation(ctx, actorUserId, invitation._id);
    } catch {
      // Invitation may have been accepted, cancelled, or declined concurrently.
    }
  }
}

export async function cancelPendingInvitationsForEmail(
  ctx: MutationCtx,
  actorUserId: Id<'users'>,
  email: string
) {
  const normalized = normalizeEmail(email);
  const organizations = await tenantsClient.listOrganizations(ctx, actorUserId);
  for (const organization of organizations) {
    await cancelPendingInvitationsForOrgEmail(ctx, actorUserId, organization._id, normalized);
  }

  // Fallback for invitations in orgs the actor no longer belongs to (stale e2e data).
  const visible = await tenantsClient.getPendingInvitations(ctx, normalized);
  for (const invitation of visible) {
    try {
      await tenantsClient.cancelInvitation(ctx, actorUserId, invitation._id);
    } catch {
      // ignore
    }
  }
}

export type SingleOrgCheckResult = { ok: true } | { ok: false; reason: 'already_in_another_org' };

export async function checkSingleOrg(
  ctx: MutationCtx,
  email: string,
  organizationId: string
): Promise<SingleOrgCheckResult> {
  const normalized = normalizeEmail(email);
  const users = await findUsersByEmail(ctx, normalized);
  const user = users[0];

  if (user) {
    const organizations = await tenantsClient.listOrganizations(ctx, user._id);
    for (const organization of organizations) {
      if (organization._id === organizationId) {
        continue;
      }
      const member = await tenantsClient.getMember(ctx, organization._id, user._id);
      if (member && (member.status ?? 'active') === 'active') {
        return { ok: false, reason: 'already_in_another_org' };
      }
    }
  }

  const pendingInvitations = await tenantsClient.getPendingInvitations(ctx, normalized);
  for (const invitation of pendingInvitations) {
    if (invitation.organizationId !== organizationId && !invitation.isExpired) {
      return { ok: false, reason: 'already_in_another_org' };
    }
  }

  return { ok: true };
}

export async function assertSingleOrgOrThrow(
  ctx: MutationCtx,
  email: string,
  organizationId: string
) {
  const result = await checkSingleOrg(ctx, email, organizationId);
  if (!result.ok) {
    throw new ConvexError('User already belongs to another organization');
  }
}

export async function assertOAuthAllowed(_ctx: MutationCtx, _email: string) {
  return { allowed: true as const };
}

async function listAllOrganizations(ctx: MutationCtx) {
  const organizations: Array<{
    _id: string;
    _creationTime: number;
    ownerId: string;
    status?: 'active' | 'suspended' | 'archived';
  }> = [];
  let cursor: string | null = null;

  while (true) {
    const page: { page: string[]; isDone: boolean; continueCursor: string } = await ctx.runQuery(
      components.tenants.organizations.listAllOrganizationIds,
      {
        paginationOpts: { numItems: 100, cursor },
      }
    );
    for (const organizationId of page.page) {
      const organization = await tenantsClient.getOrganization(ctx, organizationId);
      if (organization && (organization.status ?? 'active') === 'active') {
        organizations.push(organization);
      }
    }
    if (page.isDone) {
      break;
    }
    cursor = page.continueCursor;
  }

  return organizations;
}

async function addOrgMemberWithoutInvite(
  ctx: MutationCtx,
  organizationId: string,
  memberUserId: Id<'users'>,
  role: 'admin' | 'member',
  actorUserId: string
) {
  const existing = await tenantsClient.getMember(ctx, organizationId, memberUserId);
  if (!existing) {
    await ctx.runMutation(components.tenants.members.addMember, {
      userId: actorUserId,
      organizationId,
      memberUserId,
      role,
    });
  }

  const tenantAuthz = authz.withTenant(organizationId);
  const hasRole = await tenantAuthz.hasRole(ctx, memberUserId, role, orgScope(organizationId));
  if (!hasRole) {
    await tenantAuthz.assignRole(
      ctx,
      memberUserId,
      role,
      orgScope(organizationId),
      undefined,
      actorUserId
    );
  } else {
    await tenantAuthz.recomputeUser(ctx, memberUserId);
  }
}

async function ensureDefaultOrganization(ctx: MutationCtx, userId: Id<'users'>) {
  const existing = pickFirstCreatedOrganization(await listAllOrganizations(ctx));
  if (existing) {
    return existing;
  }

  const bySlug = await tenantsClient.getOrganizationBySlug(ctx, DEFAULT_ORGANIZATION_SLUG);
  if (bySlug) {
    return bySlug;
  }

  const organizationId = await ctx.runMutation(
    components.tenants.organizations.createOrganization,
    {
      userId,
      name: DEFAULT_ORGANIZATION_NAME,
      slug: DEFAULT_ORGANIZATION_SLUG,
      creatorRole: 'admin',
    }
  );
  await authz
    .withTenant(organizationId)
    .assignRole(ctx, userId, 'admin', orgScope(organizationId), undefined, userId);

  const created = await tenantsClient.getOrganization(ctx, organizationId);
  if (!created) {
    throw new ConvexError('Could not create the default organization');
  }
  return created;
}

export async function completeOnboarding(ctx: MutationCtx, userId: Id<'users'>, email: string) {
  await bootstrapPlatformAdmin(ctx, userId);

  const normalized = normalizeEmail(email);
  const user = await ctx.db.get(userId);
  if (!user) {
    return { activated: false as const };
  }

  const organizations = await tenantsClient.listOrganizations(ctx, userId);
  if (organizations.length > 0) {
    await markUserActive(ctx, userId);
    return { activated: true as const, organizationId: organizations[0]._id };
  }

  const invitation = await getFirstActiveInvitation(ctx, normalized);
  if (invitation) {
    const singleOrg = await checkSingleOrg(ctx, normalized, invitation.organizationId);
    if (singleOrg.ok) {
      await tenantsClient.acceptInvitation(ctx, invitation._id, userId, {
        acceptingUserIdentifier: normalized,
      });
      await markUserActive(ctx, userId);
      return { activated: true as const, organizationId: invitation.organizationId };
    }
  }

  const organization = await ensureDefaultOrganization(ctx, userId);
  const alreadyMember = await tenantsClient.getMember(ctx, organization._id, userId);
  if (!alreadyMember) {
    await addOrgMemberWithoutInvite(ctx, organization._id, userId, 'member', organization.ownerId);
  }

  await markUserActive(ctx, userId);
  return { activated: true as const, organizationId: organization._id };
}

export async function seedActiveUser(ctx: MutationCtx, userId: Id<'users'>) {
  await ctx.db.patch(userId, {
    onboardingStatus: 'active',
    activatedAt: Date.now(),
  });
}
