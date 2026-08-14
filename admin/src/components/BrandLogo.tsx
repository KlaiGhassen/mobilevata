'use client';

import { useState } from 'react';
import { brandLogoSrc } from '@/lib/brand-logos';

type Props = {
  name: string;
  logoUrl?: string | null;
  size?: number;
  className?: string;
};

export function BrandLogo({ name, logoUrl, size = 56, className = '' }: Props) {
  const src = brandLogoSrc(name, logoUrl);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span
        className={`brand-logo brand-logo--fallback ${className}`}
        style={{ width: size, height: size }}
        aria-hidden
      >
        {name.slice(0, 1).toUpperCase()}
      </span>
    );
  }

  return (
    <span
      className={`brand-logo ${className}`}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        onError={() => setFailed(true)}
      />
    </span>
  );
}
