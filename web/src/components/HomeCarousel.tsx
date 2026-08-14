'use client';

import {
  Children,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

type Props = {
  children: ReactNode;
  label: string;
  className?: string;
  /** Dwell time per slide in ms. Set 0 to disable autoplay. */
  autoplayMs?: number;
  /** Stagger start so multiple carousels don’t move in sync. */
  autoplayDelayMs?: number;
};

export function HomeCarousel({
  children,
  label,
  className = '',
  autoplayMs = 3800,
  autoplayDelayMs = 0,
}: Props) {
  const t = useTranslations('home');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const items = Children.toArray(children);
  const count = items.length;

  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** +1 = forward. In RTL, forward visually moves content to the right. */
  const autoDir = useRef<1 | -1>(1);

  const [index, setIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(1);
  const [paused, setPaused] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(autoplayDelayMs <= 0);
  const [progressKey, setProgressKey] = useState(0);
  const dragStart = useRef<{ x: number; index: number } | null>(null);

  const maxIndex = Math.max(0, count - visible);
  const canNav = count > visible;
  const autoplayActive =
    Boolean(autoplayMs) &&
    canNav &&
    bootstrapped &&
    !paused &&
    !hoverPaused &&
    !dragging;

  const measure = useCallback(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    const first = track.querySelector<HTMLElement>('.home-carousel__slide');
    if (!first) return;
    const styles = getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || '16') || 16;
    const itemWidth = first.getBoundingClientRect().width;
    const nextStep = itemWidth + gap;
    const peek = Math.min(56, itemWidth * 0.28);
    const nextVisible = Math.max(
      1,
      Math.floor((viewport.clientWidth - peek + gap) / nextStep),
    );
    setStep(nextStep);
    setVisible(nextVisible);
    setIndex((i) => Math.min(i, Math.max(0, count - nextVisible)));
  }, [count]);

  useLayoutEffect(() => {
    measure();
    const viewport = viewportRef.current;
    if (!viewport || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const ro = new ResizeObserver(() => measure());
    ro.observe(viewport);
    return () => ro.disconnect();
  }, [measure, count]);

  const pauseTemporarily = useCallback(() => {
    setPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), 5500);
  }, []);

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(maxIndex, next));
      setIndex(clamped);
      setProgressKey((k) => k + 1);
    },
    [maxIndex],
  );

  /** User-driven move — pauses autoplay briefly */
  const go = useCallback(
    (dir: -1 | 1) => {
      pauseTemporarily();
      autoDir.current = dir;
      setIndex((i) => {
        if (maxIndex <= 0) return 0;
        const next = i + dir;
        if (next > maxIndex) return 0;
        if (next < 0) return maxIndex;
        return next;
      });
      setProgressKey((k) => k + 1);
    },
    [maxIndex, pauseTemporarily],
  );

  /** Autoplay step — ping-pong so it never hard-jumps */
  const advance = useCallback(() => {
    setIndex((i) => {
      if (maxIndex <= 0) return 0;
      if (i >= maxIndex) {
        autoDir.current = -1;
        return Math.max(0, maxIndex - 1);
      }
      if (i <= 0) {
        autoDir.current = 1;
        return Math.min(maxIndex, 1);
      }
      return i + autoDir.current;
    });
    setProgressKey((k) => k + 1);
  }, [maxIndex]);

  useEffect(() => {
    if (autoplayDelayMs <= 0) {
      setBootstrapped(true);
      return;
    }
    setBootstrapped(false);
    const id = window.setTimeout(() => setBootstrapped(true), autoplayDelayMs);
    return () => window.clearTimeout(id);
  }, [autoplayDelayMs]);

  useEffect(() => {
    if (!autoplayActive || !autoplayMs) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const id = window.setTimeout(() => {
      if (!document.hidden) advance();
    }, autoplayMs);

    return () => window.clearTimeout(id);
  }, [autoplayActive, autoplayMs, advance, index]);

  useEffect(() => {
    return () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, []);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !canNav) return;
    const target = e.target as HTMLElement;
    if (target.closest('a, button, input, select, textarea, [role="button"]')) return;
    dragStart.current = { x: e.clientX, index };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStart.current || !step) return;
    const dx = e.clientX - dragStart.current.x;
    if (Math.abs(dx) < 4 && !dragging) return;
    const track = trackRef.current;
    if (!track) return;
    const base = (isRtl ? 1 : -1) * dragStart.current.index * step;
    const drag = isRtl ? -dx : dx;
    track.style.transition = 'none';
    track.style.transform = `translate3d(${base + drag}px, 0, 0)`;
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStart.current || !step) {
      setDragging(false);
      return;
    }
    const dx = e.clientX - dragStart.current.x;
    const threshold = Math.min(72, step * 0.2);
    const track = trackRef.current;
    if (track) {
      track.style.transition = '';
      track.style.transform = '';
    }
    if (Math.abs(dx) > threshold) {
      const dir = (isRtl ? dx > 0 : dx < 0) ? 1 : -1;
      autoDir.current = dir as 1 | -1;
      go(dir as -1 | 1);
    } else {
      goTo(dragStart.current.index);
      pauseTemporarily();
    }
    dragStart.current = null;
    setDragging(false);
  };

  const offset = step ? (isRtl ? 1 : -1) * index * step : 0;

  return (
    <div
      className={`home-carousel home-carousel--slides${autoplayActive ? ' is-autoplaying' : ''} ${className}`.trim()}
      style={
        autoplayMs
          ? ({ '--home-autoplay-ms': `${autoplayMs}ms` } as CSSProperties)
          : undefined
      }
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocusCapture={() => setHoverPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setHoverPaused(false);
        }
      }}
    >
      <button
        type="button"
        className="home-carousel__nav home-carousel__nav--prev"
        onClick={() => go(-1)}
        disabled={!canNav}
        aria-label={t('scrollPrev')}
      >
        <ChevronLeft size={20} aria-hidden="true" />
      </button>

      <div className="home-carousel__viewport" ref={viewportRef}>
        <div
          ref={trackRef}
          className={`home-carousel__track${dragging ? ' is-dragging' : ''}`}
          role="region"
          aria-label={label}
          aria-roledescription="carousel"
          style={{ transform: `translate3d(${offset}px, 0, 0)` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {items.map((child, i) => {
            const inView = i >= index && i < index + visible;
            const isPeek = i === index + visible || i === index - 1;
            return (
              <div
                key={i}
                className={[
                  'home-carousel__slide',
                  i === index ? 'is-active' : '',
                  inView ? 'is-inview' : '',
                  isPeek ? 'is-peek' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-hidden={!inView && !isPeek}
              >
                {child}
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        className="home-carousel__nav home-carousel__nav--next"
        onClick={() => go(1)}
        disabled={!canNav}
        aria-label={t('scrollNext')}
      >
        <ChevronRight size={20} aria-hidden="true" />
      </button>

      {canNav ? (
        <div className="home-carousel__dots" role="tablist" aria-label={label}>
          {Array.from({ length: maxIndex + 1 }, (_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`${i + 1} / ${maxIndex + 1}`}
              className={`home-carousel__dot${i === index ? ' is-active' : ''}`}
              onClick={() => {
                pauseTemporarily();
                autoDir.current = i >= index ? 1 : -1;
                goTo(i);
              }}
            >
              {i === index && autoplayActive ? (
                <span
                  key={progressKey}
                  className="home-carousel__dot-progress"
                  aria-hidden="true"
                />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
