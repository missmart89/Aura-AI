import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

export interface GestureAction {
  type: 'swipe_left' | 'swipe_right' | 'confirm' | 'cancel' | 'unknown';
  description: string;
}

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private onGestureDetected: (gesture: GestureAction) => void;

  constructor(apiKey: string, onGestureDetected: (gesture: GestureAction) => void) {
    this.ai = new GoogleGenAI({ apiKey });
    this.onGestureDetected = onGestureDetected;
  }

  public async connect() {
    if (this.sessionPromise) return;

    this.sessionPromise = this.ai.live.connect({
      model: "gemini-2.5-flash-native-audio-preview-12-2025",
      callbacks: {
        onopen: () => {
          console.log("Gemini Live session opened");
        },
        onmessage: async (message: LiveServerMessage) => {
          if (message.serverContent?.modelTurn?.parts) {
            const text = message.serverContent.modelTurn.parts
              .map(p => p.text)
              .filter(Boolean)
              .join(" ");
            
            if (text) {
              this.parseGesture(text);
            }
          }
        },
        onerror: (err) => {
          console.error("Gemini Live error:", err);
          this.sessionPromise = null;
        },
        onclose: () => {
          console.log("Gemini Live session closed");
          this.sessionPromise = null;
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: `You are Aura, a visual gesture interpreter. 
        Your job is to watch the video stream and identify specific hand gestures.
        When you see a gesture, respond ONLY with a JSON-like string in the format:
        GESTURE: {"type": "swipe_left" | "swipe_right" | "confirm" | "cancel", "description": "short description"}
        
        Gestures to identify:
        - Swipe Left: Hand moving from right to left.
        - Swipe Right: Hand moving from left to right.
        - Thumbs Up: Confirm action.
        - Open Palm: Cancel or Stop action.
        
        Do not speak unless spoken to. Focus entirely on gesture detection.`,
      },
    });
  }

  private parseGesture(text: string) {
    const match = text.match(/GESTURE:\s*({.*})/);
    if (match) {
      try {
        const gesture = JSON.parse(match[1]) as GestureAction;
        this.onGestureDetected(gesture);
      } catch (e) {
        console.error("Failed to parse gesture:", e);
      }
    }
  }

  public async sendFrame(base64Data: string) {
    if (!this.sessionPromise) return;
    const session = await this.sessionPromise;
    session.sendRealtimeInput({
      video: { data: base64Data, mimeType: 'image/jpeg' }
    });
  }

  public async disconnect() {
    if (this.sessionPromise) {
      const session = await this.sessionPromise;
      session.close();
      this.sessionPromise = null;
    }
  }
}
