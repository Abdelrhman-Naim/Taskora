'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { todayString } from '@/lib/dates';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './DatePicker.module.css';

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  id?: string;
  value?: string; // Expected format: 'YYYY-MM-DD'
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
  'data-testid'?: string;
}

const AR_WEEKDAYS = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];
const EN_WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function DatePicker({
  id,
  value = '',
  onChange,
  disabled,
  className = '',
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedby,
  'data-testid': dataTestId,
  placeholder = 'YYYY-MM-DD',
  ...rest
}: DatePickerProps): React.ReactElement {
  const { locale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  // Initialize view year and month based on initial value or today
  const today = todayString();
  const initialDateParts = value ? value.split('-').map(Number) : today.split('-').map(Number);
  const [viewYear, setViewYear] = useState<number>(initialDateParts[0] || 2026);
  const [viewMonth, setViewMonth] = useState<number>(
    initialDateParts[1] ? initialDateParts[1] - 1 : 9
  );

  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const updateCoords = () => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const calendarWidth = 310;
    const calendarHeight = 340;
    const isRtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';

    const spaceBelow = window.innerHeight - rect.bottom;
    const top =
      spaceBelow < calendarHeight && rect.top > calendarHeight
        ? rect.top - calendarHeight - 6
        : rect.bottom + 6;

    const left = isRtl
      ? Math.max(8, rect.right - calendarWidth)
      : Math.min(window.innerWidth - calendarWidth - 8, rect.left);

    setCoords({ top, left });
  };

  const handleOpen = () => {
    if (disabled) return;
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m] = value.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    }
    updateCoords();
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Click outside / escape listeners
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        handleClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
        inputRef.current?.focus();
      }
    };

    const handleScroll = () => {
      updateCoords();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen]);

  const fireChangeEvent = (newVal: string) => {
    if (inputRef.current) {
      inputRef.current.value = newVal;
      inputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
      inputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (onChange) {
      const syntheticEvent = {
        target: { value: newVal, name: rest.name || id, id },
        currentTarget: { value: newVal, name: rest.name || id, id },
        preventDefault: () => {},
        stopPropagation: () => {},
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  const handleSelectDate = (y: number, m: number, d: number) => {
    const formattedMonth = String(m + 1).padStart(2, '0');
    const formattedDay = String(d).padStart(2, '0');
    const dateStr = `${y}-${formattedMonth}-${formattedDay}`;
    fireChangeEvent(dateStr);
    handleClose();
  };

  const handleClear = () => {
    fireChangeEvent('');
    handleClose();
  };

  const handleSelectToday = () => {
    fireChangeEvent(today);
    handleClose();
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const prevYear = () => {
    setViewYear((y) => y - 1);
  };

  const nextYear = () => {
    setViewYear((y) => y + 1);
  };

  // Compute days matrix
  const firstDayOfWeek = new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay();
  const daysInCurrentMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
  const daysInPreviousMonth = new Date(Date.UTC(viewYear, viewMonth, 0)).getUTCDate();

  const calendarDays: { day: number; month: number; year: number; isOutside: boolean }[] = [];

  // Trailing days from previous month
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
    calendarDays.push({
      day: daysInPreviousMonth - i,
      month: prevM,
      year: prevY,
      isOutside: true,
    });
  }

  // Days of current month
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    calendarDays.push({
      day: d,
      month: viewMonth,
      year: viewYear,
      isOutside: false,
    });
  }

  // Leading days of next month to complete the week rows
  const remaining = (7 - (calendarDays.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
    calendarDays.push({
      day: d,
      month: nextM,
      year: nextY,
      isOutside: true,
    });
  }

  const weekdays = locale === 'ar' ? AR_WEEKDAYS : EN_WEEKDAYS;
  const monthDisplayNum = String(viewMonth + 1).padStart(2, '0');

  return (
    <div ref={wrapperRef} className={styles.container}>
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          dir="ltr"
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            fireChangeEvent(val);
            if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
              const [y, m] = val.split('-').map(Number);
              setViewYear(y);
              setViewMonth(m - 1);
            }
          }}
          onFocus={handleOpen}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedby}
          data-testid={dataTestId || 'task-due-date-input'}
          className={`${styles.input} ${className}`.trim()}
          autoComplete="off"
          {...rest}
        />

        {/* Gold Calendar trigger button */}
        <button
          type="button"
          tabIndex={-1}
          aria-label={locale === 'ar' ? 'فتح التقويم' : 'Open calendar'}
          disabled={disabled}
          className={styles.calendarIconBtn}
          onClick={() => {
            if (isOpen) {
              handleClose();
            } else {
              handleOpen();
            }
          }}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>

        {/* Quick clear button */}
        {value && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            aria-label={locale === 'ar' ? 'مسح التاريخ' : 'Clear date'}
            className={styles.clearBtn}
            onClick={handleClear}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Luxury Custom Calendar Portal Popover */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            className={styles.calendarPopover}
            role="dialog"
            aria-modal="true"
            aria-label={locale === 'ar' ? 'التقويم' : 'Calendar'}
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
          >
            {/* Header: Pure numbers display + Quick navigation */}
            <div className={styles.header}>
              <div className={styles.headerTitle} dir="ltr">
                <span className={styles.headerTitleYear}>{viewYear}</span>
                <span>/</span>
                <span>{monthDisplayNum}</span>
              </div>

              <div className={styles.headerNav} dir="ltr">
                <button
                  type="button"
                  aria-label={locale === 'ar' ? 'السنة السابقة' : 'Previous year'}
                  className={styles.navBtn}
                  onClick={prevYear}
                  title={locale === 'ar' ? 'السنة السابقة' : 'Previous year'}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="11 17 6 12 11 7" />
                    <polyline points="18 17 13 12 18 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label={locale === 'ar' ? 'الشهر السابق' : 'Previous month'}
                  className={styles.navBtn}
                  onClick={prevMonth}
                  title={locale === 'ar' ? 'الشهر السابق' : 'Previous month'}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label={locale === 'ar' ? 'الشهر القادم' : 'Next month'}
                  className={styles.navBtn}
                  onClick={nextMonth}
                  title={locale === 'ar' ? 'الشهر القادم' : 'Next month'}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label={locale === 'ar' ? 'السنة القادمة' : 'Next year'}
                  className={styles.navBtn}
                  onClick={nextYear}
                  title={locale === 'ar' ? 'السنة القادمة' : 'Next year'}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="13 17 18 12 13 7" />
                    <polyline points="6 17 11 12 6 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Weekday headers */}
            <div className={styles.weekdays}>
              {weekdays.map((w, idx) => (
                <div key={idx}>{w}</div>
              ))}
            </div>

            {/* Calendar Days Matrix (Latin numerals, pure numbers) */}
            <div className={styles.grid}>
              {calendarDays.map((item, idx) => {
                const dateKey = `${item.year}-${String(item.month + 1).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`;
                const isSelected = value === dateKey;
                const isToday = today === dateKey;

                return (
                  <button
                    key={idx}
                    type="button"
                    className={`
                      ${styles.dayCell}
                      ${item.isOutside ? styles.dayCellOutside : ''}
                      ${isToday ? styles.dayCellToday : ''}
                      ${isSelected ? styles.dayCellSelected : ''}
                    `.trim()}
                    onClick={() => handleSelectDate(item.year, item.month, item.day)}
                  >
                    {item.day}
                  </button>
                );
              })}
            </div>

            {/* Footer Quick Actions */}
            <div className={styles.footer}>
              <button
                type="button"
                className={`${styles.footerBtn} ${styles.footerBtnPrimary}`}
                onClick={handleSelectToday}
              >
                {locale === 'ar' ? 'اليوم' : 'Today'}
              </button>
              <button
                type="button"
                className={`${styles.footerBtn} ${styles.footerBtnSecondary}`}
                onClick={handleClear}
              >
                {locale === 'ar' ? 'مسح' : 'Clear'}
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
