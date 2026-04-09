import { appendFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const logDir = path.join(projectRoot, 'logs', 'canonical-audit');

function parseArgs(argv) {
  const options = {
    sample: 30,
    timeoutMs: 15000,
  };

  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--sample=')) {
      const n = Number(arg.split('=')[1]);
      if (Number.isFinite(n) && n > 0) options.sample = Math.floor(n);
      continue;
    }

    if (arg.startsWith('--timeout-ms=')) {
      const n = Number(arg.split('=')[1]);
      if (Number.isFinite(n) && n > 0) options.timeoutMs = Math.floor(n);
      continue;
    }
  }

  return options;
}

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function extractLocTags(xmlText) {
  const urls = [];
  const regex = /<loc>([^<]+)<\/loc>/gi;
  let match = regex.exec(xmlText);
  while (match) {
    urls.push(match[1].trim());
    match = regex.exec(xmlText);
  }
  return urls;
}

function normalizeCanonical(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    parsed.search = '';
    return parsed.toString();
  } catch {
    return url;
  }
}

function randomSample(arr, size) {
  if (arr.length <= size) return [...arr];
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, size);
}

async function getAllUrlsFromDist() {
  const indexPath = path.join(distDir, 'sitemap-index.xml');
  const fallbackPath = path.join(distDir, 'sitemap.xml');

  let xml = '';
  try {
    xml = await readFile(indexPath, 'utf8');
  } catch {
    xml = await readFile(fallbackPath, 'utf8');
  }

  const locs = extractLocTags(xml);
  const sitemapLocs = locs.filter((item) => item.endsWith('.xml'));
  const pageLocs = locs.filter((item) => !item.endsWith('.xml'));
  const all = [...pageLocs];

  for (const sitemapUrl of sitemapLocs) {
    try {
      const pathname = new URL(sitemapUrl).pathname;
      const localPath = path.join(distDir, pathname.replace(/^\//, ''));
      const childXml = await readFile(localPath, 'utf8');
      all.push(...extractLocTags(childXml).filter((item) => !item.endsWith('.xml')));
    } catch {
      // Ignore missing local child sitemap files.
    }
  }

  return [...new Set(all)];
}

function extractCanonical(html) {
  const regex = /<link\s+[^>]*rel=["']canonical["'][^>]*>/i;
  const match = html.match(regex);
  if (!match) return '';

  const hrefMatch = match[0].match(/href=["']([^"']+)["']/i);
  return hrefMatch ? hrefMatch[1].trim() : '';
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'canonical-audit-bot/1.0'
      }
    });
    const body = await res.text();
    return { status: res.status, body, finalUrl: res.url };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const options = parseArgs(process.argv);
  const allUrls = await getAllUrlsFromDist();
  const sampled = randomSample(allUrls, options.sample);

  await mkdir(logDir, { recursive: true });
  const logPath = path.join(logDir, `${nowStamp()}.json`);

  const results = [];
  let pass = 0;

  for (const url of sampled) {
    const item = {
      url,
      finalUrl: '',
      status: 0,
      canonical: '',
      ok: false,
      reason: '',
    };

    try {
      const response = await fetchWithTimeout(url, options.timeoutMs);
      item.status = response.status;
      item.finalUrl = response.finalUrl;
      item.canonical = extractCanonical(response.body);

      if (!item.canonical) {
        item.reason = 'missing canonical';
      } else {
        const expected = normalizeCanonical(item.finalUrl || item.url);
        const canonical = normalizeCanonical(item.canonical);
        if (expected === canonical) {
          item.ok = true;
          pass += 1;
        } else {
          item.reason = `canonical mismatch: expected ${expected} but got ${canonical}`;
        }
      }
    } catch (error) {
      item.reason = error instanceof Error ? error.message : String(error);
    }

    results.push(item);
  }

  const summary = {
    sampled: sampled.length,
    pass,
    fail: sampled.length - pass,
    passRate: sampled.length ? Number(((pass / sampled.length) * 100).toFixed(2)) : 0,
  };

  await appendFile(logPath, `${JSON.stringify({ summary, results }, null, 2)}\n`, 'utf8');

  console.log(`Canonical audit complete: ${summary.pass}/${summary.sampled} passed (${summary.passRate}%).`);
  console.log(`Log file: ${path.relative(projectRoot, logPath)}`);

  if (summary.fail > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
