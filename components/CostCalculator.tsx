
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
      const defaultWeight = Math.min(1000, Math.round(fixedFormatWeight * 1000 / 4) || 150);
      setPortionSize(defaultWeight);
    }
  }, [product, avgUnits, fixedFormatWeight]);

  const isWeightPrice = product.unit.toLowerCase().includes('kg') || product.unit.toLowerCase().includes('l');
  const pricePerKg = isWeightPrice ? product.price : (product.price / (fixedFormatWeight || 1));
  const costPerGramRaw = pricePerKg / 1000;
  const yieldFactor = 1 - (wastePercentage / 100);
  const costPerGramNet = costPerGramRaw / (yieldFactor || 1);
  const pricePerFormat = isWeightPrice ? (product.price * fixedFormatWeight) : product.price;
  const costPerUnit = avgUnits > 0 ? (pricePerFormat / avgUnits) : 0;
  const costPerUnitNet = costPerUnit / (yieldFactor || 1);

  const mainIngredientCost = calcMode === 'units' 
    ? (costPerUnitNet * portionUnits) 
    : (costPerGramNet * portionSize);

  const totalFoodCost = mainIngredientCost + extraCost;
  const suggestedPVP = totalFoodCost * markup;
  const suggestedPVPWithIVA = suggestedPVP * 1.10; 
  const marginPercentage = suggestedPVP > 0 ? ((suggestedPVP - totalFoodCost) / suggestedPVP) * 100 : 0;

  const copySummary = () => {
    const summary = `ESCANDALLO: ${product.name}\nCoste: ${totalFoodCost.toFixed(2)}€\nMargen: ${marginPercentage.toFixed(0)}%\nPVP: ${suggestedPVPWithIVA.toFixed(2)}€`;
    navigator.clipboard.writeText(summary);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 max-w-lg mx-auto pb-6">
      
      {/* HEADER CONFIGURACIÓN */}
      <div className="flex items-center justify-between px-2 mb-2">
        <h3 className="text-[10px] font-black text-stone-500 uppercase tracking-[0.15em]">Configuración de Escandallo</h3>
        <button 
          onClick={copySummary}
          className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
        >
          {copyFeedback ? '¡Copiado!' : 'Copiar Resumen'}
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
        </button>
      </div>

      {/* SELECTOR MODO (UNIDADES / PESO) */}
      {avgUnits > 0 && (
        <div className="bg-stone-100 p-1 rounded-2xl flex mb-4">
          <button 
            onClick={() => setCalcMode('units')} 
            className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${calcMode === 'units' ? 'bg-white text-sky-600 shadow-sm' : 'text-stone-400'}`}
          >
            Por Unidades ({avgUnits} Media)
          </button>
          <button 
            onClick={() => setCalcMode('weight')} 
            className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${calcMode === 'weight' ? 'bg-white text-sky-600 shadow-sm' : 'text-stone-400'}`}
          >
            Por Peso (Gramos)
          </button>
        </div>
      )}

      {/* SECCIÓN 1: RACIÓN Y MERMA */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-stone-100 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] space-y-6">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1">Ración Base</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-stone-900 tabular-nums">
                  {calcMode === 'units' ? portionUnits : portionSize}
                </span>
                <span className="text-xs font-bold text-stone-400 uppercase">
                  {calcMode === 'units' ? 'un' : 'gr'}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => calcMode === 'units' ? setPortionUnits(u => Math.max(1, u-1)) : setPortionSize(s => Math.max(0, s-5))}
                className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-stone-900 border border-stone-100 active:scale-90 transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4"/></svg>
              </button>
              <button 
                onClick={() => calcMode === 'units' ? setPortionUnits(u => u+1) : setPortionSize(s => s+5)}
                className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-stone-900 border border-stone-100 active:scale-90 transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
              </button>
            </div>
          </div>
          <input 
            type="range" min={calcMode === 'units' ? "1" : "5"} max={calcMode === 'units' ? "20" : "1000"} step={calcMode === 'units' ? "1" : "5"}
            value={calcMode === 'units' ? portionUnits : portionSize}
            onChange={(e) => calcMode === 'units' ? setPortionUnits(parseInt(e.target.value)) : setPortionSize(parseInt(e.target.value))}
            className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-[#00AEEF]"
          />
        </div>

        <div className="pt-4 border-t border-stone-50">
          <div className="flex justify-between mb-3">
            <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Merma: {wastePercentage}%</span>
          </div>
          <input 
            type="range" min="0" max="70" step="1"
            value={wastePercentage}
            onChange={(e) => setWastePercentage(parseInt(e.target.value))}
            className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-[#E31E24]"
          />
        </div>
      </div>

      {/* SECCIÓN 2: CARGAS EXTRAS */}
      <div className="bg-sky-50/30 p-6 rounded-[2.5rem] border border-sky-100 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1">Cargas Extras</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-stone-900 tabular-nums">+{extraCost.toFixed(2)}</span>
              <span className="text-xs font-bold text-sky-600 uppercase">€</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setExtraCost(c => Math.max(0, c - 0.1))}
              className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-stone-900 border border-sky-100 active:scale-90 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4"/></svg>
            </button>
            <button 
              onClick={() => setExtraCost(c => c + 0.1)}
              className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-stone-900 border border-sky-100 active:scale-90 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
            </button>
          </div>
        </div>
        <input 
          type="range" min="0" max="10" step="0.05"
          value={extraCost}
          onChange={(e) => setExtraCost(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-sky-100 rounded-lg appearance-none cursor-pointer accent-[#00AEEF]"
        />
      </div>

      {/* SECCIÓN 3: RESULTADOS Y MULTIPLICADOR */}
      <div className="bg-stone-50 p-8 rounded-[2.5rem] border border-stone-200 shadow-inner">
        <div className="flex justify-between items-center mb-6">
          <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Multiplicador de Negocio</p>
          <span className="px-3 py-1 bg-white border border-stone-200 rounded-lg text-xs font-black text-stone-900 shadow-sm">x{markup.toFixed(1)}</span>
        </div>
        
        <input 
          type="range" min="1.5" max="6" step="0.1"
          value={markup}
          onChange={(e) => setMarkup(parseFloat(e.target.value))}
          className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-700 mb-10"
        />

        <div className="grid grid-cols-4 gap-2 pt-6 border-t border-stone-200">
          <div className="text-center">
            <p className="text-[7px] font-black text-stone-400 uppercase mb-1 tracking-tighter">Coste Plato</p>
            <p className="text-sm font-black text-stone-900 tabular-nums">{totalFoodCost.toFixed(2)}€</p>
          </div>
          <div className="text-center border-l border-stone-200">
            <p className="text-[7px] font-black text-stone-400 uppercase mb-1 tracking-tighter">Margen</p>
            <p className="text-sm font-black text-[#00AEEF] tabular-nums">{marginPercentage.toFixed(0)}%</p>
          </div>
          <div className="text-center border-l border-stone-200">
            <p className="text-[7px] font-black text-stone-400 uppercase mb-1 tracking-tighter">PVP Base</p>
            <p className="text-sm font-black text-stone-900 tabular-nums">{suggestedPVP.toFixed(2)}€</p>
          </div>
          <div className="text-center border-l border-stone-200">
            <p className="text-[7px] font-black text-sky-600 uppercase mb-1 tracking-tighter">PVP (+IVA)</p>
            <p className="text-sm font-black text-[#00AEEF] tabular-nums">{suggestedPVPWithIVA.toFixed(2)}€</p>
          </div>
        </div>
      </div>
    </div>
  );
};
