
import React, { useState, useEffect } from 'react';
import { Product } from '../types';

interface Props { product: Product; }

export const CostCalculator: React.FC<Props> = ({ product }) => {
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
                   product.unit.toLowerCase().includes('lata');
  
  const [formatWeight, setFormatWeight] = useState<number>(extractFormatWeight(product.specs.format));
  const [portionSize, setPortionSize] = useState<number>(150); 
  const [wastePercentage, setWastePercentage] = useState<number>(0); 
  const [markup, setMarkup] = useState<number>(3.5);
  const [extraCost, setExtraCost] = useState<number>(0);

  useEffect(() => {
    setFormatWeight(extractFormatWeight(product.specs.format));
  }, [product]);

  // Si es por unidad, el precio/kg real depende del peso de la pieza que establezca el usuario
  const pricePerKg = isByUnit ? (product.price / (formatWeight || 1)) : product.price;
  const costPerGramRaw = pricePerKg / 1000;
  const yieldFactor = 1 - (wastePercentage / 100);
  const costPerGramNet = costPerGramRaw / (yieldFactor || 1);
  
  const mainIngredientCost = costPerGramNet * portionSize;
  const totalFoodCost = mainIngredientCost + extraCost;
  const suggestedPVP = totalFoodCost * markup;
  const suggestedPVPWithIVA = suggestedPVP * 1.10; // 10% IVA HORECA
  const marginPercentage = suggestedPVP > 0 ? ((suggestedPVP - totalFoodCost) / suggestedPVP) * 100 : 0;

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
      </div>

      {/* 1. Peso del Formato (Solo si es por unidad/pieza) - COMPACTO */}
      {isByUnit && (
        <div className="bg-amber-50/30 p-4 rounded-[1.5rem] border border-amber-100/50 shadow-sm animate-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-3">
            <div>
              <label className="block text-[8px] font-black text-amber-800 uppercase tracking-widest mb-0.5">Peso de la pieza</label>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-amber-900 leading-none tabular-nums">{formatWeight.toFixed(2)}</span>
                <span className="text-[9px] font-bold text-amber-700 uppercase">kg</span>
              </div>
            </div>
            <p className="text-[8px] text-amber-600/70 font-bold uppercase text-right leading-tight max-w-[100px]">Ajusta según recepción real</p>
          </div>
          <input 
            type="range" min="0.1" max="10" step="0.1"
            value={formatWeight} 
            onChange={(e) => setFormatWeight(parseFloat(e.target.value))}
            className={`${sliderBaseClass} accent-amber-500 bg-amber-100/50`}
          />
        </div>
      )}

      {/* 2. Control Ingrediente Principal - Compacto */}
      <div className="bg-white p-5 rounded-[1.5rem] border border-stone-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <label className="block text-[8px] font-black text-stone-500 uppercase tracking-widest mb-0.5">Ración base</label>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-stone-900 leading-none tabular-nums">{portionSize}</span>
              <span className="text-[10px] font-bold text-stone-400 uppercase">gr</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPortionSize(prev => Math.max(0, prev - 10))} className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-700 active:scale-90 transition-all shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4"/></svg>
            </button>
            <button onClick={() => setPortionSize(prev => Math.min(1000, prev + 10))} className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-700 active:scale-90 transition-all shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
            </button>
          </div>
        </div>
        <input 
          type="range" min="0" max="500" step="5"
          value={portionSize} 
          onChange={(e) => setPortionSize(parseInt(e.target.value))}
          className={`${sliderBaseClass} accent-sky-600`}
        />
        
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
      </div>

      {/* 3. COSTES COMPLEMENTARIOS - Compacto */}
      <div className="bg-sky-50/40 p-5 rounded-[1.5rem] border border-sky-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <label className="block text-[8px] font-black text-sky-900 uppercase tracking-widest mb-0.5">Cargas Extras</label>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-sky-800 leading-none tabular-nums">+{extraCost.toFixed(2)}</span>
              <span className="text-[10px] font-bold text-sky-600 uppercase">€</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-100/50 flex items-center justify-center border border-sky-100 shadow-inner">
            <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        </div>
        <input 
          type="range" min="0" max="10" step="0.10"
          value={extraCost} 
          onChange={(e) => setExtraCost(parseFloat(e.target.value))}
          className={`${sliderBaseClass} accent-sky-500 bg-sky-100`}
        />
      </div>

      {/* 4. RESULTADOS - CON IVA DEL 10% INCLUIDO */}
      <div className="bg-stone-100/80 p-6 rounded-[2rem] space-y-6 relative overflow-hidden border border-stone-200 shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-[60px] rounded-full -mr-16 -mt-16"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
            <label className="text-[8px] font-black text-stone-500 uppercase tracking-[0.2em]">Mark-up</label>
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
            <p className="text-[7px] sm:text-[8px] text-stone-400 uppercase font-black mb-2 tracking-widest">FOOD COST</p>
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
      <p className="text-center text-[8px] text-stone-400 font-bold uppercase tracking-[0.1em] opacity-40">
        Escandallo Técnico para uso en cocina (IVA 10% Sugerido)
      </p>
    </div>
  );
};
