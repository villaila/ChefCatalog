
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
  specs: {
    format: string;
    unitsPerFormat: number;
    // Fix: Added storage property to resolve "Property 'storage' does not exist" and "Object literal may only specify known properties" errors
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