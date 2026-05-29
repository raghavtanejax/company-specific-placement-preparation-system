/**
 * app/robots.txt/route.js
 * ────────────────────────
 * Next.js Route Handler — dynamically serves /robots.txt.
 *
 * WHY A ROUTE HANDLER (not public/robots.txt)?
 * ─────────────────────────────────────────────
 * A static file in /public works but cannot:
 *   • Set cache-control headers precisely
 *   • Dynamically adjust rules per environment (staging vs production)
 *   • Include server-validated paths
 *
 * This Route Handler detects the environment at runtime and serves a
 * STRICT production robots.txt in production, but blocks ALL crawlers
 * in development/staging to prevent accidental indexing of test content.
 *
 * ROBOTS.TXT ARCHITECTURE PHILOSOPHY
 * ─────────────────────────────────────
 * Crawl budget is a finite resource. For a 2,300+ question platform,
 * we must direct Googlebot EXCLUSIVELY to pages that:
 *   ✅ Are publicly accessible without authentication
 *   ✅ Have unique, indexable content with SEO value
 *   ✅ Won't waste crawl budget on authenticated/utility paths
 *
 * PATHS WE BLOCK AND WHY:
 * ┌──────────────────────────────┬──────────────────────────────────────────┐
 * │ Path                         │ Reason                                   │
 * ├──────────────────────────────┼──────────────────────────────────────────┤
 * │ /dashboard                   │ Private — requires JWT, zero SEO value   │
 * │ /profile                     │ User-specific data, no public SEO value  │
 * │ /admin                       │ Security risk to expose admin paths       │
 * │ /history                     │ User-specific quiz history               │
 * │ /bookmarks                   │ User-specific bookmarks                  │
 * │ /quiz                        │ Interactive session, not a page          │
 * │ /analyze                     │ Gemini AI tool, requires auth            │
 * │ /mock-interview              │ Live session, requires auth              │
 * │ /peer-interview              │ WebRTC session, requires auth            │
 * │ /discussions                 │ Requires auth to view                    │
 * │ /leaderboard                 │ Requires auth, changes every hour        │
 * │ /api/*                       │ Backend API — NEVER index API endpoints  │
 * │ /api/auth/*                  │ Auth endpoints — security-critical       │
 * │ /_next/*                     │ Next.js internal chunks — not content    │
 * │ /static/*                    │ Static assets — no text content          │
 * └──────────────────────────────┴──────────────────────────────────────────┘
 *
 * PATHS WE ALLOW AND WHY:
 * ┌──────────────────────────────┬──────────────────────────────────────────┐
 * │ Path                         │ Reason                                   │
 * ├──────────────────────────────┼──────────────────────────────────────────┤
 * │ /                            │ Root — allowed (crawlers start here)     │
 * │ /companies                   │ Public company listing page              │
 * │ /companies/*                 │ Individual company pages                 │
 * │ /problems                    │ Public problems listing page             │
 * │ /problems/*                  │ Individual problem pages (SEO gold mine) │
 * │ /experiences                 │ Public interview experiences listing     │
 * │ /experiences/*               │ Individual experience pages              │
 * │ /login                       │ Needed for link graph completeness       │
 * │ /register                    │ Needed for conversion funnel             │
 * │ /sitemap.xml                 │ Sitemaps must always be crawlable        │
 * └──────────────────────────────┴──────────────────────────────────────────┘
 */

import { NextResponse } from 'next/server';

/**
 * GET /robots.txt
 *
 * Returns environment-appropriate robots.txt content.
 *
 * @returns {Response}
 */
