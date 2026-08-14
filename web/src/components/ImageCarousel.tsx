'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type TouchEvent,
} from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  images: string[];
  alt: string;
  className?: string;
  sizes?: 'detail' | 'card';
};

const FALLBACK =
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80';

export function ImageCarousel({
  images,
  alt,
  className = '',
  sizes = 'detail',
}: Props) {
  const slides = images.length ? images : [FALLBACK];
  const [index, setIndex] = useState(0);
  const labelId = useId();
  const touchStartX = useRef<number | null>(null);
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIndex(0);
  }, [slides.join('|')]);

  const go = useCallback(
    (next: number) => {
      const len = slides.length;
      setIndex(((next % len) + len) % len);
    },
    [slides.length],
  );

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(index - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      go(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      go(slides.length - 1);
    }
  };

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    go(dx > 0 ? index - 1 : index + 1);
  };

  const multi = slides.length > 1;

  return (
    <div
      ref={regionRef}
      className={`image-carousel image-carousel--${sizes} ${className}`.trim()}
      role="region"
      aria-roledescription="carousel"
      aria-labelledby={labelId}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <p id={labelId} className="visually-hidden">
        {alt}
        {multi ? ` — image ${index + 1} of ${slides.length}` : ''}
      </p>

      <div className="image-carousel__viewport" aria-live="polite">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={slides[index]}
          src={slides[index]}
          alt={multi ? `${alt} (${index + 1}/${slides.length})` : alt}
          className="image-carousel__image"
          draggable={false}
        />
      </div>

      {multi ? (
        <>
          <button
            type="button"
            className="image-carousel__nav image-carousel__nav--prev"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              go(index - 1);
            }}
            aria-label="Previous image"
          >
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="image-carousel__nav image-carousel__nav--next"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              go(index + 1);
            }}
            aria-label="Next image"
          >
            <ChevronRight size={22} aria-hidden="true" />
          </button>

          {sizes === 'detail' ? (
            <div className="image-carousel__counter" aria-hidden="true">
              {index + 1} / {slides.length}
            </div>
          ) : null}

          {sizes === 'detail' ? (
            <div className="image-carousel__thumbs" role="tablist" aria-label="Photos">
              {slides.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  className={`image-carousel__thumb${i === index ? ' is-active' : ''}`}
                  onClick={() => go(i)}
                  aria-label={`Show image ${i + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          ) : (
            <div className="image-carousel__dots" role="tablist" aria-label="Photos">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  className={`image-carousel__dot${i === index ? ' is-active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    go(i);
                  }}
                  aria-label={`Show image ${i + 1}`}
                />
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
