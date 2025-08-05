/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback } from 'react';
import { streamDefinition } from './services/geminiService';
import ContentDisplay from './components/ContentDisplay';
import SearchBar from './components/SearchBar';
import LoadingSkeleton from './components/LoadingSkeleton';
import AboutModal from './components/AboutModal';

// Danh sách các từ và cụm từ tiếng Việt thú vị cho nút ngẫu nhiên.
const PREDEFINED_WORDS = [
  'Cân bằng', 'Hòa hợp', 'Bất hòa', 'Thống nhất', 'Phân mảnh', 'Rõ ràng', 'Mơ hồ', 'Hiện diện', 'Vắng mặt', 'Sáng tạo', 'Hủy diệt', 'Ánh sáng', 'Bóng tối', 'Khởi đầu', 'Kết thúc', 'Trỗi dậy', 'Sụp đổ', 'Kết nối', 'Cô lập', 'Hy vọng', 'Tuyệt vọng',
  'Trật tự và hỗn loạn', 'Ánh sáng và bóng tối', 'Âm thanh và tĩnh lặng', 'Hữu hình và vô hình', 'Tồn tại và hư vô', 'Hiện diện và vắng mặt', 'Chuyển động và tĩnh tại', 'Thống nhất và đa dạng', 'Hữu hạn và vô hạn', 'Thiêng liêng và trần tục', 'Ký ức và lãng quên', 'Câu hỏi và câu trả lời', 'Tìm kiếm và khám phá', 'Hành trình và đích đến', 'Giấc mơ và thực tại', 'Thời gian và vĩnh cửu', 'Bản ngã và tha nhân', 'Đã biết và chưa biết', 'Nói ra và không nói', 'Nhìn thấy và vô hình',
  'Ziczac', 'Sóng', 'Xoắn ốc', 'Nảy', 'Nghiêng', 'Nhỏ giọt', 'Kéo dài', 'Nén', 'Nổi', 'Rơi', 'Quay', 'Tan chảy', 'Dâng lên', 'Vặn', 'Nổ tung', 'Chồng chất', 'Phản chiếu', 'Tiếng vang', 'Rung động',
  'Trọng lực', 'Ma sát', 'Động lượng', 'Quán tính', 'Nhiễu loạn', 'Áp suất', 'Sức căng', 'Dao động', 'Phân dạng', 'Lượng tử', 'Entropy', 'Xoáy nước', 'Cộng hưởng', 'Cân bằng', 'Ly tâm', 'Đàn hồi', 'Nhớt', 'Khúc xạ', 'Khuếch tán', 'Thác đổ', 'Bay lên', 'Từ hóa', 'Phân cực', 'Gia tốc', 'Nén', 'Gợn sóng',
  'Phù du', 'Nghịch lý', 'Biến thái', 'Cảm giác kèm', 'Đệ quy', 'Biện chứng', 'Apophenia', 'Luân chuyển', 'Cao siêu', 'Kỳ lạ', 'Hư không', 'Siêu việt', 'Bất khả ngôn', 'Qualia', 'Gestalt', 'Simulacra', 'Vực thẳm',
  'Hiện sinh', 'Chủ nghĩa hư vô', 'Chủ nghĩa duy ngã', 'Hiện tượng học', 'Thông diễn học', 'Giải cấu trúc', 'Hậu hiện đại', 'Chủ nghĩa phi lý', 'Thanh tẩy', 'Giác ngộ', 'U sầu', 'Hoài niệm', 'Khát khao', 'Mơ mộng', 'Pathos', 'Ethos', 'Logos', 'Mythos', 'Liên văn bản', 'Siêu hư cấu', 'Dòng chảy'
];
const UNIQUE_WORDS = [...new Set(PREDEFINED_WORDS)];


