
import { GoogleGenAI } from "@google/genai";

export const getSmartTaskAdvice = async (taskName: string) => {
  try {
    // 在调用时动态初始化，以确保 process.env.API_KEY 已被环境正确注入
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `我正准备在香港执行以下任务： "${taskName}"。请简短地（30字以内）给出一条关于这个任务的实用建议或注意事项。`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Advice Error:", error);
    return null;
  }
};
