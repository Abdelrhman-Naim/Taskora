'use client';

import { useEffect, useRef } from 'react';

export interface UseHotkeysOptions {
  enabled?: boolean;
}

/**
 * Custom hook for layout-independent keyboard shortcuts.
 * Matches keys strictly by `event.code` (e.g. 'KeyN', 'Slash', 'Shift+Slash').
 * Automatically ignores execution when typing inside form inputs or when a modal dialog is open.
 */
function isEditable(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    return true;
  }
  const contentEditableProp = el.contentEditable;
  const contentEditableAttr = el.getAttribute?.('contenteditable');
  if (
    el.isContentEditable ||
    contentEditableProp === 'true' ||
    contentEditableProp === 'plaintext-only' ||
    contentEditableAttr === 'true' ||
    contentEditableAttr === '' ||
    contentEditableAttr === 'plaintext-only' ||
    Boolean(el.closest?.('[contenteditable="true"], [contenteditable=""], [contenteditable="plaintext-only"]'))
  ) {
    return true;
  }
  return false;
}

export function useHotkeys(
  map: Record<string, (e: KeyboardEvent) => void>,
  opts?: UseHotkeysOptions
): void {
  const enabled = opts?.enabled ?? true;
  const mapRef = useRef(map);

  useEffect(() => {
    mapRef.current = map;
  });

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Ignore if Ctrl, Meta, or Alt modifiers are active
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // 2. Ignore if focused on editable elements
      const target = e.target as HTMLElement | null;
      if (isEditable(target)) return;

      const active = document.activeElement as HTMLElement | null;
      if (isEditable(active)) return;

      // 3. Ignore if any modal dialog is open
      if (document.querySelector('[role="dialog"]')) {
        return;
      }

      // 4. Resolve key combo: check Shift+Code first, then Code
      const combo = e.shiftKey ? `Shift+${e.code}` : e.code;
      const handler = mapRef.current[combo] || mapRef.current[e.code];
      if (handler) {
        handler(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);
}
