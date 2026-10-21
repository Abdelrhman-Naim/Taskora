import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHotkeys } from '@/hooks/useHotkeys';

describe('useHotkeys hook (Task 62)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('invokes handler matching event.code even when key is in Arabic layout (e.g. key="ى" and code="KeyN")', () => {
    const handler = vi.fn();
    renderHook(() =>
      useHotkeys({
        KeyN: handler,
      })
    );

    const event = new KeyboardEvent('keydown', {
      code: 'KeyN',
      key: 'ى', // Arabic character on N key
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('ignores hotkey when focus is inside input, textarea, or select', () => {
    const handler = vi.fn();
    renderHook(() =>
      useHotkeys({
        KeyN: handler,
      })
    );

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', {
      code: 'KeyN',
      bubbles: true,
    });
    input.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('ignores hotkey when focus is inside a contenteditable element', () => {
    const handler = vi.fn();
    renderHook(() =>
      useHotkeys({
        KeyN: handler,
      })
    );

    const editable = document.createElement('div');
    editable.contentEditable = 'true';
    document.body.appendChild(editable);
    editable.focus();

    const event = new KeyboardEvent('keydown', {
      code: 'KeyN',
      bubbles: true,
    });
    editable.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('ignores hotkey when a modal dialog is present in the document', () => {
    const handler = vi.fn();
    renderHook(() =>
      useHotkeys({
        KeyN: handler,
      })
    );

    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    document.body.appendChild(dialog);

    const event = new KeyboardEvent('keydown', {
      code: 'KeyN',
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('ignores hotkey when Ctrl, Meta, or Alt modifiers are active', () => {
    const handler = vi.fn();
    renderHook(() =>
      useHotkeys({
        KeyN: handler,
      })
    );

    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'KeyN', ctrlKey: true, bubbles: true })
    );
    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'KeyN', metaKey: true, bubbles: true })
    );
    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'KeyN', altKey: true, bubbles: true })
    );

    expect(handler).not.toHaveBeenCalled();
  });

  it('does nothing when opts.enabled is false', () => {
    const handler = vi.fn();
    renderHook(() =>
      useHotkeys(
        {
          KeyN: handler,
        },
        { enabled: false }
      )
    );

    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'KeyN', bubbles: true })
    );

    expect(handler).not.toHaveBeenCalled();
  });

  it('cleans up event listener on unmount', () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() =>
      useHotkeys({
        KeyN: handler,
      })
    );

    unmount();

    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'KeyN', bubbles: true })
    );

    expect(handler).not.toHaveBeenCalled();
  });

  it('recognizes Shift+Slash combo (e.g. for "?")', () => {
    const handler = vi.fn();
    renderHook(() =>
      useHotkeys({
        'Shift+Slash': handler,
      })
    );

    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        code: 'Slash',
        key: '?',
        shiftKey: true,
        bubbles: true,
      })
    );

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
