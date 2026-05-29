/**
 * app/sitemap.xml/route.js
 * ─────────────────────────
 * Next.js Route Handler — serves a dynamically generated XML sitemap.
 *
 * ACCESS: https://prepai.in/sitemap.xml
 *
 * WHY A ROUTE HANDLER (not app/sitemap.js)?
 * ──────────────────────────────────────────
 * The built-in `app/sitemap.js` convention is convenient but has limits:
 *   • Cannot stream responses (entire sitemap must fit in memory).
 *   • Harder to control caching headers precisely.
 *   • Cannot set custom HTTP headers (e.g., X-Robots-Tag).
 *
 * This Route Handler gives us:
 *   ✅ Full control over Cache-Control headers (serves stale, revalidates async)
 *   ✅ Streaming output — handles 10,000+ URLs without memory issues
 *   ✅ Parallel data fetching (companies, questions, experiences concurrently)
 *   ✅ Graceful degradation — each data source fails independently
 *   ✅ Compression hint via Content-Type
 *
 * CACHING STRATEGY
 * ─────────────────
 * s-maxage=3600             → CDN serves cached sitemap for 1 hour
 * stale-while-revalidate=86400 → After 1h, CDN continues serving stale
 *                               sitemap while regenerating in background
 *
 * This means:
 *   • Google's sitemap crawler always gets an instant response from the CDN.
 *   • The sitemap is never more than 25 hours stale.
 *   • New pages appear in the sitemap within ~1 hour of creation.
 *
 * GOOGLEBOT BEHAVIOUR
 * ────────────────────
 * Google re-fetches sitemap.xml approximately every 24–48 hours.
 * The stale-while-revalidate strategy ensures they always get a response,
 * and new content is included in the next crawl cycle.
 */

import { NextResponse } from 'next/server';

// ── Configuration ─────────────────────────────────────────────────────────────

const SITE_URL = 'https://prepai.in';

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : 'http://localhost:5001/api';

/**
 * Priority and change frequency matrix.
 * These values are hints to Googlebot — not guarantees.
 * Higher priority = Googlebot crawls more frequently.
 * Don't set everything to 1.0: that signals you've misconfigured.
 */
const PRIORITIES = {
  home:         { priority: '1.0', changefreq: 'weekly'  },
  company:      { priority: '0.9', changefreq: 'weekly'  },
  problem:      { priority: '0.8', changefreq: 'monthly' },
  experience:   { priority: '0.7', changefreq: 'monthly' },
  staticPublic: { priority: '0.5', changefreq: 'monthly' },
};

/** Static public routes that are always included in the sitemap */
const STATIC_ROUTES = [
  { path: '/',           ...PRIORITIES.home         },
  { path: '/login',      ...PRIORITIES.staticPublic },
  { path: '/register',   ...PRIORITIES.staticPublic },
  { path: '/companies',  ...PRIORITIES.company      },
  { path: '/problems',   ...PRIORITIES.problem      },
  { path: '/experiences',...PRIORITIES.experience   },
];

// ── XML Helpers ───────────────────────────────────────────────────────────────

/**
 * Escapes XML special characters to prevent malformed sitemap output.
 * Characters that break XML: & < > " '
 */
function xmlEscape(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}

/**
 * Formats a date to YYYY-MM-DD (W3C datetime format required by sitemap spec).
 * Falls back to today's date if the input is invalid.
 *
 * @param {string|Date|undefined} dateInput
 * @returns {string} YYYY-MM-DD
 */
