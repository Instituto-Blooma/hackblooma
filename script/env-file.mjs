import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_ENV_LOCAL_PATH = path.resolve(process.cwd(), '.env.local');

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

/** Parse env file contents. Last assignment wins per key. */
export function parseEnvFile(contents) {
  const result = {};
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = unquote(trimmed.slice(separatorIndex + 1).trim());
    result[key] = value;
  }
  return result;
}

/** Read a single key from an env file. Last assignment wins. */
export function readEnvLocalVar(name, envLocalPath = DEFAULT_ENV_LOCAL_PATH) {
  if (!fs.existsSync(envLocalPath)) {
    return undefined;
  }
  const parsed = parseEnvFile(fs.readFileSync(envLocalPath, 'utf8'));
  return parsed[name];
}

/** Read all keys from an env file path. */
export function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  return parseEnvFile(fs.readFileSync(filePath, 'utf8'));
}

export function writeEnvLocalVar(name, value, envLocalPath = DEFAULT_ENV_LOCAL_PATH) {
  let contents = '';
  if (fs.existsSync(envLocalPath)) {
    contents = fs.readFileSync(envLocalPath, 'utf8');
  }
  const line = `${name}=${value}`;
  if (new RegExp(`^${name}=`, 'm').test(contents)) {
    contents = contents.replace(new RegExp(`^${name}=.*$`, 'm'), line);
  } else {
    contents =
      contents.endsWith('\n') || contents.length === 0
        ? `${contents}${line}\n`
        : `${contents}\n${line}\n`;
  }
  fs.writeFileSync(envLocalPath, contents, 'utf8');
}

export function removeEnvLocalVar(name, envLocalPath = DEFAULT_ENV_LOCAL_PATH) {
  if (!fs.existsSync(envLocalPath)) {
    return;
  }
  const contents = fs.readFileSync(envLocalPath, 'utf8');
  const next = contents
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith(`${name}=`))
    .join('\n');
  fs.writeFileSync(envLocalPath, next.endsWith('\n') ? next : `${next}\n`, 'utf8');
}

export const DEFAULT_E2E_AUTH_SECRET = 'local-e2e-secret';

export function resolveConvexUrl(env = process.env) {
  return env.VITE_CONVEX_URL ?? readEnvLocalVar('VITE_CONVEX_URL') ?? '';
}

/** Prefer an explicit env secret; fall back to the local default. */
export function resolveE2eSecret(env = process.env) {
  const fromEnv = env.E2E_AUTH_SECRET?.trim();
  return fromEnv || DEFAULT_E2E_AUTH_SECRET;
}

/** Ensure E2E_AUTH_SECRET is set on process.env and return it. */
export function requireE2eAuthSecret(env = process.env) {
  const secret = resolveE2eSecret(env);
  env.E2E_AUTH_SECRET = secret;
  return secret;
}
