/**
 * app/problems/[slug]/page.js
 * ────────────────────────────
 * Next.js Server Component — the primary SEO landing page for each
 * PrepAI problem (question). This file contains:
 *
 *   1. generateStaticParams()  — pre-renders the top 200 problems at build
 *      time (SSG). All others are rendered on-demand and cached (ISR).
 *   2. generateMetadata()      — injects fully optimised <title>, <meta>,
 *      OG, Twitter Card, and canonical tags BEFORE the HTML is sent to
 *      the browser. Googlebot sees the correct metadata on the FIRST byte.
 *   3. buildJsonLd()           — dynamically selects and builds either a
 *      Quiz schema (for MCQs) or a Course schema (for coding problems),
 *      injected as a <script type="application/ld+json"> in the SSR HTML.
 *   4. ProblemPage()           — the server component that renders semantic
 *      HTML: <main> → <article> → <h1>, <h2>, problem details, test cases.
 *   5. The heavy Monaco Editor is dynamically imported with ssr:false so
 *      it NEVER runs during the server render pass.
 *
 * URL SCHEME
 * ───────────
 * /problems/[id]   — where [id] is the MongoDB ObjectId of the question.
 *
 * WHY ObjectId (not a custom slug)?
 * The Question model has no slug field. ObjectId is used directly.
 * If you later add a `slug` field, swap `req.params.id` → `req.params.slug`
 * in publicController and update the route handler accordingly.
 */

import { notFound }           from 'next/navigation';
import ProblemPageClient       from '@/components/problems/ProblemPageClient';

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : 'http://localhost:5001/api';

// ─────────────────────────────────────────────────────────────────────────────
// Data fetching helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches a single question from the Express public API.
 * The `next: { revalidate }` option implements ISR:
 *   • Cached HTML is served instantly.
 *   • The cache is invalidated after `revalidate` seconds.
 *   • A fresh fetch is made in the background on the next request.
 *
 * @param {string} id - MongoDB ObjectId
 * @returns {Promise<object|null>}
 */
