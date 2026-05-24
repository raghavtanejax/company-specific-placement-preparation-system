import { useState, useRef, useCallback, useEffect } from 'react';

const SILENCE_TIMEOUT_MS = 10000;
const INDICATOR_CLEAR_DELAY_MS = 200;

/**
 * useVoiceInput — wraps the browser Web Speech Recognition API.
 *
 * @param {Object} options
 * @param {(text: string) => void} options.onFinalTranscript - Called with the
 *   final transcript text whenever Speech Recognition produces a final result.
 *
 * @returns {{
 *   isListening: boolean,
 *   isSupported: boolean,
 *   error: string|null,
 *   interimTranscript: string,
 *   permissionDenied: boolean,
 *   startListening: () => void,
 *   stopListening: () => void,
 *   toggleListening: () => void,
 * }}
 */
export function useVoiceInput({ onFinalTranscript } = {}) {
  // Detect browser support once at module evaluation time
  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported] = useState(() => Boolean(SpeechRecognition));
  const [permissionDenied, setPermissionDenied] = useState(false);

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  // Keep a stable ref to the latest onFinalTranscript callback
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current !== null) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      // Silence for 10 s — stop and report
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {
          // ignore if already stopped
        }
      }
      setIsListening(false);
      setTimeout(() => setInterimTranscript(''), INDICATOR_CLEAR_DELAY_MS);
      setError('No speech detected for 10 seconds. Microphone stopped.');
    }, SILENCE_TIMEOUT_MS);
  }, [clearSilenceTimer]);

  // ─── Recognition event handlers ─────────────────────────────────────────────

  const handleResult = useCallback(
    (event) => {
      // Reset silence timer on any result
      startSilenceTimer();

      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          // Deliver final transcript to caller and clear interim display
          if (onFinalTranscriptRef.current) {
            onFinalTranscriptRef.current(transcript);
          }
          setInterimTranscript('');
        } else {
          interim += transcript;
        }
      }
      if (interim) {
        setInterimTranscript(interim);
      }
    },
    [startSilenceTimer]
  );

  const handleEnd = useCallback(() => {
    clearSilenceTimer();
    setIsListening(false);
    setTimeout(() => setInterimTranscript(''), INDICATOR_CLEAR_DELAY_MS);
  }, [clearSilenceTimer]);

  const handleError = useCallback(
    (event) => {
      clearSilenceTimer();

      let message;
      switch (event.error) {
        case 'not-allowed':
          message =
            'Microphone access denied. Please allow microphone access in your browser settings.';
          setPermissionDenied(true);
          break;
        case 'no-speech':
          message = 'No speech detected. Please try again.';
          break;
        case 'network':
          message =
            'Network error during voice capture. Please check your connection.';
          break;
        case 'audio-capture':
          message = 'Audio capture failed. Please check your microphone.';
          break;
        default:
          message = `Voice input error: ${event.error}`;
      }

      setError(message);
      setIsListening(false);
      setTimeout(() => setInterimTranscript(''), INDICATOR_CLEAR_DELAY_MS);
    },
    [clearSilenceTimer]
  );

  // ─── Public API ─────────────────────────────────────────────────────────────

  const startListening = useCallback(() => {
    if (!isSupported || permissionDenied) return;

    // Create or reuse recognition instance
    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = handleResult;
      recognition.onend = handleEnd;
      recognition.onerror = handleError;

      recognitionRef.current = recognition;
    }

    setError(null);
    setInterimTranscript('');

    try {
      recognitionRef.current.start();
      setIsListening(true);
      startSilenceTimer();
    } catch (err) {
      // Recognition may already be started; ignore InvalidStateError
      if (err.name !== 'InvalidStateError') {
        setError(`Voice input error: ${err.message}`);
      }
    }
  }, [
    isSupported,
    permissionDenied,
    SpeechRecognition,
    handleResult,
    handleEnd,
    handleError,
    startSilenceTimer,
  ]);

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {
        // ignore if already stopped
      }
    }
    setIsListening(false);
  }, [clearSilenceTimer]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // ─── Cleanup on unmount ──────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, [clearSilenceTimer]);

  return {
    isListening,
    isSupported,
    error,
    interimTranscript,
    permissionDenied,
    startListening,
    stopListening,
    toggleListening,
  };
}

export default useVoiceInput;
