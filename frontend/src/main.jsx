import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import App from './App.jsx';

/**
 * Stage 1 SEO: Wrap the entire React tree in <HelmetProvider>.
 *
 * HelmetProvider creates a shared context that all descendant <Helmet>
 * instances communicate through. This must be the outermost wrapper so
 * every page component can inject its own <title>, <meta>, and OG tags.
 *
 * react-helmet-async is thread-safe (unlike the legacy react-helmet),
 * which makes it production-ready for both CSR (this project) and future
 * SSR/Next.js environments.
 *
 * Install:  npm install react-helmet-async
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
);
