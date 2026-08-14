import { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { CarEmptyIllustration } from '@/components/CarEmptyIllustration';

type Props = {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  /** When true (default), show the car illustration instead of a small icon. */
  illustration?: boolean;
};

export function EmptyState({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
  illustration = true,
}: Props) {
  return (
    <div className="empty-state surface">
      {illustration ? (
        <div className="empty-state__art" aria-hidden="true">
          <CarEmptyIllustration />
        </div>
      ) : icon ? (
        <div className="empty-state__icon" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <h2 className="empty-state__title">{title}</h2>
      {description ? <p className="empty-state__desc">{description}</p> : null}
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="btn btn-primary">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
