import { defaultLocale } from '@/i18n/routing';

/** Root not-found — delegates into the locale shell via redirect path. */
export default function RootNotFound() {
  // Soft fallback when outside the locale layout tree
  return (
    <html lang={defaultLocale}>
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
          textAlign: 'center',
        }}
      >
        <div>
          <p style={{ fontSize: 48, fontWeight: 800, margin: 0, color: '#0f766e' }}>404</p>
          <h1 style={{ fontSize: 24, margin: '12px 0' }}>Page not found</h1>
          <p style={{ color: '#64748b', marginBottom: 20 }}>
            This road doesn&apos;t lead anywhere.
          </p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- root shell, no router context */}
          <a
            href="/"
            style={{
              minHeight: 44,
              padding: '0 16px',
              borderRadius: 8,
              background: '#0f766e',
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Back to home
          </a>
        </div>
      </body>
    </html>
  );
}
