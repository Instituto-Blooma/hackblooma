import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';

type DbCtx = QueryCtx | MutationCtx;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function findUsersByEmail(ctx: DbCtx, email: string) {
  return await ctx.db
    .query('users')
    .withIndex('email', (q) => q.eq('email', normalizeEmail(email)))
    .collect();
}

async function hasGoogleAuthAccount(ctx: DbCtx, userId: Id<'users'>): Promise<boolean> {
  const account = await ctx.db
    .query('authAccounts')
    .withIndex('userIdAndProvider', (q) => q.eq('userId', userId).eq('provider', 'google'))
    .first();
  return account !== null;
}

async function pickCanonicalUser(ctx: DbCtx, matches: Doc<'users'>[]): Promise<Doc<'users'>> {
  const verified = matches.find((user) => user.emailVerificationTime !== undefined);
  if (verified) {
    return verified;
  }

  for (const user of matches) {
    if (await hasGoogleAuthAccount(ctx, user._id)) {
      return user;
    }
  }

  return matches[0];
}

async function deleteOrphanUsers(
  ctx: MutationCtx,
  matches: Doc<'users'>[],
  canonicalId: Id<'users'>
): Promise<void> {
  for (const user of matches) {
    if (user._id === canonicalId) {
      continue;
    }
    if (await hasGoogleAuthAccount(ctx, user._id)) {
      continue;
    }
    await ctx.db.delete(user._id);
  }
}

export async function resolveCanonicalUserByEmail(
  ctx: DbCtx,
  email: string,
  options?: { cleanupOrphans?: boolean }
): Promise<Doc<'users'> | null> {
  const matches = await findUsersByEmail(ctx, email);
  if (matches.length === 0) {
    return null;
  }

  const canonical = await pickCanonicalUser(ctx, matches);
  if (options?.cleanupOrphans && 'runMutation' in ctx) {
    await deleteOrphanUsers(ctx as MutationCtx, matches, canonical._id);
  }
  return canonical;
}

export async function ensureUserByEmail(
  ctx: MutationCtx,
  email: string,
  name?: string
): Promise<{ user: Doc<'users'>; created: boolean }> {
  const normalized = normalizeEmail(email);
  const matches = await findUsersByEmail(ctx, normalized);

  if (matches.length === 0) {
    const userId = await ctx.db.insert('users', {
      name,
      email: normalized,
      emailVerificationTime: Date.now(),
    });
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error(`Failed to create user ${email}`);
    }
    return { user, created: true };
  }

  const canonical = await pickCanonicalUser(ctx, matches);
  await deleteOrphanUsers(ctx, matches, canonical._id);
  await ctx.db.patch(canonical._id, {
    ...(name !== undefined ? { name } : {}),
    emailVerificationTime: canonical.emailVerificationTime ?? Date.now(),
  });
  const user = await ctx.db.get(canonical._id);
  if (!user) {
    throw new Error(`User missing after patch: ${email}`);
  }
  return { user, created: false };
}
