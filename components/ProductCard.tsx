
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { generateProductImage } from '../services/geminiService';

interface Props {
  product: Product;
  onClick: (p: Product) => void;
  showTags?: boolean; 
}

export const ProductCard: React.FC<Props> = ({ product, onClick, showTags = false }) => {
  const [displayImage, setDisplayImage] = useState<string>(product.imageUrl);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const getFormatWeight = (fmt: string): number => {
    const match = fmt.match(/(\d+(?:[.,]\d+)?)\s*(kg|gr|g|l|mls|ml)/i);
    if (!match) return 1;
    let val = parseFloat(match[1].replace(',', '.'));
    const unit = match[2].toLowerCase();
    if (unit === 'g' || unit === 'gr' || unit === 'ml' || unit === 'mls') return val / 1000;
    return val;
  };

  // NUEVA FUNCIÓN: Calcula la media si detecta un rango (12-14 -> 13)
  const getNumericUnits = (val: string | number): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    
    // Buscar rangos como "12-14" o "12 a 14"
    const rangeMatch = val.match(/(\d+(?:[.,]\d+)?)\s*(?:-|a|to)\s*(\d+(?:[.,]\d+)?)/i);
    if (rangeMatch) {
      const start = parseFloat(rangeMatch[1].replace(',', '.'));
      const end = parseFloat(rangeMatch[2].replace(',', '.'));
      return (start + end) / 2;
    }
    
    // Fallback: primer número encontrado
    const match = val.match(/(\d+(?:[.,]\d+)?)/);
    return match ? parseFloat(match[1].replace(',', '.')) : 0;
  };

  const unitsStr = product.specs.unitsPerFormat?.toString() || '';
  const effectiveUnits = getNumericUnits(unitsStr);
  
  const isWeightPrice = product.unit.toLowerCase().includes('kg') || product.unit.toLowerCase().includes('l');
  const formatWeight = getFormatWeight(product.specs.format);
  
  const pricePerFormat = isWeightPrice ? (product.price * formatWeight) : product.price;
  const unitPrice = effectiveUnits > 0 ? (pricePerFormat / effectiveUnits) : null;

  const isOroProduct = product.tags.includes('TOP CHEF');
  const isIdeaProduct = product.tags.includes('IDEA SEMANA');
  const isEspecialProduct = product.tags.some(t => t.startsWith('ESPECIAL'));
  const isOfertaProduct = product.tags.includes('OFERTA');

  useEffect(() => {
    let isMounted = true;
    const checkImage = async () => {
      const isPlaceholder = !product.imageUrl || 
                           product.imageUrl.includes('images.unsplash.com/photo-1547592166-23ac45744acd') ||
                           product.imageUrl.length < 10;

      if (isPlaceholder && !isGenerating && !errorStatus) {
        setIsGenerating(true);
        try {
          const generated = await generateProductImage(product.name);
          if (isMounted) setDisplayImage(generated);
        } catch (error) {
          if (isMounted) setDisplayImage(`https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop`);
        } finally {
          if (isMounted) setIsGenerating(false);
        }
      }
    };
    checkImage();
    return () => { isMounted = false; };
  }, [product.imageUrl, product.name]);

  return (
    <div 
      onClick={() => onClick({ ...product, imageUrl: displayImage })}
      className={`group rounded-[2rem] overflow-hidden transition-all duration-500 cursor-pointer border flex flex-col h-full active:scale-[0.98] ${
        isOroProduct 
          ? 'bg-gradient-to-br from-[#FCF6BA]/40 via-[#FCF6BA]/10 to-[#BF953F]/15 border-[#BF953F]/50 shadow-[0_4px_20px_-4px_rgba(191,149,63,0.25)] hover:shadow-[0_20px_40px_-12px_rgba(191,149,63,0.4)]' 
          : isIdeaProduct
          ? 'bg-gradient-to-br from-[#d8f3dc]/50 via-[#d8f3dc]/20 to-[#52b788]/15 border-[#52b788]/40 shadow-[0_4px_20px_-4px_rgba(82,183,136,0.25)] hover:shadow-[0_20px_40px_-12px_rgba(82,183,136,0.4)]'
          : isEspecialProduct
          ? 'bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 border-blue-200 shadow-[0_4px_20px_-4px_rgba(59,130,246,0.15)] hover:shadow-[0_20px_40px_-12px_rgba(59,130,246,0.25)]'
          : 'bg-white border-stone-50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)]'
      }`}
    >
      <div className={`relative aspect-[4/3] overflow-hidden ${isOroProduct ? 'bg-[#BF953F]/5' : isIdeaProduct ? 'bg-[#52b788]/10' : isEspecialProduct ? 'bg-blue-50/50' : 'bg-stone-50'}`}>
        {isGenerating ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-stone-50 p-8 text-center">
            <div className="w-8 h-8 border-2 border-stone-200 border-t-sky-600 rounded-full animate-spin mb-4"></div>
            <p className="text-[8px] text-stone-400 uppercase font-black tracking-[0.2em]">Generando Visual...</p>
          </div>
        ) : (
          <img 
            src={displayImage} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
          />
        )}
        
        {isEspecialProduct && (
          <div className="absolute inset-0 border-[4px] border-blue-300/60 z-10 pointer-events-none"></div>
        )}
        
        {showTags && product.tags.length > 0 && (
          <div className="absolute top-5 left-5 flex flex-col gap-2 z-20">
            {product.tags.map((tag, idx) => {
              const isOferta = tag === 'OFERTA';
              const isOro = tag === 'TOP CHEF';
              const isIdea = tag === 'IDEA SEMANA';
              const isEspecial = tag.startsWith('ESPECIAL');
              return (
                <span 
                  key={idx} 
                  className={`px-4 py-1.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-widest shadow-md 
                    ${tag === 'NOVEDAD' ? 'bg-[#E31E24] text-white' : 
                      tag === 'RECOMENDACION' ? 'bg-[#00AEEF] text-white' : 
                      isOferta ? 'bg-[#FF9F1C] text-white animate-pulse scale-110 origin-left' : 
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
        )}

        <div className={`absolute top-5 right-5 backdrop-blur px-4 py-3 rounded-2xl shadow-xl border flex flex-col items-end transition-colors duration-300 z-20 ${isOroProduct ? 'bg-stone-900/95 border-[#BF953F]/50' : isIdeaProduct ? 'bg-[#1b4332]/95 border-[#52b788]/50' : isEspecialProduct ? 'bg-blue-50/95 border-blue-200' : isOfertaProduct ? 'bg-orange-50/95 border-orange-200' : 'bg-white/95 border-white'}`}>
          <div className="flex items-center gap-1 mb-1">
            <span className={`text-lg font-black leading-none ${isOroProduct ? 'text-[#FCF6BA]' : isIdeaProduct ? 'text-[#d8f3dc]' : isEspecialProduct ? 'text-blue-700' : isOfertaProduct ? 'text-orange-600' : 'text-stone-900'}`}>{product.price.toFixed(2)}€</span>
            <span className={`text-[10px] font-bold uppercase ${isOroProduct ? 'text-[#BF953F]' : isIdeaProduct ? 'text-[#74c69d]' : isEspecialProduct ? 'text-blue-400' : isOfertaProduct ? 'text-orange-400' : 'text-stone-400'}`}>/ {product.unit}</span>
          </div>
          {unitPrice !== null && (
            <div className={`${isOroProduct ? 'bg-gradient-to-r from-[#BF953F] to-[#B38728]' : isIdeaProduct ? 'bg-gradient-to-r from-[#52b788] to-[#40916c]' : isEspecialProduct ? 'bg-blue-400' : isOfertaProduct ? 'bg-orange-500' : 'bg-[#00AEEF]'} px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors duration-300`}>
              <span className={`text-sm font-black leading-none ${isOroProduct ? 'text-stone-900' : 'text-white'}`}>{unitPrice.toFixed(2)}€</span>
              <span className={`text-[8px] font-black uppercase tracking-tighter ${isOroProduct ? 'text-stone-900/70' : isIdeaProduct ? 'text-green-100' : isEspecialProduct ? 'text-blue-100' : isOfertaProduct ? 'text-orange-100' : 'text-sky-100'}`}>/ ud</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-7 flex flex-col flex-grow">
        <div className="flex items-center gap-2 mb-3">
          <span className={`${isOroProduct ? 'bg-[#BF953F]/15 text-[#997328]' : isIdeaProduct ? 'bg-[#52b788]/20 text-[#1b4332]' : isEspecialProduct ? 'bg-blue-500/10 text-blue-600' : 'bg-stone-100 text-stone-500'} text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg`}>{product.category}</span>
        </div>
        <h3 className={`font-serif text-3xl mb-3 leading-tight transition-colors ${isOroProduct ? 'text-stone-900 group-hover:text-[#BF953F]' : isIdeaProduct ? 'text-stone-900 group-hover:text-[#2d6a4f]' : isEspecialProduct ? 'text-stone-900 group-hover:text-blue-500' : 'text-stone-900 group-hover:text-[#00AEEF]'}`}>{product.name}</h3>
        <p className={`${isOroProduct || isIdeaProduct || isEspecialProduct ? 'text-stone-600' : 'text-stone-500'} text-sm leading-relaxed line-clamp-2 mb-6 font-medium italic`}>"{product.description}"</p>
      </div>
    </div>
  );
};
