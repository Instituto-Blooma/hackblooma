import type { AuthProviderConfig } from '@convex-dev/auth/server';
import Google from '@auth/core/providers/google';
import type { OAuthConfig } from '@auth/core/providers';

type GoogleProfile = {
  sub?: string;
  id?: string;
  name?: string | null;
  email?: string | null;
  picture?: string | null;
};

type UserinfoRequestContext = {
  tokens: {
    access_token?: string;
  };
  provider: {
    userinfo?: {
      url?: URL | string;
    };
  };
};

function createEmulateGoogleProvider(emulateUrl: string): AuthProviderConfig {
  return {
    id: 'google',
    name: 'Google',
    type: 'oauth',
    clientId: 'emulate-google-client-id',
    clientSecret: 'emulate-google-client-secret',
    authorization: {
      url: `${emulateUrl}/o/oauth2/v2/auth`,
      params: { scope: 'openid email profile' },
    },
    client: {
      token_endpoint_auth_method: 'client_secret_post',
    },
    token: {
      url: `${emulateUrl}/oauth2/token`,
      async conform(response: Response) {
        const data = await response.json();
        if (!response.ok || typeof data !== 'object' || data === null) {
          return response;
        }

        const { id_token: _idToken, ...rest } = data as { id_token?: string };
        return Response.json(rest, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      },
    },
    userinfo: {
      url: `${emulateUrl}/oauth2/v2/userinfo`,
      async request({ tokens, provider }: UserinfoRequestContext) {
        const response = await fetch(provider.userinfo?.url as URL, {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch emulated Google profile: ${response.status}`);
        }

        return response.json();
      },
    },
    profile(profile: GoogleProfile) {
      return {
        id: profile.id || profile.sub || '',
        name: profile.name ?? undefined,
        email: profile.email ?? undefined,
        image: profile.picture ?? undefined,
      };
    },
  } satisfies OAuthConfig<GoogleProfile>;
}

export function createGoogleProvider(): AuthProviderConfig {
  const googleClientId = process.env.AUTH_GOOGLE_ID?.trim();
  if (googleClientId) {
    return Google({
      clientId: googleClientId,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    });
  }

  const emulateUrl =
    process.env.AUTH_GOOGLE_EMULATE_URL?.trim().replace(/\/+$/, '') ?? 'http://localhost:4002';

  return createEmulateGoogleProvider(emulateUrl);
}