const App: React.FC = () => {
  const [currentTopic, setCurrentTopic] = useState<string>('Siêu văn bản');
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [copyButtonText, setCopyButtonText] = useState<string>('Sao chép');
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  
  // States for Speech Synthesis
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [vietnameseVoice, setVietnameseVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isVoiceReady, setIsVoiceReady] = useState<boolean>(false);
  const [isSpeechSynthSupported, setIsSpeechSynthSupported] = useState<boolean>(false);

  // Effect to find and set the best available Vietnamese voice, handling async loading.
  useEffect(() => {
    // Check if the browser supports the API at all.
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
        console.warn('Trình duyệt này không hỗ trợ tổng hợp giọng nói.');
        setIsSpeechSynthSupported(false);
        setIsVoiceReady(true); // Loading is done, but it's unsupported.
        return;
    }

    setIsSpeechSynthSupported(true); // Assume supported, will be set to false if no voice is found.
    setIsVoiceReady(false); // Start as not ready, button will show "Loading".

    const getAndSetVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        // Voices are still loading, wait for the next 'onvoiceschanged' event.
        return; 
      }
      
      // Now that we have the voices, we don't need to listen for this event anymore.
      window.speechSynthesis.onvoiceschanged = null;

      const vietnameseVoices = voices.filter(voice => voice.lang.startsWith('vi'));
      
      if (vietnameseVoices.length === 0) {
        console.warn('Không tìm thấy giọng đọc tiếng Việt. Tính năng Nghe sẽ bị vô hiệu hóa.');
        setIsSpeechSynthSupported(false); // No Vietnamese voice, so the feature is unsupported.
        setIsVoiceReady(true); // Loading is "done".
        return;
      }
      
      // Prioritize known, high-quality voices with a Northern accent.
      const preferredVoiceNames = [
        'Linh', 'Mai', 'Google Tiếng Việt', 'Microsoft An (Vietnamese)',
      ];
      
      let bestVoice: SpeechSynthesisVoice | null = null;

      // 1. Find an exact match from the preferred list.
      for (const name of preferredVoiceNames) {
        const foundVoice = vietnameseVoices.find(voice => voice.name === name);
        if (foundVoice) {
          bestVoice = foundVoice;
          break;
        }
      }

      // 2. If not found, prefer any local voice (often higher quality).
      if (!bestVoice) {
         bestVoice = vietnameseVoices.find(voice => voice.localService) || null;
      }

      // 3. Fallback to the first available Vietnamese voice.
      if (!bestVoice) {
          bestVoice = vietnameseVoices[0];
      }
      
      console.log(`Đã chọn giọng đọc: ${bestVoice.name} (Ngôn ngữ: ${bestVoice.lang}, Local: ${bestVoice.localService})`);
      setVietnameseVoice(bestVoice);
      setIsVoiceReady(true); // Voice is selected and ready to use.
    };

    // The 'voiceschanged' event is the only reliable way to know when the list is populated.
    window.speechSynthesis.onvoiceschanged = getAndSetVoice;
    
    // We also call it directly, in case the voices are already loaded.
    getAndSetVoice(); 

    return () => {
      // Cleanup listener and cancel any speech on unmount
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel();
      }
    };
  }, []); // Run only once on mount.


  useEffect(() => {
    if (!currentTopic) return;
    
    // Reset state for new topic
    setCopyButtonText('Sao chép'); 
    if (isSpeechSynthSupported) {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
    }
    setIsSpeaking(false);

    let isCancelled = false;

    const fetchContent = async () => {
      // Set initial state for a clean page load
      setIsLoading(true);
      setError(null);
      setContent(''); // Clear previous content immediately
      setGenerationTime(null);
      const startTime = performance.now();

      let accumulatedContent = '';
      try {
        for await (const chunk of streamDefinition(currentTopic)) {
          if (isCancelled) break;
          
          if (chunk.startsWith('Lỗi:')) { // Check for Vietnamese error prefix
            throw new Error(chunk);
          }
          accumulatedContent += chunk;
          if (!isCancelled) {
            setContent(accumulatedContent);
          }
        }
      } catch (e: unknown) {
        if (!isCancelled) {
          const errorMessage = e instanceof Error ? e.message : 'Đã xảy ra một lỗi không xác định';
          setError(errorMessage);
          setContent(''); // Ensure content is clear on error
          console.error(e);
        }
      } finally {
        if (!isCancelled) {
          const endTime = performance.now();
          setGenerationTime(endTime - startTime);
          setIsLoading(false);
        }
      }
    };

    fetchContent();
    
    return () => {
      isCancelled = true;
      if (isSpeechSynthSupported) {
        window.speechSynthesis.cancel(); // Also cancel on unmount
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTopic, isSpeechSynthSupported]); // Added isSpeechSynthSupported dependency

  const handleWordClick = useCallback((word: string) => {
    const newTopic = word.trim();
    if (newTopic && newTopic.toLowerCase() !== currentTopic.toLowerCase()) {
      setCurrentTopic(newTopic);
    }
  }, [currentTopic]);

  const handleSearch = useCallback((topic: string) => {
    const newTopic = topic.trim();
    if (newTopic && newTopic.toLowerCase() !== currentTopic.toLowerCase()) {
      setCurrentTopic(newTopic);
    }
  }, [currentTopic]);

  const handleRandom = useCallback(() => {
    setIsLoading(true); // Disable UI immediately
    setError(null);
    setContent('');

    const randomIndex = Math.floor(Math.random() * UNIQUE_WORDS.length);
    const randomWord = UNIQUE_WORDS[randomIndex];

    // Prevent picking the same word twice in a row
    if (randomWord.toLowerCase() === currentTopic.toLowerCase()) {
      const nextIndex = (randomIndex + 1) % UNIQUE_WORDS.length;
      setCurrentTopic(UNIQUE_WORDS[nextIndex]);
    } else {
      setCurrentTopic(randomWord);
    }
  }, [currentTopic]);

  const handleCopy = useCallback(() => {
    if (content) {
      const textToCopy = `${currentTopic}\n\n${content}`;
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopyButtonText('Đã sao chép!');
        setTimeout(() => {
          setCopyButtonText('Sao chép');
        }, 2000); // Revert after 2 seconds
      }).catch(err => {
        console.error('Không thể sao chép văn bản: ', err);
      });
    }
  }, [currentTopic, content]);

  const handleSpeak = useCallback(() => {
    if (!isSpeechSynthSupported || !isVoiceReady) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else if (content && currentTopic) {
      const textToSpeak = `${currentTopic}. ${content}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      if (vietnameseVoice) {
        utterance.voice = vietnameseVoice;
      } else {
        utterance.lang = 'vi-VN';
      }

      utterance.onend = () => {
        setIsSpeaking(false);
      };
      utterance.onerror = (event) => {
        if (event.error !== 'interrupted') {
          console.error('Lỗi tổng hợp giọng nói:', event.error);
        }
        setIsSpeaking(false);
      };
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  }, [isSpeaking, content, currentTopic, vietnameseVoice, isSpeechSynthSupported, isVoiceReady]);


  return (
    <div>
      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
      <SearchBar onSearch={handleSearch} onRandom={handleRandom} isLoading={isLoading} />
      
      <header style={{ textAlign: 'center', marginBottom: '3rem', marginTop: '1rem' }}>
        <h1 style={{ letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          HỎI ĐÁP VÔ HẠN - ĐÔNG TÂY KIM CỔ
        </h1>
      </header>
      
      <main>
        <div>
          <div className="content-header">
            <h2 style={{ textTransform: 'capitalize' }}>
              {currentTopic}
            </h2>
             {!isLoading && content.length > 0 && !error && (
              <div className="action-buttons">
                {isSpeechSynthSupported && (
                  <button
                    onClick={handleSpeak}
                    className={`speak-button ${isSpeaking ? 'speaking' : ''}`}
                    aria-label={isSpeaking ? "Dừng đọc" : "Nghe nội dung"}
                    disabled={!isVoiceReady}
                  >
                    {!isVoiceReady ? 'Đang tải' : (isSpeaking ? 'Dừng' : 'Nghe')}
                  </button>
                )}
                <button 
                  onClick={handleCopy} 
                  className={`copy-button ${copyButtonText === 'Đã sao chép!' ? 'copied' : ''}`}
                  aria-label="Sao chép nội dung"
                >
                  {copyButtonText}
                </button>
              </div>
            )}
          </div>

          {error && (
            <div style={{ border: '1px solid #cc0000', padding: '1rem', color: '#cc0000' }}>
              <p style={{ margin: 0 }}>Đã xảy ra lỗi</p>
              <p style={{ marginTop: '0.5rem', margin: 0 }}>{error}</p>
            </div>
          )}
          
          {/* Show skeleton loader when loading and no content is yet available */}
          {isLoading && content.length === 0 && !error && (
            <LoadingSkeleton />
          )}

          {/* Show content as it streams or when it's interactive */}
          {content.length > 0 && !error && (
             <ContentDisplay 
               content={content} 
               isLoading={isLoading} 
               onWordClick={handleWordClick} 
             />
          )}

          {/* Show empty state if fetch completes with no content and is not loading */}
          {!isLoading && !error && content.length === 0 && (
            <div style={{ color: '#888', padding: '2rem 0' }}>
              <p>Không thể tạo nội dung.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="sticky-footer">
        <div className="footer-content">
          <p className="footer-text" style={{ margin: 0 }}>
            Người phát triển: Đỗ Như Lâm
          </p>
          <p className="footer-text" style={{ marginTop: '4px', fontSize: '0.85em' }}>
            Câu trả lời do AI tạo ra chỉ để tham khảo, cần cân nhắc kỹ lưỡng
          </p>
        </div>
        <button onClick={() => setIsAboutModalOpen(true)} className="footer-button">Giới thiệu</button>
      </footer>
    </div>
  );
};

export default App;