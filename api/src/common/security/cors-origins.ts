const DEFAULT_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
];

/** Shared browser origins for HTTP CORS and Socket.IO. */
export function resolveCorsOrigins(
  raw: string | undefined = process.env.CORS_ORIGINS,
): string[] {
  const fromEnv = (raw || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return fromEnv.length ? fromEnv : DEFAULT_CORS_ORIGINS;
}
