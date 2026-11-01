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
// ZONE 4: HELPER FUNCTIONS
// ============================================================================
function getSpeechRecognitionClass(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as Record<string, unknown>;
  const Recognition = (win.SpeechRecognition || win.webkitSpeechRecognition) as
    | SpeechRecognitionConstructor
    | undefined;
  return Recognition || null;
}

// ============================================================================
// ZONE 6: MAIN HOOK COMPONENT
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
      committedTextRef.current = (
        committedTextRef.current + ' ' + activeSessionTextRef.current
      ).trim();
      activeSessionTextRef.current = '';
    }
    setIsListening(false);
  }, []);

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

      try {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch {
            // ignore
          }
        }

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
          const combined = (
            committedTextRef.current + ' ' + activeSessionTextRef.current
          ).trim();

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
          // If chunk ended, commit current chunk text
          if (activeSessionTextRef.current) {
            committedTextRef.current = (
              committedTextRef.current + ' ' + activeSessionTextRef.current
            ).trim();
            activeSessionTextRef.current = '';
          }

          // Auto-Resume / Keep-Alive:
          // Keep listening until the user explicitly calls stopListening()!
          if (isIntentionallyListeningRef.current) {
            try {
              instance.start();
              return;
            } catch {
              setTimeout(() => {
                if (isIntentionallyListeningRef.current) {
                  try {
                    instance.start();
                  } catch {
                    setIsListening(false);
                    isIntentionallyListeningRef.current = false;
                  }
                }
              }, 200);
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
    },
    []
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
