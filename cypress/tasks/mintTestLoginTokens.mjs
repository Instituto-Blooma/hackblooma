import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api.js';

/**
 * Mint Convex Auth tokens via the gated test-login credentials provider.
 */
export async function mintTestLoginTokens({ convexUrl, secret, email }) {
  if (!convexUrl) {
    throw new Error('VITE_CONVEX_URL is not set (env or .env.local)');
  }
  if (!secret) {
    throw new Error('E2E_AUTH_SECRET is not set — run pnpm run e2e:setup or pnpm run e2e:run');
  }
  if (!email) {
    throw new Error('mintTestLoginTokens requires email');
  }

  const client = new ConvexHttpClient(convexUrl);
  const result = await client.action(api.auth.signIn, {
    provider: 'test-login',
    params: { email, secret },
  });

  const token = result?.tokens?.token;
  const refreshToken = result?.tokens?.refreshToken;
  if (!token || !refreshToken) {
    throw new Error(`Failed to mint auth token for ${email}`);
  }

  return { token, refreshToken };
}
