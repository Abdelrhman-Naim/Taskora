import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewPreference } from '@/hooks/useViewPreference';

describe('useViewPreference hook (Task 59)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('defaults to "list" when localStorage is empty', () => {
    const { result } = renderHook(() => useViewPreference());
    expect(result.current[0]).toBe('list');
  });

  it('initializes from valid localStorage value ("board" or "calendar")', () => {
    localStorage.setItem('tf-view', 'board');
    const { result } = renderHook(() => useViewPreference());
    expect(result.current[0]).toBe('board');
  });

  it('falls back to "list" when localStorage has an invalid value', () => {
    localStorage.setItem('tf-view', 'invalid-view-type');
    const { result } = renderHook(() => useViewPreference());
    expect(result.current[0]).toBe('list');
  });

  it('persists changes to localStorage and updates state', () => {
    const { result } = renderHook(() => useViewPreference());
    expect(result.current[0]).toBe('list');

    act(() => {
      result.current[1]('board');
    });

    expect(result.current[0]).toBe('board');
    expect(localStorage.getItem('tf-view')).toBe('board');

    act(() => {
      result.current[1]('calendar');
    });

    expect(result.current[0]).toBe('calendar');
    expect(localStorage.getItem('tf-view')).toBe('calendar');
  });

  it('gracefully handles localStorage exceptions (e.g. security restricted)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage access denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage access denied');
    });

    const { result } = renderHook(() => useViewPreference());
    expect(result.current[0]).toBe('list');

    // Setting view should not crash
    act(() => {
      result.current[1]('board');
    });
    expect(result.current[0]).toBe('board');
  });
});
