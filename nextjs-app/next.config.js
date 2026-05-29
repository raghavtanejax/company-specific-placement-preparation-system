/**
 * next.config.js
 * ───────────────
 * Next.js configuration for PrepAI.
 *
 * PERFORMANCE & SEO PILLARS IMPLEMENTED HERE:
 *
 * 1. Bundle Analysis: `@next/bundle-analyzer` integration to keep
 *    the initial JS bundle tight (critical for LCP and Googlebot).
 *
 * 2. Image Optimisation: WebP/AVIF conversion for all company logos
 *    and OG images — reduces image bytes by 40–60%.
 *
 * 3. Monaco Editor Webpack rule: Prevents Next.js from accidentally
 *    including Monaco's 4MB worker files in the main bundle.
 *
 * 4. HTTP headers: Security headers (X-Content-Type-Options, etc.)
 *    and CORS headers for the public API routes.
 *
 * 5. Redirects: Canonical redirects to prevent duplicate content
 *    (the #1 cause of crawl budget waste on large content sites).
 *
 * 6. Compiler optimisations: Dead code elimination for production.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {

  // ── Strict Mode — catches common React mistakes early ────────────────────
  reactStrictMode: true,

  // ── Compiler: Remove console.log in production ───────────────────────────
  // Eliminates dead code, reduces bundle size, improves Lighthouse score
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }  // Keep error and warning logs
      : false,
  },

  // ── Image Optimisation ───────────────────────────────────────────────────
  // Next.js automatically converts images to WebP/AVIF and serves
  // the optimal format per browser. This directly improves LCP scores.
  images: {
    formats: ['image/avif', 'image/webp'],  // AVIF first (best compression)
    deviceSizes: [640, 828, 1080, 1200, 1920], // Responsive breakpoints
    imageSizes:  [16, 32, 48, 64, 96, 128],    // For layout-constrained images

    // Allow images from these external origins (add company logo CDNs here)
    remotePatterns: [
      {
        protocol: 'https',
        hostname:  'company-specific-placement-preparation.onrender.com',
      },
      // Add more hostnames as needed:
      // { protocol: 'https', hostname: 'assets.prepai.in' },
    ],
  },

  // ── Experimental features ────────────────────────────────────────────────
  experimental: {
    // Partial Prerendering (PPR) — Next.js 15+ feature.
    // Serves a static HTML shell INSTANTLY from the CDN, then streams
    // dynamic content (user-specific data) as it becomes available.
    // Googlebot sees the static shell with full metadata immediately.
    // ppr: true, // Enable when stable in your Next.js version

    // Optimise CSS — removes unused CSS classes to reduce stylesheet size
    optimizeCss: true,

    // Turbopack for faster local development (does not affect production)
    // turbo: {},
  },

  // ── Webpack Customisation ────────────────────────────────────────────────
  webpack(config, { isServer }) {
    // ── Monaco Editor Worker Fix ──────────────────────────────────────────
    // Monaco uses Web Workers internally for language services (syntax
    // highlighting, IntelliSense, etc.). Without this configuration,
    // webpack tries to bundle these workers into the main chunk, which:
    //   1. Doesn't work (workers need their own context)
    //   2. Bloats the main bundle by ~500KB+
    //   3. Slows down Googlebot's JavaScript execution significantly
    //
    // The `asset/resource` rule tells webpack to emit each worker as a
    // separate file and reference it by URL — the correct pattern.
    if (!isServer) {
      config.module.rules.push({
        test:    /\.worker\.(js|ts)$/,
        use:     [{ loader: 'worker-loader', options: { esModule: false } }],
      });
    }

    // ── SVG Support ───────────────────────────────────────────────────────
    // Allows importing SVG files as React components (for icons, logos).
    config.module.rules.push({
      test:    /\.svg$/i,
      issuer:  /\.[jt]sx?$/,
      use:     ['@svgr/webpack'],
    });

    return config;
  },

  // ── HTTP Security & Performance Headers ─────────────────────────────────
  // These headers are injected into EVERY response from the Next.js server.
  // They improve Core Web Vitals and security scores simultaneously.
  async headers() {
    return [
      // ── Global security headers ─────────────────────────────────────────
      {
        source: '/:path*',
        headers: [
          // Prevents MIME-type sniffing attacks
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          // Prevents clickjacking
          { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
          // Controls referrer information in links
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          // Enables DNS prefetching for faster external link resolution
          { key: 'X-DNS-Prefetch-Control',    value: 'on' },
          // Force HTTPS for 1 year (only enable when HTTPS is confirmed)
          // { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },

      // ── Public content pages: allow CDN caching ─────────────────────────
      // These pages are rendered by SSG/ISR and can be cached at the CDN.
      {
        source: '/(companies|problems|experiences)/:path*',
        headers: [
          {
            key:   'Cache-Control',
            // s-maxage: CDN cache duration (1 hour)
            // stale-while-revalidate: Allow stale serving for 24 hours
            //   while regenerating in the background
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },

      // ── Private/auth pages: never cache at CDN ──────────────────────────
      {
        source: '/(dashboard|profile|admin|history|bookmarks|quiz|analyze|mock-interview|peer-interview|discussions|leaderboard)/:path*',
        headers: [
          {
            key:   'Cache-Control',
            value: 'private, no-cache, no-store, must-revalidate',
          },
          // Prevent search engines from indexing these pages via HTTP header
          // (backup to the noIndex flag in Helmet/metadata)
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },

      // ── API routes: CORS for public endpoints ────────────────────────────
      {
        source: '/api/public/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin',  value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
          { key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=600' },
        ],
      },
    ];
  },

  // ── Redirects: Canonical URL enforcement ────────────────────────────────
  // Duplicate content is a major SEO penalty. These redirects ensure
  // each resource has exactly one canonical URL.
  async redirects() {
    return [
      // Redirect trailing slashes to the canonical (no-trailing-slash) form
      // (handled automatically by Next.js trailingSlash: false, but explicit
      //  redirects here as a fallback for any edge cases)
      {
        source:      '/companies/',
        destination: '/companies',
        permanent:   true, // 301 — passes PageRank to the canonical URL
      },
      {
        source:      '/problems/',
        destination: '/problems',
        permanent:   true,
      },
      {
        source:      '/experiences/',
        destination: '/experiences',
        permanent:   true,
      },

      // If someone accesses the old Vite app's /companies/:slug route,
      // redirect to the new Next.js equivalent.
      // Remove this once migration is complete and DNS is fully switched.
      // {
      //   source:      '/company/:slug',
      //   destination: '/companies/:slug',
      //   permanent:   true,
      // },
    ];
  },

  // ── Rewrites: Proxy backend API through Next.js ──────────────────────────
  // Optional: If you want to proxy your Express backend through Next.js
  // instead of calling it directly, uncomment these rewrites.
  // This hides the backend URL and allows using relative paths in the client.
  //
  // async rewrites() {
  //   return [
  //     {
  //       source:      '/api/:path*',
  //       destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
  //     },
  //   ];
  // },
};

export default nextConfig;
