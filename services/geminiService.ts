
import { GoogleGenAI, Type } from "@google/genai";
import { RecipeSuggestion, Product } from "../types";

export type CulinaryStyle = 'Tradicional' | 'Clásica' | 'Moderna' | 'Técnica';

export const getChefInspiration = async (product: Product, style: CulinaryStyle = 'Moderna'): Promise<RecipeSuggestion> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Como Chef Ejecutivo de Pirineos Exdim, crea una propuesta culinaria de estilo "${style}" para el producto: "${product.name}". 
    
    Instrucciones de estilo:
    - Tradicional: Sabores de siempre, guisos, recetas regionales, reconfortante.
    - Clásica: Técnicas francesas/internacionales académicas, salsas madre, elegancia atemporal.
    - Moderna: Vanguardia, contrastes de texturas, presentaciones minimalistas, ingredientes globales.
    - Técnica: Enfoque extremo en procesos químicos/físicos (vacío, fermentos, temperaturas precisas), máxima optimización de merma.

    Responde estrictamente en formato JSON con la siguiente estructura:
    {
      "title": "Nombre creativo del plato",
      "description": "Breve concepto del plato (max 20 palabras)",
      "ingredients": ["lista de ingredientes con cantidades"],
      "steps": ["paso 1", "paso 2", ...],
      "plating": "Descripción del emplatado",
      "chefTips": "Consejo profesional para rentabilidad o sabor"
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
      steps: ["El servicio Chef IA está temporalmente en mantenimiento."],
      plating: "No disponible",
      chefTips: "Contacta con soporte."
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
