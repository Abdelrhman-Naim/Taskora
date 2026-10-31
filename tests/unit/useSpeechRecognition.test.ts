import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

describe('useSpeechRecognition hook', () => {
  const originalSpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition;
  const originalWebkitSpeechRecognition = (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

  afterEach(() => {
    (window as unknown as Record<string, unknown>).SpeechRecognition = originalSpeechRecognition;
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition = originalWebkitSpeechRecognition;
  });

  it('detects when speech recognition is not supported in window', () => {
    delete (window as unknown as Record<string, unknown>).SpeechRecognition;
    delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.isSupported).toBe(false);
    expect(result.current.isListening).toBe(false);
  });

  it('initializes speech recognition and starts/stops listening', () => {
    let onResultCallback: ((event: unknown) => void) | null = null;
    let onEndCallback: (() => void) | null = null;
    const startMock = vi.fn();
    const stopMock = vi.fn().mockImplementation(() => {
      onEndCallback?.();
    });

    class MockSpeechRecognition {
      lang = '';
      continuous = false;
      interimResults = false;
      start = startMock;
      stop = stopMock;
      set onresult(cb: (event: unknown) => void) {
        onResultCallback = cb;
      }
      set onend(cb: () => void) {
        onEndCallback = cb;
      }
      set onerror(cb: (err: unknown) => void) {
        // no-op
      }
    }

    (window as unknown as Record<string, unknown>).SpeechRecognition = MockSpeechRecognition;

    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.isSupported).toBe(true);

    act(() => {
      result.current.startListening('ar-SA');
    });

    expect(startMock).toHaveBeenCalled();
    expect(result.current.isListening).toBe(true);

    // Simulate result event
    act(() => {
      onResultCallback?.({
        results: [
          [{ transcript: 'تطوير تطبيق متجر إلكتروني' }],
        ],
      });
    });

    expect(result.current.transcript).toBe('تطوير تطبيق متجر إلكتروني');

    act(() => {
      result.current.stopListening();
    });

    expect(result.current.isListening).toBe(false);
  });
});