async function fetchQuestion(id) {
  try {
    const res = await fetch(`${API_BASE}/public/questions/${id}`, {
      next: { revalidate: 3600 }, // Re-validate stale cache every 1 hour (ISR)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Static Params — pre-render top 200 problems at build time (SSG)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * generateStaticParams pre-renders a set of problem pages at build time.
 *
 * HOW IT WORKS:
 *   • At `next build`, Next.js calls this function ONCE.
 *   • It fetches the 200 most recently created question IDs.
 *   • Those pages are rendered as static HTML and stored in the CDN edge cache.
 *   • Any question ID NOT in this list is rendered on-demand (ISR) and then
 *     cached automatically — so the first visitor triggers a build, and every
 *     subsequent visitor gets the cached static page.
 *
 * PERFORMANCE IMPLICATION:
 *   • Pre-rendered pages → Time To First Byte (TTFB) < 50ms from CDN.
 *   • On-demand ISR pages → TTFB ~200–400ms on first request, then CDN.
 */
export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_BASE}/public/questions/slugs`);
    if (!res.ok) return [];
    const questions = await res.json();

    // Pre-render at most the 200 most recent problems at build time.
    // Increase this limit as server build capacity allows.
    return questions.slice(0, 200).map((q) => ({ slug: q._id.toString() }));
  } catch {
    return []; // Graceful degradation — all pages will use on-demand ISR
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Dynamic Metadata — SSR <head> injection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * generateMetadata is called by Next.js for every request (SSR) or at build
 * time for pre-rendered pages. It returns a structured Metadata object that
 * Next.js automatically serialises into the <head> of the HTML response.
 *
 * CRITICAL SEO IMPACT:
 *   Without this, Googlebot receives <title>PrepAI</title> for every problem.
 *   With this, Googlebot receives a unique, keyword-rich title on the FIRST
 *   byte — no JavaScript execution required.
 *
 * @param {{ params: { slug: string } }} props
 * @returns {Promise<import('next').Metadata>}
 */
export async function generateMetadata({ params }) {
  const question = await fetchQuestion(params.slug);

  if (!question) {
    return {
      title:  'Problem Not Found',
      robots: { index: false },
    };
  }

  // ── Title Construction ─────────────────────────────────────────────────────
  // Pattern: "Solve [Title] - [Company] Interview Practice | PrepAI"
  // If question has multiple companies, use the first one for the title tag.
  const companyName = question.company?.[0]
    ? question.company[0].charAt(0).toUpperCase() + question.company[0].slice(1)
    : null;

  const title = companyName
    ? `Solve "${question.title}" – ${companyName} Interview Practice | PrepAI`
    : `Solve "${question.title}" – ${question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)} Interview Question | PrepAI`;

  // ── Description Construction ───────────────────────────────────────────────
  // Include: problem name, difficulty, key skills (comma-joined), question type.
  // Target length: 140–155 characters.
  const skillsStr = question.skills?.slice(0, 3).join(', ') || 'algorithms';
  const typeLabel = question.type === 'coding' ? 'coding challenge' : 'multiple-choice question';

  const description =
    `Practice "${question.title}" — a ${question.difficulty} ${typeLabel} ` +
    `covering ${skillsStr}. Used in real ${companyName || 'top tech company'} interviews. ` +
    `Solve it live in our in-browser editor on PrepAI.`;

  // Trim to 155 chars max (Google truncates beyond this)
  const metaDescription = description.length > 155
    ? description.substring(0, 152) + '...'
    : description;

  // ── Keywords ───────────────────────────────────────────────────────────────
  const keywords = [
    question.title,
    ...(question.skills || []),
    ...(question.company || []).map(c => `${c} interview questions`),
    `${question.difficulty} interview question`,
    `${question.type} interview`,
    'interview practice',
    'coding interview',
    'placement preparation',
    'PrepAI',
  ];

  return {
    title,
    description:  metaDescription,
    keywords,
    alternates: {
      canonical: `/problems/${params.slug}`,
    },
    openGraph: {
      title,
      description:  metaDescription,
      type:         'article', // Problems are content articles
      url:         `https://prepai.in/problems/${params.slug}`,
      siteName:    'PrepAI',
      publishedTime: question.createdAt,
      images: [{
        url:    '/og-problem.png', // Dedicated OG image for problem pages
        width:  1200,
        height: 630,
        alt:    `Solve ${question.title} on PrepAI`,
      }],
    },
    twitter: {
      card:        'summary_large_image',
      site:        '@prepai_in',
      title,
      description: metaDescription,
      images:      ['/og-problem.png'],
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. JSON-LD Structured Data Engine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * buildJsonLd — Dynamically generates the most appropriate Schema.org
 * structured data based on the question's `type` field.
 *
 * SCHEMA SELECTION LOGIC:
 * ┌───────────────┬──────────────────────────────────────────────────────────┐
 * │ question.type │ Schema Output                                            │
 * ├───────────────┼──────────────────────────────────────────────────────────┤
 * │ 'mcq'         │ Quiz + FAQPage (eligible for Google Rich Snippets:       │
 * │               │ shows Q&A dropdown directly in SERP results)             │
 * ├───────────────┼──────────────────────────────────────────────────────────┤
 * │ 'coding'      │ LearningResource + SoftwareSourceCode (helps Google      │
 * │               │ classify the page as an educational coding resource)     │
 * └───────────────┴──────────────────────────────────────────────────────────┘
 *
 * @param {object} question  - Question document from MongoDB
 * @param {string} pageUrl   - Absolute canonical URL of this page
 * @returns {object[]}       - Array of JSON-LD objects to inject
 */
function buildJsonLd(question, pageUrl) {
  const schemas = [];

  const difficultyMap = {
    easy:   'Beginner',
    medium: 'Intermediate',
    hard:   'Advanced',
  };

  // ── Shared: BreadcrumbList ─────────────────────────────────────────────────
  // Helps Google show breadcrumb navigation directly in the SERP URL row.
  schemas.push({
    '@context':        'https://schema.org',
    '@type':           'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',     item: 'https://prepai.in' },
      { '@type': 'ListItem', position: 2, name: 'Problems', item: 'https://prepai.in/problems' },
      { '@type': 'ListItem', position: 3, name: question.title, item: pageUrl },
    ],
  });

  if (question.type === 'mcq') {
    // ── MCQ Path: Quiz Schema ────────────────────────────────────────────────
    //
    // The Quiz type can trigger a rich snippet in Google Search that shows
    // the question directly in the SERP as an expandable card.
    //
    // IMPORTANT: Google requires that the acceptedAnswer NOT reveal the answer
    // directly in the schema if users can answer the question on the page.
    // We provide a hint-level description instead of the full answer key.
    //
    // Eligibility check: question must have ≥2 options to be a valid quiz.
    if (question.options && question.options.length >= 2) {
      schemas.push({
        '@context':   'https://schema.org',
        '@type':      'Quiz',
        name:          question.title,
        description:   question.description,
        educationalLevel: difficultyMap[question.difficulty] || 'Intermediate',
        about: {
          '@type': 'Thing',
          name:    question.skills?.[0] || 'Software Engineering',
        },
        hasPart: [
          {
            '@type':  'Question',
            name:      question.title,
            text:      question.description,
            // Provide a contextual hint, NOT the isCorrect flag
            acceptedAnswer: {
              '@type': 'Answer',
              text:   `This is a ${question.difficulty}-level ${question.skills?.join(', ')} question. ` +
                      `Select the most accurate option and verify your understanding with PrepAI's explanation.`,
            },
            // Surface the wrong answers as suggestedAnswer to help Google
            // understand the question has multiple choices
            suggestedAnswer: (question.options || []).map((opt) => ({
              '@type': 'Answer',
              text:    opt.text,
            })),
          },
        ],
      });
    }

    // ── MCQ Path: FAQPage Schema ─────────────────────────────────────────────
    //
    // FAQPage can generate "People Also Ask" style expandable FAQ panels
    // directly in SERPs. We generate 3 evergreen FAQ questions per problem.
    schemas.push({
      '@context': 'https://schema.org',
      '@type':    'FAQPage',
      mainEntity: [
        {
          '@type':          'Question',
          name:             `What is the difficulty level of "${question.title}"?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text:   `"${question.title}" is classified as a ${question.difficulty}-level ` +
                    `interview question on PrepAI. It tests knowledge of ${question.skills?.join(', ') || 'core concepts'}.`,
          },
        },
        {
          '@type':          'Question',
          name:             `Which companies ask "${question.title}" in interviews?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text:   question.company?.length
              ? `This question has been asked in interviews at: ${question.company.join(', ')}. ` +
                `Practise it with PrepAI's live in-browser quiz mode.`
              : `This question appears in technical and screening rounds across top tech companies. ` +
                `Practise it on PrepAI to improve your interview readiness.`,
          },
        },
        {
          '@type':          'Question',
          name:             `How do I practise "${question.title}" for interview preparation?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text:   `Open the problem on PrepAI, attempt it in quiz mode, then review the ` +
                    `explanation and check the Discussion section for community approaches. ` +
                    `You can also bookmark it for targeted revision.`,
          },
        },
      ],
    });

  } else {
    // ── Coding Path: LearningResource + SoftwareSourceCode ──────────────────
    //
    // LearningResource classifies the page as an educational coding challenge.
    // SoftwareSourceCode signals to Google that this page contains executable
    // code content, which can improve rankings for "how to solve X" queries.
    schemas.push({
      '@context':       'https://schema.org',
      '@type':          'LearningResource',
      name:              question.title,
      description:       question.description,
      url:               pageUrl,
      educationalLevel:  difficultyMap[question.difficulty] || 'Intermediate',
      learningResourceType: 'Coding Challenge',
      teaches: (question.skills || []).map((skill) => ({
        '@type': 'DefinedTerm',
        name:    skill,
      })),
      about: {
        '@type': 'ComputerLanguage',
        name:    question.skills?.find(s =>
          ['javascript', 'python', 'java', 'c++', 'golang'].includes(s.toLowerCase())
        ) || 'Any Language',
      },
      provider: {
        '@type': 'Organization',
        name:    'PrepAI',
        url:     'https://prepai.in',
        logo:    'https://prepai.in/favicon.svg',
      },
    });

    // FAQPage for coding questions — "People Also Ask" targets
    schemas.push({
      '@context': 'https://schema.org',
      '@type':    'FAQPage',
      mainEntity: [
        {
          '@type':          'Question',
          name:             `How do I solve "${question.title}" in a coding interview?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text:   `To solve "${question.title}", focus on ${question.skills?.slice(0, 2).join(' and ') || 'the core algorithm'}. ` +
                    `On PrepAI you can write, run, and test your solution in the in-browser editor, ` +
                    `then compare it against ${question.testCases?.length || 'multiple'} hidden test cases.`,
          },
        },
        {
          '@type':          'Question',
          name:             `What is the time complexity approach for "${question.title}"?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text:   `The optimal approach for "${question.title}" depends on your algorithm choice. ` +
                    `Use PrepAI's code editor to experiment with different approaches and submit your ` +
                    `solution against all test cases to verify correctness.`,
          },
        },
        {
          '@type':          'Question',
          name:             `Which companies ask "${question.title}" in technical interviews?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text:   question.company?.length
              ? `"${question.title}" has been seen in technical rounds at ${question.company.join(', ')}. ` +
                `Prepare with PrepAI's ${question.company[0]}-specific question bank.`
              : `"${question.title}" is a common coding challenge in technical rounds at top tech companies.`,
          },
        },
      ],
    });
  }

  return schemas;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Page Component — Semantic HTML + Server-Rendered Content
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ProblemPage — Next.js Server Component (default export).
 *
 * RENDERING STRATEGY:
 *   • The entire page (except the code editor) is rendered on the server.
 *   • Googlebot sees the full problem title, description, constraints, and
 *     test cases in the raw HTML response — zero JS execution required.
 *   • The Monaco editor is lazily loaded client-side ONLY after the browser
 *     has parsed and painted the server HTML (no impact on LCP).
 *
 * SEMANTIC HTML STRUCTURE:
 *   <main>           — primary landmark for screen readers & crawlers
 *     <article>      — identifies this as a standalone content piece
 *       <header>     — problem title, metadata badges
 *         <h1>       — primary keyword target (problem title)
 *       <section>    — problem description (keyword density)
 *         <h2>       — "Problem Description"
 *       <section>    — constraints (structured content)
 *         <h2>       — "Constraints & Examples"
 *       <section>    — test cases (structured data)
 *         <h2>       — "Sample Test Cases"
 *       <aside>      — company info (secondary keywords)
 *     <section>      — live code editor (client-side only)
 */
