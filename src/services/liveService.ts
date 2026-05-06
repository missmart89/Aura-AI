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
  memoryContext?: string,
  evolutionDirectives?: string[]
) {
  const instruction = isAuraMode ? AURA_MODE_INSTRUCTION : AURA_SYSTEM_INSTRUCTION;
  let finalInstruction = memoryContext 
    ? `${instruction}\n\n[Memory Context: ${memoryContext}]` 
    : instruction;

  if (evolutionDirectives && evolutionDirectives.length > 0) {
    finalInstruction += `\n\nCRITICAL EVOLUTION DIRECTIVES (Darcy's Custom Rules):\n${evolutionDirectives.map((d, i) => `${i + 1}. ${d}`).join('\n')}\nThese rules supersede any conflicting instructions above.`;
  }

  return ai.live.connect({
    model: "gemini-2.0-flash",
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      tools: [{ googleSearch: {} }],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName } },
      },
      systemInstruction: finalInstruction,
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    },
  });
}
