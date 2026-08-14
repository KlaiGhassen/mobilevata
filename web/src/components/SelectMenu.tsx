'use client';

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export type SelectOption = {
  value: string;
  label: string;
  icon?: React.ReactNode;
  hint?: string;
};

type Props = {
  id?: string;
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  clearable?: boolean;
  emptyText?: string;
  size?: 'md' | 'lg';
};

type PanelPos = { top: number; left: number; width: number; maxHeight: number; placement: 'bottom' | 'top' };

export function SelectMenu({
  id,
  label,
  value,
  options,
  onChange,
  placeholder = '—',
  disabled = false,
  searchable = false,
  searchPlaceholder = 'Search…',
  clearable = false,
  emptyText = 'No results',
  size = 'md',
}: Props) {
  const autoId = useId();
  const fieldId = id || autoId;
  const listId = `${fieldId}-list`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<PanelPos | null>(null);
  const [darkTone, setDarkTone] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const filled = Boolean(value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.hint?.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q),
    );
  }, [options, query]);

  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 6;
    const viewportPad = 8;
    const spaceBelow = window.innerHeight - rect.bottom - viewportPad;
    const spaceAbove = rect.top - viewportPad;
    const preferBottom = spaceBelow >= 220 || spaceBelow >= spaceAbove;
    const maxHeight = Math.max(160, Math.min(320, preferBottom ? spaceBelow - gap : spaceAbove - gap));
    const width = Math.max(rect.width, 200);
    let left = rect.left;
    if (left + width > window.innerWidth - viewportPad) {
      left = Math.max(viewportPad, window.innerWidth - width - viewportPad);
    }
    left = Math.max(viewportPad, left);

    setPos({
      top: preferBottom ? rect.bottom + gap : rect.top - gap,
      left,
      width,
      maxHeight,
      placement: preferBottom ? 'bottom' : 'top',
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    setDarkTone(
      Boolean(rootRef.current?.closest('.search-panel--hero')) &&
        document.documentElement.getAttribute('data-theme') === 'dark',
    );
    updatePosition();
    const onReposition = () => updatePosition();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const idx = Math.max(
      0,
      filtered.findIndex((o) => o.value === value),
    );
    setActive(idx === -1 ? 0 : idx);
    const t = window.setTimeout(() => {
      if (searchable) searchRef.current?.focus();
      else listRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, filtered, value, searchable]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
      setQuery('');
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        setQuery('');
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery('');
    triggerRef.current?.focus();
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
    }
  };

  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(Math.max(filtered.length - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = filtered[active];
      if (opt) pick(opt.value);
    } else if (e.key === 'Tab') {
      setOpen(false);
      setQuery('');
    }
  };

  const panel =
    open && pos && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={panelRef}
            className={`select-panel surface select-panel--portal select-panel--${pos.placement}${darkTone ? ' select-panel--dark' : ''}`}
            style={{
              top: pos.placement === 'bottom' ? pos.top : undefined,
              bottom: pos.placement === 'top' ? window.innerHeight - pos.top : undefined,
              left: pos.left,
              width: pos.width,
              maxHeight: pos.maxHeight,
            }}
            role="presentation"
          >
            {searchable && (
              <div className="select-search">
                <Search size={14} aria-hidden="true" className="select-search__icon" />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  onKeyDown={onListKeyDown}
                />
              </div>
            )}

            <div
              ref={listRef}
              id={listId}
              role="listbox"
              aria-labelledby={`${fieldId}-label`}
              className="select-list"
              tabIndex={searchable ? -1 : 0}
              onKeyDown={onListKeyDown}
            >
              {filtered.length === 0 ? (
                <div className="select-empty">{emptyText}</div>
              ) : (
                filtered.map((opt, index) => {
                  const isSelected = opt.value === value;
                  const isActive = index === active;
                  return (
                    <button
                      key={opt.value || `__empty-${index}`}
                      type="button"
                      role="option"
                      data-index={index}
                      aria-selected={isSelected}
                      className={`select-option${isSelected ? ' is-selected' : ''}${isActive ? ' is-active' : ''}`}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => pick(opt.value)}
                    >
                      {opt.icon ? (
                        <span className="select-option__icon" aria-hidden="true">
                          {opt.icon}
                        </span>
                      ) : null}
                      <span className="select-option__text">
                        <span>{opt.label}</span>
                        {opt.hint ? <small>{opt.hint}</small> : null}
                      </span>
                      {isSelected ? <Check size={16} aria-hidden="true" /> : <span style={{ width: 16 }} />}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      ref={rootRef}
      className={`field select-field select-field--${size}${filled ? ' is-filled' : ''}${disabled ? ' is-disabled' : ''}${open ? ' is-open' : ''}`}
    >
      <label id={`${fieldId}-label`} htmlFor={fieldId}>
        {label}
      </label>

      <div className="select-control">
        <button
          ref={triggerRef}
          type="button"
          id={fieldId}
          className="select-trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-labelledby={`${fieldId}-label`}
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            setOpen((v) => !v);
            if (open) setQuery('');
          }}
          onKeyDown={onTriggerKeyDown}
        >
          <span className="select-trigger__value">
            {selected?.icon ? (
              <span className="select-trigger__icon" aria-hidden="true">
                {selected.icon}
              </span>
            ) : null}
            <span className={`select-trigger__label${selected ? '' : ' select-trigger__placeholder'}`}>
              {selected?.label ?? placeholder}
            </span>
          </span>
          <ChevronDown size={16} aria-hidden="true" className="select-trigger__chevron" />
        </button>

        {clearable && filled && !disabled ? (
          <button
            type="button"
            className="select-clear"
            aria-label="Clear"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
          >
            <X size={14} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {panel}
    </div>
  );
}
