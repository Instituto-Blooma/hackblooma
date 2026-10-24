import { resolveConvexUrl, resolveE2eSecret } from '../../script/env-file.mjs';
import { mintTestLoginTokens } from './mintTestLoginTokens.mjs';

/**
 * Mint Convex Auth tokens for Cypress via the gated test-login credentials provider.
 */
export async function mintAuthToken({ email }) {
  return mintTestLoginTokens({
    convexUrl: resolveConvexUrl(),
    secret: resolveE2eSecret(),
    email,
  });
}
