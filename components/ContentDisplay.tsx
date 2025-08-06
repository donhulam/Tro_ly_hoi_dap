/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';

interface ContentDisplayProps {
  content: string;
  isLoading: boolean;
  onWordClick: (word: string) => void;
}

// State for the selection popup
interface PopupState {
  text: string;
  top: number;
  left: number;
}

// A sub-component to render the interactive text and handle selection logic.
const InteractiveContent: React.FC<{
  content: string;
  onWordClick: (word: string) => void;
  onPhraseSelect: (popupState: PopupState | null) => void;
}> = ({ content, onWordClick, onPhraseSelect }) => {
  const contentRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      
      // If there's no selection object or it's just a click (not a range), clear any existing popup.
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        onPhraseSelect(null);
        return;
      }
      
      const range = selection.getRangeAt(0);
      const container = contentRef.current;
      
      // If the selection is outside our content area, clear the popup.
      if (!container || !container.contains(range.commonAncestorContainer)) {
        onPhraseSelect(null);
        return;
      }
      
      const selectedText = selection.toString().trim();
      
      // Only show the popup for multi-word phrases.
      if (selectedText && selectedText.includes(' ')) {
        const rect = range.getBoundingClientRect();
        onPhraseSelect({
          text: selectedText,
          top: rect.bottom + 5, // Position 5px below the selection for a tighter fit.
          left: rect.left + rect.width / 2,
        });
      } else {
        // If the selection is a single word or empty, clear the popup.
        // Single word clicks are handled by the buttons.
        onPhraseSelect(null);
      }
    };
    
    // Listen for mouseup on the whole document to catch selections.
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onPhraseSelect]);

  const words = content.split(/(\s+)/).filter(Boolean);

  return (
    <p style={{ margin: 0 }} ref={contentRef}>
      {words.map((word, index) => {
        // Make non-whitespace words clickable.
        if (/\S/.test(word)) {
          const cleanWord = word.replace(/[.,!?;:()"']/g, '');
          if (cleanWord) {
            return (
              <button
                key={index}
                onClick={() => onWordClick(cleanWord)}
                className="interactive-word"
                aria-label={`Tìm hiểu thêm về ${cleanWord}`}
              >
                {word}
              </button>
            );
          }
        }
        // Render whitespace as-is.
        return <span key={index}>{word}</span>;
      })}
    </p>
  );
};


const StreamingContent: React.FC<{ content: string }> = ({ content }) => (
  <p style={{ margin: 0 }}>
    {content}
    <span className="blinking-cursor">|</span>
  </p>
);

// The main display component.
const ContentDisplay: React.FC<ContentDisplayProps> = ({ content, isLoading, onWordClick }) => {
  const [popup, setPopup] = useState<PopupState | null>(null);

  // Callback for InteractiveContent to update the popup state.
  const handlePhraseSelect = (popupState: PopupState | null) => {
    setPopup(popupState);
  };

  // Handler for the search button inside the popup.
  const handlePopupSearch = () => {
    if (popup) {
      onWordClick(popup.text);
      setPopup(null); // Hide popup after initiating the search.
    }
  };

  if (isLoading) {
    return <StreamingContent content={content} />;
  }
  
  if (content) {
    return (
      // Using a fragment to render the content and the popup as siblings.
      <>
        <InteractiveContent 
          content={content} 
          onWordClick={onWordClick} 
          onPhraseSelect={handlePhraseSelect} 
        />
        {popup && (
          <div 
              className="selection-popup"
              style={{ 
                  position: 'fixed',
                  top: `${popup.top}px`,
                  left: `${popup.left}px`,
                  transform: 'translateX(-50%)',
                  zIndex: 100, // Ensure it's on top of other content.
              }}
              // Events to handle interaction
              onMouseUp={(e) => e.stopPropagation()}
              onClick={handlePopupSearch}
              // Accessibility
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handlePopupSearch() }}
              aria-label={`Tìm kiếm cho cụm từ: ${popup.text}`}
          >
              {popup.text}
          </div>
        )}
      </>
    );
  }

  return null;
};

export default ContentDisplay;