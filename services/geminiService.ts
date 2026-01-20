
import { GoogleGenAI, Type } from "@google/genai";
import { RecipeSuggestion, Product } from "../types";

// Always use the process.env.API_KEY directly for initialization as per guidelines
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const getChefInspiration = async (product: Product): Promise<RecipeSuggestion> => {
  try {
    const ai = getAiClient();
    if (!ai) throw new Error("API Key faltante");

    const prompt = `Como Chef Ejecutivo, crea una receta técnica para: "${product.name}". Responde en JSON.`;

    // Using gemini-3-flash-preview for basic text tasks
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            method: { type: Type.STRING },
            pairing: { type: Type.STRING },
            chefTips: { type: Type.STRING }
          },
          required: ["title", "ingredients", "method", "pairing", "chefTips"]
        }
      }
    });

    // Use .text property directly as it is not a function
    const text = response.text || '{}';
    return JSON.parse(text);
  } catch (error) {
    console.error("Error IA:", error);
    return {
      title: `${product.name} Sugerencia del Chef`,
      ingredients: ["Ingrediente principal", "Acompañamiento"],
      method: "Preparación estándar profesional.",
      pairing: "Vino recomendado.",
      chefTips: "Servir recién preparado."
    };
  }
};

export const generateProductImage = async (productName: string): Promise<string> => {
  try {
    const ai = getAiClient();
    if (!ai) throw new Error("API Key faltante");

    // Using gemini-2.5-flash-image for general image generation
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Gourmet food photo of ${productName}, professional lighting, white background` }] },
      config: { 
        imageConfig: { 
          aspectRatio: "1:1" 
        } 
      },
    });

    // Iterate through candidates and parts to find the image data
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Error generating image:", error);
    return `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop`;
  }
};
