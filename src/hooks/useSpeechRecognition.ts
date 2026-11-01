'use client';

// ============================================================================
// ZONE 1: IMPORTS
// ============================================================================
import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// ZONE 2: CONFIG & CONSTANTS
// ============================================================================
const DEFAULT_LANGUAGE = 'ar-SA';

// Type definitions for browser Speech Recognition API
interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

// ============================================================================
// ZONE 3: TYPES & INTERFACES
// ============================================================================
export interface UseSpeechRecognitionOptions {
  onTranscript?: (transcript: string) => void;
}

export interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
  startListening: (lang?: string) => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
}

// ============================================================================
// ZONE 4: HELPER FUNCTIONS (MOBILE DE-DUPLICATION ENGINE)
// ============================================================================
function getSpeechRecognitionClass(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as Record<string, unknown>;
  const Recognition = (win.SpeechRecognition || win.webkitSpeechRecognition) as
    | SpeechRecognitionConstructor
    | undefined;
  return Recognition || null;
}

/**
 * Merges committed speech text with a new incoming session/chunk transcript,
 * completely eliminating the notorious mobile/Android Chrome duplication loop
 * where re-delivered audio chunks duplicate previous words.
 */
export function mergeSpeechTranscripts(committed: string, currentSession: string): string {
  const c = (committed || '').trim();
  const s = (currentSession || '').trim();

  if (!c) return s;
  if (!s) return c;

  // Case 1: Identical strings
  if (c.toLowerCase() === s.toLowerCase()) {
    return c;
  }

  // Case 2: The new session starts with the committed text (Android Chrome cumulative re-emit)
  if (s.toLowerCase().startsWith(c.toLowerCase())) {
    return s;
  }

  // Case 3: The committed text already includes the new session text
  if (c.toLowerCase().endsWith(s.toLowerCase())) {
    return c;
  }

  // Case 4: Sliding window token overlap detection
  // e.g. committed: "فحص أمان المواقع", session: "المواقع وسرعة التصفح"
  const cWords = c.split(/\s+/);
  const sWords = s.split(/\s+/);

  const maxOverlap = Math.min(cWords.length, sWords.length);
  for (let overlap = maxOverlap; overlap > 0; overlap--) {
    const cTail = cWords.slice(cWords.length - overlap).join(' ').toLowerCase();
    const sHead = sWords.slice(0, overlap).join(' ').toLowerCase();

    if (cTail === sHead) {
      // Retain the exact casing/characters of cWords, followed by non-overlapping sWords
      return (cWords.join(' ') + ' ' + sWords.slice(overlap).join(' ')).trim();
    }
  }

  // Case 5: Independent non-overlapping phrase chunks
  return `${c} ${s}`.trim();
}

// ============================================================================
// ZONE 5: MAIN HOOK COMPONENT
// ============================================================================
export function useSpeechRecognition(
  options?: UseSpeechRecognitionOptions
): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported] = useState<boolean>(() => {
    return getSpeechRecognitionClass() !== null;
  });
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const optionsRef = useRef(options);
  const isIntentionallyListeningRef = useRef(false);
  const committedTextRef = useRef('');
  const activeSessionTextRef = useRef('');
  const currentLangRef = useRef(DEFAULT_LANGUAGE);
  const launchInstanceRef = useRef<((RecognitionClass: SpeechRecognitionConstructor, lang: string) => void) | null>(null);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const stopListening = useCallback(() => {
    isIntentionallyListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Recognition already stopped
      }
    }
    if (activeSessionTextRef.current) {
      committedTextRef.current = mergeSpeechTranscripts(
        committedTextRef.current,
        activeSessionTextRef.current
      );
      activeSessionTextRef.current = '';
    }
    setIsListening(false);
  }, []);

  const launchInstance = useCallback((RecognitionClass: SpeechRecognitionConstructor, lang: string) => {
    try {
      const instance = new RecognitionClass();
      instance.continuous = true;
      instance.interimResults = true;
      instance.lang = lang;

      instance.onresult = (event: SpeechRecognitionEvent) => {
        let sessionTranscript = '';
        const results = event.results;
        for (let i = 0; i < Object.keys(results).length; i++) {
          const item = results[i]?.[0];
          if (item?.transcript) {
            sessionTranscript += item.transcript + ' ';
          }
        }

        activeSessionTextRef.current = sessionTranscript.trim();
        const combined = mergeSpeechTranscripts(
          committedTextRef.current,
          activeSessionTextRef.current
        );

        if (combined) {
          setTranscript(combined);
          optionsRef.current?.onTranscript?.(combined);
        }
      };

      instance.onerror = (event: { error: string }) => {
        if (event.error !== 'no-speech') {
          setError(event.error);
        }
      };

      instance.onend = () => {
        // Commit current session with smart deduplication
        if (activeSessionTextRef.current) {
          committedTextRef.current = mergeSpeechTranscripts(
            committedTextRef.current,
            activeSessionTextRef.current
          );
          activeSessionTextRef.current = '';
        }

        // Auto-Resume / Keep-Alive until explicit user stop
        if (isIntentionallyListeningRef.current) {
          try {
            // Instantiate a clean recognizer to avoid dirty buffers on mobile
            launchInstanceRef.current?.(RecognitionClass, currentLangRef.current);
            return;
          } catch {
            setTimeout(() => {
              if (isIntentionallyListeningRef.current) {
                try {
                  launchInstanceRef.current?.(RecognitionClass, currentLangRef.current);
                } catch {
                  setIsListening(false);
                  isIntentionallyListeningRef.current = false;
                }
              }
            }, 250);
            return;
          }
        }

        setIsListening(false);
      };

      recognitionRef.current = instance;
      instance.start();
      setIsListening(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setError(message);
      setIsListening(false);
      isIntentionallyListeningRef.current = false;
    }
  }, []);

  useEffect(() => {
    launchInstanceRef.current = launchInstance;
  }, [launchInstance]);

  const startListening = useCallback(
    (lang: string = DEFAULT_LANGUAGE) => {
      const RecognitionClass = getSpeechRecognitionClass();
      if (!RecognitionClass) {
        setError('Speech recognition is not supported in this browser.');
        return;
      }

      setError(null);
      currentLangRef.current = lang;
      isIntentionallyListeningRef.current = true;

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }

      launchInstance(RecognitionClass, lang);
    },
    [launchInstance]
  );

  const resetTranscript = useCallback(() => {
    committedTextRef.current = '';
    activeSessionTextRef.current = '';
    setTranscript('');
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isIntentionallyListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error,
  };
}
