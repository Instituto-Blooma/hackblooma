import { convexAuth, type AuthProviderConfig } from '@convex-dev/auth/server';
import type { MutationCtx } from './_generated/server';
import { createOrUpdateOAuthUser } from './lib/auth';
import { createGoogleProvider } from './lib/googleProvider';
import { createTestLoginProvider } from './lib/testLoginProvider';

function createAuthProviders(): AuthProviderConfig[] {
  const providers: AuthProviderConfig[] = [createGoogleProvider()];
  if (process.env.E2E_AUTH_SECRET?.trim()) {
    providers.push(createTestLoginProvider());
  }
  return providers;
}

export const { auth, signIn, signOut, store } = convexAuth({
  providers: createAuthProviders(),
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      return await createOrUpdateOAuthUser(ctx as MutationCtx, args);
    },
  },
});
