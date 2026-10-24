import { defineConfig } from 'cypress';
import { readFileSync, existsSync } from 'node:fs';
import { resolveConvexUrl } from './script/env-file.mjs';
import { mintAuthToken } from './cypress/tasks/mintAuthToken.mjs';
import { verifyAuthSession } from './cypress/tasks/verifyAuthSession.mjs';
import {
  resetE2eFixturesForSpec,
  readSessionEpochFromContext,
} from './cypress/plugins/resetE2eFixtures.mjs';

const convexUrl = resolveConvexUrl();

function loadInitialSessionEpoch(): string | undefined {
  const path = 'cypress/fixtures/e2e-context.json';
  if (!existsSync(path)) {
    return undefined;
  }
  try {
    const ctx = JSON.parse(readFileSync(path, 'utf8')) as { sessionEpoch?: string };
    return ctx.sessionEpoch;
  } catch {
    return undefined;
  }
}

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    defaultCommandTimeout: 15000,
    retries: { runMode: 1, openMode: 0 },
    video: false,
    screenshotOnRunFailure: true,
    experimentalRunAllSpecs: true,
    env: {
      convexUrl,
      sessionEpoch: loadInitialSessionEpoch(),
      RESEND_EMULATE_URL: process.env.RESEND_EMULATE_URL ?? 'http://localhost:4003',
    },
    setupNodeEvents(on, config) {
      on('task', {
        mintAuthToken,
        verifyAuthSession,
      });

      on('before:spec', (spec) => {
        const epoch = resetE2eFixturesForSpec(spec.relative);
        if (epoch) {
          config.env.sessionEpoch = epoch;
        }
      });

      on('before:run', () => {
        const epoch = readSessionEpochFromContext();
        if (epoch) {
          config.env.sessionEpoch = epoch;
        }
      });

      return config;
    },
  },
});
