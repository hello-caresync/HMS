'use client';

import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: { length: number; [index: number]: { isFinal: boolean; [index: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Toggle browser speech recognition; appends finalized transcript to the field. */
export function useSpeechToText(onAppend: (phrase: string) => void) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const toggle = useCallback(() => {
    if (listening) {
      stop();
      return;
    }

    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      toast.error('Voice input is not supported in this browser');
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      if (!last?.isFinal) return;
      const phrase = last[0]?.transcript?.trim();
      if (phrase) onAppend(phrase);
    };

    recognition.onerror = () => {
      setListening(false);
      recognitionRef.current = null;
      toast.error('Could not capture voice — check microphone permissions');
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening, onAppend, stop]);

  return { listening, toggle, stop };
}
