import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_E2E_AUTH_SECRET,
  parseEnvFile,
  readEnvFile,
  readEnvLocalVar,
  requireE2eAuthSecret,
  resolveE2eSecret,
} from './env-file.mjs';

describe('parseEnvFile', () => {
  it('last assignment wins', () => {
    const parsed = parseEnvFile('FOO=first\nFOO=second\n');
    expect(parsed.FOO).toBe('second');
  });

  it('skips comments and blank lines', () => {
    const parsed = parseEnvFile('# comment\n\nBAR=baz\n');
    expect(parsed).toEqual({ BAR: 'baz' });
  });

  it('unquotes values', () => {
    const parsed = parseEnvFile('QUOTED="hello world"\nSINGLE=\'one\'\n');
    expect(parsed.QUOTED).toBe('hello world');
    expect(parsed.SINGLE).toBe('one');
  });
});

describe('readEnvLocalVar', () => {
  it('reads last value from file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'env-file-test-'));
    const envPath = join(dir, '.env.local');
    writeFileSync(envPath, 'VITE_CONVEX_URL=http://first\nVITE_CONVEX_URL=http://second\n');
    expect(readEnvLocalVar('VITE_CONVEX_URL', envPath)).toBe('http://second');
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('readEnvFile', () => {
  it('returns empty object when file missing', () => {
    expect(readEnvFile('/nonexistent/.env.local')).toEqual({});
  });
});

describe('resolveE2eSecret', () => {
  it('prefers an explicit env secret', () => {
    expect(resolveE2eSecret({ E2E_AUTH_SECRET: ' from-ci ' })).toBe('from-ci');
  });

  it('falls back to the local default', () => {
    expect(resolveE2eSecret({})).toBe(DEFAULT_E2E_AUTH_SECRET);
  });

  it('writes the resolved secret onto process.env', () => {
    const env = {};
    expect(requireE2eAuthSecret(env)).toBe(DEFAULT_E2E_AUTH_SECRET);
    expect(env.E2E_AUTH_SECRET).toBe(DEFAULT_E2E_AUTH_SECRET);
  });
});
