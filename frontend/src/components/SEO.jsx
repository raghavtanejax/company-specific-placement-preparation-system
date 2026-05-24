import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * SEO Component — Stage 1 (react-helmet-async)
 * -----------------------------------------------
 * A reusable "slot" for page-level metadata. Drop it anywhere inside a
 * route component and it will inject the correct tags into <head>.
 *
 * Usage on a static page (e.g., Landing / About):
 *   <SEO title="PrepAI – Crack Any Placement Interview" />
 *
 * Usage on a dynamic page (e.g., CompanyDetail):
 *   <SEO
 *     title={`${company.name} Interview Questions | PrepAI`}
 *     description={`Prepare for ${company.name} placements. ${company.questionCount}+ curated questions, hiring roadmap, and community interview experiences.`}
 *     canonical={`https://prepai.in/companies/${company.slug}`}
 *     ogImage="https://prepai.in/og-default.png"
 *   />
 *
 * Hierarchy: The last <Helmet> to render wins, so child routes always
 * override the default set in <DefaultSEO />.
 */
const SEO = ({
  title,
  description,
  canonical,
  ogType = 'website',
  ogImage,
  ogImageAlt,
  noIndex = false,
  children,
}) => {
  /* ── Constants ─────────────────────────────────────────────────────── */
  const SITE_NAME    = 'PrepAI';
  const DEFAULT_DESC = 'PrepAI is your AI-powered, company-specific placement preparation platform. Practice 2,300+ curated interview questions, analyse job descriptions with Gemini AI, and read real community experiences.';
  const DEFAULT_OG   = 'https://prepai.in/og-default.png';
  const BASE_URL     = 'https://prepai.in';

  const metaTitle    = title   || `${SITE_NAME} – Company-Specific Placement Preparation`;
  const metaDesc     = description || DEFAULT_DESC;
  const metaOgImage  = ogImage || DEFAULT_OG;
  const metaCanonical = canonical ? `${BASE_URL}${canonical}` : null;

  return (
    <Helmet>
      {/* ── Primary ──────────────────────────────────────────────────── */}
      <title>{metaTitle}</title>
      <meta name="description" content={metaDesc} />

      {/* Prevent private/auth pages from being indexed */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Canonical link prevents duplicate-content penalties */}
      {metaCanonical && <link rel="canonical" href={metaCanonical} />}

      {/* ── Open Graph (Facebook, LinkedIn, WhatsApp, Slack) ─────────── */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title"       content={metaTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:type"        content={ogType} />
      <meta property="og:image"       content={metaOgImage} />
      {ogImageAlt && <meta property="og:image:alt" content={ogImageAlt} />}
      {metaCanonical && <meta property="og:url" content={metaCanonical} />}

      {/* ── Twitter Card ─────────────────────────────────────────────── */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:site"        content="@prepai_in" />
      <meta name="twitter:title"       content={metaTitle} />
      <meta name="twitter:description" content={metaDesc} />
      <meta name="twitter:image"       content={metaOgImage} />

      {/* Slot for page-specific extras (e.g. JSON-LD structured data) */}
      {children}
    </Helmet>
  );
};

export default SEO;
