
import { GoogleGenAI, Type } from "@google/genai";
import { RecipeSuggestion, Product } from "../types";

export const getChefInspiration = async (product: Product): Promise<RecipeSuggestion> => {
  try {
    // La llave ahora será inyectada correctamente por Vite
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Como Chef Ejecutivo de Pirineos Exdim, crea una receta técnica profesional para: "${product.name}". 
    Enfócate en maximizar el rendimiento del producto. Responde estrictamente en JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
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
      title: `${product.name} Sugerencia del Chef`,
      ingredients: ["Ingrediente principal", "Acompañamiento"],
      method: "El servicio Chef IA está temporalmente en mantenimiento o la API Key no es válida.",
      pairing: "No disponible",
      chefTips: "Contacta con soporte técnico de Pirineos Exdim."
    };
  }
};

export const generateProductImage = async (productName: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { 
        parts: [{ text: `High-end gourmet food photography of ${productName}, professional culinary lighting, minimalist white background` }] 
      },
      config: { 
        imageConfig: { aspectRatio: "1:1" } 
      },
    });

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image data found");
  } catch (error) {
    console.error("Error generando imagen:", error);
    return `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop`;
  }
};
