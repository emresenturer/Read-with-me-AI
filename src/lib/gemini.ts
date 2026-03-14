import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { AudioRecorder, AudioStreamer } from "./audio";

export interface LiveSessionCallbacks {
  onConnect: () => void;
  onDisconnect: () => void;
  onError: (err: any) => void;
  onTeacherSpeak: (text: string) => void;
  onShowWord: (word: string) => void;
  onShowOptions: (options: string[]) => void;
  onCelebrate: () => void;
  onEndLesson: () => void;
}

export class LiveSession {
  private ai: any;
  private session: any;
  public recorder: AudioRecorder | null = null;
  public streamer: AudioStreamer | null = null;
  private isConnected = false;
  private connectionTimeout: any;

  constructor(private callbacks: LiveSessionCallbacks) {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  async connect(systemInstruction: string) {
    if (this.isConnected) return;

    try {
      this.streamer = new AudioStreamer();
      this.recorder = new AudioRecorder();

      this.connectionTimeout = setTimeout(() => {
        if (!this.isConnected) {
          this.callbacks.onError(new Error("Connection timed out. Please check your network or API key."));
          this.disconnect();
        }
      }, 15000);

      const sessionPromise = this.ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        callbacks: {
          onopen: async () => {
            clearTimeout(this.connectionTimeout);
            this.isConnected = true;
            this.callbacks.onConnect();
            try {
              await this.recorder?.start((base64Data) => {
                if (this.isConnected && this.session) {
                  sessionPromise.then((s: any) => {
                    s.sendRealtimeInput({
                      media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                    });
                  });
                }
              });
            } catch (e) {
              console.error("Microphone error:", e);
              this.callbacks.onError(new Error("Could not access microphone. Please ensure permissions are granted."));
              this.disconnect();
            }
          },
          onmessage: async (message: any) => {
            // Handle audio playback
            const base64Audio = message.serverContent?.modelTurn?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
            if (base64Audio) {
              this.streamer?.playBase64(base64Audio);
            }

            // Handle text (subtitles)
            const textPart = message.serverContent?.modelTurn?.parts?.find((p: any) => p.text);
            if (textPart && textPart.text) {
              this.callbacks.onTeacherSpeak(textPart.text);
            }

            if (message.serverContent?.interrupted) {
              this.streamer?.stop();
            }

            // Handle tool calls
            if (message.toolCall) {
              const calls = message.toolCall.functionCalls;
              if (calls) {
                const responses: any[] = [];
                for (const call of calls) {
                  if (call.name === 'showWord') {
                    this.callbacks.onShowWord((call.args as any).word);
                    responses.push({ id: call.id, name: call.name, response: { result: "word displayed" } });
                  } else if (call.name === 'showOptions') {
                    this.callbacks.onShowOptions((call.args as any).options);
                    responses.push({ id: call.id, name: call.name, response: { result: "options displayed" } });
                  } else if (call.name === 'celebrate') {
                    this.callbacks.onCelebrate();
                    responses.push({ id: call.id, name: call.name, response: { result: "celebrated" } });
                  } else if (call.name === 'endLesson') {
                    this.callbacks.onEndLesson();
                    responses.push({ id: call.id, name: call.name, response: { result: "lesson ended" } });
                  }
                }
                if (responses.length > 0 && this.session) {
                  sessionPromise.then((s: any) => {
                    if (typeof s.sendToolResponse === 'function') {
                      s.sendToolResponse({ functionResponses: responses });
                    } else {
                      s.send({ toolResponse: { functionResponses: responses } });
                    }
                  });
                }
              }
            }
          },
          onerror: (err: any) => {
            clearTimeout(this.connectionTimeout);
            console.error("Live API Error:", err);
            this.callbacks.onError(new Error("Connection error with the AI teacher."));
            this.disconnect();
          },
          onclose: () => {
            clearTimeout(this.connectionTimeout);
            if (!this.isConnected) {
              this.callbacks.onError(new Error("Connection closed before opening. Check API key and model access."));
            }
            this.disconnect();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
          },
          systemInstruction,
          tools: [{
            functionDeclarations: [
              {
                name: "showWord",
                description: "Display a single big word on the screen for the child to read.",
                parameters: { type: Type.OBJECT, properties: { word: { type: Type.STRING } }, required: ["word"] }
              },
              {
                name: "showOptions",
                description: "Display multiple choice buttons on the screen for the child to tap.",
                parameters: { type: Type.OBJECT, properties: { options: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["options"] }
              },
              {
                name: "celebrate",
                description: "Trigger a confetti celebration on the screen when the child does a great job!",
                parameters: { type: Type.OBJECT, properties: {} }
              },
              {
                name: "endLesson",
                description: "End the lesson when the child has completed all tasks.",
                parameters: { type: Type.OBJECT, properties: {} }
              }
            ]
          }]
        }
      });
      
      this.session = await sessionPromise;
    } catch (err) {
      clearTimeout(this.connectionTimeout);
      console.error("Setup error:", err);
      this.callbacks.onError(err instanceof Error ? err : new Error(String(err)));
      this.disconnect();
    }
  }

  sendText(text: string) {
    if (this.isConnected && this.session) {
      try {
        this.session.send({
          clientContent: {
            turns: [{
              role: "user",
              parts: [{ text }]
            }],
            turnComplete: true
          }
        });
      } catch (e) {
        console.error("Failed to send text:", e);
      }
    }
  }

  disconnect() {
    this.isConnected = false;
    this.recorder?.stop();
    this.streamer?.stop();
    if (this.session && typeof this.session.close === 'function') {
      try { this.session.close(); } catch (e) {}
    }
    this.session = null;
    this.callbacks.onDisconnect();
  }
}
