
import React, { useState, useEffect } from 'react';
import { Product, CartItem } from './types';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { fetchWeeklyCatalog } from './services/dataService';

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCartSummary, setShowCartSummary] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchWeeklyCatalog();
        setProducts(data);
      } catch (error) {
        console.error("Error al cargar el catálogo:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

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

  const calculateItemTotal = (item: CartItem) => {
    const isWeightBased = item.unit.toLowerCase().includes('kg') || item.unit.toLowerCase().includes('l');
    const weight = isWeightBased ? getAverageWeight(item.specs.format) : 1;
    return item.price * item.quantity * weight;
  };

  const cartTotal = cart.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const generateOrderMessage = () => {
    const header = `*PEDIDO CHEFCATALOG*\nFecha: ${new Date().toLocaleDateString()}\n--------------------------\n\n`;
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
    });
  };

  const categories = ['Todos', ...Array.from(new Set(products.map((p: Product) => p.category)))];
  const getCount = (cat: string) => cat === 'Todos' ? products.length : products.filter(p => p.category === cat).length;
  const filteredProducts = categoryFilter === 'Todos' ? products : products.filter(p => p.category === categoryFilter);

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-32">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-100 px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            <div className="flex items-center">
              <div className="flex flex-col items-start">
                <svg width="240" height="100" viewBox="0 0 240 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-14 sm:h-20 w-auto">
                  <path d="M10 70 L45 20 L60 40" stroke="#E31E24" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M40 70 L90 10 L140 70 H40Z" fill="#1A1A1A" />
                  <path d="M72 35 L90 10 L108 35 L90 55 L72 35Z" fill="white" stroke="#000" strokeWidth="0.5" />
                  <path d="M110 70 L155 30 L200 70 H110Z" fill="#00AEEF" />
                  <text x="10" y="92" fontFamily="Arial Black, sans-serif" fontSize="26" fontWeight="900" fill="#00AEEF">PIRINEOS</text>
                  <text x="155" y="92" fontFamily="Arial Black, sans-serif" fontSize="26" fontWeight="900" fill="#1A1A1A">EXDIM</text>
                  <text x="122" y="104" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="#888" style={{ letterSpacing: '0.02em' }}>calidad por naturaleza</text>
                </svg>
              </div>
            </div>
          </div>

          <div className="flex-grow flex flex-col justify-center items-end text-right overflow-hidden pr-2">
            <h1 className="text-lg sm:text-xl font-black tracking-tighter text-stone-900 leading-none">ChefCatalog</h1>
            <p className="text-[10px] text-stone-400 font-bold italic mt-1 flex items-center gap-1">
              Propuesta semanal <span className="w-1.5 h-1.5 bg-sky-500 rounded-full"></span>
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-10">
        <section className="mb-10 text-center sm:text-left">
          <h2 className="text-4xl md:text-7xl font-serif text-stone-900 leading-tight tracking-tighter mb-4">
            La Compra <br />
            <span className="text-stone-300 italic font-light">Profesional</span>
          </h2>
          <div className="w-16 h-1 bg-sky-600 mb-6"></div>
          <p className="text-stone-500 text-base md:text-lg max-w-xl font-medium">
            Planifica tus pedidos basándote en pesos medios operativos y precios de mercado de Pirineos Exdim.
          </p>
        </section>

        <div className="flex gap-2 mb-10 overflow-x-auto no-scrollbar pb-2">
          {categories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 whitespace-nowrap ${
                categoryFilter === cat 
                  ? 'bg-stone-900 border-stone-900 text-white shadow-xl' 
                  : 'bg-white border-stone-100 text-stone-400 hover:border-stone-200'
              }`}
            >
              {cat} ({getCount(cat)})
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-80 bg-stone-100 rounded-[2rem] animate-pulse"></div>
            ))
          ) : (
            filteredProducts.map((p) => (
              <ProductCard key={p.id} product={p} onClick={setSelectedProduct} />
            ))
          )}
        </div>
      </main>

      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50">
          <button 
            onClick={() => setShowCartSummary(true)}
            className="w-full bg-stone-900 text-white rounded-2xl p-5 flex items-center justify-between shadow-2xl border border-white/10 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="bg-sky-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">
                {cartCount}
              </div>
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
              <h3 className="font-serif text-xl">Confirmar Pedido</h3>
              <button onClick={() => setShowCartSummary(false)} className="p-2 text-stone-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              {cart.map(item => {
                const itemTotal = calculateItemTotal(item);
                const weightPerUnit = getAverageWeight(item.specs.format);
                const isWeightBased = item.unit.toLowerCase().includes('kg') || item.unit.toLowerCase().includes('l');
                
                return (
                  <div key={item.id} className="flex justify-between items-center bg-stone-50 p-4 rounded-xl border border-stone-100 shadow-sm">
                    <div className="flex-grow pr-4">
                      <h4 className="font-bold text-[11px] uppercase tracking-tight text-stone-900 leading-tight mb-1">{item.name}</h4>
                      <div className="flex items-center gap-3">
                        <p className="text-[10px] text-stone-400 font-medium">{item.price.toFixed(2)}€ / {item.unit}</p>
                        {isWeightBased && (
                          <p className="text-[10px] text-stone-500 font-bold bg-stone-100 px-1.5 py-0.5 rounded">
                            ~{(weightPerUnit * item.quantity).toFixed(1)} {item.unit}
                          </p>
                        )}
                        <p className="text-[10px] text-sky-600 font-black ml-auto">
                          {itemTotal.toFixed(2)}€
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 rounded-lg bg-white border border-stone-200 text-stone-400 flex items-center justify-center font-bold">-</button>
                      <span className="font-black text-xs min-w-[1.2rem] text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 rounded-lg bg-white border border-stone-200 text-stone-400 flex items-center justify-center font-bold">+</button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-6 bg-stone-50 border-t space-y-4">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Total (aprox)</span>
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">(+ IVA)</span>
                </div>
                <span className="text-2xl font-black text-stone-900">{cartTotal.toFixed(2)}€</span>
              </div>
              <button 
                onClick={copyToClipboard}
                className="w-full bg-sky-600 text-white py-4 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-sky-100 active:scale-[0.98] transition-transform"
              >
                Copiar para WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      <ProductModal 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        onAddToCart={addToCart}
      />
    </div>
  );
};

export default App;
