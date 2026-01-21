
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
    unitsPerFormat: number; // Nueva propiedad: sustituye a shelfLife
    storage: string;
  };
}

export interface CartItem extends Product {
  quantity: number;
}

export interface RecipeSuggestion {
  title: string;
  ingredients: string[];
  method: string;
  pairing: string;
  chefTips: string;
}

export interface InventoryItem {
  name: string;
  quantity: number;
  unit: string;
  cost: number;
}
