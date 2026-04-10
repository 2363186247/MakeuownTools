# 14-Day SEO Recovery Plan (Execution-Ready)

## Goal

Move from 0 visibility to first measurable indexing and impressions by focusing on crawl quality, index quality, and discovery signals.

## North-Star Metrics (Day 14 target)

- Google Search Console: at least 20 indexed pages
- Bing Webmaster: at least 20 indexed pages
- Search impressions: first non-zero trend
- Branded search clicks: first non-zero trend

## Daily Checklist Table

| Day | Priority | Actions | Deliverable | Success Check |
|---|---|---|---|---|
| 1 | Critical | Submit updated sitemap in GSC and Bing; run URL Inspection for homepage + 10 core pages | Submission log + screenshots | Both consoles show sitemap fetched successfully |
| 2 | Critical | Validate robots, canonical, and status for top 30 core URLs | QA sheet with URL/status/canonical | 30/30 URLs return 200 and self-canonical |
| 3 | High | Publish 3 high-intent pages (1 Docker, 1 NAS, 1 Solar) with unique examples and decision logic | 3 published pages | Pages visible in sitemap and linked from hubs |
| 4 | High | Add internal links from homepage and hubs to the 3 new pages and 10 existing core pages | Internal linking patch | Each new page gets at least 5 internal links |
| 5 | Critical | Request indexing for homepage, /docker/, /calculator/, /reverse-proxy/, 10 high-intent detail pages | URL inspection requests | At least 10 URLs move to discovered/crawled state |
| 6 | High | Publish 2 comparison pages with practical benchmarks and edge cases | 2 comparison pages | Pages have FAQ + table + actionable conclusion |
| 7 | High | Build first external discovery wave: 5 community posts answering real problems and linking relevant tools | Outreach log with URLs | At least 2 posts accepted/published |
| 8 | Critical | Review server logs and webmaster crawl stats; identify blocked or ignored URLs | Crawl diagnosis report | No critical crawl errors; core paths crawled |
| 9 | High | Publish 2 reference pages (quick reference + troubleshooting) tied to existing core calculators | 2 reference pages | Pages linked from at least 3 existing pages |
| 10 | High | Run content quality pass on top 20 core pages (add examples, constraints, and mistakes section) | Quality update changelog | Word-level uniqueness and practical depth improved |
| 11 | Medium | Create 1 "best entry" page per vertical: Docker, NAS, Solar, VRAM | 4 entry pages or sections | Each entry page links to 5-8 conversion pages |
| 12 | High | Second indexing push: request indexing for all newly published pages from days 3-11 | Index request list | At least 70% of requested pages are discovered |
| 13 | Medium | Evaluate impression and query data; identify first winning query clusters | Query cluster note | At least 3 query clusters identified |
| 14 | Critical | Decide next 30-day roadmap: expand winning clusters only, keep low-value pages out of sitemap | 30-day plan doc | Approved roadmap with page production priorities |

## Daily Operating Commands

```bash
npm run build
npm run seo:audit
npm run seo:audit:canonical
npm run indexnow:submit:dist
```

## URL Inspection Batch (recommended order)

1. /
2. /docker/
3. /reverse-proxy/
4. /calculator/
5. /calculator/vram/
6. /calculator/nas-raid/
7. /calculator/off-grid-solar/
8. /calculator/3d-printing/
9. /calculator/satisfactory/
10. /docker/compare/reverse-proxy-comparison/
11. /docker/decision/stack-selector/
12. /calculator/nas-raid/compare/raid-level-comparison/
13. /calculator/nas-raid/decision/raid-level-selector/
14. /calculator/nas-raid/reference/raid-capacity-matrix/
15. /calculator/nas-raid/reference/planning-quick-reference/

## Risk Controls

- Do not expand sitemap until indexed/valid ratio improves.
- Do not ship large batches of near-duplicate parameter pages.
- Do not route high-value anchor text to query URLs marked noindex.

## Weekly Retro Template

- What changed in indexed count?
- Which URLs were crawled but not indexed?
- Which queries showed first impressions?
- Which page types underperformed and should be paused?
- What 5 pages will be improved next week?
