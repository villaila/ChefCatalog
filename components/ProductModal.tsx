
import React, { useState, useEffect } from 'react';
import { Product, RecipeSuggestion } from '../types';
import { CostCalculator } from './CostCalculator';
import { getChefInspiration } from '../services/geminiService';

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

  const handleGetRecipe = async () => {
    if (!product) return;
    setLoading(true);
    try {
      const res = await getChefInspiration(product);
      setRecipe(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    if (product) {
      onAddToCart(product);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    }
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <div 
        className="bg-white w-full max-w-5xl h-[92vh] sm:h-auto sm:max-h-[90vh] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col sm:flex-row animate-in slide-in-from-bottom-full duration-500 relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Imagen Lateral (Escritorio) o Superior (Móvil) */}
        <div className="w-full sm:w-[40%] bg-stone-100 relative overflow-hidden h-[180px] sm:h-auto shrink-0 border-b sm:border-b-0 sm:border-r border-stone-100">
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover" 
          />
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 bg-white/95 backdrop-blur text-stone-900 rounded-full p-2.5 sm:hidden shadow-lg border border-stone-100 active:scale-90 transition-transform z-20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido Principal */}
        <div className="w-full sm:w-[60%] flex flex-col bg-white overflow-hidden">
          
          <div className="px-6 pt-6 pb-4 sm:px-10 sm:pt-10 sm:pb-6 border-b border-stone-50 shrink-0">
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0 flex-grow">
                <span className="text-[11px] font-black text-emerald-700 uppercase tracking-[0.2em] mb-1 block">
                  {product.category}
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif text-stone-900 leading-none uppercase tracking-tight truncate whitespace-nowrap" title={product.name}>
                  {product.name}
                </h2>
                <p className="text-stone-500 text-[10px] font-black uppercase tracking-widest italic mt-1.5">{product.origin}</p>
              </div>
              <button onClick={onClose} className="hidden sm:block text-stone-300 hover:text-stone-900 transition-colors shrink-0">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Selector de Pestañas */}
          <div className="flex w-full bg-white border-b border-stone-100 shrink-0">
            {[
              { id: 'info', label: 'FICHA TÉCNICA', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              { id: 'calc', label: 'ESCANDALLO', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2-2v14a2 2 0 002 2z' },
              { id: 'recipe', label: 'CHEF IA', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-4 px-1 text-[10px] font-black uppercase tracking-[0.05em] border-b-2 transition-all duration-300 ${
                  activeTab === tab.id 
                    ? 'border-emerald-600 text-stone-900 bg-emerald-50/20' 
                    : 'border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={tab.icon} />
                </svg>
                <span className="leading-none">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Contenido Desplazable */}
          <div className="flex-grow overflow-y-auto p-5 sm:p-10 bg-white">
            {activeTab === 'info' && (
              <div className="space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-stone-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-l-4 sm:border-l-8 border-emerald-500 shadow-sm">
                  <p className="text-stone-800 text-sm sm:text-[15px] leading-relaxed font-semibold italic">
                    "{product.description}"
                  </p>
                </div>
                
                <div>
                  <h4 className="text-[9px] sm:text-[11px] font-black text-stone-800 uppercase tracking-[0.25em] mb-4">ESPECIFICACIONES</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
                    {Object.entries(product.specs).map(([key, value]) => (
                      <div key={key} className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-stone-100 shadow-sm">
                        <p className="text-[8px] sm:text-[9px] text-stone-500 uppercase font-black tracking-widest mb-1 sm:mb-2.5">{key}</p>
                        <p className="text-[11px] sm:text-[13px] font-extrabold text-stone-900 uppercase leading-tight">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="text-[9px] sm:text-[11px] font-black text-stone-800 uppercase tracking-[0.25em] mb-4 flex items-center gap-3">
                    VALOR DIFERENCIAL
                    <span className="flex-grow h-[1px] bg-stone-100"></span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    {product.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-center gap-3 bg-stone-50/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-stone-100">
                        <div className="w-2 h-2 rounded-full bg-emerald-600 shadow-lg shadow-emerald-200 shrink-0"></div>
                        <span className="text-[10px] sm:text-[11px] font-black text-stone-800 uppercase tracking-tight">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'calc' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <CostCalculator product={product} />
              </div>
            )}

            {activeTab === 'recipe' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {!recipe && !loading ? (
                  <div className="text-center py-10 sm:py-16">
                    <button 
                      onClick={handleGetRecipe} 
                      className="w-full max-w-md bg-stone-100 text-stone-800 px-8 py-5 sm:px-10 sm:py-6 rounded-2xl sm:rounded-3xl font-black text-[11px] sm:text-[12px] uppercase tracking-[0.2em] sm:tracking-[0.25em] shadow-lg border border-stone-200 active:scale-95 transition-all mx-auto flex items-center justify-center gap-3 sm:gap-4 hover:bg-white"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                      Generar Receta Técnica IA
                    </button>
                    <p className="mt-4 text-[9px] text-stone-400 font-bold uppercase tracking-widest">Inspiración profesional basada en el mercado</p>
                  </div>
                ) : loading ? (
                  <div className="text-center py-16 sm:py-20">
                    <div className="w-12 h-12 sm:w-16 h-16 border-4 border-stone-50 border-t-emerald-600 rounded-full animate-spin mx-auto mb-6 sm:mb-8 shadow-sm"></div>
                    <p className="text-[10px] sm:text-[11px] font-black text-stone-400 uppercase tracking-[0.3em] animate-pulse">Consultando Red de Chefs...</p>
                  </div>
                ) : recipe && (
                  <div className="space-y-6 sm:space-y-8 pb-4">
                    <div className="bg-stone-50 p-6 sm:p-10 rounded-2xl sm:rounded-[2.5rem] shadow-sm relative overflow-hidden border border-stone-100">
                      <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 h-48 bg-emerald-500/5 blur-[60px] sm:blur-[100px] rounded-full -mr-16 sm:-mr-24 -mt-16 sm:-mt-24"></div>
                      <h4 className="font-serif text-2xl sm:text-3xl mb-2 sm:mb-3 relative z-10 leading-tight text-stone-900">{recipe.title}</h4>
                      <p className="text-[9px] sm:text-[11px] text-emerald-600 font-black uppercase tracking-[0.3em] relative z-10">Signature Dish Suggestion</p>
                    </div>
                    <div className="p-6 sm:p-8 bg-stone-50/50 rounded-2xl sm:rounded-3xl border border-stone-100">
                      <h5 className="text-[9px] sm:text-[11px] font-black text-stone-400 uppercase tracking-widest mb-3 sm:mb-4">Proceso de Elaboración</h5>
                      <p className="text-sm sm:text-base text-stone-800 leading-relaxed font-medium italic">"{recipe.method}"</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Fijo con Precio Actualizado */}
          <div className="px-6 py-4 sm:px-10 sm:py-8 border-t border-stone-100 bg-white shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.05)] flex items-center justify-between sticky bottom-0 z-40 shrink-0">
            <div>
              <p className="text-[8px] sm:text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1 sm:mb-1.5">PRECIO MERCADO</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tighter tabular-nums">{product.price.toFixed(2)}€</span>
                <span className="text-[10px] sm:text-[11px] font-bold text-stone-500 uppercase tracking-widest">/{product.unit}</span>
              </div>
            </div>
            <button 
              onClick={handleAdd}
              className={`${justAdded ? 'bg-stone-900' : 'bg-emerald-600'} text-white px-8 sm:px-12 py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-[11px] sm:text-[12px] uppercase tracking-[0.2em] sm:tracking-[0.25em] shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-2`}
            >
              {justAdded ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                  Añadido
                </>
              ) : 'Añadir'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
