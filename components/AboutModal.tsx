/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  // Prevent modal from closing when clicking inside the content
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="about-modal-title">
      <div className="modal-content" onClick={handleContentClick}>
        <button onClick={onClose} className="modal-close-button" aria-label="Đóng cửa sổ giới thiệu">&times;</button>
        <h2 id="about-modal-title" className="modal-title">Giới thiệu</h2>
        <p><strong>Hỏi Đáp Vô Hạn - Đông Tây Kim Cổ</strong> là một bách khoa toàn thư nơi mỗi từ là một liên kết. Nhấp vào bất kỳ từ nào để tìm hiểu sâu hơn về một chuỗi kiến thức vô tận, được cung cấp bởi mô hình Gemini.</p>
        <p>Bạn cũng có thể đặt bất kỳ câu hỏi nào, sử dụng giọng nói để tìm kiếm hoặc khám phá một chủ đề ngẫu nhiên để bắt đầu cuộc hành trình tri thức của mình.</p>
        <p>Dự án này được lấy cảm hứng từ ý tưởng về một wiki vô hạn, nhằm mục đích tạo ra một trải nghiệm khám phá và học hỏi liền mạch.</p>
      </div>
    </div>
  );
};

export default AboutModal;