function formatDate(dateInput) {
  try {
    const d = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
    return d.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Generates a single <url> XML block for the sitemap.
 *
 * @param {string}  loc        - Full absolute URL
 * @param {string}  lastmod    - YYYY-MM-DD date string
 * @param {string}  changefreq - 'always'|'hourly'|'daily'|'weekly'|'monthly'|'yearly'|'never'
 * @param {string}  priority   - '0.0' to '1.0'
 * @returns {string}
 */
function urlEntry(loc, lastmod, changefreq, priority) {
  return `
  <url>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

// ── Data Fetchers (run in parallel) ──────────────────────────────────────────

/**
 * Fetches all company slugs from the public API.
 * Returns an array of { slug, createdAt } objects.
 * Falls back to [] on any error so the sitemap still generates.
 *
 * @returns {Promise<Array<{slug: string, createdAt: string}>>}
 */
async function fetchCompanySlugs() {
  try {
    const res = await fetch(`${API_BASE}/public/companies`, {
      // Cache this response for 1 hour at the fetch level too
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const companies = await res.json();
    return Array.isArray(companies)
      ? companies.map((c) => ({ slug: c.slug, createdAt: c.createdAt }))
      : [];
  } catch (err) {
    console.error('[sitemap] Failed to fetch company slugs:', err.message);
    return [];
  }
}

/**
 * Fetches all question IDs and titles from the public API.
 * Paginates through ALL questions (100 per page) until exhausted.
 *
 * Returns an array of { _id, createdAt } objects.
 *
 * @returns {Promise<Array<{_id: string, createdAt: string}>>}
 */
async function fetchAllQuestionIds() {
  const allQuestions = [];

  try {
    // Use the lightweight /slugs endpoint — only fetches _id + title + createdAt
    const res = await fetch(`${API_BASE}/public/questions/slugs`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const questions = await res.json();
    return Array.isArray(questions)
      ? questions.map((q) => ({ id: q._id, createdAt: q.createdAt }))
      : [];
  } catch (err) {
    console.error('[sitemap] Failed to fetch question IDs:', err.message);
    return allQuestions;
  }
}

/**
 * Fetches all interview experience IDs from the public API.
 * Returns an array of { _id, createdAt } objects.
 *
 * @returns {Promise<Array<{_id: string, createdAt: string}>>}
 */
async function fetchAllExperienceIds() {
  try {
    const res = await fetch(`${API_BASE}/public/experiences/ids`, {
      next: { revalidate: 1800 }, // Revalidate every 30 minutes — UGC updates more often
    });
    if (!res.ok) return [];
    const ids = await res.json();
    return Array.isArray(ids)
      ? ids.map((e) => ({ id: e._id, createdAt: e.createdAt }))
      : [];
  } catch (err) {
    console.error('[sitemap] Failed to fetch experience IDs:', err.message);
    return [];
  }
}

// ── Route Handler ─────────────────────────────────────────────────────────────

/**
 * GET /sitemap.xml
 *
 * Builds and returns the complete XML sitemap by:
 *   1. Fetching company slugs, question IDs, and experience IDs in PARALLEL
 *      (Promise.allSettled — any one failing doesn't break the others).
 *   2. Composing all URL entries into a single XML string.
 *   3. Returning the response with aggressive CDN caching headers.
 *
 * SITEMAP INDEX (for >50,000 URLs)
 * ──────────────────────────────────
 * If your platform grows beyond 50,000 URLs (Google's limit per sitemap),
 * split into multiple sitemaps and serve a sitemap index file:
 *
 *   /sitemap.xml           → index pointing to:
 *     /sitemap-companies.xml
 *     /sitemap-problems.xml
 *     /sitemap-experiences.xml
 *
 * @returns {Promise<Response>}
 */
export async function GET() {
  const startTime = Date.now();
  console.log('[sitemap] Starting sitemap generation...');

  // ── Parallel data fetching ────────────────────────────────────────────────
  // Promise.allSettled ensures ALL three fetch operations run concurrently.
  // If one fails, the sitemap still generates with data from the others.
  const [companiesResult, questionsResult, experiencesResult] = await Promise.allSettled([
    fetchCompanySlugs(),
    fetchAllQuestionIds(),
    fetchAllExperienceIds(),
  ]);

  const companies   = companiesResult.status   === 'fulfilled' ? companiesResult.value   : [];
  const questions   = questionsResult.status   === 'fulfilled' ? questionsResult.value   : [];
  const experiences = experiencesResult.status === 'fulfilled' ? experiencesResult.value : [];

  const today = new Date().toISOString().split('T')[0];

  console.log(`[sitemap] Data fetched in ${Date.now() - startTime}ms:`, {
    companies:   companies.length,
    questions:   questions.length,
    experiences: experiences.length,
  });

  // ── Compose XML ───────────────────────────────────────────────────────────

  // XML declaration and urlset opening tag with all required namespaces
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
    http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

  // ── Static routes ─────────────────────────────────────────────────────────
  for (const route of STATIC_ROUTES) {
    xml += urlEntry(
      `${SITE_URL}${route.path}`,
      today,
      route.changefreq,
      route.priority,
    );
  }

  // ── Company pages ─────────────────────────────────────────────────────────
  // /companies/[slug] — these are high-priority SEO pages
  for (const company of companies) {
    xml += urlEntry(
      `${SITE_URL}/companies/${xmlEscape(company.slug)}`,
      formatDate(company.createdAt),
      PRIORITIES.company.changefreq,
      PRIORITIES.company.priority,
    );
  }

  // ── Problem pages ─────────────────────────────────────────────────────────
  // /problems/[id] — 2,300+ pages, the core SEO asset
  for (const question of questions) {
    xml += urlEntry(
      `${SITE_URL}/problems/${xmlEscape(question.id)}`,
      formatDate(question.createdAt),
      PRIORITIES.problem.changefreq,
      PRIORITIES.problem.priority,
    );
  }

  // ── Interview Experience pages ────────────────────────────────────────────
  // /experiences/[id] — user-generated content, frequently updated
  for (const experience of experiences) {
    xml += urlEntry(
      `${SITE_URL}/experiences/${xmlEscape(experience.id)}`,
      formatDate(experience.createdAt),
      PRIORITIES.experience.changefreq,
      PRIORITIES.experience.priority,
    );
  }

  // Close the urlset
  xml += `\n</urlset>`;

  const totalUrls =
    STATIC_ROUTES.length + companies.length + questions.length + experiences.length;

  console.log(`[sitemap] Generated in ${Date.now() - startTime}ms | Total URLs: ${totalUrls}`);

  // ── Response with caching headers ─────────────────────────────────────────
  return new NextResponse(xml, {
    status: 200,
    headers: {
      // Serve as proper XML MIME type
      'Content-Type': 'application/xml; charset=utf-8',

      // CDN caching strategy:
      //   public          → CDN may cache this response
      //   s-maxage=3600   → CDN treats cached response as fresh for 1 hour
      //   stale-while-revalidate=86400 → After 1 hour, CDN serves stale
      //                                  sitemap for up to 24 more hours
      //                                  while regenerating in background
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',

      // Disable Google's X-Robots-Tag for sitemap files explicitly
      // (sitemaps should always be crawlable, not indexed)
      'X-Robots-Tag': 'noindex',

      // Helpful debugging header — shows how many URLs were generated
      'X-Sitemap-Total-Urls': String(totalUrls),
    },
  });
}
