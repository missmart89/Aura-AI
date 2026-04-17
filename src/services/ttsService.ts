import { GoogleGenAI, Modality } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export async function generateSpeech(text: string, voiceName: string = 'Zephyr', options: { tone?: string, speed?: string, accent?: string } = {}) {
  try {
    const { tone = 'natural and seductive', speed = 'normal', accent = 'American' } = options;
    const prompt = `Say this ${tone} at a ${speed} pace with a ${accent} accent, including natural human-like cues like subtle hesitations or breaths where appropriate: ${text}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      await audio.play();
      return true;
    }
    return false;
  } catch (error) {
    console.error('TTS Error:', error);
    return false;
  }
}
