
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
  const [selectedStyle, setSelectedStyle] = useState<CulinaryStyle>('Moderna');

  useEffect(() => {
    if (product) {
      setRecipe(null);
      setActiveTab('info');
      setJustAdded(false);
    }
  }, [product]);

  if (!product) return null;

  const handleGenerateRecipe = async () => {
    setLoading(true);
    try {
      const result = await getChefInspiration(product, selectedStyle);
      setRecipe(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const unitsDisplay = product.specs.unitsPerFormat?.toString() || '1';
  
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="bg-white w-full max-w-6xl h-[92vh] sm:h-auto sm:max-h-[92vh] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col sm:flex-row relative z-10 animate-in slide-in-from-bottom sm:zoom-in duration-300">
        
        {/* Botón de Cierre (X) */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-white/80 backdrop-blur-md sm:bg-stone-100 hover:bg-stone-200 rounded-full text-stone-900 shadow-lg transition-all active:scale-90"
          aria-label="Cerrar modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Panel Izquierdo: Imagen (Compacto) */}
        <div className="w-full sm:w-[30%] bg-stone-100 h-[140px] sm:h-auto shrink-0 relative">
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent sm:hidden"></div>
          <div className="absolute top-4 left-4 flex flex-col gap-1.5">
            {product.tags.map((tag, idx) => {
              const isOferta = tag === 'OFERTA';
              const isOro = tag === 'TOP CHEF';
              const isIdea = tag === 'IDEA SEMANA';
              const isEspecial = tag.startsWith('ESPECIAL');
              return (
                <span 
                  key={idx} 
                  className={`px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest shadow-lg 
                    ${tag === 'NOVEDAD' ? 'bg-[#E31E24] text-white' : 
                      tag === 'RECOMENDACION' ? 'bg-[#00AEEF] text-white' : 
                      isOferta ? 'bg-[#FF9F1C] text-white animate-pulse' : 
                      isOro ? 'bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-stone-900 shadow-[0_0_15px_rgba(191,149,63,0.4)]' : 
                      isIdea ? 'bg-gradient-to-r from-[#52b788] via-[#74c69d] to-[#40916c] text-white shadow-[0_0_15px_rgba(82,183,136,0.4)]' : 
                      isEspecial ? 'bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 
                      'bg-[#52b788] text-white'}`}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        </div>

        {/* Panel Derecho: Información Técnica */}
        <div className="w-full sm:w-[70%] flex flex-col bg-white overflow-hidden">
          {/* Cabecera Compacta */}
          <div className="px-6 pt-6 pb-2 sm:px-10 sm:pt-8 border-b border-stone-50 pr-14 sm:pr-16">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[8px] sm:text-[9px] font-black text-sky-600 uppercase tracking-widest">{product.category}</span>
              <span className="w-0.5 h-0.5 rounded-full bg-stone-300"></span>
              <span className="text-[8px] sm:text-[9px] font-black text-stone-400 uppercase tracking-widest">{product.origin}</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-serif text-stone-900 leading-none uppercase tracking-tight">{product.name}</h2>
          </div>

          {/* Navegación por Pestañas */}
          <div className="flex w-full bg-white border-b border-stone-100">
            {[
              { id: 'info', label: 'Ficha Técnica' },
              { id: 'calc', label: 'Escandallo' },
              { id: 'recipe', label: 'Chef IA' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)} 
                className={`flex-1 py-3 sm:py-4 text-[8px] sm:text-[9px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === tab.id ? 'border-sky-600 text-stone-900 bg-sky-50/20' : 'border-transparent text-stone-300 hover:text-stone-500'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Contenido Dinámico Optimizado */}
          <div className="flex-grow overflow-y-auto p-6 sm:p-10 no-scrollbar bg-white">
            {activeTab === 'info' && (
              <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
                
                {/* Concepto y Specs en una sola vista */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  <div className="lg:col-span-3">
                    <div className="bg-stone-50 p-4 sm:p-5 rounded-2xl border-l-4 border-sky-500">
                      <p className="text-stone-600 text-xs sm:text-sm font-medium leading-relaxed italic">"{product.description}"</p>
                    </div>
                  </div>

                  {/* Fila de Especificaciones (Sin scroll) */}
                  {[
                    { label: 'Origen', val: product.origin },
                    { label: 'Conservación', val: product.specs.storage },
                    { label: 'Formato', val: product.specs.format }
                  ].map((spec, i) => (
                    <div key={i} className="bg-white p-3 sm:p-4 rounded-xl border border-stone-100 shadow-sm flex flex-col justify-center">
                      <span className="text-[7px] sm:text-[8px] text-stone-400 uppercase font-black tracking-widest mb-1">{spec.label}</span>
                      <span className="text-[10px] sm:text-xs font-bold text-stone-900 truncate">{spec.val}</span>
                    </div>
                  ))}
                </div>

                {/* Ventajas en cuadrícula de alta densidad */}
                <div className="pt-2 border-t border-stone-50">
                  <h4 className="text-[8px] font-black text-stone-900 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <span className="w-6 h-[1px] bg-sky-600"></span>
                    Valores Profesionales
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {product.benefits && product.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-center gap-3 bg-stone-50/40 p-2.5 rounded-lg border border-stone-50 transition-colors hover:bg-white hover:border-sky-100">
                        <svg className="w-3 h-3 text-sky-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-[10px] sm:text-xs font-bold text-stone-600 leading-tight">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'calc' && <CostCalculator product={product} />}

            {activeTab === 'recipe' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                {!recipe && !loading && (
                  <div className="text-center py-6 px-4 bg-stone-50 rounded-3xl border border-stone-100">
                    <h4 className="font-serif text-lg sm:text-xl text-stone-800 mb-2">Inspiración IA para {product.name}</h4>
                    <p className="text-[10px] text-stone-500 mb-6 font-medium">IA Gastronómica para tu menú diario.</p>
                    
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                      {(['Tradicional', 'Clásica', 'Moderna', 'Técnica'] as CulinaryStyle[]).map((style) => (
                        <button
                          key={style}
                          onClick={() => setSelectedStyle(style)}
                          className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${selectedStyle === style ? 'bg-sky-600 text-white shadow-lg' : 'bg-white text-stone-300 border border-stone-100 hover:text-stone-500'}`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>

                    <button onClick={handleGenerateRecipe} className="bg-stone-900 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">
                      Sugerir Receta
                    </button>
                  </div>
                )}

                {loading && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-10 h-10 border-2 border-stone-100 border-t-sky-600 rounded-full animate-spin"></div>
                    <p className="text-[8px] font-black text-stone-400 uppercase tracking-[0.3em] animate-pulse">Chef IA diseñando...</p>
                  </div>
                )}

                {recipe && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="lg:col-span-2 pb-4 border-b border-stone-50">
                      <h3 className="text-xl sm:text-2xl font-serif text-stone-900 mb-1">{recipe.title}</h3>
                      <p className="text-stone-500 italic text-xs sm:text-sm">{recipe.description}</p>
                    </div>
                    <div className="space-y-4">
                      <h5 className="text-[8px] font-black text-sky-600 uppercase tracking-widest border-b border-sky-100 pb-1">Ingredientes</h5>
                      <ul className="space-y-1.5">
                        {recipe.ingredients.map((ing, i) => (
                          <li key={i} className="text-[10px] sm:text-xs text-stone-600 flex items-start gap-2">
                            <span className="text-sky-400 font-bold">•</span> <span>{ing}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h5 className="text-[8px] font-black text-sky-600 uppercase tracking-widest border-b border-sky-100 pb-1">Preparación</h5>
                      <ol className="space-y-2">
                        {recipe.steps.map((step, i) => (
                          <li key={i} className="text-[10px] sm:text-xs text-stone-600 leading-relaxed flex items-start gap-2">
                            <span className="font-black text-[9px] text-stone-300 bg-stone-50 w-5 h-5 rounded flex items-center justify-center shrink-0">{i+1}</span> 
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer del Modal (Fijo) */}
          <div className="px-6 py-5 sm:px-10 sm:py-6 border-t border-stone-100 bg-white flex items-center justify-between">
            <div className="hidden sm:block">
              <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-0.5">Precio Neto</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-stone-900 tabular-nums">{product.price.toFixed(2)}€</span>
                <span className="text-[10px] font-bold text-stone-400 uppercase">/ {product.unit}</span>
              </div>
            </div>
            <button 
              onClick={() => {onAddToCart(product); setJustAdded(true); setTimeout(()=>setJustAdded(false), 2000);}} 
              className={`flex-grow sm:flex-grow-0 px-8 sm:px-10 py-4 sm:py-4.5 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl ${justAdded ? 'bg-green-600 text-white' : 'bg-[#00AEEF] hover:bg-sky-600 text-white shadow-sky-100'}`}
            >
              {justAdded ? '✓ Añadido' : 'Añadir al Pedido'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
