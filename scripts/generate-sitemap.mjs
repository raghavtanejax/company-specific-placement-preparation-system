/**
 * generate-sitemap.mjs
 * ─────────────────────
 * Node.js script that generates a production-ready sitemap.xml for PrepAI.
 *
 * HOW IT WORKS
 * ─────────────
 * 1. Static routes are hard-coded (they never change).
 * 2. Dynamic routes (/companies/:slug and /experiences/:id) are fetched
 *    directly from your MongoDB via Mongoose. This means the script must
 *    be run from the backend directory (or with access to the .env file).
 * 3. The XML is written to: frontend/public/sitemap.xml
 *    so Vite's build step copies it to the dist/ output automatically.
 *
 * USAGE
 * ─────
 *   # From the project root:
 *   node scripts/generate-sitemap.mjs
 *
 *   # Or schedule it via a cron job / CI pipeline (recommended: daily):
 *   0 2 * * * node /path/to/project/scripts/generate-sitemap.mjs
 *
 * INSTALL DEPENDENCY (only if not already in backend/package.json):
 *   cd backend && npm install mongoose dotenv
 */

import mongoose from 'mongoose';
import dotenv   from 'dotenv';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Resolve paths ─────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: resolve(__dirname, '../backend/.env') });

// Output path: Vite's /public directory
const OUTPUT_PATH = resolve(__dirname, '../frontend/public/sitemap.xml');

// ── Site constants ────────────────────────────────────────────────────────────
const SITE_URL    = 'https://prepai.in';
const NOW         = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// ── Static routes configuration ───────────────────────────────────────────────
/**
 * @type {Array<{ loc: string, changefreq: string, priority: string }>}
 *
 * changefreq values: always | hourly | daily | weekly | monthly | yearly | never
 * priority:  0.0 (lowest) → 1.0 (highest)
 */
const STATIC_ROUTES = [
  { loc: '/',          changefreq: 'weekly',  priority: '1.0' },
  { loc: '/login',     changefreq: 'monthly', priority: '0.5' },
  { loc: '/register',  changefreq: 'monthly', priority: '0.5' },
  { loc: '/companies', changefreq: 'daily',   priority: '0.9' },
  { loc: '/experiences', changefreq: 'hourly', priority: '0.8' },
  { loc: '/leaderboard', changefreq: 'daily',  priority: '0.6' },
];

// ── Minimal Mongoose models (avoids importing the full backend) ───────────────
const companySchema = new mongoose.Schema({
  slug:      String,
  updatedAt: Date,
  createdAt: Date,
});

const experienceSchema = new mongoose.Schema({
  _id:       mongoose.Schema.Types.ObjectId,
  createdAt: Date,
});

const Company  = mongoose.models.Company  || mongoose.model('Company',  companySchema);
const Experience = mongoose.models.InterviewExperience
  || mongoose.model('InterviewExperience', experienceSchema);

// ── XML helper ────────────────────────────────────────────────────────────────
/**
 * Generates a single <url> XML block.
 * @param {string} loc        - Absolute URL
 * @param {string} lastmod    - ISO date string (YYYY-MM-DD)
 * @param {string} changefreq - Crawler hint for revisit frequency
 * @param {string} priority   - SEO priority weight (0.0 – 1.0)
 * @returns {string} XML block
 */
const urlBlock = (loc, lastmod, changefreq, priority) => `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

// ── Main generator ────────────────────────────────────────────────────────────
async function generateSitemap() {
  console.log('🗺️  PrepAI Sitemap Generator\n');

  // 1. Connect to MongoDB
  console.log('  Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI, {
    tls: true,
    tlsAllowInvalidCertificates: false,
  });
  console.log('  ✓ Connected\n');

  // 2. Fetch dynamic slugs
  console.log('  Fetching company slugs...');
  const companies = await Company.find({}, 'slug createdAt').lean();
  console.log(`  ✓ Found ${companies.length} companies`);

  console.log('  Fetching interview experience IDs...');
  const experiences = await Experience.find({}, '_id createdAt').lean();
  console.log(`  ✓ Found ${experiences.length} experiences\n`);

  // 3. Build XML string
  let urlsXML = '';

  // Static routes
  for (const route of STATIC_ROUTES) {
    urlsXML += urlBlock(
      `${SITE_URL}${route.loc}`,
      NOW,
      route.changefreq,
      route.priority,
    );
  }

  // Dynamic company pages
  for (const company of companies) {
    const lastmod = company.createdAt
      ? new Date(company.createdAt).toISOString().split('T')[0]
      : NOW;
    urlsXML += urlBlock(
      `${SITE_URL}/companies/${company.slug}`,
      lastmod,
      'weekly',
      '0.8',
    );
  }

  // Dynamic experience pages
  for (const exp of experiences) {
    const lastmod = exp.createdAt
      ? new Date(exp.createdAt).toISOString().split('T')[0]
      : NOW;
    urlsXML += urlBlock(
      `${SITE_URL}/experiences/${exp._id}`,
      lastmod,
      'monthly',
      '0.7',
    );
  }

  // 4. Wrap in XML envelope
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
    http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlsXML}
</urlset>`;

  // 5. Write to disk
  writeFileSync(OUTPUT_PATH, xml, 'utf8');
  console.log(`  ✅ sitemap.xml written to: ${OUTPUT_PATH}`);
  console.log(`     Total URLs: ${STATIC_ROUTES.length + companies.length + experiences.length}\n`);

  // 6. Disconnect
  await mongoose.disconnect();
  console.log('  ✓ Disconnected from MongoDB');
  console.log('\n  Next step: Ping Google to reindex —');
  console.log('  https://www.google.com/ping?sitemap=https://prepai.in/sitemap.xml\n');
}

generateSitemap().catch((err) => {
  console.error('❌ Sitemap generation failed:', err.message);
  process.exit(1);
});
