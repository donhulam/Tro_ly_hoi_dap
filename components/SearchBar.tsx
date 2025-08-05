/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';

// --- Start of type definitions for Web Speech API ---
// These types are not part of the standard TypeScript DOM library and are added
// here to provide type safety for the browser's SpeechRecognition API.

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

// Extend the Window interface to include vendor-prefixed SpeechRecognition
// which might not be present on the standard `Window` type.
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionStatic;
    webkitSpeechRecognition?: SpeechRecognitionStatic;
  }
}

// --- End of type definitions ---


interface SearchBarProps {
  onSearch: (query: string) => void;
  onRandom: () => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onRandom, isLoading }) => {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // This ref is needed to get the latest query value inside the `onend` callback,
  // which would otherwise capture a stale value of `query`.
  const queryRef = useRef(query);
  useEffect(() => {
    queryRef.current = query;
  }, [query]);


  // Check for SpeechRecognition API.
  // The global `Window` interface has been extended to include these properties.
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const isSpeechSupported = !!SpeechRecognition;

  useEffect(() => {
    if (!isSpeechSupported) return;

    const recognition: SpeechRecognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true; // Listen until explicitly stopped or a long pause.
    recognition.lang = 'vi-VN'; // Set to Vietnamese
    recognition.interimResults = true; // Get results as they come.

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Concatenate all results to form the full transcript.
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      
      setQuery(transcript); // Update the input field with the live transcript.
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Lỗi nhận dạng giọng nói:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // After recognition ends, perform the search with the final transcript.
      // Use the ref to ensure we have the most up-to-date query.
      const finalQuery = queryRef.current.trim();
      if (finalQuery) {
        onSearch(finalQuery);
        setQuery(''); // Clear input after search, consistent with form submission.
      }
    };

    // Cleanup function to ensure recognition is stopped when the component unmounts.
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null; // Prevent onend from firing on unmount
        recognitionRef.current.stop();
      }
    };

  }, [isSpeechSupported, onSearch]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
      setQuery(''); // Clear the input field after search
    }
  };

  const handleMicClick = () => {
    if (isLoading || !recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop(); // This will trigger the 'onend' handler to perform the search.
    } else {
      setQuery(''); // Clear the input field for a new voice search.
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSubmit} className="search-form" role="search">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isListening ? "Đang lắng nghe..." : "Mời bạn đặt câu hỏi ở đây"}
          className="search-input"
          aria-label="Đặt câu hỏi của bạn"
          disabled={isLoading}
        />
        {isSpeechSupported && (
          <button
            type="button"
            onClick={handleMicClick}
            className={`mic-button ${isListening ? 'listening' : ''}`}
            aria-label={isListening ? 'Dừng ghi âm' : 'Bắt đầu ghi âm bằng giọng nói'}
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1.2-9.1c0-.66.54-1.2 1.2-1.2s1.2.54 1.2 1.2v6.2c0 .66-.54 1.2-1.2 1.2s-1.2-.54-1.2-1.2V4.9zM17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </button>
        )}
      </form>
      <button onClick={onRandom} className="random-button" disabled={isLoading}>
        Ngẫu nhiên
      </button>
    </div>
  );
};

export default SearchBar;