
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

const parseCSV = (text: string): string[][] => {
  const firstLineEnd = text.indexOf('\n');
  const firstLine = firstLineEnd === -1 ? text : text.slice(0, firstLineEnd);
  const delimiter = firstLine.includes(';') ? ';' : ',';

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentVal.trim());
      if (currentRow.some(val => val !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  currentRow.push(currentVal.trim());
  if (currentRow.some(val => val !== '')) {
    rows.push(currentRow);
  }

  return rows;
};

export const fetchWeeklyCatalog = async (sheetUrl: string = DEFAULT_SHEET_URL): Promise<Product[]> => {
  try {
    const response = await fetch(`${sheetUrl}${sheetUrl.includes('?') ? '&' : '?'}cb=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    
    if (!response.ok) throw new Error('Error de conexión con Google Sheets');
    
    const csvText = await response.text();
    const rows = parseCSV(csvText);
    
    if (rows.length <= 1) return FALLBACK_DATA.map(p => ({ ...p, tags: [] }));

    const dataRows = rows.slice(1);
    const parsedProducts: Product[] = dataRows.map((col, index) => {
      
      const rawTags = col[12] || '';
      const tags = rawTags
        .split(/[|/,]/)
        .map(t => t.trim()
          .toUpperCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") 
        )
        .filter(t => t.length > 0);

      return {
        id: col[0] || `item-${index}`,
        name: col[1] || '',
        category: col[2] || 'General',
        price: parseFloat(col[3]?.replace(',', '.') || '0') || 0,
        unit: col[4] || 'ud',
        description: col[5] || '',
        imageUrl: transformDriveUrl(col[6] || ''),
        origin: col[7] || '', 
        benefits: col[8] ? col[8].split('|').map(b => b.trim()) : [],
        tags: tags,
        specs: {
          format: col[9] || 'Estándar',
          unitsPerFormat: col[10] || '', // CAMBIO CLAVE: Mantener como string para soportar "12-14"
          storage: col[11] || 'Ambiente'
        }
      };
    });

    return parsedProducts.filter(p => p.name.length > 0);
    
  } catch (error) {
    console.error('Error cargando datos:', error);
    return FALLBACK_DATA.map(p => ({ ...p, tags: [] }));
  }
};
