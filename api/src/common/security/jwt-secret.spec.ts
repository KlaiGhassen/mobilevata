import { resolveJwtSecret } from './jwt-secret';

describe('resolveJwtSecret', () => {
  it('rejects missing, short, and known-weak secrets', () => {
    expect(() => resolveJwtSecret(undefined)).toThrow(/required/i);
    expect(() => resolveJwtSecret('short')).toThrow(/32/);
    expect(() =>
      resolveJwtSecret('mobile-de-clone-dev-secret-change-in-production'),
    ).toThrow(/weak/i);
  });

  it('accepts a strong secret', () => {
    const secret = 'a'.repeat(32);
    expect(resolveJwtSecret(secret)).toBe(secret);
  });
});
