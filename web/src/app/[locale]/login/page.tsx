'use client';

import { FormEvent, useState } from 'react';
import { Eye, EyeOff, Heart, MessagesSquare, ShieldCheck, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Alert } from '@/components/Alert';
import { FormField } from '@/components/FormField';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const t = useTranslations('auth');
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof fieldErrors = {};
    if (!email.trim()) next.email = t('required');
    if (!password) next.password = t('required');
    setFieldErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setError('');
    try {
      await login(email.trim(), password);
      router.push('/account');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-gate">
      <section className="auth-gate__visual" aria-hidden="true">
        <div className="auth-gate__visual-media" />
        <div className="auth-gate__visual-scrim" />
        <div className="auth-gate__visual-content">
          <p className="auth-gate__eyebrow">{t('loginEyebrow')}</p>
          <h2 className="auth-gate__visual-title">{t('loginVisualTitle')}</h2>
          <p className="auth-gate__visual-body">{t('loginVisualBody')}</p>
          <ul className="auth-gate__trust">
            <li>
              <ShieldCheck size={18} aria-hidden="true" />
              <span>{t('loginTrust1')}</span>
            </li>
            <li>
              <Heart size={18} aria-hidden="true" />
              <span>{t('loginTrust2')}</span>
            </li>
            <li>
              <MessagesSquare size={18} aria-hidden="true" />
              <span>{t('loginTrust3')}</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="auth-gate__panel">
        <div className="auth-gate__panel-inner fade-up">
          <Link href="/" className="auth-gate__brand" aria-label="Autovia">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt=""
              width={96}
              height={32}
              className="auth-gate__logo"
            />
            <span className="brand-mark">
              Autovia<span>.</span>
            </span>
          </Link>

          <header className="auth-gate__header">
            <h1 className="auth-gate__title">{t('loginTitle')}</h1>
            <p className="auth-gate__lead">{t('loginLead')}</p>
          </header>

          {process.env.NODE_ENV === 'development' ? (
            <p className="auth-gate__demo">
              <Sparkles size={14} aria-hidden="true" />
              {t('demo')}
            </p>
          ) : null}

          <form className="auth-gate__form" onSubmit={onSubmit} noValidate>
            {error ? <Alert tone="error">{error}</Alert> : null}

            <FormField label={t('email')} error={fieldErrors.email}>
              {({ id, describedBy }) => (
                <input
                  id={id}
                  type="email"
                  autoComplete="email"
                  value={email}
                  placeholder={t('emailPlaceholder')}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={describedBy}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              )}
            </FormField>

            <FormField label={t('password')} error={fieldErrors.password}>
              {({ id, describedBy }) => (
                <div className="auth-gate__password">
                  <input
                    id={id}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    placeholder={t('passwordPlaceholder')}
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={describedBy}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="auth-gate__password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                  >
                    {showPassword ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>
              )}
            </FormField>

            <button
              className="btn btn-primary auth-gate__submit"
              type="submit"
              disabled={loading}
            >
              {loading ? t('signingIn') : t('signIn')}
            </button>
          </form>

          <p className="auth-gate__footer">
            {t('noAccount')}{' '}
            <Link href="/register" className="auth-gate__link">
              {t('signUp')}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
