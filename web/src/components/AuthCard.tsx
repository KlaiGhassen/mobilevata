import { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';

type Props = {
  title: string;
  hint?: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthCard({ title, hint, children, footer }: Props) {
  return (
    <div className="auth-card">
      <header className="auth-card__header">
        <Link href="/" className="auth-card__brand" aria-label="Autovia">
          <img
            src="/logo.png"
            alt=""
            aria-hidden="true"
            width={96}
            height={32}
            className="auth-card__logo"
          />
          <span className="brand-mark">
            Autovia<span>.</span>
          </span>
        </Link>
        <h1 className="auth-card__title">{title}</h1>
        {hint ? <p className="auth-card__hint">{hint}</p> : null}
      </header>
      {children}
      <div className="auth-card__footer">{footer}</div>
    </div>
  );
}
