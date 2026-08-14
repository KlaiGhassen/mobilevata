/** Decorative empty-state car illustration (inline SVG). */
export function CarEmptyIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`car-illustration ${className}`.trim()}
      viewBox="0 0 280 180"
      width="220"
      height="142"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="presentation"
    >
      <ellipse cx="140" cy="158" rx="88" ry="10" fill="currentColor" opacity="0.08" />
      <path
        d="M48 118c8-28 28-46 52-52 18-4 36-4 54 2 22 8 40 18 52 34l18 8c8 4 12 12 10 20H42c-2-8 0-14 6-12z"
        fill="currentColor"
        opacity="0.12"
      />
      <path
        d="M62 112c10-24 30-38 52-42 20-4 42-2 60 8 16 10 30 22 38 34"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M54 118h172c6 0 10 4 10 10v8H44v-8c0-6 4-10 10-10z"
        fill="currentColor"
        opacity="0.18"
      />
      <rect x="78" y="78" width="52" height="28" rx="8" fill="currentColor" opacity="0.22" />
      <rect x="140" y="78" width="58" height="28" rx="8" fill="currentColor" opacity="0.16" />
      <circle cx="88" cy="136" r="18" fill="var(--color-surface)" stroke="currentColor" strokeWidth="3" opacity="0.7" />
      <circle cx="88" cy="136" r="8" fill="currentColor" opacity="0.35" />
      <circle cx="198" cy="136" r="18" fill="var(--color-surface)" stroke="currentColor" strokeWidth="3" opacity="0.7" />
      <circle cx="198" cy="136" r="8" fill="currentColor" opacity="0.35" />
      <path
        d="M118 104h28"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.35"
      />
      <circle cx="214" cy="112" r="4" fill="var(--color-primary)" opacity="0.9" />
      <circle cx="66" cy="112" r="4" fill="currentColor" opacity="0.45" />
    </svg>
  );
}
