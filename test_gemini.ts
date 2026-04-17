import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import * as dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  try {
    const result = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: "Test",
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      },
    });
    console.log("Success:", result.text);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
