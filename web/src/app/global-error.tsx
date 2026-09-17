'use client';

import { useEffect } from 'react';

/** Root-level fallback when the locale layout itself fails. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
          background: '#f8fafc',
          color: '#0f172a',
          padding: 24,
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <p style={{ fontSize: 48, fontWeight: 800, margin: 0, color: '#0f766e' }}>500</p>
          <h1 style={{ fontSize: 24, margin: '12px 0' }}>Something went wrong</h1>
          <p style={{ color: '#64748b', marginBottom: 20 }}>
            An unexpected error occurred. You can try again or go back home.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={reset}
              style={{
                minHeight: 44,
                padding: '0 16px',
                borderRadius: 8,
                border: 'none',
                background: '#0f766e',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- no router context in global-error */}
            <a
              href="/"
              style={{
                minHeight: 44,
                padding: '0 16px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                display: 'inline-flex',
                alignItems: 'center',
                fontWeight: 600,
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
