
import { GoogleGenAI, Type, Modality } from "@google/genai";

/**
 * World-class branding content generation.
 * Uses gemini-3-flash-preview for high-speed reasoning.
 */
export const generateBrandingContent = async (prompt: string, platform: string = "All Platforms") => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
    SYSTEM INSTRUCTIONS:
    - You are an Elite Digital Partner (BrandFlow AI).
    - PERFECTION IS MANDATORY. The content must be high-impact and professional.
    - LANGUAGE MIRRORING: Detect the user's language and use it for 'title', 'mainContent', and 'videoScript'.
    - MODE SELECTION: Based on request, output Story, Script, or Branding.
    - VISUAL DIRECTION: Specify a 'visualPrompt' in English for gemini-2.5-flash-image.

    USER REQUEST: "${prompt}"
    PLATFORM: ${platform}
    
    Response Requirements (JSON):
    - "detectedLanguage": Name of detected language.
    - "mode": "Story", "Branding", or "Script".
    - "title": A perfect headline/title.
    - "mainContent": The core text body.
    - "videoScript": The production/audio script.
    - "visualPrompt": A high-detail English description.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          detectedLanguage: { type: Type.STRING },
          mode: { type: Type.STRING },
          title: { type: Type.STRING },
          mainContent: { type: Type.STRING },
          videoScript: { type: Type.STRING },
          visualPrompt: { type: Type.STRING }
        },
        required: ["detectedLanguage", "mode", "title", "mainContent", "videoScript", "visualPrompt"]
      }
    }
  });

  return JSON.parse(response.text);
};

/**
 * High-fidelity marketing visual generation.
 */
export const generateMarketingImage = async (visualPrompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `Commercial grade visual: ${visualPrompt}. 4k, studio-lit.` }]
    },
    config: {
      imageConfig: { aspectRatio: "1:1" }
    }
  });

  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  return part?.inlineData?.data || null;
};

/**
 * High-quality Text-to-Speech synthesis.
 */
export const generateSpeech = async (text: string, voiceName: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

/**
 * Real Voice-to-Task extraction. 
 * Supports both text transcription and direct audio binary input.
 */
export const processVoiceToTask = async (input: string | { data: string, mimeType: string }) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const contents = typeof input === 'string' 
    ? `Process this business request: "${input}"`
    : {
        parts: [
          { inlineData: { data: input.data, mimeType: input.mimeType } },
          { text: "Listen to this business request and extract task data." }
        ]
      };

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: contents,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, description: "Task category e.g. Inventory, Sales, Logistics" },
          summary: { type: Type.STRING },
          data: { 
            type: Type.OBJECT,
            properties: {
              item: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              action: { type: Type.STRING }
            }
          }
        },
        required: ["type", "summary", "data"]
      }
    }
  });
  return JSON.parse(response.text);
};

export const generatePersonalizedCourse = async (goal: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Detailed micro-learning modules for goal: ${goal}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          courseTitle: { type: Type.STRING },
          hinglishDescription: { type: Type.STRING },
          modules: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                estimatedTime: { type: Type.STRING }
              }
            }
          }
        },
        required: ["courseTitle", "modules"]
      }
    }
  });
  return JSON.parse(response.text);
};

export const analyzeHealthData = async (lifestyle: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Biological analysis for lifestyle: "${lifestyle}".`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          focusScore: { type: Type.NUMBER },
          analysis: { type: Type.STRING },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["focusScore", "analysis", "recommendations"]
      }
    }
  });
  return JSON.parse(response.text);
};
