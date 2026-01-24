
import React, { useState, useEffect } from 'react';
import { Product } from '../types';

interface Props { product: Product; }

export const CostCalculator: React.FC<Props> = ({ product }) => {
  // Función para extraer la media de un rango (ej: "12/14" -> 13) o un número simple
  const extractAverageUnits = (prod: Product): number => {
    // Buscamos en el nombre y en el formato para máxima precisión
    const searchString = `${prod.name} ${prod.specs.format}`;
    
    // 1. Prioridad: Rango de calibre tipo "12/14", "12-14" o "12 a 14"
    const rangeMatch = searchString.match(/(\d+)\s*[\/\-a]\s*(\d+)/i);
    if (rangeMatch) {
      return (parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2;
    }
    
    // 2. Formato con unidades explícitas "15 uds", "10 lomos", etc.
    const singleMatch = searchString.match(/(\d+)\s*(uds|unidades|piezas|lomos|unid)/i);
    if (singleMatch) return parseInt(singleMatch[1]);
    
    // 3. Fallback al campo numérico directo si existe
    return prod.specs.unitsPerFormat || 0;
  };

  const extractFormatWeight = (spec: string) => {
    const match = spec.match(/(\d+(?:[.,]\d+)?)\s*(g|kg)/i);
    if (match) {
      let val = parseFloat(match[1].replace(',', '.'));
      return match[2].toLowerCase() === 'g' ? val / 1000 : val;
    }
    return 1; 
  };

  const isByUnit = product.unit.toLowerCase().includes('ud') || 
                   product.unit.toLowerCase().includes('piez') || 
                   product.unit.toLowerCase().includes('unid') ||
                   product.unit.toLowerCase().includes('lata') ||
                   product.unit.toLowerCase().includes('bote') ||
                   product.unit.toLowerCase().includes('frasco') ||
                   product.unit.toLowerCase().includes('envase') ||
                   product.unit.toLowerCase().includes('caja') ||
                   product.unit.toLowerCase().includes('pack');
  
  const avgUnits = extractAverageUnits(product);
  const fixedFormatWeight = extractFormatWeight(product.specs.format);
  
  const [calcMode, setCalcMode] = useState<'weight' | 'units'>(avgUnits > 1 ? 'units' : 'weight');
  const [portionSize, setPortionSize] = useState<number>(150); 
  const [portionUnits, setPortionUnits] = useState<number>(1);
  const [wastePercentage, setWastePercentage] = useState<number>(0); 
  const [markup, setMarkup] = useState<number>(3.5);
  const [extraCost, setExtraCost] = useState<number>(0);
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    if (avgUnits > 1) {
      setCalcMode('units');
    } else {
      setCalcMode('weight');
      if (isByUnit) {
        setPortionSize(Math.min(1000, Math.round(fixedFormatWeight * 1000)));
      }
    }
  }, [product, avgUnits, isByUnit, fixedFormatWeight]);

  const pricePerKg = isByUnit ? (product.price / (fixedFormatWeight || 1)) : product.price;
  const costPerGramRaw = pricePerKg / 1000;
  const yieldFactor = 1 - (wastePercentage / 100);
  const costPerGramNet = costPerGramRaw / (yieldFactor || 1);
  
  const costPerUnit = avgUnits > 0 ? (product.price / avgUnits) : 0;

  const mainIngredientCost = calcMode === 'units' 
    ? (costPerUnit * portionUnits) 
    : (costPerGramNet * portionSize);

  const totalFoodCost = mainIngredientCost + extraCost;
  const suggestedPVP = totalFoodCost * markup;
  const suggestedPVPWithIVA = suggestedPVP * 1.10; 
  const marginPercentage = suggestedPVP > 0 ? ((suggestedPVP - totalFoodCost) / suggestedPVP) * 100 : 0;

  const copySummary = () => {
    const racionStr = calcMode === 'units' ? `${portionUnits} unidades` : `${portionSize}g`;
    const summary = `ESCANDALLO: ${product.name}
---------------------------
Ración: ${racionStr}
Merma: ${calcMode === 'weight' ? wastePercentage + '%' : 'N/A (por unidad)'}
Cargas extra: ${extraCost.toFixed(2)}€
---------------------------
COSTE PLATO: ${totalFoodCost.toFixed(2)}€
MARGEN: ${marginPercentage.toFixed(0)}%
PVP SUGERIDO (c/ IVA): ${suggestedPVPWithIVA.toFixed(2)}€`;

    navigator.clipboard.writeText(summary);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const getMarginColorClass = (margin: number) => {
    if (margin >= 70) return 'text-sky-600';
    if (margin >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const sliderBaseClass = "w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer touch-none transition-all";

  return (
    <div className="space-y-4 animate-in fade-in duration-300 select-none pb-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[9px] font-black text-stone-600 uppercase tracking-[0.25em]">
          CONFIGURACIÓN DE ESCANDALLO
        </h3>
        <button 
          onClick={copySummary}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
            copyFeedback ? 'bg-green-500 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
          }`}
        >
          {copyFeedback ? '¡Copiado!' : 'Copiar Resumen'}
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
        </button>
      </div>

      {avgUnits > 1 && (
        <div className="flex bg-stone-100 p-1 rounded-xl gap-1">
          <button 
            onClick={() => setCalcMode('units')}
            className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${calcMode === 'units' ? 'bg-white text-sky-600 shadow-sm' : 'text-stone-400'}`}
          >
            Por Unidades ({avgUnits} media)
          </button>
          <button 
            onClick={() => setCalcMode('weight')}
            className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${calcMode === 'weight' ? 'bg-white text-sky-600 shadow-sm' : 'text-stone-400'}`}
          >
            Por Peso (gramos)
          </button>
        </div>
      )}

      <div className="bg-white p-5 rounded-[1.5rem] border border-stone-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <label className="block text-[8px] font-black text-stone-500 uppercase tracking-widest mb-0.5">
              {calcMode === 'units' ? 'Unidades en plato' : 'Ración base'}
            </label>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-stone-900 leading-none tabular-nums">
                {calcMode === 'units' ? portionUnits : portionSize}
              </span>
              <span className="text-[10px] font-bold text-stone-400 uppercase">
                {calcMode === 'units' ? 'uds' : 'gr'}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => calcMode === 'units' ? setPortionUnits(p => Math.max(1, p - 1)) : setPortionSize(prev => Math.max(0, prev - 5))} 
              className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-700 active:scale-90 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4"/></svg>
            </button>
            <button 
              onClick={() => calcMode === 'units' ? setPortionUnits(p => Math.min(avgUnits, p + 1)) : setPortionSize(prev => Math.min(1000, prev + 5))} 
              className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-700 active:scale-90 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
            </button>
          </div>
        </div>
        
        <input 
          type="range" 
          min={calcMode === 'units' ? "1" : "0"} 
          max={calcMode === 'units' ? avgUnits.toString() : "1000"} 
          step={calcMode === 'units' ? "1" : "5"}
          value={calcMode === 'units' ? portionUnits : portionSize} 
          onChange={(e) => calcMode === 'units' ? setPortionUnits(parseInt(e.target.value)) : setPortionSize(parseInt(e.target.value))}
          className={`${sliderBaseClass} accent-sky-600`}
        />
        
        {calcMode === 'weight' && (
          <div className="mt-5 pt-4 border-t border-stone-50 flex items-center justify-between">
            <div>
              <span className="block text-[8px] font-black text-stone-600 uppercase tracking-widest">Merma: {wastePercentage}%</span>
            </div>
            <input 
              type="range" min="0" max="60" step="1"
              value={wastePercentage} 
              onChange={(e) => setWastePercentage(parseInt(e.target.value))}
              className="w-32 h-1 bg-stone-100 accent-red-400"
            />
          </div>
        )}

        {calcMode === 'units' && (
          <div className="mt-4 pt-4 border-t border-stone-50">
             <p className="text-[10px] text-stone-400 font-bold italic">
               Coste unitario (media {avgUnits}): <span className="text-stone-700 font-black">{costPerUnit.toFixed(2)}€ / ud</span>
             </p>
          </div>
        )}
      </div>

      <div className="bg-sky-50/40 p-5 rounded-[1.5rem] border border-sky-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <label className="block text-[8px] font-black text-sky-900 uppercase tracking-widest mb-0.5">Cargas Extras</label>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-sky-800 leading-none tabular-nums">+{extraCost.toFixed(2)}</span>
              <span className="text-[10px] font-bold text-sky-600 uppercase">€</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setExtraCost(prev => Math.max(0, prev - 0.10))} 
              className="w-10 h-10 rounded-xl bg-sky-100/50 border border-sky-200 flex items-center justify-center text-sky-600 active:scale-90 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4"/></svg>
            </button>
            <button 
              onClick={() => setExtraCost(prev => Math.min(10, prev + 0.10))} 
              className="w-10 h-10 rounded-xl bg-sky-100/50 border border-sky-200 flex items-center justify-center text-sky-600 active:scale-90 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
            </button>
          </div>
        </div>
        <input 
          type="range" min="0" max="10" step="0.10"
          value={extraCost} 
          onChange={(e) => setExtraCost(parseFloat(e.target.value))}
          className={`${sliderBaseClass} accent-sky-500 bg-sky-100`}
        />
      </div>

      <div className="bg-stone-100/80 p-6 rounded-[2rem] space-y-6 relative overflow-hidden border border-stone-200 shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-[60px] rounded-full -mr-16 -mt-16"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
            <label className="text-[8px] font-black text-stone-500 uppercase tracking-[0.2em]">Multiplicador de Negocio</label>
            <span className="text-[10px] font-black text-stone-700 bg-white px-2.5 py-1 rounded-lg tabular-nums border border-stone-200">x{markup.toFixed(1)}</span>
          </div>
          <input 
            type="range" min="1.5" max="6" step="0.1"
            value={markup} 
            onChange={(e) => setMarkup(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-700 touch-none"
          />
        </div>

        <div className="grid grid-cols-4 gap-1 relative z-10 border-t border-stone-200 pt-6">
          <div className="flex flex-col">
            <p className="text-[7px] sm:text-[8px] text-stone-400 uppercase font-black mb-2 tracking-widest">COSTE PLATO</p>
            <p className="text-lg sm:text-xl font-black text-stone-800 tabular-nums leading-none tracking-tight">{totalFoodCost.toFixed(2)}€</p>
          </div>
          <div className="text-center border-x border-stone-200 flex flex-col items-center justify-center px-1">
            <p className="text-[7px] sm:text-[8px] text-stone-400 uppercase font-black mb-2 tracking-widest">MARGEN</p>
            <p className={`text-lg sm:text-xl font-black tabular-nums leading-none ${getMarginColorClass(marginPercentage)}`}>
              {marginPercentage.toFixed(0)}%
            </p>
          </div>
          <div className="text-center flex flex-col items-center border-r border-stone-200 pr-1">
            <p className="text-[7px] sm:text-[8px] text-stone-500 uppercase font-black mb-2 tracking-widest">PVP BASE</p>
            <p className="text-lg sm:text-xl font-black text-stone-700 tracking-tight tabular-nums leading-none">{suggestedPVP.toFixed(2)}€</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <p className="text-[7px] sm:text-[8px] text-sky-700 uppercase font-black mb-2 tracking-widest">PVP (+IVA)</p>
            <p className="text-xl sm:text-2xl font-black text-sky-700 tracking-tighter tabular-nums leading-none">{suggestedPVPWithIVA.toFixed(2)}€</p>
          </div>
        </div>
      </div>
    </div>
  );
};
