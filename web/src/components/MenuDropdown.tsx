'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

type MenuOption<T extends string> = {
  value: T;
  label: string;
  icon?: React.ReactNode;
};

type Props<T extends string> = {
  label: string;
  value: T;
  options: MenuOption<T>[];
  onChange: (value: T) => void;
  icon?: React.ReactNode;
  align?: 'start' | 'end';
};

export function MenuDropdown<T extends string>({
  label,
  value,
  options,
  onChange,
  icon,
  align = 'end',
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="menu-dropdown" style={{ position: 'relative' }}>
      <button
        type="button"
        className="btn btn-ghost menu-dropdown__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        title={label}
      >
        {icon}
        <span className="menu-dropdown__label">{selected?.label ?? label}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          className="menu-dropdown__panel surface"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            [align === 'end' ? 'insetInlineEnd' : 'insetInlineStart']: 0,
            zIndex: 60,
            minWidth: 180,
            padding: 'var(--space-1)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                className="menu-dropdown__item"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {option.icon}
                  {option.label}
                </span>
                {active ? <Check size={16} aria-hidden="true" /> : <span style={{ width: 16 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
