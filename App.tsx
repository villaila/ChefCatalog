
import React, { useState, useEffect } from 'react';
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
    
    // Si el carrito se vacía, limpiamos el timestamp
    if (cart.length === 0) {
      setCartStartTime(null);
      localStorage.removeItem(CART_TIME_KEY);
    } else if (!cartStartTime) {
      // Si es el primer producto, guardamos el momento actual
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
    const header = `*PEDIDO CATÁLOGO CHEF*\nFecha: ${new Date().toLocaleDateString()}\nIniciado: ${cartStartTime || 'Reciente'}\n--------------------------\n\n`;
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
      
      // Preguntar por el borrado tras copiar
      setTimeout(() => {
        if (window.confirm("¿Deseas vaciar el carrito ahora que has copiado el pedido?")) {
          clearCart();
        }
      }, 500);
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-32">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-100 px-4 sm:px-6 py-2 sm:py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            <svg width="220" height="70" viewBox="0 0 540 170" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-14 sm:h-20 w-auto">
              <path d="M150 45L40 100L210 100L150 45Z" fill="#E31E24" />
              <path d="M280 10L120 120L440 120L280 10Z" fill="#1A1A1A" />
              <path d="M280 10L220 50L340 50L280 10Z" fill="white" />
              <path d="M380 40L230 135L530 135L380 40Z" fill="#00AEEF" />
              <text x="0" y="152" fontFamily="Arial Black, sans-serif" fontSize="68" fontWeight="900" fill="#00AEEF" letterSpacing="-2">PIRINEOS</text>
              <text x="325" y="152" fontFamily="Arial Black, sans-serif" fontSize="68" fontWeight="900" fill="#1A1A1A" letterSpacing="-2">EXDIM</text>
              <text x="322" y="168" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" fill="#888">calidad por naturaleza</text>
            </svg>
          </div>
          <div className="flex-grow flex flex-col justify-center items-end text-right pr-2">
            <h1 className="text-base sm:text-lg font-black tracking-tighter text-stone-900 leading-none">Catálogo Chef</h1>
            <p className="text-[9px] text-stone-400 font-bold italic mt-0.5 flex items-center gap-1">
              Selección Exclusiva <span className="w-1 h-1 bg-sky-500 rounded-full"></span>
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-6 sm:pt-8">
        <section className="mb-8 sm:mb-12 text-center sm:text-left">
          <h2 className="text-4xl md:text-5xl font-serif text-stone-900 leading-tight tracking-tighter mb-1">
            La Compra <br />
            <span className="text-stone-300 italic font-light">Profesional</span>
          </h2>
          <div className="w-12 h-1 bg-[#00AEEF] mb-3"></div>
          <p className="text-stone-500 text-sm md:text-base max-w-xl font-medium leading-relaxed">
            Directo desde Pirineos Exdim. Precios actualizados y escandallos para tu cocina.
          </p>
        </section>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {Array(6).fill(0).map((_, i) => (
                <div key={i} className="aspect-[4/3] bg-stone-100 rounded-[2rem] animate-pulse"></div>
             ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50">
          <button onClick={() => setShowCartSummary(true)} className="w-full bg-stone-900 text-white rounded-2xl p-5 flex items-center justify-between shadow-2xl border border-white/10 active:scale-[0.98] transition-all">
            <div className="flex items-center gap-3">
              <div className="bg-[#00AEEF] text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">{cartCount}</div>
              <span className="text-[11px] font-black uppercase tracking-widest">Ver mi lista</span>
            </div>
            <span className="text-lg font-black">{cartTotal.toFixed(2)}€</span>
          </button>
        </div>
      )}

      {showCartSummary && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-stone-900/80 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center">
              <div className="flex flex-col">
                <h3 className="font-serif text-xl">Confirmar Pedido</h3>
                {cartStartTime && (
                  <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">
                    Iniciado el {cartStartTime}
                  </p>
                )}
              </div>
              <button onClick={() => setShowCartSummary(false)} className="p-2 text-stone-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-stone-50 p-4 rounded-xl border border-stone-100">
                  <div className="flex-grow pr-4">
                    <h4 className="font-bold text-[11px] uppercase tracking-tight text-stone-900 mb-1">{item.name}</h4>
                    <div className="flex items-center gap-3">
                      <p className="text-[10px] text-stone-400">{item.price.toFixed(2)}€ / {item.unit}</p>
                      <p className="text-[10px] text-sky-600 font-black ml-auto">{calculateItemTotal(item).toFixed(2)}€</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 rounded-lg bg-white border border-stone-200">-</button>
                    <span className="font-black text-xs min-w-[1.2rem] text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 rounded-lg bg-white border border-stone-200">+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-stone-50 border-t space-y-4">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Total (aprox)</span>
                  <span className="text-[9px] text-stone-400 font-medium italic">Sujeto a pesos finales</span>
                </div>
                <span className="text-2xl font-black text-stone-900">{cartTotal.toFixed(2)}€</span>
              </div>
              <button onClick={copyToClipboard} className="w-full bg-[#00AEEF] text-white py-4 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-sky-100 active:scale-95 transition-all">
                Copiar para WhatsApp
              </button>
              <button onClick={() => window.confirm("¿Vaciar toda la lista actual?") && clearCart()} className="w-full text-stone-400 py-2 text-[9px] font-black uppercase tracking-widest hover:text-red-500 transition-colors">
                Borrar carrito
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
