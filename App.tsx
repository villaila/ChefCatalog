
import React, { useState, useEffect, useMemo } from 'react';
import { Product, CartItem } from './types';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { fetchWeeklyCatalog } from './services/dataService';

const CART_STORAGE_KEY = 'chef_catalog_cart';
const CART_TIME_KEY = 'chef_catalog_cart_time';

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartStartTime, setCartStartTime] = useState<string | null>(null);
  const [showCartSummary, setShowCartSummary] = useState(false);

  // Cálculo dinámico del rango de la semana actual (Lunes a Domingo)
  const weekRange = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay();
    // Ajuste para que el lunes sea el día 1 y domingo el 7
    const diffToMonday = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    
    const monday = new Date(now.getFullYear(), now.getMonth(), diffToMonday);
    const sunday = new Date(now.getFullYear(), now.getMonth(), diffToMonday + 6);
    
    const fmt = (d: Date) => d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase().replace('.', '');
    return `${fmt(monday)} — ${fmt(sunday)}`;
  }, []);

  // Carga inicial desde localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    const savedTime = localStorage.getItem(CART_TIME_KEY);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Error al recuperar el carrito", e);
      }
    }
    if (savedTime) {
      setCartStartTime(savedTime);
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchWeeklyCatalog();
        const sortedData = [...data].sort((a, b) => {
          const isSpecialA = a.tags.includes('NOVEDAD') || a.tags.includes('RECOMENDACION');
          const isSpecialB = b.tags.includes('NOVEDAD') || b.tags.includes('RECOMENDACION');
          if (isSpecialA === isSpecialB) return 0;
          return isSpecialA ? 1 : -1;
        });
        setProducts(sortedData);
      } catch (error) {
        console.error("Error al cargar el catálogo:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Guardar en localStorage cada vez que el carrito cambie
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    
    if (cart.length === 0) {
      setCartStartTime(null);
      localStorage.removeItem(CART_TIME_KEY);
    } else if (!cartStartTime) {
      const now = new Date().toLocaleString('es-ES', { 
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
      });
      setCartStartTime(now);
      localStorage.setItem(CART_TIME_KEY, now);
    }
  }, [cart]);

  const getAverageWeight = (format: string): number => {
    const match = format.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml)/i);
    if (match) {
      let val = parseFloat(match[1].replace(',', '.'));
      const unit = match[2].toLowerCase();
      if (unit === 'g' || unit === 'ml') return val / 1000;
      return val;
    }
    return 1;
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const clearCart = () => {
    setCart([]);
    setCartStartTime(null);
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(CART_TIME_KEY);
    setShowCartSummary(false);
  };

  const calculateItemTotal = (item: CartItem) => {
    const isWeightBased = item.unit.toLowerCase().includes('kg') || item.unit.toLowerCase().includes('l');
    const weight = isWeightBased ? getAverageWeight(item.specs.format) : 1;
    return item.price * item.quantity * weight;
  };

  const cartTotal = cart.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const generateOrderMessage = () => {
    const header = `*PEDIDO CATÁLOGO CHEF*\nValidez: ${weekRange}\nFecha: ${new Date().toLocaleDateString()}\nIniciado: ${cartStartTime || 'Reciente'}\n--------------------------\n\n`;
    const items = cart.map(item => {
      const isWeightBased = item.unit.toLowerCase().includes('kg') || item.unit.toLowerCase().includes('l');
      const weight = getAverageWeight(item.specs.format);
      const itemTotal = calculateItemTotal(item);
      const detail = isWeightBased ? ` (~${(weight * item.quantity).toFixed(1)}${item.unit})` : '';
      return `- *${item.quantity}x* ${item.name}${detail} - ${itemTotal.toFixed(2)}€`;
    }).join('\n');
    const footer = `\n\n--------------------------\n*TOTAL ESTIMADO: ${cartTotal.toFixed(2)}€ (+ IVA)*\n\n_Enviado desde mi catálogo digital_`;
    return header + items + footer;
  };

  const copyToClipboard = () => {
    const text = generateOrderMessage();
    navigator.clipboard.writeText(text).then(() => {
      alert("✅ ¡Copiado! Pégalo ahora en el chat de tu comercial.");
      setTimeout(() => {
        if (window.confirm("¿Deseas vaciar el carrito ahora que has copiado el pedido?")) {
          clearCart();
        }
      }, 500);
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-32">
      <header className="sticky top-0 z-40 bg-white/98 backdrop-blur-xl border-b border-stone-100 px-4 sm:px-8 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <svg width="220" height="70" viewBox="0 0 540 170" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 sm:h-16 w-auto">
              <path d="M150 45L40 100L210 100L150 45Z" fill="#E31E24" stroke="#1A1A1A" strokeWidth="6" strokeLinejoin="round" />
              <path d="M280 10L120 120L440 120L280 10Z" fill="#1A1A1A" stroke="#1A1A1A" strokeWidth="6" strokeLinejoin="round" />
              <path d="M280 10L220 50L340 50L280 10Z" fill="white" />
              <path d="M380 40L230 135L530 135L380 40Z" fill="#00AEEF" stroke="#1A1A1A" strokeWidth="6" strokeLinejoin="round" />
              <text x="0" y="150" fontFamily="Arial Black, sans-serif" fontSize="54" fontWeight="900" fill="#00AEEF" letterSpacing="-1.5">PIRINEOS</text>
              <text x="265" y="150" fontFamily="Arial Black, sans-serif" fontSize="54" fontWeight="900" fill="#1A1A1A" letterSpacing="-1.5">EXDIM</text>
            </svg>
          </div>

          <div className="flex flex-col items-end text-right">
            <span className="text-[11px] sm:text-[13px] font-black text-stone-900 tracking-[0.05em] leading-none mb-1">
              Catálogo Chef
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-widest whitespace-nowrap">
                VIGENCIA:
              </span>
              <span className="text-[10px] sm:text-[12px] font-black text-sky-600 tabular-nums">
                {weekRange}
              </span>
            </div>
          </div>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8 sm:pt-12">
        <section className="mb-10 sm:mb-16 text-center sm:text-left relative">
          <div className="absolute -left-6 top-0 w-1 h-20 bg-[#00AEEF] hidden sm:block"></div>
          <h2 className="text-4xl sm:text-6xl font-serif text-stone-900 leading-none tracking-tighter mb-4">
            La Compra <br />
            <span className="text-stone-300 italic font-light">Profesional</span>
          </h2>
          <p className="text-stone-500 text-sm sm:text-lg max-w-xl font-medium leading-relaxed italic">
            Directo desde Pirineos Exdim. Precios actualizados y escandallos para tu cocina.
          </p>
        </section>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {Array(6).fill(0).map((_, i) => (
                <div key={i} className="aspect-[4/3] bg-stone-100 rounded-[2.5rem] animate-pulse"></div>
             ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
            {products.map(p => (
              <ProductCard 
                key={p.id} 
                product={p} 
                onClick={setSelectedProduct} 
                showTags={true} 
              />
            ))}
          </div>
        )}
      </main>

      {cart.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
          <button onClick={() => setShowCartSummary(true)} className="w-full bg-stone-900 text-white rounded-3xl p-6 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 active:scale-95 transition-all">
            <div className="flex items-center gap-4">
              <div className="bg-[#00AEEF] text-white w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shadow-lg shadow-sky-500/20">{cartCount}</div>
              <span className="text-[12px] font-black uppercase tracking-[0.25em]">Mi Pedido</span>
            </div>
            <span className="text-xl font-black tabular-nums">{cartTotal.toFixed(2)}€</span>
          </button>
        </div>
      )}

      {showCartSummary && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-stone-900/40 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setShowCartSummary(false)}></div>
          <div className="bg-white w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] overflow-hidden flex flex-col max-h-[92vh] shadow-2xl relative z-10">
            <div className="p-8 border-b border-stone-100 flex justify-between items-center">
              <div className="flex flex-col">
                <h3 className="font-serif text-2xl text-stone-900">Confirmar Pedido</h3>
                <p className="text-[10px] text-sky-600 font-black uppercase tracking-[0.2em] mt-1">
                  VIGENCIA: {weekRange}
                </p>
              </div>
              <button onClick={() => setShowCartSummary(false)} className="p-3 bg-stone-50 rounded-full text-stone-400 hover:text-stone-900 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-8 space-y-6 no-scrollbar">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-stone-50/50 p-5 rounded-2xl border border-stone-100 hover:bg-white transition-colors">
                  <div className="flex-grow pr-4">
                    <h4 className="font-black text-[12px] uppercase tracking-tight text-stone-900 mb-1">{item.name}</h4>
                    <div className="flex items-center gap-3">
                      <p className="text-[11px] text-stone-400 font-medium">{item.price.toFixed(2)}€ / {item.unit}</p>
                      <p className="text-[12px] text-sky-600 font-black ml-auto tabular-nums">{calculateItemTotal(item).toFixed(2)}€</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-stone-100 shadow-sm">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center font-black text-stone-400 hover:text-red-500 transition-colors">-</button>
                    <span className="font-black text-sm min-w-[1.5rem] text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center font-black text-stone-400 hover:text-sky-600 transition-colors">+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-8 bg-stone-50 border-t border-stone-100 space-y-6">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total Estimado</span>
                  <span className="text-[9px] text-stone-400 font-bold italic">Sujeto a pesaje final</span>
                </div>
                <span className="text-3xl font-black text-stone-900 tracking-tighter">{cartTotal.toFixed(2)}€</span>
              </div>
              <button onClick={copyToClipboard} className="w-full bg-[#00AEEF] text-white py-5 rounded-2xl font-black text-[12px] uppercase tracking-[0.25em] shadow-xl shadow-sky-200 active:scale-95 transition-all">
                Copiar para ENVIAR
              </button>
              <button onClick={() => window.confirm("¿Vaciar toda la lista actual?") && clearCart()} className="w-full text-stone-300 py-2 text-[10px] font-black uppercase tracking-widest hover:text-red-500 transition-colors">
                Limpiar Selección
              </button>
            </div>
          </div>
        </div>
      )}

      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={addToCart} />
    </div>
  );
};

export default App;
