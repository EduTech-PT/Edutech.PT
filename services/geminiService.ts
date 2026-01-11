import { GoogleGenAI } from "@google/genai";

export const sendMessageToGemini = async (prompt: string, history: { role: string, parts: { text: string }[] }[]) => {
  // Inicializamos o SDK apenas no momento do envio para garantir que process.env.API_KEY já está injetado
  // e para não quebrar o carregamento inicial da página.
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY não encontrada. Verifique as configurações do ambiente.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
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