'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Props = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Accessible name for the nav */
  label?: string;
  className?: string;
};

function pageWindow(current: number, total: number, radius = 1): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, total, current]);
  for (let i = current - radius; i <= current + radius; i += 1) {
    if (i >= 1 && i <= total) pages.add(i);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | 'ellipsis')[] = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('ellipsis');
    out.push(sorted[i]);
  }
  return out;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  label,
  className = '',
}: Props) {
  const t = useTranslations('pagination');
  if (totalPages <= 1 || totalItems === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  const items = pageWindow(page, totalPages);

  return (
    <nav
      className={`pagination ${className}`.trim()}
      aria-label={label || t('navLabel')}
    >
      <p className="pagination__summary" aria-live="polite">
        {t('showing', { from, to, total: totalItems })}
      </p>

      <div className="pagination__controls">
        <button
          type="button"
          className="btn btn-ghost pagination__btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label={t('prev')}
        >
          <ChevronLeft size={16} aria-hidden="true" className="pagination__chevron" />
          <span className="pagination__btn-text">{t('prev')}</span>
        </button>

        <ul className="pagination__pages">
          {items.map((item, idx) =>
            item === 'ellipsis' ? (
              <li key={`e-${idx}`} className="pagination__ellipsis" aria-hidden="true">
                …
              </li>
            ) : (
              <li key={item}>
                <button
                  type="button"
                  className={`pagination__page${item === page ? ' is-current' : ''}`}
                  aria-label={t('goto', { page: item })}
                  aria-current={item === page ? 'page' : undefined}
                  onClick={() => onPageChange(item)}
                >
                  {item}
                </button>
              </li>
            ),
          )}
        </ul>

        <button
          type="button"
          className="btn btn-ghost pagination__btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label={t('next')}
        >
          <span className="pagination__btn-text">{t('next')}</span>
          <ChevronRight size={16} aria-hidden="true" className="pagination__chevron" />
        </button>
      </div>
    </nav>
  );
}
