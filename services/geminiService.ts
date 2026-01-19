
import { GoogleGenAI, Type } from "@google/genai";
import { RecipeSuggestion, Product } from "../types";

// Helper para obtener la API KEY independientemente del entorno (Vite o Node)
const getApiKey = () => {
  // @ts-ignore
  return process.env.API_KEY || import.meta.env?.VITE_API_KEY;
};

const getAiClient = () => {
  const apiKey = getApiKey();
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

    return JSON.parse(response.text || '{}');
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Gourmet food photo of ${productName}` }] },
      config: { imageConfig: { aspectRatio: "1:1" } },
    });

    const imageData = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
    if (imageData) return `data:image/png;base64,${imageData}`;
    throw new Error("No image data");
  } catch (error) {
    return `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop`;
  }
};
