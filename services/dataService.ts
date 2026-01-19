
import { Product } from '../types';
import { WEEKLY_CATALOG as FALLBACK_DATA } from '../constants';

// Nueva URL de publicación CSV proporcionada por el usuario
const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7Oh80BAHGpWxo7UKAUpuXTYYgX4yR_FKI8pVfT9763Eu_o2CWROKXmOPJidQhzwk3R4eOn9ncw-6V/pub?output=csv';

/**
 * Transforma URLs de Google Drive/Sheets en enlaces operativos de imagen
 */
const transformDriveUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  let fileId = '';
  // Detectar enlaces estándar de compartir
  if (url.includes('drive.google.com')) {
    const driveRegex = /\/d\/([a-zA-Z0-9_-]{25,})|id=([a-zA-Z0-9_-]{25,})/;
    const match = url.match(driveRegex);
    if (match) fileId = match[1] || match[2];
  } 
  // Detectar enlaces de previsualización o miniaturas
  else if (url.includes('googleusercontent.com')) {
    const parts = url.split('/');
    const possibleId = parts[parts.length - 1].split(/[?#]/)[0];
    if (possibleId.length > 20) fileId = possibleId;
  }
  return fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : url;
};

/**
 * Procesa una línea de CSV respetando celdas con comas internas envueltas en comillas
 */
const parseCSVLine = (text: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else current += char;
  }
  result.push(current.trim());
  return result.map(val => val.replace(/^"|"$/g, '').replace(/""/g, '"'));
};

export const fetchWeeklyCatalog = async (sheetUrl: string = DEFAULT_SHEET_URL): Promise<Product[]> => {
  try {
    // El parámetro &t= fuerza a Google a servir la versión más reciente del CSV
    const cacheBuster = `&t=${Date.now()}`;
    const finalUrl = sheetUrl.includes('?') ? `${sheetUrl}${cacheBuster}` : `${sheetUrl}?${cacheBuster}`;
    
    console.log("Cargando catálogo desde:", finalUrl);
    
    const response = await fetch(finalUrl);
    if (!response.ok) throw new Error('Error de conexión con Google Sheets');
    
    const csvText = await response.text();
    // Dividir por líneas y filtrar las que estén totalmente vacías
    const rows = csvText.split(/\r?\n/).map(r => r.trim()).filter(r => r.length > 0);
    
    if (rows.length <= 1) {
      console.warn("El Excel parece no tener datos de productos todavía.");
      return FALLBACK_DATA;
    }

    // Omitimos la fila de cabecera
    const dataRows = rows.slice(1);
    const parsedProducts: Product[] = dataRows.map((row, index) => {
      const col = parseCSVLine(row);
      
      // Mapeo de columnas basado en el orden estándar de tu Excel
      return {
        id: col[0] || `item-${index}`,
        name: col[1] || '',
        category: col[2] || 'General',
        price: parseFloat(col[3]?.replace(',', '.') || '0') || 0,
        unit: col[4] || 'ud',
        description: col[5] || '',
        imageUrl: transformDriveUrl(col[6] || ''),
        origin: col[7] || 'Nacional',
        benefits: col[8] ? col[8].split('|').map(b => b.trim()) : [],
        specs: {
          format: col[9] || 'Estándar',
          shelfLife: col[10] || 'Consultar',
          storage: col[11] || 'Ambiente'
        }
      };
    });

    // Solo devolvemos productos que al menos tengan nombre
    const finalProducts = parsedProducts.filter(p => p.name.length > 0);
    console.log(`Cargados ${finalProducts.length} productos con éxito.`);
    
    return finalProducts.length > 0 ? finalProducts : FALLBACK_DATA;
    
  } catch (error) {
    console.error('Error crítico cargando datos del catálogo:', error);
    return FALLBACK_DATA;
  }
};
