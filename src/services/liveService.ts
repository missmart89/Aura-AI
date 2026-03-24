import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { AURA_SYSTEM_INSTRUCTION, AURA_MODE_INSTRUCTION } from "./geminiService";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

export const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export async function connectToAuraLive(
  callbacks: {
    onopen?: () => void;
    onmessage: (message: LiveServerMessage) => void;
    onerror?: (error: any) => void;
    onclose?: () => void;
  },
  voiceName: string = "Zephyr",
  isAuraMode: boolean = false,
  memoryContext?: string
) {
  const instruction = isAuraMode ? AURA_MODE_INSTRUCTION : AURA_SYSTEM_INSTRUCTION;
  const finalInstruction = memoryContext 
    ? `${instruction}\n\n[Memory Context: ${memoryContext}]` 
    : instruction;

  return ai.live.connect({
    model: "gemini-2.5-flash-native-audio-preview-12-2025",
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName } },
      },
      systemInstruction: finalInstruction,
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    },
  });
}
