import { execSync } from 'node:child_process';
import { readEnvLocalVar } from './env-file.mjs';
import { log, ROOT_DIR } from './lib.mjs';

/** @type {Map<string, string> | null} */
let cachedEnv = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseConvexEnvList(output) {
  const map = new Map();
  for (const line of output.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1);
    map.set(key, value);
  }
  return map;
}

function fetchConvexEnvList() {
  try {
    return execSync('npx convex env list', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return '';
  }
}

export function invalidateConvexEnvCache() {
  cachedEnv = null;
}

export function loadConvexEnv({ force = false } = {}) {
  if (!force && cachedEnv) {
    return cachedEnv;
  }
  cachedEnv = parseConvexEnvList(fetchConvexEnvList());
  return cachedEnv;
}

export function convexEnvHas(name) {
  return loadConvexEnv().has(name);
}

export function readConvexEnv(name) {
  return loadConvexEnv().get(name);
}

export async function setConvexEnvVar(name, value, { attempts = 3 } = {}) {
  const escaped = value.replace(/"/g, '\\"');
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      execSync(`npx convex env set -- ${name} "${escaped}"`, { stdio: 'inherit' });
      invalidateConvexEnvCache();
      return true;
    } catch {
      await sleep(1000);
    }
  }
  return false;
}

export async function unsetConvexEnvVar(name) {
  try {
    execSync(`npx convex env remove ${name}`, { stdio: 'inherit' });
    invalidateConvexEnvCache();
  } catch {
    // ignore
  }
}

/** Pass the value on stdin so `$` and quotes in a secret are not expanded by the shell. */
export async function setConvexEnvVarFromStdin(name, value, { attempts = 3 } = {}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      execSync(`npx convex env set -- ${name}`, {
        input: value,
        stdio: ['pipe', 'inherit', 'inherit'],
      });
      invalidateConvexEnvCache();
      return true;
    } catch {
      await sleep(1000);
    }
  }
  return false;
}

/**
 * One-shot `convex dev --once`. Returns false when push failed after writing
 * CONVEX_DEPLOYMENT so the caller can set required env and retry.
 */
export function runLocalConvexPushOnce(tag, { env = process.env, extraArgs = '' } = {}) {
  try {
    execSync(`npx convex dev --once --tail-logs=disable${extraArgs}`, {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      env,
      timeout: 600_000,
    });
    return true;
  } catch (error) {
    if (!readEnvLocalVar('CONVEX_DEPLOYMENT')) {
      throw error;
    }
    log(
      tag,
      'Convex function push did not finish (often missing required component env). Will set required env and retry.'
    );
    return false;
  }
}

/** Push local Convex, retrying once if the first push failed after writing CONVEX_DEPLOYMENT. */
export async function pushLocalConvexWithEnv(tag, { env = process.env, extraArgs = '' } = {}) {
  const pushed = runLocalConvexPushOnce(tag, { env, extraArgs });
  if (!pushed) {
    const retried = runLocalConvexPushOnce(tag, { env, extraArgs });
    if (!retried) {
      throw new Error('Convex bootstrap still failed after setting required env vars.');
    }
  }
}
