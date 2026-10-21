'use client';

import { useState, useCallback } from 'react';

export type TaskView = 'list' | 'board' | 'calendar';

const STORAGE_KEY = 'tf-view';
const VALID_VIEWS: TaskView[] = ['list', 'board', 'calendar'];

function getInitialView(): TaskView {
  if (typeof window === 'undefined') return 'list';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && (VALID_VIEWS as string[]).includes(stored)) {
      return stored as TaskView;
    }
  } catch {
    // Ignore localStorage access errors (e.g. security-restricted)
  }
  return 'list';
}

export function useViewPreference(): [TaskView, (v: TaskView) => void] {
  const [view, setViewState] = useState<TaskView>(getInitialView);

  const setView = useCallback((nextView: TaskView) => {
    setViewState(nextView);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, nextView);
      } catch {
        // Ignore localStorage write errors
      }
    }
  }, []);

  return [view, setView];
}
