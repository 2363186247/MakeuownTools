// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

const CORE_STATIC_PATHS = new Set([
  '/',
  '/calculator/',
  '/calculator/vram/',
  '/calculator/3d-printing/',
  '/calculator/satisfactory/',
  '/calculator/nas-raid/',
  '/calculator/nas-raid/compare/raid-level-comparison/',
  '/calculator/nas-raid/decision/raid-level-selector/',
  '/calculator/nas-raid/faq/',
  '/calculator/nas-raid/reference/raid-capacity-matrix/',
  '/calculator/nas-raid/reference/planning-quick-reference/',
  '/calculator/off-grid-solar/',
  '/docker/',
  '/docker/compare/reverse-proxy-comparison/',
  '/docker/decision/stack-selector/',
  '/docker/faq/',
  '/docker/reference/deployment-quick-reference/',
  '/docker/reference/proxy-capability-matrix/',
  '/reverse-proxy/'
]);

const CORE_NAS_PAGES = new Set([
  '/calculator/nas-raid/4x-8tb-raid5-calculator/',
  '/calculator/nas-raid/raid10-vs-raid5-storage-capacity/',
  '/calculator/nas-raid/uk-6x-12tb-raidz2-calculator/'
]);

const CORE_SOLAR_PAGES = new Set([
  '/calculator/off-grid-solar/12v-vs-24v-vs-48v-off-grid-solar-battery-calculator-24v-profile-2/',
  '/calculator/off-grid-solar/60w-1440m-plus-1000w-10m-12v-3sunh-1day-off-grid-solar-battery-calculator/',
  '/calculator/off-grid-solar/off-grid-solar-arizona-profile-2-60w-1440m-plus-1000w-10m-plus-40w-300m-24v-6.5sunh-1day-off-grid-solar-battery-calculator/'
]);

function normalizedPathFromPage(page) {
  try {
    const pathname = new URL(page).pathname;
    return pathname.endsWith('/') ? pathname : `${pathname}/`;
  } catch {
    return '';
  }
}

function isCoreSitemapPath(page) {
  const pathname = normalizedPathFromPage(page);
  if (!pathname) return false;

  if (CORE_STATIC_PATHS.has(pathname)) return true;
  if (CORE_NAS_PAGES.has(pathname)) return true;
  if (CORE_SOLAR_PAGES.has(pathname)) return true;

  if (/^\/docker\/[^/]+-[^/]+-[^/]+\/$/.test(pathname)) return true;
  if (/^\/reverse-proxy\/(?:nginx|caddy)-for-(?:node|react|python|ghost)\/$/.test(pathname)) return true;
  if (/^\/calculator\/3d-printing\/[^/]+-1-75mm\/$/.test(pathname)) return true;

  return false;
}

// https://astro.build/config
export default defineConfig({
  site: 'https://makeuowntools.dpdns.org',
  trailingSlash: 'always',
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [
    sitemap({
      filter: (page) => isCoreSitemapPath(page)
    })
  ]
});