
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: API_KEY });
};

/**
 * Generates a "Perfect Pack" with absolute precision.
 * Detects language, mirrors it, and selects the ideal marketing/storytelling mode.
 */
export const generateBrandingContent = async (prompt: string, platform: string = "All Platforms") => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
    SYSTEM INSTRUCTIONS:
    - You are an Elite Digital Partner (BrandFlow AI).
    - PERFECTION IS MANDATORY. The content must be high-impact, emotionally resonant, and professional.
    - LANGUAGE MIRRORING: Detect the user's language (Hindi, English, Hinglish, Arabic, etc.). Use ONLY that language for the 'title', 'mainContent', and 'videoScript'.
    - MODE SELECTION:
       * If user wants a Story: Create a gripping narrative with a beginning, middle, and powerful end.
       * If user wants a Script: Create a production-ready video/reel script with scene descriptions and narrator lines.
       * If user wants Branding: Create a strategic business campaign including a hook and detailed copy.
    - VISUAL DIRECTION: You are a World-Class Art Director. Based on the topic, decide the PERFECT image style (e.g., 'A 3D isometric tech illustration', 'A cinematic moody portrait', 'A minimalist flat-vector logo style', 'A hyper-realistic nature photograph', 'A vibrant neon cyberpunk render'). Specify this in the 'visualPrompt'.
    - VIDEO DIRECTION: Provide a concise 'videoPrompt' in English suitable for a high-quality cinematic video generator.

    USER REQUEST: "${prompt}"
    PLATFORM: ${platform}
    
    Response Requirements (JSON):
    - "detectedLanguage": Name of detected language.
    - "mode": "Story", "Branding", or "Script".
    - "title": A perfect headline/title.
    - "mainContent": The core text body.
    - "videoScript": The production/audio script.
    - "visualPrompt": A high-detail English prompt describing the SPECIFIC ART STYLE you chose for the better visual impact.
    - "videoPrompt": A cinematic English prompt for a 16:9 high-quality video generation.`,
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
          visualPrompt: { type: Type.STRING },
          videoPrompt: { type: Type.STRING }
        },
        required: ["detectedLanguage", "mode", "title", "mainContent", "videoScript", "visualPrompt", "videoPrompt"]
      }
    }
  });

  return JSON.parse(response.text);
};

/**
 * Generates a world-class marketing image using the AI-suggested style.
 */
export const generateMarketingImage = async (visualPrompt: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `Commercial grade, high-fidelity marketing visual. Style and Subject: ${visualPrompt}. 4k, studio-lit, impeccable detail, trending on ArtStation.` }]
    },
    config: {
      imageConfig: { aspectRatio: "1:1" }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }
  return null;
};

/**
 * Generates an AI Video using the Veo model.
 */
export const generateAIVideo = async (prompt: string, onStatus: (msg: string) => void) => {
  // We recreate the client here to ensure it uses the latest selected API key if applicable
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  onStatus("Initializing Video Engine...");
  
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  onStatus("Dreaming up the scenes... (May take 1-2 minutes)");
  
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
    onStatus("Crafting your cinematic masterpiece... 🍿");
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed.");
  
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

/**
 * Synthesizes speech for the "Voice" component.
 */
export const generateSpeech = async (text: string, voiceName: string) => {
  const ai = getGeminiClient();
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

export const processVoiceToTask = async (transcription: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Convert business voice note to data: "${transcription}".`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          summary: { type: Type.STRING },
          data: { 
            type: Type.OBJECT,
            properties: {
              item: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              action: { type: Type.STRING }
            }
          }
        }
      }
    }
  });
  return JSON.parse(response.text);
};

export const generatePersonalizedCourse = async (goal: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Micro-learning path for: ${goal}.`,
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
        }
      }
    }
  });
  return JSON.parse(response.text);
};

export const analyzeHealthData = async (lifestyle: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Bio-hacking analysis for founder: "${lifestyle}".`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          focusScore: { type: Type.NUMBER },
          analysis: { type: Type.STRING },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });
  return JSON.parse(response.text);
};
