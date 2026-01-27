
import React, { useState, useEffect } from 'react';
import { Product, RecipeSuggestion } from '../types';
import { CostCalculator } from './CostCalculator';
import { getChefInspiration, CulinaryStyle } from '../services/geminiService';

interface Props {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (p: Product) => void;
}

export const ProductModal: React.FC<Props> = ({ product, onClose, onAddToCart }) => {
  const [recipe, setRecipe] = useState<RecipeSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'calc' | 'recipe'>('info');
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (product) {
      setRecipe(null);
      setActiveTab('info');
      setJustAdded(false);
    }
  }, [product]);

  if (!product) return null;

  const getFormatWeight = (fmt: string): number => {
    const match = fmt.match(/(\d+(?:[.,]\d+)?)\s*(kg|gr|g|l|mls|ml)/i);
    if (!match) return 1;
    let val = parseFloat(match[1].replace(',', '.'));
    const unit = match[2].toLowerCase();
    if (unit === 'g' || unit === 'gr' || unit === 'ml' || unit === 'mls') return val / 1000;
    return val;
  };

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

  const unitsDisplay = product.specs.unitsPerFormat?.toString() || '';
  const numericUnitsForCalc = getNumericUnits(unitsDisplay);
  
  const isWeightPrice = product.unit.toLowerCase().includes('kg') || product.unit.toLowerCase().includes('l');
  const formatWeight = getFormatWeight(product.specs.format);
  const pricePerFormat = isWeightPrice ? (product.price * formatWeight) : product.price;
  const unitPrice = numericUnitsForCalc > 0 ? (pricePerFormat / numericUnitsForCalc) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="bg-white w-full max-w-5xl h-[92vh] sm:h-auto sm:max-h-[90vh] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col sm:flex-row relative z-10">
        <div className="w-full sm:w-[40%] bg-stone-100 h-[180px] sm:h-auto shrink-0 border-r border-stone-100">
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        </div>
        <div className="w-full sm:w-[60%] flex flex-col bg-white overflow-hidden">
          <div className="px-6 pt-6 pb-4 sm:px-10 sm:pt-10 border-b border-stone-50">
            <span className="text-[11px] font-black text-sky-700 uppercase tracking-widest mb-1 block">{product.category}</span>
            <h2 className="text-2xl sm:text-3xl font-serif text-stone-900 leading-none uppercase">{product.name}</h2>
          </div>
          <div className="flex w-full bg-white border-b border-stone-100">
            {['info', 'calc', 'recipe'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 ${activeTab === tab ? 'border-sky-600 text-stone-900 bg-sky-50/20' : 'border-transparent text-stone-500'}`}>
                {tab === 'info' ? 'FICHA' : tab === 'calc' ? 'ESCANDALLO' : 'CHEF IA'}
              </button>
            ))}
          </div>
          <div className="flex-grow overflow-y-auto p-5 sm:p-10">
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div className="bg-stone-50 p-6 rounded-3xl border-l-8 border-sky-500">
                  <p className="text-stone-800 text-sm font-semibold italic">"{product.description}"</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-stone-100">
                    <p className="text-[8px] text-stone-500 uppercase font-black mb-2">Formato</p>
                    <p className="text-[13px] font-extrabold text-stone-900">{product.specs.format}</p>
                  </div>
                  {unitsDisplay && (
                    <div className="bg-sky-50/50 p-5 rounded-2xl border border-sky-100">
                      <p className="text-[8px] text-sky-600 uppercase font-black mb-2">Unid. Estimadas (Media)</p>
                      <p className="text-[13px] font-extrabold text-stone-900">{unitsDisplay} ud</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'calc' && <CostCalculator product={product} />}
          </div>
          <div className="px-6 py-4 sm:px-10 sm:py-8 border-t border-stone-100 bg-white flex items-center justify-between">
            <div>
              <p className="text-[8px] font-black text-stone-400 uppercase mb-1">PRECIO / RACIÓN</p>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-black text-stone-900">{product.price.toFixed(2)}€</span>
                {unitPrice && <span className="text-lg font-black text-sky-600">{unitPrice.toFixed(2)}€ / ud</span>}
              </div>
            </div>
            <button onClick={() => {onAddToCart(product); setJustAdded(true); setTimeout(()=>setJustAdded(false), 2000);}} className={`${justAdded ? 'bg-stone-900' : 'bg-sky-600'} text-white px-8 py-4 rounded-xl font-black text-[12px] uppercase shadow-xl transition-all`}>
              {justAdded ? 'Añadido' : 'Añadir'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
