import type { Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';

async function reassignTodosCreatedBy(
  ctx: MutationCtx,
  organizationId: string,
  fromUserId: Id<'users'>,
  toUserId: Id<'users'>
) {
  const todos = await ctx.db
    .query('todos')
    .withIndex('by_org', (q) => q.eq('organizationId', organizationId))
    .collect();
  for (const todo of todos) {
    if (todo.createdBy === fromUserId) {
      await ctx.db.patch(todo._id, { createdBy: toUserId, userId: toUserId });
    }
  }
}

const SUCCESSION_HANDLERS = [{ reassign: reassignTodosCreatedBy }] as const;

export async function reassignAllOrgResources(
  ctx: MutationCtx,
  organizationId: string,
  fromUserId: Id<'users'>,
  toUserId: Id<'users'>
) {
  for (const handler of SUCCESSION_HANDLERS) {
    await handler.reassign(ctx, organizationId, fromUserId, toUserId);
  }
}
