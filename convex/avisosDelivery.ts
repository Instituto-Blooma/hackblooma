'use node';

import { v } from 'convex/values';
import webpush from 'web-push';
import { internal } from './_generated/api';
import { internalAction } from './_generated/server';

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

async function sendEmail(args: { to: string; subject: string; body: string; url: string }) {
  const apiKey = process.env.RESEND_API_KEY ?? 're_emulate_test_key';
  const baseUrl = (process.env.RESEND_BASE_URL ?? 'https://api.resend.com').replace(/\/+$/, '');
  const from = process.env.RESEND_FROM ?? 'onboarding@example.com';
  const response = await fetch(`${baseUrl}/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject: args.subject,
      html: `<p><strong>${escapeHtml(args.subject)}</strong></p><p>${escapeHtml(args.body)}</p><p><a href="${args.url}">Abrir a agenda de olimpíadas</a></p><p style="color:#666">Instituto Blooma · Meninas fazendo o futuro</p>`,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to send aviso email: ${response.status} ${await response.text()}`);
  }
}

function pushConfigured() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return false;
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? 'mailto:contato@institutoblooma.org.br',
    publicKey,
    privateKey
  );
  return true;
}

/** Sends one Aviso by e-mail and as a notificação on every device she enabled. */
export const deliver = internalAction({
  args: { avisoId: v.id('avisos') },
  handler: async (ctx, args) => {
    const payload = await ctx.runQuery(internal.avisos.getDeliveryPayload, {
      avisoId: args.avisoId,
    });
    if (!payload) {
      return null;
    }
    const siteUrl = (process.env.SITE_URL ?? 'http://localhost:5173').replace(/\/+$/, '');
    const url = `${siteUrl}${payload.path}`;

    if (payload.email) {
      try {
        await sendEmail({ to: payload.email, subject: payload.title, body: payload.body, url });
      } catch (error) {
        console.error(error);
      }
    }

    if (payload.subscriptions.length && pushConfigured()) {
      const message = JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.path,
      });
      for (const subscription of payload.subscriptions) {
        try {
          await webpush.sendNotification(subscription, message);
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await ctx.runMutation(internal.avisos.removeExpiredSubscription, {
              endpoint: subscription.endpoint,
            });
          } else {
            console.error(error);
          }
        }
      }
    }
    return null;
  },
});
