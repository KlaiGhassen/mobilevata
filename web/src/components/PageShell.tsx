import { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';

type Props = {
  children: ReactNode;
  narrow?: boolean;
  form?: boolean;
  className?: string;
};

export function PageShell({ children, narrow, form, className = '' }: Props) {
  const mods = [
    narrow ? 'page-shell--narrow' : '',
    form ? 'page-shell--form' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`page-shell ${mods} ${className}`.trim()}>
      <div className="container page-shell__inner">{children}</div>
    </div>
  );
}

type HeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
};

export function PageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel,
}: HeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header__text">
        {backHref ? (
          <Link href={backHref} className="page-header__back">
            <ArrowLeft size={16} aria-hidden="true" />
            {backLabel || 'Back'}
          </Link>
        ) : null}
        <h1 className="page-header__title">{title}</h1>
        {description ? <p className="page-header__desc">{description}</p> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  );
}
