
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { generateProductImage } from '../services/geminiService';

interface Props {
  product: Product;
  onClick: (p: Product) => void;
}

export const ProductCard: React.FC<Props> = ({ product, onClick }) => {
  const [displayImage, setDisplayImage] = useState<string>(product.imageUrl);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const unitPrice = product.specs.unitsPerFormat > 0 
    ? product.price / product.specs.unitsPerFormat 
    : null;

  useEffect(() => {
    let isMounted = true;
    
    const checkImage = async () => {
      const isPlaceholder = !product.imageUrl || 
                           product.imageUrl.includes('images.unsplash.com/photo-1547592166-23ac45744acd') ||
                           product.imageUrl.length < 10;

      if (isPlaceholder && !isGenerating && !errorStatus) {
        const staggerDelay = Math.random() * 2000;
        await new Promise(resolve => setTimeout(resolve, staggerDelay));
        
        if (!isMounted) return;
        setIsGenerating(true);
        
        try {
          const generated = await generateProductImage(product.name);
          if (isMounted) setDisplayImage(generated);
        } catch (error: any) {
          if (isMounted) {
            if (error.message === "QUOTA_EXCEEDED") {
              setErrorStatus("QUOTA");
              setDisplayImage(`https://source.unsplash.com/featured/?${encodeURIComponent(product.name + ',food')}`);
            } else {
              setErrorStatus("ERROR");
            }
          }
        } finally {
          if (isMounted) setIsGenerating(false);
        }
      } else if (!isPlaceholder) {
        setDisplayImage(product.imageUrl);
      }
    };

    checkImage();
    return () => { isMounted = false; };
  }, [product.imageUrl, product.name]);

  return (
    <div 
      onClick={() => onClick({ ...product, imageUrl: displayImage })}
      className="group bg-white rounded-[2rem] overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] transition-all duration-500 cursor-pointer border border-stone-50 flex flex-col h-full active:scale-[0.98]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-50">
        {isGenerating ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-stone-50 p-8 text-center">
            <div className="w-8 h-8 border-2 border-stone-200 border-t-sky-600 rounded-full animate-spin mb-4"></div>
            <p className="text-[8px] text-stone-400 uppercase font-black tracking-[0.2em] animate-pulse">Generando Visual...</p>
          </div>
        ) : (
          <img 
            src={displayImage} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
            onError={() => setDisplayImage('https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=1000&auto=format&fit=crop')}
          />
        )}
        
        {/* Badge de Precio */}
        <div className="absolute top-5 right-5 bg-white/95 backdrop-blur px-4 py-3 rounded-2xl shadow-xl border border-white flex flex-col items-end">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-lg font-black text-stone-900 leading-none">
              {product.price.toFixed(2)}
              <span className="text-xs ml-0.5">€</span>
            </span>
            <span className="text-[10px] text-stone-400 font-bold uppercase">/ {product.unit}</span>
          </div>
          {unitPrice && (
            <div className="bg-sky-600 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-sm">
              <span className="text-sm font-black text-white leading-none">
                {unitPrice.toFixed(2)}€
              </span>
              <span className="text-[8px] font-black text-sky-100 uppercase tracking-tighter">/ ud</span>
            </div>
          )}
        </div>

        {errorStatus === "QUOTA" && (
          <div className="absolute bottom-3 left-3 bg-amber-500/90 backdrop-blur px-2 py-1 rounded-lg">
             <span className="text-[7px] text-white font-black uppercase">Modo Ahorro Cuota</span>
          </div>
        )}
      </div>
      
      <div className="p-7 flex flex-col flex-grow">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-stone-100 text-stone-500 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">
            {product.category}
          </span>
          <span className="text-[9px] text-sky-600 font-black uppercase tracking-widest">
            {product.origin}
          </span>
        </div>

        <h3 className="font-serif text-3xl text-stone-900 mb-3 leading-tight group-hover:text-sky-800 transition-colors">
          {product.name}
        </h3>
        
        <p className="text-stone-500 text-sm leading-relaxed line-clamp-2 mb-6 font-medium italic">
          "{product.description}"
        </p>
        
        <div className="mt-auto flex flex-wrap gap-2">
          {product.benefits.slice(0, 2).map((b, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-100">
              <div className="w-1 h-1 bg-sky-500 rounded-full"></div>
              <span className="text-[9px] font-black text-stone-600 uppercase tracking-tighter">
                {b}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
