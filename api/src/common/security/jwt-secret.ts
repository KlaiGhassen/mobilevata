import { Logger } from '@nestjs/common';

const WEAK_SECRETS = new Set([
  'dev-secret',
  'change-me',
  'secret',
  'jwt-secret',
  'password',
  'mobile-de-clone-dev-secret-change-in-production',
]);

/**
 * Resolve JWT_SECRET or fail closed. Never falls back to a hardcoded default.
 */
export function resolveJwtSecret(raw: string | undefined): string {
  const secret = (raw || '').trim();
  if (!secret) {
    throw new Error(
      'JWT_SECRET is required. Set a strong value in api/.env (min 32 characters).',
    );
  }
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters.');
  }
  if (WEAK_SECRETS.has(secret.toLowerCase())) {
    throw new Error(
      'JWT_SECRET is a known weak/default value. Generate a unique secret.',
    );
  }
  return secret;
}

export function assertJwtSecretConfigured(raw: string | undefined) {
  const secret = resolveJwtSecret(raw);
  Logger.log('JWT_SECRET validated', 'Security');
  return secret;
}
