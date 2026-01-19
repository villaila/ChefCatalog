
import { GoogleGenAI, Type } from "@google/genai";
import { RecipeSuggestion, Product } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

// Función auxiliar para reintentar peticiones en caso de error 429
const fetchWithRetry = async (fn: () => Promise<any>, retries = 3, delay = 1000): Promise<any> => {
  try {
    return await fn();
  } catch (error: any) {
    // Si es un error 404 (modelo no existe o ID mal), no reintentamos
    if (error.message?.includes('404') || error.status === 404) {
      throw error;
    }
    if (retries > 0 && (error.message?.includes('429') || error.status === 429)) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const getChefInspiration = async (product: Product): Promise<RecipeSuggestion> => {
  return fetchWithRetry(async () => {
    const ai = getAiClient();
    if (!ai) throw new Error("API Key faltante");

    const prompt = `Como Chef Ejecutivo de Pirineos Exdim, crea una receta técnica creativa para: "${product.name}". La descripción del producto es: "${product.description}". Responde estrictamente en JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Modelo actualizado para evitar el error 404
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
  }).catch(error => {
    console.error("Error final IA Receta:", error);
    return {
      title: `${product.name} al Estilo Pirineos`,
      ingredients: ["Producto seleccionado", "Guarnición de temporada", "Aceite de oliva virgen"],
      method: "Preparación profesional resaltando la calidad original del producto.",
      pairing: "Vino blanco seco o tinto joven según temporada.",
      chefTips: "Mantener la cadena de frío hasta el momento del cocinado."
    };
  });
};

export const generateProductImage = async (productName: string): Promise<string> => {
  return fetchWithRetry(async () => {
    const ai = getAiClient();
    if (!ai) throw new Error("API Key faltante");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Gourmet food professional photography of ${productName}, top view, high-end restaurant plating, soft natural lighting, depth of field` }] },
      config: { imageConfig: { aspectRatio: "1:1" } },
    });

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          return `data:image/png;base64,${base64EncodeString}`;
        }
      }
    }
    throw new Error("No image data");
  }).catch(error => {
    console.error("Error final IA Imagen:", error);
    return `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop`;
  });
};
