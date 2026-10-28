import { internal } from '../_generated/api';
import type { Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type { AvisoKind } from './olimpiadas';

/** Records an Aviso once per `dedupeKey` and schedules e-mail + notificação delivery. */
export async function createAviso(
  ctx: MutationCtx,
  args: {
    userId: Id<'users'>;
    kind: AvisoKind;
    olympiadId: Id<'olympiads'>;
    phaseId?: Id<'phases'>;
    title: string;
    body: string;
    dedupeKey: string;
  }
) {
  const existing = await ctx.db
    .query('avisos')
    .withIndex('by_user_and_dedupeKey', (q) =>
      q.eq('userId', args.userId).eq('dedupeKey', args.dedupeKey)
    )
    .first();
  if (existing) {
    return null;
  }
  const avisoId = await ctx.db.insert('avisos', { ...args, createdAt: Date.now() });
  await ctx.scheduler.runAfter(0, internal.avisosDelivery.deliver, { avisoId });
  return avisoId;
}
