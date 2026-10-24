import { convexEnvHas } from './convex-env.mjs';
import { isProxiedLocalConvex } from './env-urls.mjs';

/** @typedef {'google-oauth' | 'google-emulate' | 'e2e-programmatic'} DevAuthMode */

/**
 * Resolve local/CI/PR dev auth strategy.
 * PR previews (proxied local Convex) always use Google emulate.
 */
export function resolveDevAuthMode(env = process.env) {
  if (isProxiedLocalConvex()) {
    return 'google-emulate';
  }

  if (env.AUTH_GOOGLE_ID || convexEnvHas('AUTH_GOOGLE_ID')) {
    return 'google-oauth';
  }

  if (env.E2E === '1') {
    return 'e2e-programmatic';
  }

  return 'google-emulate';
}

/**
 * Whether to start the Google OAuth emulator process.
 * E2E stack also needs emulate for OAuth UI specs when programmatic auth is active.
 */
export function shouldStartGoogleEmulate(env = process.env, { forE2eStack = false } = {}) {
  const mode = resolveDevAuthMode(env);
  if (forE2eStack) {
    return mode !== 'google-oauth';
  }
  return mode === 'google-emulate';
}

export function usesGoogleOAuthCredentials(env = process.env) {
  return resolveDevAuthMode(env) === 'google-oauth';
}

export function e2eAuthSecretConfigured(env = process.env) {
  return env.E2E === '1';
}