export async function GET() {
  const isProd = process.env.NODE_ENV === 'production';
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://prepai.in';

  // ── STAGING / DEVELOPMENT: Block everything ────────────────────────────────
  // Prevents Google from indexing test deployments, preview branches,
  // or local dev servers that might be accidentally exposed.
  if (!isProd) {
    const stagingRobots = `# PrepAI robots.txt — STAGING / DEVELOPMENT
# All crawlers are blocked on non-production environments.
# This prevents accidental indexing of test content.

User-agent: *
Disallow: /

# Sitemap is still discoverable for testing
Sitemap: ${SITE_URL}/sitemap.xml
`;

    return new NextResponse(stagingRobots, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store', // Never cache staging robots.txt
      },
    });
  }

  // ── PRODUCTION: Precise crawl budget allocation ────────────────────────────

  const productionRobots = `# =============================================================================
#  PrepAI – robots.txt (Production)
#  Generated dynamically by Next.js Route Handler
#  Last conceptual update: 2025
# =============================================================================
#
#  CRAWL BUDGET STRATEGY:
#  We have 2,300+ high-value problem pages + company pages + experiences.
#  Every Googlebot visit to /dashboard or /api/* is a WASTED crawl.
#  This file directs ALL crawl budget to SEO-valuable public content.
# =============================================================================


# ─── Default: All well-behaved crawlers ──────────────────────────────────────
User-agent: *

# ── ALLOW: Public SEO content ────────────────────────────────────────────────
# (Allow directives are listed explicitly for clarity)
Allow: /$
Allow: /companies
Allow: /companies/
Allow: /problems
Allow: /problems/
Allow: /experiences
Allow: /experiences/
Allow: /login
Allow: /register

# ── DISALLOW: Private user routes ────────────────────────────────────────────
Disallow: /dashboard
Disallow: /profile
Disallow: /admin
Disallow: /history
Disallow: /bookmarks
Disallow: /analyze
Disallow: /leaderboard
Disallow: /discussions

# ── DISALLOW: Interactive session routes ─────────────────────────────────────
# These are live WebRTC / AI sessions — not indexable content pages
Disallow: /quiz
Disallow: /quiz/
Disallow: /mock-interview
Disallow: /mock-interview/
Disallow: /peer-interview
Disallow: /peer-interview/

# ── DISALLOW: Backend API (all paths) ────────────────────────────────────────
# CRITICAL: API endpoints should NEVER be indexed by search engines.
# They return JSON, not HTML, and exposing them wastes crawl budget.
Disallow: /api/
Disallow: /api/auth/
Disallow: /api/auth/login
Disallow: /api/auth/register
Disallow: /api/admin/

# ── DISALLOW: Next.js Internal Paths ─────────────────────────────────────────
# _next/ contains chunked JavaScript bundles and static assets.
# Indexing these would be meaningless and waste significant crawl budget.
Disallow: /_next/
Disallow: /_next/static/
Disallow: /_next/data/

# ── DISALLOW: Utility paths ──────────────────────────────────────────────────
Disallow: /static/
Disallow: /*.json$
Disallow: /*.map$

# ─── Google-specific crawler directives ──────────────────────────────────────
# Googlebot respects the same rules above but we specify it explicitly
# to allow future Google-specific overrides (e.g., allowing Google Images)
User-agent: Googlebot
Allow: /companies/
Allow: /problems/
Allow: /experiences/
Disallow: /api/
Disallow: /_next/
Disallow: /dashboard
Disallow: /admin

# ─── Googlebot-Image ─────────────────────────────────────────────────────────
# Allow Google Images to index OG images for rich visual search results
User-agent: Googlebot-Image
Allow: /og-default.png
Allow: /og-problem.png
Allow: /favicon.svg
Disallow: /

# ─── Bing crawler ────────────────────────────────────────────────────────────
User-agent: Bingbot
Allow: /companies/
Allow: /problems/
Allow: /experiences/
Disallow: /api/
Disallow: /_next/
Disallow: /dashboard

# ─── Block bad/unwanted bots ─────────────────────────────────────────────────
# These bots scrape without indexing — they provide zero SEO value
# and consume your server resources and bandwidth.
User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /

User-agent: BLEXBot
Disallow: /

# =============================================================================
#  Sitemap declaration
#  Google, Bing, and others discover new URLs from here.
#  Without this line, crawlers must find the sitemap via Search Console only.
# =============================================================================
Sitemap: ${SITE_URL}/sitemap.xml
`;

  return new NextResponse(productionRobots, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',

      // Cache for 24 hours — robots.txt doesn't change often
      // stale-while-revalidate ensures zero-latency on subsequent requests
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}
