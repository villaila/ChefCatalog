
import { Product } from './types';

export const WEEKLY_CATALOG: Product[] = [
  {
    id: '5',
    name: 'Bonito del Norte en Aceite',
    category: 'Conservas',
    price: 12.00,
    unit: 'Lata',
    description: 'Lomos de bonito seleccionados, capturados uno a uno. Textura firme y sabor suave con el punto justo de maduración en aceite.',
    imageUrl: 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?q=80&w=1000&auto=format&fit=crop',
    origin: 'Cantábrico, España',
    benefits: ['Apertura y servicio directo', 'Larga vida útil', 'Formato hostelería'],
    // Added missing 'tags' property
    tags: ['OFERTA'],
    specs: {
      format: 'Lata 650g',
      // Fix: 'shelfLife' replaced with 'unitsPerFormat' to match types.ts interface
      unitsPerFormat: 1,
      storage: 'Lugar fresco y seco'
    }
  },
  {
    id: '1',
    name: 'Magret de Pato Extra',
    category: 'Carnes',
    price: 18.90,
    unit: 'kg',
    description: 'Corte magro y jugoso procedente de las pechugas de patos cebados. Sabor intenso ideal para marcar a la plancha.',
    imageUrl: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?q=80&w=1000&auto=format&fit=crop',
    origin: "Francia",
    benefits: ['Versatilidad en cocina', 'Rendimiento excelente', 'Proteína premium'],
    tags: ['ESPECIAL PATO'],
    specs: {
      format: 'Planchas 400g',
      unitsPerFormat: 1,
      storage: '0°C a 4°C'
    }
  },
  {
    id: '2',
    name: 'Presa de Cerdo Ibérico Puro',
    category: 'Carnes',
    price: 24.50,
    unit: 'kg',
    description: 'Veteado intramuscular extremo. Notas de bellota y frutos secos. Ideal para tratamientos en brasa de encina.',
    imageUrl: 'https://images.unsplash.com/photo-1602491993980-30221e4237ec?q=80&w=1000&auto=format&fit=crop',
    origin: 'Guijuelo, Salamanca',
    benefits: ['Alta demanda en carta', 'Pérdida mínima por cocción', 'Exclusividad estacional'],
    // Added missing 'tags' property
    tags: ['IDEA SEMANA'],
    specs: {
      format: 'Piezas de 600g aprox.',
      // Fix: 'shelfLife' replaced with 'unitsPerFormat' to match types.ts interface
      unitsPerFormat: 1,
      storage: 'Refrigerado'
    }
  },
  {
    id: '4',
    name: 'Trufa Negra de Invierno',
    category: 'Especialidades',
    price: 920.00,
    unit: 'kg',
    description: 'Tuber Melanosporum en su punto álgido de madurez. Aroma profundo a tierra húmeda y bosque.',
    imageUrl: 'https://images.unsplash.com/photo-1590212151175-e58edd96185b?q=80&w=1000&auto=format&fit=crop',
    origin: 'Sarrión, Teruel',
    benefits: ['Elevación de ticket medio', 'Aroma de alta intensidad', 'Icono de temporada'],
    // Added missing 'tags' property
    tags: ['TOP CHEF'],
    specs: {
      format: 'Piezas +30g',
      // Fix: 'shelfLife' replaced with 'unitsPerFormat' to match types.ts interface
      unitsPerFormat: 1,
      storage: 'Bote hermético / 4°C'
    }
  }
];
