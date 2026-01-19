
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

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = categoryFilter === 'Todos' 
    ? products 
    : products.filter(p => p.category === categoryFilter);

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="font-serif text-3xl tracking-tight text-stone-900">GASTRO<span className="text-emerald-700 font-black italic">PRO</span></h1>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em]">Catálogo Selección Semanal</p>
          </div>
          
          <button 
            onClick={() => setShowCartSummary(!showCartSummary)}
            className="relative bg-stone-900 text-white p-3 rounded-2xl shadow-xl active:scale-95 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Categories Bar */}
        <div className="max-w-7xl mx-auto px-6 pb-4 overflow-x-auto flex gap-3 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                categoryFilter === cat 
                  ? 'bg-stone-900 text-white border-stone-900 shadow-md' 
                  : 'bg-white text-stone-500 border-stone-100 hover:border-stone-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-12 h-12 border-4 border-stone-200 border-t-emerald-600 rounded-full animate-spin mb-6"></div>
            <p className="text-[11px] font-black text-stone-400 uppercase tracking-[0.4em] animate-pulse">Actualizando Mercado...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onClick={setSelectedProduct} 
              />
            ))}
          </div>
        )}
      </main>

      <ProductModal 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        onAddToCart={addToCart}
      />

      {/* Cart Summary Overlay */}
      {showCartSummary && cart.length > 0 && (
        <div className="fixed inset-0 z-40 flex items-end justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setShowCartSummary(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden relative z-50 animate-in slide-in-from-bottom-10">
            <div className="p-8 border-b border-stone-100 flex justify-between items-center">
              <h3 className="font-serif text-2xl">Tu Pedido</h3>
              <button onClick={() => setShowCartSummary(false)} className="text-stone-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-8 space-y-6">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="min-w-0 flex-grow pr-4">
                    <p className="text-xs font-black text-stone-900 uppercase truncate">{item.name}</p>
                    <p className="text-[10px] text-stone-400 font-bold uppercase">{item.quantity} x {item.price.toFixed(2)}€/{item.unit}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-600">-</button>
                    <span className="text-sm font-black w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-600">+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-8 bg-stone-50 border-t border-stone-100">
              <div className="flex justify-between items-baseline mb-6">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Total Estimado</span>
                <span className="text-3xl font-black text-stone-900">{cartTotal.toFixed(2)}€</span>
              </div>
              <button className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-100">
                Tramitar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
