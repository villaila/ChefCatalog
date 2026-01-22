
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  description: string;
  imageUrl: string;
  origin: string;
  benefits: string[];
  tags: string[]; // Nueva propiedad para clasificación
  specs: {
    format: string;
    unitsPerFormat: number;
    storage: string;
  };
}

export interface CartItem extends Product {
  quantity: number;
}

export interface RecipeSuggestion {
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  plating: string;
  chefTips: string;
}

export interface InventoryItem {
  name: string;
  quantity: number;
  unit: string;
  cost: number;
}