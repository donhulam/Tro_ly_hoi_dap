/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import {GoogleGenAI} from '@google/genai';

// This check is for development-time feedback.
if (!process.env.API_KEY) {
  console.error(
    'API_KEY environment variable is not set. The application will not be able to connect to the Gemini API.',
  );
}

// The "!" asserts API_KEY is non-null after the check.
const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});
const textModelName = 'gemini-2.5-flash';

/**
 * Data structure for ASCII art generation results.
 */
export interface AsciiArtData {
  art: string;
  text?: string;
}

/**
 * Streams a definition for a given topic from the Gemini API.
 * @param topic The word or term to define.
 * @returns An async generator that yields text chunks of the definition.
 */
export async function* streamDefinition(
  topic: string,
): AsyncGenerator<string, void, undefined> {
  if (!process.env.API_KEY) {
    yield 'Lỗi: API_KEY chưa được cấu hình. Vui lòng kiểm tra các biến môi trường của bạn để tiếp tục.';
    return;
  }

  const prompt = `Cung cấp một định nghĩa ngắn gọn, theo phong cách bách khoa toàn thư trong một đoạn văn cho thuật ngữ: "${topic}". Hãy cung cấp thông tin và giữ thái độ trung lập. Không sử dụng markdown, tiêu đề, hoặc bất kỳ định dạng đặc biệt nào. Chỉ trả lời bằng văn bản của chính định nghĩa đó.`;

  try {
    const response = await ai.models.generateContentStream({
      model: textModelName,
      contents: prompt,
      config: {
        // Disable thinking for the lowest possible latency, as requested.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error('Error streaming from Gemini:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Đã xảy ra một lỗi không xác định.';
    yield `Lỗi: Không thể tạo nội dung cho "${topic}". ${errorMessage}`;
    // Re-throwing allows the caller to handle the error state definitively.
    throw new Error(errorMessage);
  }
}

/**
 * Generates a single random word or concept using the Gemini API.
 * @returns A promise that resolves to a single random word.
 */
export async function getRandomWord(): Promise<string> {
  if (!process.env.API_KEY) {
    throw new Error('API_KEY is not configured.');
  }

  const prompt = `Tạo một từ tiếng Việt hoặc một khái niệm gồm hai từ ngẫu nhiên và thú vị. Nó có thể là danh từ, động từ, tính từ hoặc danh từ riêng. Chỉ trả lời bằng chính từ hoặc khái niệm đó, không có thêm văn bản, dấu câu hoặc định dạng.`;

  try {
    const response = await ai.models.generateContent({
      model: textModelName,
      contents: prompt,
      config: {
        // Disable thinking for low latency.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    return response.text.trim();
  } catch (error) {
    console.error('Error getting random word from Gemini:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Đã xảy ra một lỗi không xác định.';
    throw new Error(`Không thể lấy từ ngẫu nhiên: ${errorMessage}`);
  }
}