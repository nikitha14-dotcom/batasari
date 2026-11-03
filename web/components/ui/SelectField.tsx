'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { Icon } from '@/components/navigation/icons';
import styles from './ui.module.css';

export type SelectOption = { value: string; label: string };

/**
 * The 933 x 75 field and the menu that drops below it (Feedback_1 ->
 * Feedback_2).
 *
 * Built as a button plus a listbox rather than a native <select> because the
 * design's menu rows are 44px tall with their own hover and selected states,
 * which a native control will not render. That means owning the keyboard and
 * outside-click behaviour, which the design does not specify: Escape closes,
 * click outside closes, Enter/Space opens.
 */
export function SelectField({
  label,
  options,
  value,
  onChange,
  placeholder,
  error,
  compact = false,
}: {
  label: string;
  options: readonly SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string | null;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();
  const valueId = useId();
  const errorId = useId();

  const selected = options.find((option) => option.value === value) ?? null;

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className={`${styles.field} ${compact ? styles.selectCompact : ''}`}>
      <span className={styles.fieldLabel} id={labelId}>
        {label}
      </span>

      <div className={styles.selectWrap} ref={wrapRef}>
        <button
          ref={buttonRef}
          type="button"
          className={styles.select}
          aria-haspopup="listbox"
          aria-expanded={open}
          /* Both, so the button announces "Feedback Type: Bug Report"
             rather than just the label -- otherwise a screen reader user
             cannot tell what is currently selected. */
          aria-labelledby={`${labelId} ${valueId}`}
          aria-describedby={error ? errorId : undefined}
          onClick={() => setOpen((wasOpen) => !wasOpen)}
        >
          <span id={valueId} className={selected ? styles.selectValue : styles.selectPlaceholder}>
            {selected ? selected.label : placeholder}
          </span>
          <span className={`${styles.selectChevron} ${open ? styles.selectChevronOpen : ''}`}>
            <Icon name="chevron-down" size={16} />
          </span>
        </button>

        {open && (
          <ul className={styles.menu} role="listbox" aria-labelledby={labelId}>
            {options.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  className={`${styles.menuItem} ${
                    option.value === value ? styles.menuItemSelected : ''
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    buttonRef.current?.focus();
                  }}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <span className={styles.fieldError} id={errorId} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

