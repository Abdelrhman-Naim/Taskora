'use client';

import React, { useState, useMemo } from 'react';
import { Task, Locale } from '@/types';
import { monthGrid, tasksByDate } from '@/lib/calendar';
import { isOverdue, todayString } from '@/lib/dates';
import { useI18n } from '@/i18n/I18nProvider';
import { Icon } from '@/components/ui/Icon';
import styles from './TaskCalendar.module.css';

export interface TaskCalendarProps {
  tasks: Task[];
  locale: Locale;
  onOpen: (t: Task) => void;
}

export function TaskCalendar({
  tasks,
  locale,
  onOpen,
}: TaskCalendarProps): React.ReactElement {
  const { t, tp } = useI18n();
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-12
  const today = todayString();

  const weekStart = locale === 'ar' ? 6 : 0; // Saturday in ar, Sunday in en

  const grid = useMemo(() => {
    return monthGrid(year, month, weekStart);
  }, [year, month, weekStart]);

  const tasksMap = useMemo(() => {
    return tasksByDate(tasks);
  }, [tasks]);

  const undatedTasks = useMemo(() => {
    return tasks.filter((task) => !task.dueDate);
  }, [tasks]);

  const monthYearLabel = useMemo(() => {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
    }).format(currentDate);
  }, [currentDate, locale]);

  const weekdays = useMemo(() => {
    const list: string[] = [];
    // Anchor to Sunday 2026-10-04 (which is a Sunday in UTC)
    // 0 = Sunday (day 4), 1 = Monday (day 5), ..., 6 = Saturday (day 10)
    for (let i = 0; i < 7; i++) {
      const dayOffset = (weekStart + i) % 7;
      const refDate = new Date(Date.UTC(2026, 9, 4 + dayOffset));
      list.push(
        new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(refDate)
      );
    }
    return list;
  }, [locale, weekStart]);

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const currentMonthPrefix = `${year}-${String(month).padStart(2, '0')}`;

  return (
    <div className={styles.container} data-testid="task-calendar-view">
      <div className={styles.header} data-testid="calendar-header">
        <h3 className={styles.monthDisplay}>{monthYearLabel}</h3>
        <div className={styles.navControls}>
          <button
            type="button"
            className={styles.navBtn}
            data-testid="calendar-prev-btn"
            aria-label={t('calendar.prev')}
            onClick={handlePrevMonth}
          >
            <Icon name="chevron" size={14} className={locale === 'ar' ? '' : 'rotate-180'} />
          </button>
          <button
            type="button"
            className={styles.todayBtn}
            data-testid="calendar-today-btn"
            onClick={handleToday}
          >
            {t('calendar.today')}
          </button>
          <button
            type="button"
            className={styles.navBtn}
            data-testid="calendar-next-btn"
            aria-label={t('calendar.next')}
            onClick={handleNextMonth}
          >
            <Icon name="chevron" size={14} className={locale === 'ar' ? 'rotate-180' : ''} />
          </button>
        </div>
      </div>

      <div className={styles.gridWrapper}>
        <div className={styles.weekdaysHeader} data-testid="calendar-weekdays">
          {weekdays.map((dayName, idx) => (
            <div key={idx} className={styles.weekday}>
              {dayName}
            </div>
          ))}
        </div>

        <div className={styles.grid}>
          {grid.flat().map((dateStr) => {
            const isCurrentMonth = dateStr.startsWith(currentMonthPrefix);
            const isCurrentToday = dateStr === today;
            const dayNum = Number(dateStr.split('-')[2]);
            const dayTasks = tasksMap[dateStr] || [];

            const visibleTasks = dayTasks.slice(0, 3);
            const overflowCount = dayTasks.length - 3;

            return (
              <div
                key={dateStr}
                data-testid={`calendar-day-${dateStr}`}
                aria-current={isCurrentToday ? 'date' : undefined}
                className={`${styles.dayCell} ${!isCurrentMonth ? styles.otherMonth : ''} ${
                  isCurrentToday ? styles.todayCell : ''
                }`}
              >
                <span className={styles.dayNumber} dir="ltr">
                  {dayNum}
                </span>

                {visibleTasks.map((task) => {
                  const taskOverdue =
                    task.status !== 'done' && isOverdue(task, today);

                  return (
                    <button
                      key={task.id}
                      type="button"
                      data-testid={`calendar-task-pill-${task.id}`}
                      className={`${styles.taskPill} ${
                        taskOverdue ? styles.taskPillOverdue : ''
                      }`}
                      onClick={() => onOpen(task)}
                    >
                      <span
                        className={`${styles.statusDot} ${
                          task.status === 'todo'
                            ? styles.statusTodo
                            : task.status === 'in_progress'
                            ? styles.statusInProgress
                            : styles.statusDone
                        }`}
                        aria-hidden="true"
                      />
                      <span className={styles.pillTitle}>
                        <bdi>{task.title}</bdi>
                      </span>
                      {taskOverdue && (
                        <span aria-label={t('calendar.overdue')} title={t('calendar.overdue')}>
                          !
                        </span>
                      )}
                    </button>
                  );
                })}

                {overflowCount > 0 && (
                  <button
                    type="button"
                    className={styles.morePill}
                    data-testid={`calendar-more-pill-${dateStr}`}
                    onClick={() => {
                      if (visibleTasks[0]) onOpen(visibleTasks[0]);
                    }}
                  >
                    +{tp('calendar.more', overflowCount, { count: overflowCount })}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {undatedTasks.length > 0 && (
        <div
          className={styles.undatedStrip}
          data-testid="calendar-undated-tasks"
        >
          <span>{t('calendar.noDueDate', { count: undatedTasks.length })}</span>
        </div>
      )}
    </div>
  );
}