export default async function ProblemPage({ params }) {
  const question = await fetchQuestion(params.slug);

  if (!question) {
    notFound(); // Renders app/not-found.js with 404 status
  }

  // Build structured data before rendering
  const pageUrl  = `https://prepai.in/problems/${params.slug}`;
  const jsonLdSchemas = buildJsonLd(question, pageUrl);

  // Capitalise difficulty for display
  const difficultyLabel = question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1);

  // Difficulty → colour token (Tailwind-safe classes)
  const difficultyClass = {
    easy:   'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    medium: 'text-yellow-400  bg-yellow-400/10  border-yellow-400/30',
    hard:   'text-red-400     bg-red-400/10     border-red-400/30',
  }[question.difficulty] || 'text-purple-400 bg-purple-400/10 border-purple-400/30';

  return (
    <>
      {/*
        ── JSON-LD Injection ─────────────────────────────────────────────────
        Each schema is injected as a separate <script> in the server HTML.
        Google can parse all of them from a single page.
        dangerouslySetInnerHTML is safe here: the data comes from our own DB,
        not from user input. JSON.stringify escapes any special characters.
      */}
      {jsonLdSchemas.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/*
        ── Page Layout ───────────────────────────────────────────────────────
        <main> is the primary ARIA landmark. Googlebot uses it to identify
        the main content body, separate from nav and footer boilerplate.
      */}
      <main
        className="problem-page-layout"
        style={{
          maxWidth:   '1280px',
          margin:     '0 auto',
          padding:    '2rem 1.5rem',
          display:    'grid',
          gridTemplateColumns: '1fr 1fr',
          gap:        '2rem',
          minHeight:  '100vh',
        }}
      >
        {/*
          ── Left Panel: Problem Definition ───────────────────────────────────
          This entire panel is server-rendered and visible to Googlebot
          on the very first byte of the HTML response.
        */}
        <article
          className="problem-definition"
          itemScope
          itemType="https://schema.org/LearningResource"
        >
          {/* ── Problem Header ─────────────────────────────────────────────── */}
          <header style={{ marginBottom: '2rem' }}>
            {/* Breadcrumb navigation — mirrors the BreadcrumbList JSON-LD */}
            <nav aria-label="Breadcrumb" style={{ marginBottom: '1rem' }}>
              <ol
                style={{
                  display:    'flex',
                  gap:        '0.5rem',
                  listStyle:  'none',
                  padding:    0,
                  fontSize:   '0.8rem',
                  color:      'var(--text-muted)',
                }}
              >
                <li><a href="/" style={{ color: 'inherit' }}>Home</a></li>
                <li aria-hidden="true">›</li>
                <li><a href="/problems" style={{ color: 'inherit' }}>Problems</a></li>
                <li aria-hidden="true">›</li>
                <li aria-current="page"
                  style={{ color: 'var(--text-main)', maxWidth: '200px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {question.title}
                </li>
              </ol>
            </nav>

            {/*
              <h1> is the most important on-page SEO signal.
              It should contain the primary keyword (problem title) exactly.
              Google uses h1 to understand the page's core topic.
            */}
            <h1
              itemProp="name"
              style={{
                fontSize:     'clamp(1.4rem, 3vw, 2rem)',
                fontWeight:   700,
                lineHeight:   1.3,
                marginBottom: '1rem',
                color:        'var(--text-main)',
              }}
            >
              {question.title}
            </h1>

            {/* Metadata badges — crawlable inline text, not just visual decoration */}
            <div
              style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}
              role="group"
              aria-label="Problem metadata"
            >
              {/* Difficulty badge */}
              <span
                className={`difficulty-badge ${difficultyClass}`}
                itemProp="educationalLevel"
                style={{
                  padding:      '0.25rem 0.75rem',
                  borderRadius: '6px',
                  fontSize:     '0.75rem',
                  fontWeight:   700,
                  border:       '1px solid',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}
              >
                {difficultyLabel}
              </span>

              {/* Question type badge */}
              <span
                style={{
                  padding:       '0.25rem 0.75rem',
                  borderRadius:  '6px',
                  fontSize:      '0.75rem',
                  fontWeight:    600,
                  background:    'rgba(139,92,246,0.1)',
                  color:         '#a78bfa',
                  border:        '1px solid rgba(139,92,246,0.25)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {question.type === 'coding' ? '⌨ Coding' : '❓ MCQ'}
              </span>

              {/* Skill tags — important for long-tail keyword coverage */}
              {(question.skills || []).map((skill) => (
                <span
                  key={skill}
                  itemProp="keywords"
                  style={{
                    padding:      '0.25rem 0.6rem',
                    borderRadius: '6px',
                    fontSize:     '0.72rem',
                    fontWeight:   500,
                    background:   'rgba(255,255,255,0.05)',
                    color:        'var(--text-muted)',
                    border:       '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </header>

          {/* ── Problem Description ───────────────────────────────────────── */}
          {/*
            This <section> with <h2> and the description text is critical for
            keyword density and semantic content classification by Google.
            The description text is rendered as raw HTML from the server —
            no JavaScript required to display it.
          */}
          <section
            aria-labelledby="problem-description-heading"
            style={{
              marginBottom: '2rem',
              padding:      '1.5rem',
              background:   'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              border:       '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <h2
              id="problem-description-heading"
              style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-main)' }}
            >
              📋 Problem Description
            </h2>
            <p
              itemProp="description"
              style={{
                color:      'var(--text-muted)',
                lineHeight: 1.7,
                fontSize:   '0.92rem',
                whiteSpace: 'pre-wrap', // Preserve formatting from DB
              }}
            >
              {question.description}
            </p>
          </section>

          {/* ── Test Cases — Only for Coding Questions ────────────────────── */}
          {question.type === 'coding' && question.testCases?.length > 0 && (
            <section
              aria-labelledby="test-cases-heading"
              style={{
                marginBottom: '2rem',
                padding:      '1.5rem',
                background:   'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                border:       '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <h2
                id="test-cases-heading"
                style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-main)' }}
              >
                🧪 Sample Test Cases
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Show only the first 3 test cases publicly */}
                {question.testCases.slice(0, 3).map((tc, i) => (
                  <div
                    key={i}
                    style={{
                      display:       'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap:           '0.5rem',
                    }}
                  >
                    <div>
                      <span
                        style={{
                          display:       'block',
                          fontSize:      '0.7rem',
                          fontWeight:    700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          color:         'var(--neon-purple)',
                          marginBottom:  '0.25rem',
                        }}
                      >
                        Input
                      </span>
                      <code
                        style={{
                          display:      'block',
                          padding:      '0.5rem 0.75rem',
                          background:   'rgba(0,0,0,0.3)',
                          borderRadius: '6px',
                          fontSize:     '0.82rem',
                          fontFamily:   'JetBrains Mono, Fira Code, monospace',
                          color:        '#e2e8f0',
                          whiteSpace:   'pre-wrap',
                        }}
                      >
                        {tc.input}
                      </code>
                    </div>
                    <div>
                      <span
                        style={{
                          display:       'block',
                          fontSize:      '0.7rem',
                          fontWeight:    700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          color:         '#34d399',
                          marginBottom:  '0.25rem',
                        }}
                      >
                        Expected Output
                      </span>
                      <code
                        style={{
                          display:      'block',
                          padding:      '0.5rem 0.75rem',
                          background:   'rgba(0,0,0,0.3)',
                          borderRadius: '6px',
                          fontSize:     '0.82rem',
                          fontFamily:   'JetBrains Mono, Fira Code, monospace',
                          color:        '#34d399',
                          whiteSpace:   'pre-wrap',
                        }}
                      >
                        {tc.expectedOutput}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── MCQ Options Preview — for MCQ questions ───────────────────── */}
          {question.type === 'mcq' && question.options?.length > 0 && (
            <section
              aria-labelledby="options-heading"
              style={{
                marginBottom: '2rem',
                padding:      '1.5rem',
                background:   'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                border:       '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <h2
                id="options-heading"
                style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-main)' }}
              >
                🎯 Select Your Answer
              </h2>
              {/* Options are rendered server-side (no isCorrect exposed) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {question.options.map((opt, i) => (
                  <div
                    key={i}
                    style={{
                      padding:      '0.75rem 1rem',
                      borderRadius: '8px',
                      background:   'rgba(255,255,255,0.03)',
                      border:       '1px solid rgba(255,255,255,0.08)',
                      fontSize:     '0.9rem',
                      color:        'var(--text-muted)',
                      cursor:       'default',
                    }}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--neon-purple)', marginRight: '0.75rem' }}>
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {opt.text}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Company Context — Secondary Keywords ──────────────────────── */}
          {question.company?.length > 0 && (
            <aside
              aria-label="Companies that ask this question"
              style={{
                padding:      '1.25rem',
                background:   'rgba(139,92,246,0.05)',
                borderRadius: '12px',
                border:       '1px solid rgba(139,92,246,0.15)',
              }}
            >
              <h2 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem', color: '#a78bfa' }}>
                🏢 Asked in Interviews At:
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {question.company.map((slug) => (
                  <a
                    key={slug}
                    href={`/companies/${slug}`}
                    style={{
                      padding:       '0.3rem 0.75rem',
                      borderRadius:  '6px',
                      fontSize:      '0.78rem',
                      fontWeight:    600,
                      background:    'rgba(139,92,246,0.1)',
                      color:         '#c4b5fd',
                      border:        '1px solid rgba(139,92,246,0.2)',
                      textDecoration: 'none',
                      textTransform:  'capitalize',
                    }}
                  >
                    {slug.replace(/-/g, ' ')}
                  </a>
                ))}
              </div>
            </aside>
          )}
        </article>

        {/*
          ── Right Panel: Code Editor (Client-Side Only) ───────────────────────
          ProblemPageClient is a 'use client' component. It receives the
          question data as a prop (no additional client-side API call needed)
          and lazy-loads the Monaco Editor with ssr:false.

          The `right-panel` stays completely invisible during SSR — it doesn't
          add a single byte to the server HTML that crawlers evaluate.
          This keeps the LCP element (the <h1> and description) at the top
          of the HTML document where it counts most for Core Web Vitals.
        */}
        <div style={{ position: 'sticky', top: '5rem', height: 'fit-content' }}>
          <ProblemPageClient question={question} />
        </div>
      </main>
    </>
  );
}
