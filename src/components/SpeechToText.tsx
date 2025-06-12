import React, { useState, useEffect, useCallback } from 'react';

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface SpeechToTextProps {
  onTranscript: (text: string) => void;
}

export const SpeechToText: React.FC<SpeechToTextProps> = ({ onTranscript }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  const initializeRecognition = useCallback(() => {
    if (window.SpeechRecognition || (window as any).webkitSpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false; // Changed to false to handle sessions better
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => {
        setIsListening(true);
      };

      recognitionInstance.onresult = (event) => {
        const lastResult = event.results[event.results.length - 1];
        const transcript = lastResult[0].transcript;
        
        if (lastResult.isFinal) {
          onTranscript(transcript + ' ');
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
        // Cleanup the old instance
        recognitionInstance.removeEventListener('result', recognitionInstance.onresult);
        recognitionInstance.removeEventListener('error', recognitionInstance.onerror);
        recognitionInstance.removeEventListener('end', recognitionInstance.onend);
        // Create a fresh instance for next time
        initializeRecognition();
      };

      setRecognition(recognitionInstance);
    }
  }, [onTranscript]);

  useEffect(() => {
    initializeRecognition();
    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, [initializeRecognition]);

  const toggleListening = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (error) {
        // If there's an error starting (like recognition already started),
        // reinitialize and try again
        console.log('Reinitializing recognition...');
        initializeRecognition();
        setTimeout(() => {
          recognition.start();
        }, 100);
      }
    }
  };

  return (
    <button
      onClick={toggleListening}
      className={`p-3 rounded-full ${
        isListening 
          ? 'bg-red-500 hover:bg-red-600' 
          : 'bg-blue-500 hover:bg-blue-600'
      } text-white transition-colors duration-200 flex items-center justify-center w-12 h-12 shadow-lg`}
      title={isListening ? 'Stop recording' : 'Start recording'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={isListening 
            ? "M21 12a9 9 0 11-18 0 9 9 0 0118 0z M16 8l-8 8m0-8l8 8" // X icon when recording
            : "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" // Microphone icon when not recording
          }
        />
      </svg>
    </button>
  );
}; 