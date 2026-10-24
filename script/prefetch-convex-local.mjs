#!/usr/bin/env node
/**
 * Prefetch Convex local backend (+ dashboard) into ~/.cache/convex so
 * `pnpm run build:convex:local` / local `convex dev --once` can skip GitHub downloads.
 *
 * Railway PR builds often fail with Convex's "File not found at …" because the
 * CLI treats any non-200 from github.com/releases/download as fatal, and those
 * asset URLs commonly 302 → release-assets.githubusercontent.com (or briefly
 * 403/5xx). This script downloads with redirects + retries via curl/fetch.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import {
  chmodSync,
  cpSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const CACHE_DIR = join(homedir(), '.cache', 'convex');
const BINARIES_DIR = join(CACHE_DIR, 'binaries');
const DASHBOARD_DIR = join(CACHE_DIR, 'dashboard');
const VERSION_API = 'https://version.convex.dev/v1/local_backend_version';
const MAX_ATTEMPTS = 5;

function log(message) {
  console.error(`[prefetch-convex-local] ${message}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getBinaryArtifactName() {
  switch (process.platform) {
    case 'darwin':
      if (process.arch === 'arm64') return 'convex-local-backend-aarch64-apple-darwin.zip';
      if (process.arch === 'x64') return 'convex-local-backend-x86_64-apple-darwin.zip';
      break;
    case 'linux':
      if (process.arch === 'arm64') return 'convex-local-backend-aarch64-unknown-linux-gnu.zip';
      if (process.arch === 'x64') return 'convex-local-backend-x86_64-unknown-linux-gnu.zip';
      break;
    case 'win32':
      return 'convex-local-backend-x86_64-pc-windows-msvc.zip';
  }
  throw new Error(`Unsupported platform ${process.platform}/${process.arch}`);
}

function executableName() {
  return process.platform === 'win32' ? 'convex-local-backend.exe' : 'convex-local-backend';
}

function githubAssetUrl(version, filename) {
  return `https://github.com/get-convex/convex-backend/releases/download/${version}/${filename}`;
}

function convexCliVersion() {
  try {
    const pkg = JSON.parse(
      readFileSync(join(process.cwd(), 'node_modules/convex/package.json'), 'utf8')
    );
    return pkg.version || '1.35.1';
  } catch {
    return '1.35.1';
  }
}

async function fetchLatestVersion() {
  const response = await fetch(VERSION_API, {
    headers: { 'Convex-Client': `npm-cli-${convexCliVersion()}` },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`version.convex.dev returned ${response.status}: ${text}`);
  }
  const data = await response.json();
  if (!data?.version) throw new Error('Invalid version.convex.dev response');
  return data.version;
}

function hasCurl() {
  const result = spawnSync('curl', ['--version'], { stdio: 'ignore' });
  return result.status === 0;
}

async function downloadWithCurl(url, destPath) {
  mkdirSync(dirname(destPath), { recursive: true });
  const tmpPath = `${destPath}.partial`;
  rmSync(tmpPath, { force: true });
  execFileSync(
    'curl',
    [
      '--fail',
      '--location',
      '--retry',
      '5',
      '--retry-delay',
      '2',
      '--retry-all-errors',
      '--connect-timeout',
      '30',
      '--max-time',
      '600',
      '--output',
      tmpPath,
      url,
    ],
    { stdio: ['ignore', 'inherit', 'inherit'] }
  );
  renameSync(tmpPath, destPath);
}

async function downloadWithFetch(url, destPath) {
  mkdirSync(dirname(destPath), { recursive: true });
  const tmpPath = `${destPath}.partial`;
  rmSync(tmpPath, { force: true });

  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url, { redirect: 'follow' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }
      if (!response.body) throw new Error('Empty response body');
      await pipeline(Readable.fromWeb(response.body), createWriteStream(tmpPath));
      renameSync(tmpPath, destPath);
      return;
    } catch (error) {
      lastError = error;
      rmSync(tmpPath, { force: true });
      log(`Download attempt ${attempt}/${MAX_ATTEMPTS} failed: ${error.message}`);
      if (attempt < MAX_ATTEMPTS) await sleep(1000 * 2 ** (attempt - 1));
    }
  }
  throw lastError;
}

async function downloadFile(url, destPath) {
  if (hasCurl()) {
    log(`Downloading with curl: ${url}`);
    await downloadWithCurl(url, destPath);
    return;
  }
  log(`Downloading with fetch: ${url}`);
  await downloadWithFetch(url, destPath);
}

async function unzipToDir(zipPath, destDir) {
  mkdirSync(destDir, { recursive: true });

  // Prefer system unzip when available (local/dev images).
  const unzip = spawnSync('unzip', ['-o', zipPath, '-d', destDir], {
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  if (unzip.status === 0) return;

  // Railway/Nixpacks images often lack unzip + python3 — use adm-zip.
  try {
    const { default: AdmZip } = await import('adm-zip');
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(destDir, true);
    return;
  } catch (error) {
    log(`adm-zip extract failed: ${error.message}`);
  }

  const py = spawnSync(
    'python3',
    [
      '-c',
      'import sys, zipfile; zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])',
      zipPath,
      destDir,
    ],
    { stdio: ['ignore', 'inherit', 'inherit'] }
  );
  if (py.status === 0) return;

  throw new Error(
    `Failed to unzip ${zipPath}. Tried unzip, adm-zip, and python3 (unzip exit ${unzip.status}, python exit ${py.status}).`
  );
}

async function ensureBinary(version) {
  const destDir = join(BINARIES_DIR, version);
  const binaryPath = join(destDir, executableName());
  if (existsSync(binaryPath)) {
    log(`Binary cache hit: ${binaryPath}`);
    return;
  }

  const artifact = getBinaryArtifactName();
  const workDir = join(tmpdir(), `convex-prefetch-${process.pid}`);
  mkdirSync(workDir, { recursive: true });
  const zipPath = join(workDir, artifact);
  const extractDir = join(workDir, 'extract');

  try {
    await downloadFile(githubAssetUrl(version, artifact), zipPath);
    await unzipToDir(zipPath, extractDir);
    const extractedBinary = join(extractDir, executableName());
    if (!existsSync(extractedBinary)) {
      throw new Error(`Zip did not contain ${executableName()}`);
    }
    mkdirSync(destDir, { recursive: true });
    renameSync(extractedBinary, binaryPath);
    if (process.platform !== 'win32') {
      chmodSync(binaryPath, 0o755);
    }
    log(`Installed binary: ${binaryPath}`);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

async function ensureDashboard(version) {
  const configPath = join(DASHBOARD_DIR, 'config.json');
  const outDir = join(DASHBOARD_DIR, 'out');
  if (existsSync(configPath) && existsSync(outDir)) {
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf8'));
      if (config?.version === version) {
        log(`Dashboard cache hit for ${version}`);
        return;
      }
    } catch {
      // re-download
    }
  }

  const workDir = join(tmpdir(), `convex-dashboard-prefetch-${process.pid}`);
  mkdirSync(workDir, { recursive: true });
  const zipPath = join(workDir, 'dashboard.zip');
  const extractDir = join(workDir, 'extract');

  try {
    await downloadFile(githubAssetUrl(version, 'dashboard.zip'), zipPath);
    rmSync(DASHBOARD_DIR, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });
    await unzipToDir(zipPath, extractDir);

    const entries = readdirSync(extractDir);
    for (const entry of entries) {
      cpSync(join(extractDir, entry), join(outDir, entry), { recursive: true });
    }

    if (entries.length === 1 && statSync(join(outDir, entries[0])).isDirectory()) {
      const nested = join(outDir, entries[0]);
      if (existsSync(join(nested, 'index.html'))) {
        for (const entry of readdirSync(nested)) {
          renameSync(join(nested, entry), join(outDir, entry));
        }
        rmSync(nested, { recursive: true, force: true });
      }
    }

    writeFileSync(configPath, JSON.stringify({ version }, null, 2));
    log(`Installed dashboard for ${version}`);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

async function main() {
  mkdirSync(join(CACHE_DIR, 'tmp'), { recursive: true });
  process.env.CONVEX_TMPDIR = process.env.CONVEX_TMPDIR || join(CACHE_DIR, 'tmp');

  const version = await fetchLatestVersion();
  log(`Latest local backend version: ${version}`);

  await ensureBinary(version);
  await ensureDashboard(version);

  log('Prefetch complete');
}

main().catch((error) => {
  console.error(`[prefetch-convex-local] ERROR: ${error?.stack || error}`);
  process.exit(1);
});
