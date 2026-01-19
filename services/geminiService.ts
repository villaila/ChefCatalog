
import { GoogleGenAI, Type } from "@google/genai";
import { RecipeSuggestion, Product } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY no configurada.");
  }
  return new GoogleGenAI({ apiKey: apiKey });
};

export const getChefInspiration = async (product: Product): Promise<RecipeSuggestion> => {
  try {
    const ai = getAiClient();
    const prompt = `
      Actúa como un Chef Ejecutivo Michelin. 
      Producto: "${product.name}"
      Descripción: ${product.description}
      Formato de compra: ${product.specs.format} (Precio: ${product.price}€ por ${product.unit})
      
      Crea una sugerencia de plato estrella. Ten en cuenta el peso del formato (${product.specs.format}) para que la sugerencia sea realista en términos de producción y costes para un restaurante.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            ingredients: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            method: { type: Type.STRING },
            pairing: { type: Type.STRING },
            chefTips: { type: Type.STRING }
          },
          required: ["title", "ingredients", "method", "pairing", "chefTips"]
        }
      }
    });

    const text = response.text ? response.text.trim() : '{}';
    return JSON.parse(text);
  } catch (error) {
    console.error("Error en Chef IA:", error);
    return {
      title: `Especialidad de ${product.name}`,
      ingredients: ["Producto principal", "Guarnición de temporada", "Aceite de oliva virgen"],
      method: "Preparación respetando el formato original del producto.",
      pairing: "Vino blanco o tinto ligero según preferencia.",
      chefTips: "Aprovechar el jugo o aceite del propio formato para intensificar el sabor."
    };
  }
};

export const generateProductImage = async (productName: string): Promise<string> => {
  try {
    const ai = getAiClient();
    // Prompt más corto para mayor rapidez y menor consumo
    const prompt = `Gourmet commercial photo of ${productName}, clean minimalist background, professional lighting.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { 
        imageConfig: { aspectRatio: "4:3" }
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Imagen no devuelta");
  } catch (error: any) {
    // Si es error de cuota (429), lanzamos error específico para que el componente lo maneje
    if (error?.message?.includes('429') || error?.status === 429) {
      console.warn("Cuota de API excedida. Usando imagen de stock temporal.");
      throw new Error("QUOTA_EXCEEDED");
    }
    console.error("Error generando imagen:", error);
    return 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=1000&auto=format&fit=crop';
  }
};
