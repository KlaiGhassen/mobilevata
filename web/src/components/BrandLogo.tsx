'use client';

import { useState } from 'react';
import { brandLogoSrc } from '@/lib/brand-logos';

type Props = {
  name: string;
  logoUrl?: string | null;
  size?: number;
  className?: string;
};

export function BrandLogo({ name, logoUrl, size = 48, className = '' }: Props) {
  const src = brandLogoSrc(name, logoUrl);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span
        className={`brand-logo-fallback ${className}`}
        style={{ width: size, height: size }}
        aria-hidden
      >
        {name.slice(0, 1)}
      </span>
    );
  }

  return (
    <span
      className={`brand-logo-frame ${className}`}
      style={{ width: size, height: Math.round(size * 0.7) }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={size}
        height={Math.round(size * 0.7)}
        onError={() => setFailed(true)}
      />
    </span>
  );
}
