import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api.js';
import { resolveConvexUrl } from '../../script/env-file.mjs';

/**
 * Verify a minted JWT resolves to the expected user via users.current.
 */
export async function verifyAuthSession({ token, expectedEmail }) {
  const convexUrl = resolveConvexUrl();
  if (!convexUrl) {
    throw new Error('VITE_CONVEX_URL is not set (env or .env.local)');
  }
  if (!token) {
    throw new Error('verifyAuthSession requires token');
  }
  if (!expectedEmail) {
    throw new Error('verifyAuthSession requires expectedEmail');
  }

  const client = new ConvexHttpClient(convexUrl);
  client.setAuth(token);

  const user = await client.query(api.users.current, {});
  if (!user) {
    throw new Error('users.current returned null — token invalid or expired');
  }

  const normalizedExpected = expectedEmail.toLowerCase().trim();
  const normalizedActual = (user.email ?? '').toLowerCase().trim();
  if (normalizedActual !== normalizedExpected) {
    throw new Error(
      `Expected authenticated user ${normalizedExpected}, got ${normalizedActual || '(no email)'}`
    );
  }

  return { ok: true, email: user.email, role: user.role };
}
