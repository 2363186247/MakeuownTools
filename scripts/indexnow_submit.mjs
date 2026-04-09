import { appendFile, mkdir, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const publicDir = path.join(projectRoot, 'public');
const logDir = path.join(projectRoot, 'logs', 'indexnow');
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const DEFAULT_BATCH_SIZE = 10000;

function parseArgs(argv) {
  const options = {
    source: 'dist-sitemap',
    urlFile: '',
    dryRun: false,
    retries: 3,
  };

  for (const arg of argv.slice(2)) {
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg.startsWith('--source=')) {
      options.source = arg.split('=')[1] || options.source;
      continue;
    }

    if (arg.startsWith('--url-file=')) {
      options.urlFile = arg.split('=')[1] || '';
      continue;
    }

    if (arg.startsWith('--retries=')) {
      const n = Number(arg.split('=')[1]);
      if (Number.isFinite(n) && n >= 0) options.retries = Math.floor(n);
      continue;
    }
  }

  return options;
}

function isHexKeyFile(name) {
  return /^[a-f0-9]{16,128}\.txt$/i.test(name);
}

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function writeLog(logPath, event, data) {
  const line = JSON.stringify({ ts: new Date().toISOString(), event, ...data });
  await appendFile(logPath, `${line}\n`, 'utf8');
}

async function getSiteUrl() {
  if (process.env.SITE_URL) {
    return new URL(process.env.SITE_URL).toString().replace(/\/$/, '');
  }

  const configModule = await import(path.join(projectRoot, 'astro.config.mjs'));
  const site = configModule?.default?.site;
  if (!site) {
    throw new Error('SITE_URL not found. Set SITE_URL env var or define site in astro.config.mjs.');
  }

  return new URL(site).toString().replace(/\/$/, '');
}

async function findIndexNowKey() {
  if (process.env.INDEXNOW_KEY) {
    return process.env.INDEXNOW_KEY.trim();
  }

  const files = await readdir(publicDir, { withFileTypes: true });
  for (const file of files) {
    if (!file.isFile() || !isHexKeyFile(file.name)) continue;

    const keyFromName = file.name.replace(/\.txt$/i, '');
    const body = (await readFile(path.join(publicDir, file.name), 'utf8')).trim();
    if (body === keyFromName) {
      return keyFromName;
    }
  }

  throw new Error('IndexNow key not found. Set INDEXNOW_KEY or generate a key file in public/<key>.txt.');
}

