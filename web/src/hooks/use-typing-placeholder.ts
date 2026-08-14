'use client';

import { useEffect, useState } from 'react';

type Phase = 'typing' | 'holding' | 'deleting';

/** Typewriter cycle through phrases; freezes while `paused`. */
export function useTypingPlaceholder(phrases: string[], paused = false) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState(phrases[0] ?? '');
  const [phase, setPhase] = useState<Phase>('typing');
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setText(phrases[0] ?? '');
      return undefined;
    }
    if (paused || !phrases.length) return undefined;

    const phrase = phrases[index % phrases.length] ?? '';

    if (phase === 'typing') {
      if (text.length < phrase.length) {
        const id = window.setTimeout(() => setText(phrase.slice(0, text.length + 1)), 36);
        return () => window.clearTimeout(id);
      }
      const id = window.setTimeout(() => setPhase('holding'), 1700);
      return () => window.clearTimeout(id);
    }

    if (phase === 'holding') {
      const id = window.setTimeout(() => setPhase('deleting'), 0);
      return () => window.clearTimeout(id);
    }

    if (text.length > 0) {
      const id = window.setTimeout(() => setText(text.slice(0, -1)), 20);
      return () => window.clearTimeout(id);
    }

    const id = window.setTimeout(() => {
      setIndex((i) => (i + 1) % phrases.length);
      setPhase('typing');
    }, 320);
    return () => window.clearTimeout(id);
  }, [phrases, index, text, phase, paused, reduceMotion]);

  return text;
}
