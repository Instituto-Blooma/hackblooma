import { internal } from '../_generated/api';
import type { MutationCtx } from '../_generated/server';

export function buildAcceptUrl(invitationId: string) {
  const siteUrl = (
    process.env.SITE_URL ??
    process.env.CONVEX_SITE_URL ??
    'http://localhost:5173'
  ).replace(/\/+$/, '');
  return `${siteUrl}/accept-invitation/${invitationId}`;
}

export async function sendInvitationEmail(
  ctx: MutationCtx,
  args: {
    inviteeIdentifier: string;
    organizationName: string;
    invitationId: string;
  }
) {
  await ctx.scheduler.runAfter(0, internal.emails.sendInvitation, {
    email: args.inviteeIdentifier,
    organizationName: args.organizationName,
    invitationId: args.invitationId,
    acceptUrl: buildAcceptUrl(args.invitationId),
  });
}

export async function afterInvitationResent(
  ctx: MutationCtx,
  args: {
    inviteeIdentifier: string;
    organizationName: string;
    invitationId: string;
  }
) {
  await sendInvitationEmail(ctx, args);
}
