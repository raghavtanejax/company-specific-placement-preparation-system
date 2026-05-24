import { useState, useEffect, useCallback } from 'react';

/**
 * useVoiceOutput
 *
 * Custom React hook that wraps the browser's Web Speech Synthesis API.
 * Reads/writes voice preference from/to localStorage under the key
 * `mockInterview_voiceEnabled`.
 *
 * Returns: { voiceEnabled, setVoiceEnabled, isSupported, speak, cancel }
 */
function useVoiceOutput() {
  // Detect Speech Synthesis support once (stable across renders)
  const isSupported = 'speechSynthesis' in window;

  // Initialize voiceEnabled from localStorage.
  // Rule: stored === 'false' → false; anything else (absent, 'true', unrecognized) → true.
  const [voiceEnabled, _setVoiceEnabled] = useState(() => {
    const stored = localStorage.getItem('mockInterview_voiceEnabled');
    return stored === 'false' ? false : true;
  });

  /**
   * setVoiceEnabled(val: boolean)
   * Updates React state and persists to localStorage (silent failure on error).
   */
  const setVoiceEnabled = useCallback((val) => {
    _setVoiceEnabled(val);
    try {
      localStorage.setItem('mockInterview_voiceEnabled', String(val));
    } catch (_) {
      // Silent failure — preference applies for current session only
    }
    if (!val && isSupported) {
      window.speechSynthesis.cancel();
    }
  }, [isSupported]);

  /**
   * cleanText(text: string) → string
   * Strips markdown formatting characters and emoji in the specified Unicode ranges.
   * Markdown chars removed: * _ ` ~
   * Emoji ranges removed: U+1F000–U+1FAFF and U+2600–U+27BF
   */
  const cleanText = useCallback((text) => {
    return text
      .replace(/[*_`~]/g, '')
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '');
  }, []);

  /**
   * speak(text: string)
   * Cancels any in-progress utterance, then speaks the cleaned text.
   * No-op if voiceEnabled is false or Speech Synthesis is not supported.
   */
  const speak = useCallback((text) => {
    if (!voiceEnabled || !isSupported) return;

    // Cancel any currently playing utterance before starting a new one
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText(text));
    utterance.lang = 'en-US';
    utterance.onerror = (e) => console.error('SpeechSynthesis error:', e.error);

    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled, isSupported, cleanText]);

  /**
   * cancel()
   * Cancels any active Speech Synthesis utterance immediately.
   */
  const cancel = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
  }, [isSupported]);

  // Cleanup on unmount: cancel any in-progress utterance
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  return {
    voiceEnabled,
    setVoiceEnabled,
    isSupported,
    speak,
    cancel,
  };
}

export default useVoiceOutput;
