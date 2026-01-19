
import { Product } from '../types';
import { WEEKLY_CATALOG as FALLBACK_DATA } from '../constants';

const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7Oh80BAHGpWxo7UKAUpuXTYYgX4yR_FKI8pVfT9763Eu_o2CWROKXmOPJidQhzwk3R4eOn9ncw-6V/pub?output=csv';

const transformDriveUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  let fileId = '';
  if (url.includes('drive.google.com')) {
    const driveRegex = /\/d\/([a-zA-Z0-9_-]{25,})|id=([a-zA-Z0-9_-]{25,})/;
    const match = url.match(driveRegex);
    if (match) fileId = match[1] || match[2];
  } 
  else if (url.includes('googleusercontent.com')) {
    const parts = url.split('/');
    const possibleId = parts[parts.length - 1].split(/[?#]/)[0];
    if (possibleId.length > 20) fileId = possibleId;
  }
  return fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : url;
};

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
    const response = await fetch(`${sheetUrl}${sheetUrl.includes('?') ? '&' : '?'}cb=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    
    if (!response.ok) throw new Error('Error de conexión con Google Sheets');
    
    const csvText = await response.text();
    const rows = csvText.split(/\r?\n/).map(r => r.trim()).filter(r => r.length > 0);
    
    if (rows.length <= 1) return FALLBACK_DATA;

    // Mapeo dinámico de cabeceras
    const headers = parseCSVLine(rows[0]).map(h => h.toLowerCase().trim());
    const getCol = (name: string, row: string[]) => {
      const idx = headers.findIndex(h => h.includes(name.toLowerCase()));
      return idx !== -1 ? row[idx] : '';
    };

    const dataRows = rows.slice(1);
    const parsedProducts: Product[] = dataRows.map((rowText, index) => {
      const col = parseCSVLine(rowText);
      return {
        id: getCol('id', col) || `item-${index}`,
        name: getCol('nombre', col) || getCol('name', col) || '',
        category: getCol('categoría', col) || getCol('category', col) || 'General',
        price: parseFloat(getCol('precio', col)?.replace(',', '.') || '0') || 0,
        unit: getCol('unidad', col) || getCol('unit', col) || 'ud',
        description: getCol('descripción', col) || getCol('description', col) || '',
        imageUrl: transformDriveUrl(getCol('imagen', col) || getCol('image', col) || ''),
        origin: getCol('origen', col) || getCol('origin', col) || 'Nacional',
        benefits: getCol('beneficios', col) ? getCol('beneficios', col).split('|').map(b => b.trim()) : [],
        specs: {
          format: getCol('formato', col) || 'Estándar',
          shelfLife: getCol('vida útil', col) || getCol('caducidad', col) || 'Consultar',
          storage: getCol('conservación', col) || 'Ambiente'
        }
      };
    });

    return parsedProducts.filter(p => p.name.length > 0);
  } catch (error) {
    console.error('Error cargando datos:', error);
    return FALLBACK_DATA;
  }
};
