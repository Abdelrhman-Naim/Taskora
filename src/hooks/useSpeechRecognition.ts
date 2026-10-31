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

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Recognition already stopped
      }
      setIsListening(false);
    }
  }, [isListening]);

  const startListening = useCallback(
    (lang: string = DEFAULT_LANGUAGE) => {
      const RecognitionClass = getSpeechRecognitionClass();
      if (!RecognitionClass) {
        setError('Speech recognition is not supported in this browser.');
        return;
      }

      setError(null);

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
          let fullTranscript = '';
          const results = event.results;
          for (let i = 0; i < Object.keys(results).length; i++) {
            const item = results[i]?.[0];
            if (item?.transcript) {
              fullTranscript += item.transcript + ' ';
            }
          }
          if (fullTranscript.trim()) {
            const trimmed = fullTranscript.trim();
            setTranscript(trimmed);
            optionsRef.current?.onTranscript?.(trimmed);
          }
        };

        instance.onerror = (event: { error: string }) => {
          if (event.error !== 'no-speech') {
            setError(event.error);
          }
          setIsListening(false);
        };

        instance.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = instance;
        instance.start();
        setIsListening(true);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to start recording';
        setError(message);
        setIsListening(false);
      }
    },
    []
  );

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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
