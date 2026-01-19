
import { GoogleGenAI, Type } from "@google/genai";
import { RecipeSuggestion, Product } from "../types";

// Función para obtener la instancia de la IA de forma segura
const getAiClient = () => {
  // En entornos de desarrollo local o Vercel, buscamos la variable API_KEY
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.warn("API_KEY no encontrada. La IA funcionará en modo demo.");
    return null;
  }
  
  return new GoogleGenAI({ apiKey });
};

export const getChefInspiration = async (product: Product): Promise<RecipeSuggestion> => {
  try {
    const ai = getAiClient();
    if (!ai) throw new Error("No API Key");

    const prompt = `Actúa como un Chef Ejecutivo Michelin. 
      Crea una receta técnica para: "${product.name}". 
      Descripción: ${product.description}. 
      Responde solo en JSON.`;

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
    console.error("Error Chef IA:", error);
    return {
      title: `Sugerencia: ${product.name} al estilo Chef`,
      ingredients: ["Producto principal", "Aceite de oliva", "Sal en escamas", "Brote tierno"],
      method: "Tratamiento mínimo del producto para resaltar su origen y frescura.",
      pairing: "Vino blanco seco o cerveza artesana suave.",
      chefTips: "Servir a temperatura ambiente para potenciar aromas."
    };
  }
};

export const generateProductImage = async (productName: string): Promise<string> => {
  try {
    const ai = getAiClient();
    if (!ai) throw new Error("No API Key");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Gourmet food photography of ${productName}, luxury plating, top view.` }] },
      config: { imageConfig: { aspectRatio: "1:1" } },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No image");
  } catch (error) {
    return `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop`;
  }
};
