
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || "";

export const sendMessageToGemini = async (prompt: string, history: { role: string, parts: { text: string }[] }[]) => {
  if (!API_KEY) {
    throw new Error("Chave de API do Gemini não configurada.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history,
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: "Tu és o 'EduBot', um tutor inteligente da EduTech PT. Responde sempre em Português de Portugal. Sê encorajador, didático e profissional. Ajuda os alunos com dúvidas sobre programação, tecnologia e os cursos da plataforma.",
        temperature: 0.7,
        topP: 0.95,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Erro ao chamar Gemini API:", error);
    throw error;
  }
};