async function resolveKeyLocation(siteUrl, key) {
  if (process.env.INDEXNOW_KEY_LOCATION) {
    return process.env.INDEXNOW_KEY_LOCATION.trim();
  }
  return `${siteUrl}/${key}.txt`;
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

async function collectUrlsFromSitemaps(siteUrl) {
  const sitemapIndexPath = path.join(distDir, 'sitemap-index.xml');
  const fallbackSitemapPath = path.join(distDir, 'sitemap.xml');

  let indexXml = '';
  try {
    indexXml = await readFile(sitemapIndexPath, 'utf8');
  } catch {
    indexXml = await readFile(fallbackSitemapPath, 'utf8');
  }

  const locs = extractLocTags(indexXml);
  const sitemapLocs = locs.filter((url) => url.endsWith('.xml'));
  const pageLocs = locs.filter((url) => !url.endsWith('.xml'));
  const collected = [...pageLocs];

  for (const sitemapUrl of sitemapLocs) {
    let localPath = '';
    try {
      const pathname = new URL(sitemapUrl).pathname;
      localPath = path.join(distDir, pathname.replace(/^\//, ''));
    } catch {
      continue;
    }

    let childXml = '';
    try {
      childXml = await readFile(localPath, 'utf8');
    } catch {
      continue;
    }

    const childLocs = extractLocTags(childXml).filter((url) => !url.endsWith('.xml'));
    collected.push(...childLocs);
  }

  const normalized = new Set();
  for (const raw of collected) {
    try {
      const u = new URL(raw);
      const site = new URL(siteUrl);
      if (u.host !== site.host) continue;
      normalized.add(u.toString());
    } catch {
      // Ignore invalid URLs in sitemap.
    }
  }

  return [...normalized];
}

async function collectUrlsFromFile(filePath, siteUrl) {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(projectRoot, filePath);
  const content = await readFile(abs, 'utf8');
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => Boolean(line) && !line.startsWith('#'));

  const filtered = new Set();
  const site = new URL(siteUrl);

  for (const line of lines) {
    try {
      const u = new URL(line);
      if (u.host === site.host) filtered.add(u.toString());
    } catch {
      // Ignore invalid lines.
    }
  }

  return [...filtered];
}

function splitBatches(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

async function submitBatch(payload, retries, logPath) {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      const res = await fetch(INDEXNOW_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      const body = await res.text();
      await writeLog(logPath, 'batch_response', {
        attempt,
        status: res.status,
        ok: res.ok,
        body,
      });

      if (!res.ok) {
        throw new Error(`IndexNow API responded ${res.status}: ${body}`);
      }

      return { ok: true, status: res.status, body };
    } catch (error) {
      await writeLog(logPath, 'batch_error', {
        attempt,
        message: error instanceof Error ? error.message : String(error),
      });

      if (attempt === retries) {
        return {
          ok: false,
          status: 0,
          body: error instanceof Error ? error.message : String(error),
        };
      }

      const backoffMs = 1000 * (2 ** attempt);
      await sleep(backoffMs);
      attempt += 1;
    }
  }

  return { ok: false, status: 0, body: 'Unexpected retry state.' };
}

async function main() {
  const options = parseArgs(process.argv);
  const siteUrl = await getSiteUrl();
  const key = await findIndexNowKey();
  const keyLocation = await resolveKeyLocation(siteUrl, key);

  await mkdir(logDir, { recursive: true });
  const logPath = path.join(logDir, `${nowStamp()}.jsonl`);

  let urls = [];
  if (options.source === 'url-file') {
    if (!options.urlFile) {
      throw new Error('When using --source=url-file, you must provide --url-file=<path>.');
    }
    urls = await collectUrlsFromFile(options.urlFile, siteUrl);
  } else {
    urls = await collectUrlsFromSitemaps(siteUrl);
  }

  await writeLog(logPath, 'start', {
    source: options.source,
    totalUrls: urls.length,
    siteUrl,
    keyLocation,
    dryRun: options.dryRun,
  });

  if (urls.length === 0) {
    console.log('No URLs found to submit.');
    console.log(`Log file: ${path.relative(projectRoot, logPath)}`);
    return;
  }

  if (options.dryRun) {
    console.log(`Dry run: ${urls.length} URLs are ready for IndexNow submission.`);
    console.log(`Sample URLs:\n- ${urls.slice(0, 5).join('\n- ')}`);
    console.log(`Log file: ${path.relative(projectRoot, logPath)}`);
    return;
  }

  const batches = splitBatches(urls, DEFAULT_BATCH_SIZE);
  let successCount = 0;

  for (let i = 0; i < batches.length; i += 1) {
    const batch = batches[i];
    const payload = {
      host: new URL(siteUrl).host,
      key,
      keyLocation,
      urlList: batch,
    };

    await writeLog(logPath, 'batch_submit', {
      index: i + 1,
      size: batch.length,
      sampleUrls: batch.slice(0, 5),
    });

    const result = await submitBatch(payload, options.retries, logPath);
    if (result.ok) {
      successCount += batch.length;
      console.log(`Batch ${i + 1}/${batches.length} submitted successfully (${batch.length} URLs).`);
    } else {
      console.error(`Batch ${i + 1}/${batches.length} failed: ${result.body}`);
      await writeLog(logPath, 'batch_failed_urls', {
        index: i + 1,
        failedCount: batch.length,
        failedUrls: batch,
      });
    }
  }

  const successRate = (successCount / urls.length) * 100;
  await writeLog(logPath, 'summary', {
    totalUrls: urls.length,
    successCount,
    successRate,
    failedCount: urls.length - successCount,
  });

  console.log(`IndexNow submission complete. Success: ${successCount}/${urls.length} (${successRate.toFixed(2)}%).`);
  console.log(`Log file: ${path.relative(projectRoot, logPath)}`);

  if (successCount < urls.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
