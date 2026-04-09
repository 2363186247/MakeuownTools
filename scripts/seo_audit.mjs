import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const logDir = path.join(projectRoot, 'logs', 'seo-audit');
const MIN_WORDS = 180;

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

function unique(items) {
  return [...new Set(items)];
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitle(html) {
  const match = html.match(/<title>([^<]*)<\/title>/i);
  return match ? match[1].trim() : '';
}

function extractMetaDescription(html) {
  const match = html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  return match ? match[1].trim() : '';
}

function extractCanonical(html) {
  const match = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  return match ? match[1].trim() : '';
}

function extractRobots(html) {
  const match = html.match(/<meta\s+[^>]*name=["']robots["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  return match ? match[1].trim() : '';
}

function countWords(text) {
  const words = text.match(/[\p{L}\p{N}]+(?:[\p{L}\p{N}'-]*)?/gu);
  return words ? words.length : 0;
}

function pathToDistFile(url) {
  const parsed = new URL(url);
  const pathname = parsed.pathname;
  if (pathname === '/') return path.join(distDir, 'index.html');
  if (pathname.endsWith('/')) return path.join(distDir, pathname.slice(1), 'index.html');
  return path.join(distDir, `${pathname.slice(1)}.html`);
}

async function collectUrlsFromSitemap() {
  const sitemapIndexPath = path.join(distDir, 'sitemap-index.xml');
  const sitemapPath = path.join(distDir, 'sitemap.xml');

  let xml = '';
  try {
    xml = await readFile(sitemapIndexPath, 'utf8');
  } catch {
    xml = await readFile(sitemapPath, 'utf8');
  }

  const locs = extractLocTags(xml);
  const sitemapLocs = locs.filter((item) => item.endsWith('.xml'));
  const pageLocs = locs.filter((item) => !item.endsWith('.xml'));
  const collected = [...pageLocs];

  for (const sitemapUrl of sitemapLocs) {
    try {
      const childPath = path.join(distDir, new URL(sitemapUrl).pathname.replace(/^\//, ''));
      const childXml = await readFile(childPath, 'utf8');
      collected.push(...extractLocTags(childXml).filter((item) => !item.endsWith('.xml')));
    } catch {
      // Ignore missing nested sitemap files.
    }
  }

  return unique(collected);
}

async function main() {
  await mkdir(logDir, { recursive: true });
  const logPath = path.join(logDir, `${nowStamp()}.json`);

  const urls = await collectUrlsFromSitemap();
  const pages = [];
  const titleMap = new Map();
  const descriptionMap = new Map();

  for (const url of urls) {
    try {
      const filePath = pathToDistFile(url);
      const html = await readFile(filePath, 'utf8');
      const title = extractTitle(html);
      const description = extractMetaDescription(html);
      const canonical = extractCanonical(html);
      const robots = extractRobots(html);
      const text = stripHtml(html);
      const wordCount = countWords(text);
      const queryString = new URL(url).search;

      const entry = {
        url,
        title,
        description,
        canonical,
        robots,
        wordCount,
        queryString,
        isThin: wordCount < MIN_WORDS,
      };

      pages.push(entry);

      if (title) {
        if (!titleMap.has(title)) titleMap.set(title, []);
        titleMap.get(title).push(url);
      }

      if (description) {
        if (!descriptionMap.has(description)) descriptionMap.set(description, []);
        descriptionMap.get(description).push(url);
      }
    } catch (error) {
      pages.push({
        url,
        title: '',
        description: '',
        canonical: '',
        robots: '',
        wordCount: 0,
        queryString: '',
        isThin: true,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  const duplicateTitles = [...titleMap.entries()].filter(([, urlsWithSameTitle]) => urlsWithSameTitle.length > 1);
  const duplicateDescriptions = [...descriptionMap.entries()].filter(([, urlsWithSameDescription]) => urlsWithSameDescription.length > 1);
  const thinPages = pages.filter((page) => page.isThin);
  const noindexQueryPages = pages.filter((page) => page.queryString && page.robots.includes('noindex'));
  const canonicalMismatches = pages.filter((page) => page.canonical && page.canonical !== page.url && !(page.queryString && page.canonical === page.url.split('?')[0]));

  const report = {
    summary: {
      totalPages: pages.length,
      duplicateTitleGroups: duplicateTitles.length,
      duplicateDescriptionGroups: duplicateDescriptions.length,
      thinPages: thinPages.length,
      noindexQueryPages: noindexQueryPages.length,
      canonicalMismatches: canonicalMismatches.length,
      thinThresholdWords: MIN_WORDS,
    },
    duplicates: {
      titles: duplicateTitles.map(([title, urlsWithSameTitle]) => ({ title, urls: urlsWithSameTitle })),
      descriptions: duplicateDescriptions.map(([description, urlsWithSameDescription]) => ({ description, urls: urlsWithSameDescription }))
    },
    thinPages: thinPages
      .sort((a, b) => a.wordCount - b.wordCount)
      .slice(0, 50),
    canonicalMismatches: canonicalMismatches.slice(0, 50),
    noindexQueryPages: noindexQueryPages.slice(0, 50)
  };

  await writeFile(logPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log(`SEO audit complete for ${pages.length} pages.`);
  console.log(`Duplicate title groups: ${report.summary.duplicateTitleGroups}`);
  console.log(`Duplicate description groups: ${report.summary.duplicateDescriptionGroups}`);
  console.log(`Thin pages (< ${MIN_WORDS} words): ${report.summary.thinPages}`);
  console.log(`Query URLs set to noindex: ${report.summary.noindexQueryPages}`);
  console.log(`Canonical mismatches: ${report.summary.canonicalMismatches}`);
  console.log(`Log file: ${path.relative(projectRoot, logPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
