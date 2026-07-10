'use client';

import React, { useEffect, useRef, useState } from 'react';

export type RoleOption<T extends string> = {
  value: T;
  label: string;
};

type RoleSelectorDropdownProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: RoleOption<T>[];
  align?: 'left' | 'right';
  variant?: 'amber' | 'blush';
};

const TRIGGER_AMBER =
  'flex w-full items-center justify-between gap-2 bg-slate-900 border border-slate-700 text-slate-100 font-bold px-4 py-2 rounded-xl text-xs focus:outline-none focus:border-amber-500 transition-all cursor-pointer min-w-[180px]';

const TRIGGER_BLUSH =
  'flex w-full items-center justify-between gap-2 bg-slate-900 border border-slate-700 text-slate-100 font-bold px-4 py-2 rounded-xl text-xs focus:outline-none focus:border-[#D48D82] focus:ring-1 focus:ring-[#D48D82] transition-all cursor-pointer min-w-[180px]';

const MENU_CLASSNAME =
  'absolute mt-2 w-52 bg-[#0F172A] border border-slate-800 rounded-xl shadow-xl overflow-hidden py-1 z-50';

const ROW_CLASSNAME =
  'w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer flex items-center justify-between';

const ACTIVE_ROW_AMBER = 'bg-amber-600/10 text-amber-400 font-bold';
const ACTIVE_ROW_BLUSH = 'bg-[#D48D82]/10 text-[#E0A89F] font-bold';

export default function RoleSelectorDropdown<T extends string>({
  value,
  onChange,
  options,
  align = 'right',
  variant = 'amber',
}: RoleSelectorDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const triggerClass = variant === 'blush' ? TRIGGER_BLUSH : TRIGGER_AMBER;
  const activeRowClass = variant === 'blush' ? ACTIVE_ROW_BLUSH : ACTIVE_ROW_AMBER;
  const checkColor = variant === 'blush' ? 'text-[#E0A89F]' : 'text-amber-400';

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((prev) => !prev)}
        className={triggerClass}
      >
        <span className="min-w-0 truncate text-left">
          {selected?.label ?? 'Select role'}
        </span>
        <span className="shrink-0 text-slate-200" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Role options"
          className={`${MENU_CLASSNAME} ${align === 'left' ? 'left-0' : 'right-0'}`}
        >
          {options.map((option) => {
            const isActive = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`${ROW_CLASSNAME} ${isActive ? activeRowClass : ''}`}
              >
                <span className="min-w-0 truncate pr-2">{option.label}</span>
                {isActive && (
                  <span className={`shrink-0 ${checkColor}`} aria-hidden>
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
