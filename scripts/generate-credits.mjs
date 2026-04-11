/**
 * Regenerates src/md/credits.en.md and src/md/credits.cs.md from:
 * - scripts/credits-manual.json (curated entries first)
 * - npm: license-checker --json
 * - Rust: cargo metadata (transitive crates from Cargo.lock)
 *
 * Fails (exit 1, no writes) if any automated dependency uses a blocked license (GPL, AGPL, …).
 * Run from repo root: npm run credits:gen
 */

import { execFileSync, execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MANUAL_PATH = join(ROOT, 'scripts', 'credits-manual.json');
const PACKAGE_JSON = join(ROOT, 'package.json');
const CARGO_TOML = join(ROOT, 'src-tauri', 'Cargo.toml');
const OUT_EN = join(ROOT, 'src', 'md', 'credits.en.md');
const OUT_CS = join(ROOT, 'src', 'md', 'credits.cs.md');

const HEADERS = {
  en: `# Credits

This application uses the following open source components. Listed are name, link and licence.

`,
  cs: `# Zdroje

Tato aplikace využívá následující open source komponenty. Uvedeny jsou název, odkaz a licence.

`,
};

/** SPDX-like tokens that must never appear in automated deps (LGPL not blocked; see plan). */
function licenseTokenIsBlocked(token) {
  const t = token.trim();
  if (!t) return false;
  if (/^eupl-/i.test(t)) return false;
  if (/^agpl(-|$)/i.test(t)) return true;
  if (/^gpl(-|$)/i.test(t)) return true;
  if (/^sspl(-|$)/i.test(t)) return true;
  if (/^busl(-|$)/i.test(t)) return true;
  if (t.toLowerCase().includes('commons-clause')) return true;
  return false;
}

function extractLicenseTokens(licenseRaw) {
  if (licenseRaw == null) return [];
  const raw = Array.isArray(licenseRaw) ? licenseRaw.join(' OR ') : String(licenseRaw);
  if (/unknown/i.test(raw.trim()) || raw.trim() === '') return [];
  let s = raw.replace(/[()]/g, ' ');
  s = s.replace(/^licence:\s*/i, '').replace(/^license:\s*/i, '');
  const chunks = s.split(/\s+(?:OR|AND)\s+/i);
  const tokens = [];
  for (const chunk of chunks) {
    for (let w of chunk.trim().split(/\s+/)) {
      w = w.replace(/^[,;]+|[,;]+$/g, '');
      if (!w || /^(OR|AND)$/i.test(w)) continue;
      tokens.push(w);
    }
  }
  return tokens;
}

function collectPolicyViolations(id, licenseRaw) {
  const tokens = extractLicenseTokens(licenseRaw);
  const bad = [];
  for (const tok of tokens) {
    if (licenseTokenIsBlocked(tok)) bad.push(tok);
  }
  return bad.length ? { id, licenseRaw: String(licenseRaw), bad } : null;
}

function normalizeGitUrl(url) {
  if (!url || typeof url !== 'string') return null;
  let u = url.trim();
  const hash = u.indexOf('#');
  if (hash !== -1) u = u.slice(0, hash);
  if (u.startsWith('git+')) u = u.slice(4);
  if (u.startsWith('git://')) u = `https://${u.slice(6)}`;
  u = u.replace(/^ssh:\/\/git@github\.com\//, 'https://github.com/');
  if (u.endsWith('.git')) u = u.slice(0, -4);
  return u || null;
}

function npmRepositoryUrl(repo) {
  if (!repo) return null;
  if (typeof repo === 'string') return normalizeGitUrl(repo);
  if (typeof repo === 'object' && repo.url) return normalizeGitUrl(repo.url);
  return null;
}

function readManual() {
  const data = JSON.parse(readFileSync(MANUAL_PATH, 'utf8'));
  const entries = data.entries ?? [];
  const licensePolicySkipIds = new Set(data.licensePolicySkipIds ?? []);
  return { entries, licensePolicySkipIds };
}

function manualLicenseLine(entry, locale) {
  const lic = entry.license;
  if (typeof lic === 'string') return lic;
  if (lic && typeof lic === 'object') return lic[locale] ?? lic.en ?? lic.cs ?? '';
  return '';
}

function bullet(linkText, url, licenseLine) {
  return `- [${linkText}](${url}) — ${licenseLine}\n`;
}

function readRootPackage() {
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8'));
  return { name: pkg.name ?? '', license: pkg.license ?? null };
}

function runLicenseChecker() {
  const opts = {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  };
  try {
    const out = execSync('npx license-checker --json', { ...opts, shell: true });
    return JSON.parse(out);
  } catch (e) {
    console.error(e.stderr?.toString?.() || e.stdout?.toString?.() || e.message);
    throw e;
  }
}

function isRootNpmPackage(info, pkgName) {
  const p = info?.path ?? '';
  if (!p) return false;
  const norm = p.replace(/\\/g, '/');
  const rootNorm = ROOT.replace(/\\/g, '/');
  return norm === rootNorm || norm.endsWith(`/${pkgName}`) && !norm.includes('/node_modules/');
}

function npmEntries(licenseData, pkgName) {
  const rows = [];
  for (const [key, info] of Object.entries(licenseData)) {
    if (isRootNpmPackage(info, pkgName)) continue;
    const lic = info.licenses;
    const nameAt = key;
    const nameOnly = key.replace(/@[^@]+$/, '');
    const repo = npmRepositoryUrl(info.repository);
    const npmSlug = nameOnly.startsWith('@')
      ? nameOnly.split('/').map(encodeURIComponent).join('/')
      : encodeURIComponent(nameOnly);
    const url = repo ?? `https://www.npmjs.com/package/${npmSlug}`;
    rows.push({
      id: nameAt,
      licenseRaw: lic,
      linkText: nameAt,
      url,
      sortKey: nameAt.toLowerCase(),
    });
  }
  rows.sort((a, b) => (a.sortKey < b.sortKey ? -1 : a.sortKey > b.sortKey ? 1 : 0));
  return rows;
}

function runCargoMetadata() {
  const out = execFileSync(
    'cargo',
    ['metadata', '--manifest-path', CARGO_TOML, '--locked', '--format-version', '1'],
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 },
  );
  return JSON.parse(out);
}

function cargoRegistryRows(meta) {
  const { packages, resolve } = meta;
  if (!resolve?.root || !resolve.nodes?.length) {
    console.warn('cargo metadata: missing resolve graph');
    return [];
  }
  const byId = new Map(packages.map((p) => [p.id, p]));
  const nodeById = new Map(resolve.nodes.map((n) => [n.id, n]));
  const rootId = resolve.root;
  const seen = new Set();
  const queue = [rootId];

  while (queue.length) {
    const id = queue.shift();
    if (seen.has(id)) continue;
    seen.add(id);
    const node = nodeById.get(id);
    if (!node?.deps) continue;
    for (const d of node.deps) {
      if (d.pkg && !seen.has(d.pkg)) queue.push(d.pkg);
    }
  }

  const rows = [];
  for (const id of seen) {
    if (id === rootId) continue;
    const pkg = byId.get(id);
    if (!pkg) continue;
    const src = pkg.source ?? '';
    if (!src.startsWith('registry+')) continue;
    const nameAt = `${pkg.name}@${pkg.version}`;
    const repo = normalizeGitUrl(pkg.repository) ?? (pkg.homepage ? String(pkg.homepage).trim() : null);
    const url = repo ?? `https://crates.io/crates/${pkg.name}`;
    const lic = pkg.license ?? null;
    if (lic == null || String(lic).trim() === '') {
      console.warn(`cargo: missing license for ${nameAt} (see crates.io / Cargo.toml)`);
    }
    rows.push({
      id: nameAt,
      licenseRaw: lic,
      linkText: nameAt,
      url,
      sortKey: nameAt.toLowerCase(),
    });
  }
  rows.sort((a, b) => (a.sortKey < b.sortKey ? -1 : a.sortKey > b.sortKey ? 1 : 0));
  return rows;
}

function isCompositeLicense(raw) {
  const s = String(raw ?? '')
    .replace(/[()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Space-delimited only — do not use \\bOR\\b (matches "or" in GPL-3.0-or-later).
  return /\s+OR\s+/i.test(s) || /\s+AND\s+/i.test(s);
}

/** Pretty single SPDX / npm labels; dual SPDX lines keep identifiers (matches existing credits). */
function formatSingleLicense(raw, locale) {
  const s = String(raw ?? '')
    .trim()
    .replace(/[()]/g, '');
  const key = s.toLowerCase();
  const isCs = locale === 'cs';

  const map = {
    mit: isCs ? 'Licence MIT' : 'MIT License',
    isc: isCs ? 'Licence ISC' : 'ISC License',
    'apache-2.0': 'Apache License 2.0',
    'apache license 2.0': 'Apache License 2.0',
    'bsd-2-clause': 'BSD 2-Clause',
    'bsd-3-clause': 'BSD 3-Clause',
    '0bsd': isCs ? 'Licence 0BSD' : '0BSD',
    unlicense: isCs ? 'Licence Unlicense' : 'The Unlicense',
    'cc0-1.0': 'CC0-1.0',
    'mpl-2.0': 'MPL-2.0',
    'lgpl-2.1': isCs ? 'Licence LGPL-2.1' : 'LGPL-2.1',
    'lgpl-3.0': isCs ? 'Licence LGPL-3.0' : 'LGPL-3.0',
    'eupl-1.2': 'EUPL-1.2',
    'eupl-2.0': 'EUPL-2.0',
    'eupl-1.1': 'EUPL-1.1',
  };

  if (map[key]) return map[key];

  if (/^bsd\s*2[\s-]?clause/i.test(s)) return 'BSD 2-Clause';
  if (/^bsd\s*3[\s-]?clause/i.test(s)) return 'BSD 3-Clause';

  return s;
}

function normalizeCompositeSpdx(raw) {
  return String(raw ?? '')
    .trim()
    .replace(/[()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatLicenseForDisplay(raw, locale) {
  if (raw == null || String(raw).trim() === '') return locale === 'cs' ? 'Neznámá licence' : 'Unknown license';
  const str = Array.isArray(raw) ? raw.join(' OR ') : String(raw);
  if (isCompositeLicense(str)) {
    const inner = normalizeCompositeSpdx(str);
    if (locale === 'cs') return `Licence: ${inner}`;
    return inner;
  }
  return formatSingleLicense(str, locale);
}

function runPolicyGate(items, skipIds) {
  const violations = [];
  for (const row of items) {
    if (skipIds.has(row.id)) continue;
    const v = collectPolicyViolations(row.id, row.licenseRaw);
    if (v) violations.push(v);
  }
  if (!violations.length) return;
  console.error('Blocked non-permissive licenses detected:\n');
  for (const v of violations) {
    console.error(`  ${v.id}`);
    console.error(`    license: ${v.licenseRaw}`);
    console.error(`    blocked tokens: ${v.bad.join(', ')}\n`);
  }
  process.exit(1);
}

function main() {
  const { name: pkgName, license: rootPkgLicense } = readRootPackage();
  const { entries: manual, licensePolicySkipIds } = readManual();

  const licenseData = runLicenseChecker();
  const npmRows = npmEntries(licenseData, pkgName);

  let cargoRows = [];
  try {
    const meta = runCargoMetadata();
    cargoRows = cargoRegistryRows(meta);
  } catch (e) {
    console.error('cargo metadata failed:', e.message);
    process.exit(1);
  }

  const rootPolicyRow = {
    id: `${pkgName} (package.json)`,
    licenseRaw: rootPkgLicense,
  };
  runPolicyGate([rootPolicyRow, ...npmRows, ...cargoRows], licensePolicySkipIds);

  for (const locale of ['en', 'cs']) {
    let body = '';
    for (const e of manual) {
      body += bullet(e.linkText, e.url, manualLicenseLine(e, locale));
    }
    for (const row of npmRows) {
      body += bullet(row.linkText, row.url, formatLicenseForDisplay(row.licenseRaw, locale));
    }
    for (const row of cargoRows) {
      body += bullet(row.linkText, row.url, formatLicenseForDisplay(row.licenseRaw, locale));
    }
    const out = HEADERS[locale] + body;
    const path = locale === 'en' ? OUT_EN : OUT_CS;
    writeFileSync(path, out, 'utf8');
  }

  console.log(`Wrote ${OUT_EN} and ${OUT_CS}`);
}

main();
