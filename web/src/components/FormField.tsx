'use client';

import { ReactNode, useId } from 'react';

type Props = {
  label: string;
  children: (ids: { id: string; describedBy?: string }) => ReactNode;
  error?: string;
  hint?: string;
  className?: string;
  htmlFor?: string;
};

export function FormField({ label, children, error, hint, className = '', htmlFor }: Props) {
  const autoId = useId();
  const id = htmlFor || autoId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`field ${className}`.trim()}>
      <label htmlFor={id}>{label}</label>
      {children({ id, describedBy })}
      {hint && !error ? (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
