
import { GoogleGenAI, Type } from "@google/genai";
import { RecipeSuggestion, Product } from "../types";

export type CulinaryStyle = 'Tradicional' | 'Clásica' | 'Moderna' | 'Técnica';

export const getChefInspiration = async (product: Product, style: CulinaryStyle = 'Moderna'): Promise<RecipeSuggestion> => {
  try {
    const apiKey = (process.env.API_KEY || '') as string;
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `Como Chef Ejecutivo de Pirineos Exdim, crea una propuesta culinaria de estilo "${style}" para el producto: "${product.name}". 
    
    Instrucciones de estilo:
    - Tradicional: Sabores de siempre, guisos, recetas regionales.
    - Clásica: Técnicas francesas/internacionales académicas.
    - Moderna: Vanguardia, contrastes de texturas, presentaciones minimalistas.
    - Técnica: Enfoque extremo en procesos, máxima optimización de merma.

    Responde estrictamente en formato JSON:
    {
      "title": "Nombre creativo del plato",
      "description": "Breve concepto (max 20 palabras)",
      "ingredients": ["lista"],
      "steps": ["pasos"],
      "plating": "Descripción",
      "chefTips": "Consejo profesional"
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            steps: { type: Type.ARRAY, items: { type: Type.STRING } },
            plating: { type: Type.STRING },
            chefTips: { type: Type.STRING }
          },
          required: ["title", "description", "ingredients", "steps", "plating", "chefTips"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error Chef IA:", error);
    return {
      title: `${product.name} Sugerencia`,
      description: "Error de conexión con el servicio de IA.",
      ingredients: ["Revisa tu conexión"],
      steps: ["Servicio temporalmente no disponible."],
      plating: "No disponible",
      chefTips: "Contacta con soporte."
    };
  }
};

export const generateProductImage = async (productName: string): Promise<string> => {
  try {
    const apiKey = (process.env.API_KEY || '') as string;
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { 
        parts: [{ text: `High-end gourmet food photography of ${productName}, minimalist background` }] 
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
    throw new Error("No image data");
  } catch (error) {
    return `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop`;
  }
};
