import {
  type AuthProviderConfig,
  type GenericActionCtxWithAuthConfig,
} from '@convex-dev/auth/server';
import { ConvexCredentials } from '@convex-dev/auth/providers/ConvexCredentials';
import type { Value } from 'convex/values';
import { internal } from '../_generated/api';
import type { DataModel } from '../_generated/dataModel';

export function createTestLoginProvider(): AuthProviderConfig {
  return ConvexCredentials({
    id: 'test-login',
    authorize: async (
      credentials: Partial<Record<string, Value | undefined>>,
      ctx: GenericActionCtxWithAuthConfig<DataModel>
    ) => {
      const expectedSecret = process.env.E2E_AUTH_SECRET?.trim();
      if (!expectedSecret) {
        throw new Error(
          'E2E programmatic auth is not enabled — set E2E_AUTH_SECRET on the Convex deployment (pnpm run e2e:setup)'
        );
      }

      const secret = typeof credentials.secret === 'string' ? credentials.secret : '';
      if (secret !== expectedSecret) {
        throw new Error('Invalid E2E auth credentials');
      }

      const email =
        typeof credentials.email === 'string' ? credentials.email.toLowerCase().trim() : '';
      if (!email) {
        return null;
      }

      const userId = await ctx.runQuery(internal.users.getIdByEmail, { email });
      if (!userId) {
        return null;
      }

      return { userId };
    },
  });
}
