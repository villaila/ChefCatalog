
import React, { useState, useEffect } from 'react';
import { Product } from '../types';

interface Props { product: Product; }

export const CostCalculator: React.FC<Props> = ({ product }) => {
  const getNumericUnits = (val: string | number): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const rangeMatch = val.match(/(\d+(?:[.,]\d+)?)\s*(?:-|a|to)\s*(\d+(?:[.,]\d+)?)/i);
    if (rangeMatch) {
      const start = parseFloat(rangeMatch[1].replace(',', '.'));
      const end = parseFloat(rangeMatch[2].replace(',', '.'));
      return (start + end) / 2;
    }
    const match = val.match(/(\d+(?:[.,]\d+)?)/);
    return match ? parseFloat(match[1].replace(',', '.')) : 0;
  };

  const avgUnits = getNumericUnits(product.specs.unitsPerFormat || 0);

  const getFormatWeight = (fmt: string): number => {
    const match = fmt.match(/(\d+(?:[.,]\d+)?)\s*(kg|gr|g|l|mls|ml)/i);
    if (!match) return 1;
    let val = parseFloat(match[1].replace(',', '.'));
    const unit = match[2].toLowerCase();
    if (unit === 'g' || unit === 'gr' || unit === 'ml' || unit === 'mls') return val / 1000;
    return val;
  };

  const fixedFormatWeight = getFormatWeight(product.specs.format);
  
  const [calcMode, setCalcMode] = useState<'weight' | 'units'>(avgUnits > 0 ? 'units' : 'weight');
  const [portionSize, setPortionSize] = useState<number>(150); 
  const [portionUnits, setPortionUnits] = useState<number>(1);
  const [wastePercentage, setWastePercentage] = useState<number>(0); 
  const [markup, setMarkup] = useState<number>(3.5);
  const [extraCost, setExtraCost] = useState<number>(0);
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    if (avgUnits > 0) {
      setCalcMode('units');
    } else {
      setCalcMode('weight');
      setPortionSize(Math.min(1000, Math.round(fixedFormatWeight * 1000 / 4) || 150));
    }
  }, [product, avgUnits, fixedFormatWeight]);

  const isWeightPrice = product.unit.toLowerCase().includes('kg') || product.unit.toLowerCase().includes('l');
  
  const pricePerKg = isWeightPrice ? product.price : (product.price / (fixedFormatWeight || 1));
  const costPerGramRaw = pricePerKg / 1000;
  const yieldFactor = 1 - (wastePercentage / 100);
  const costPerGramNet = costPerGramRaw / (yieldFactor || 1);
  
  const pricePerFormat = isWeightPrice ? (product.price * fixedFormatWeight) : product.price;
  const costPerUnit = avgUnits > 0 ? (pricePerFormat / avgUnits) : 0;

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
Media por formato: ${avgUnits} uds
COSTE PLATO: ${totalFoodCost.toFixed(2)}€
MARGEN: ${marginPercentage.toFixed(0)}%
PVP SUGERIDO (c/ IVA): ${suggestedPVPWithIVA.toFixed(2)}€`;

    navigator.clipboard.writeText(summary);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 select-none pb-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[9px] font-black text-stone-600 uppercase tracking-[0.25em]">ESCANDALLO (Media: {avgUnits} uds)</h3>
        <button onClick={copySummary} className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${copyFeedback ? 'bg-green-500 text-white' : 'bg-stone-100 text-stone-500'}`}>
          {copyFeedback ? '¡Copiado!' : 'Copiar'}
        </button>
      </div>

      {avgUnits > 0 && (
        <div className="flex bg-stone-100 p-1 rounded-xl gap-1">
          <button onClick={() => setCalcMode('units')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${calcMode === 'units' ? 'bg-white text-sky-600 shadow-sm' : 'text-stone-400'}`}>Unidades</button>
          <button onClick={() => setCalcMode('weight')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${calcMode === 'weight' ? 'bg-white text-sky-600 shadow-sm' : 'text-stone-400'}`}>Peso</button>
        </div>
      )}

      <div className="bg-white p-5 rounded-[1.5rem] border border-stone-100">
        <div className="flex justify-between items-center mb-4">
          <div>
            <label className="block text-[8px] font-black text-stone-500 uppercase tracking-widest mb-0.5">
              {calcMode === 'units' ? 'Unidades en plato' : 'Ración base'}
            </label>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-stone-900 leading-none tabular-nums">{calcMode === 'units' ? portionUnits : portionSize}</span>
              <span className="text-[10px] font-bold text-stone-400 uppercase">{calcMode === 'units' ? 'uds' : 'gr'}</span>
            </div>
          </div>
        </div>
        <input type="range" min={calcMode === 'units' ? "1" : "0"} max={calcMode === 'units' ? Math.max(1, Math.ceil(avgUnits * 2)).toString() : "1000"} step={calcMode === 'units' ? "1" : "5"} value={calcMode === 'units' ? portionUnits : portionSize} onChange={(e) => calcMode === 'units' ? setPortionUnits(parseInt(e.target.value)) : setPortionSize(parseInt(e.target.value))} className="w-full accent-sky-600" />
      </div>

      <div className="bg-stone-100/80 p-6 rounded-[2rem] space-y-4 border border-stone-200">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[7px] text-stone-400 uppercase font-black mb-1">COSTE PLATO</p>
            <p className="text-xl font-black text-stone-800 tabular-nums">{totalFoodCost.toFixed(2)}€</p>
          </div>
          <div className="text-right">
            <p className="text-[7px] text-sky-700 uppercase font-black mb-1">PVP (+IVA)</p>
            <p className="text-2xl font-black text-sky-700 tabular-nums">{suggestedPVPWithIVA.toFixed(2)}€</p>
          </div>
        </div>
      </div>
    </div>
  );
};
