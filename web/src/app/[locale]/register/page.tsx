'use client';

import { FormEvent, useState } from 'react';
import {
  Eye,
  EyeOff,
  Heart,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Alert } from '@/components/Alert';
import { FormField } from '@/components/FormField';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = t('required');
    if (!form.lastName.trim()) next.lastName = t('required');
    if (!form.email.trim()) next.email = t('required');
    if (form.password.length < 8 || !/(?=.*[A-Za-z])(?=.*\d)/.test(form.password)) {
      next.password = t('passwordHint');
    }
    if (form.password !== form.confirmPassword) {
      next.confirmPassword = t('passwordMismatch');
    }
    setFieldErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setError('');
    try {
      const { confirmPassword: _, ...payload } = form;
      await register(payload);
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
        <div className="auth-gate__visual-media auth-gate__visual-media--register" />
        <div className="auth-gate__visual-scrim" />
        <div className="auth-gate__visual-content">
          <p className="auth-gate__eyebrow">{t('registerEyebrow')}</p>
          <h2 className="auth-gate__visual-title">{t('registerVisualTitle')}</h2>
          <p className="auth-gate__visual-body">{t('registerVisualBody')}</p>
          <ul className="auth-gate__trust">
            <li>
              <ShieldCheck size={18} aria-hidden="true" />
              <span>{t('registerTrust1')}</span>
            </li>
            <li>
              <Heart size={18} aria-hidden="true" />
              <span>{t('registerTrust2')}</span>
            </li>
            <li>
              <MessagesSquare size={18} aria-hidden="true" />
              <span>{t('registerTrust3')}</span>
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
            <h1 className="auth-gate__title">{t('registerTitle')}</h1>
            <p className="auth-gate__lead">{t('registerHint')}</p>
          </header>

          {process.env.NODE_ENV === 'development' ? (
            <p className="auth-gate__demo">
              <Sparkles size={14} aria-hidden="true" />
              {t('demo')}
            </p>
          ) : null}

          <form className="auth-gate__form" onSubmit={onSubmit} noValidate>
            {error ? <Alert tone="error">{error}</Alert> : null}

            <div className="auth-gate__row">
              <FormField label={t('firstName')} error={fieldErrors.firstName}>
                {({ id, describedBy }) => (
                  <input
                    id={id}
                    autoComplete="given-name"
                    required
                    aria-invalid={Boolean(fieldErrors.firstName)}
                    aria-describedby={describedBy}
                    value={form.firstName}
                    onChange={(e) => set('firstName', e.target.value)}
                  />
                )}
              </FormField>
              <FormField label={t('lastName')} error={fieldErrors.lastName}>
                {({ id, describedBy }) => (
                  <input
                    id={id}
                    autoComplete="family-name"
                    required
                    aria-invalid={Boolean(fieldErrors.lastName)}
                    aria-describedby={describedBy}
                    value={form.lastName}
                    onChange={(e) => set('lastName', e.target.value)}
                  />
                )}
              </FormField>
            </div>

            <FormField label={t('email')} error={fieldErrors.email}>
              {({ id, describedBy }) => (
                <input
                  id={id}
                  type="email"
                  autoComplete="email"
                  required
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={describedBy}
                  value={form.email}
                  placeholder={t('emailPlaceholder')}
                  onChange={(e) => set('email', e.target.value)}
                />
              )}
            </FormField>

            <FormField
              label={t('password')}
              error={fieldErrors.password}
              hint={!fieldErrors.password ? t('passwordHint') : undefined}
            >
              {({ id, describedBy }) => (
                <div className="auth-gate__password">
                  <input
                    id={id}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={describedBy}
                    value={form.password}
                    placeholder={t('passwordPlaceholder')}
                    onChange={(e) => set('password', e.target.value)}
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

            <FormField
              label={t('confirmPassword')}
              error={fieldErrors.confirmPassword}
            >
              {({ id, describedBy }) => (
                <div className="auth-gate__password">
                  <input
                    id={id}
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    aria-invalid={Boolean(fieldErrors.confirmPassword)}
                    aria-describedby={describedBy}
                    value={form.confirmPassword}
                    onChange={(e) => set('confirmPassword', e.target.value)}
                  />
                  <button
                    type="button"
                    className="auth-gate__password-toggle"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? t('hidePassword') : t('showPassword')}
                  >
                    {showConfirm ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>
              )}
            </FormField>

            <FormField label={t('phone')}>
              {({ id }) => (
                <input
                  id={id}
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                />
              )}
            </FormField>

            <button
              className="btn btn-primary auth-gate__submit"
              type="submit"
              disabled={loading}
            >
              {loading ? t('creating') : t('signUp')}
            </button>
          </form>

          <p className="auth-gate__footer">
            {t('hasAccount')}{' '}
            <Link href="/login" className="auth-gate__link">
              {t('signIn')}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
