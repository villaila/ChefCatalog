
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

  const handleShareApp = async () => {
    const shareData = {
      title: 'ChefCatalog - Pirineos Exdim',
      text: 'Consulta nuestra propuesta semanal de productos premium para tu cocina.',
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Enlace copiado al portapapeles');
      }
    } catch (err) {
      console.log('Error al compartir', err);
    }
  };

  const generateOrderMessage = () => {
    const header = `📋 *BORRADOR DE PEDIDO - ${new Date().toLocaleDateString()}*\n\n`;
    const items = cart.map(item => {
      const isWeightBased = item.unit.toLowerCase().includes('kg') || item.unit.toLowerCase().includes('l');
      const weight = getAverageWeight(item.specs.format);
      const detail = isWeightBased ? ` (~${(weight * item.quantity).toFixed(1)}${item.unit})` : '';
      return `• ${item.quantity}x ${item.name}${detail} -> ${calculateItemTotal(item).toFixed(2)}€`;
    }).join('\n');
    const footer = `\n\n*TOTAL ESTIMADO: ${cartTotal.toFixed(2)}€*\n_(Sujeto a pesos reales de recepción)_\n\n_Generado desde ChefCatalog_`;
    return header + items + footer;
  };

  const copyToClipboard = () => {
    const text = generateOrderMessage();
    navigator.clipboard.writeText(text);
    alert("Pedido copiado. Ya puedes pegarlo en WhatsApp o Mail.");
  };

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];
  const getCount = (cat: string) => cat === 'Todos' ? products.length : products.filter(p => p.category === cat).length;
  const filteredProducts = categoryFilter === 'Todos' ? products : products.filter(p => p.category === categoryFilter);

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-32">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-100 px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            <div className="flex items-center">
              {/* LOGO PIRINEOS EXDIM */}
              <svg width="220" height="100" viewBox="0 0 220 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-16 sm:h-20 w-auto">
                <path d="M15 65 L40 20 L65 65" stroke="#1A1A1A" strokeWidth="1" fill="none"/>
                <path d="M15 65 L40 20 L65 65" stroke="#E31E24" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M35 65 L80 5 L125 65 H35Z" fill="#1A1A1A" stroke="#1A1A1A" strokeWidth="1.5"/>
                <path d="M80 5 L102 30 L80 44 L58 30 Z" fill="white" stroke="#1A1A1A" strokeWidth="1"/>
                <path d="M95 65 L135 25 L175 65 H95Z" fill="#00AEEF" stroke="#1A1A1A" strokeWidth="2"/>
                <text x="18" y="84" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="19" fill="#00AEEF" letterSpacing="-0.5">PIRINEOS</text>
                <text x="120" y="84" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="19" fill="#1A1A1A" letterSpacing="-0.5">EXDIM</text>
                <text x="122" y="94" fontFamily="Arial, sans-serif" fontWeight="400" fontSize="9.5" fill="#71717a" letterSpacing="0.4">calidad por naturaleza</text>
              </svg>
            </div>
          </div>

          <div className="flex-grow flex flex-col justify-center items-end text-right overflow-hidden pr-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-stone-900 leading-none truncate w-full">ChefCatalog</h1>
            <div className="flex items-center justify-end gap-1.5 mt-1 sm:mt-1.5">
              <p className="text-[11px] sm:text-[14px] text-stone-400 font-medium italic whitespace-nowrap">Propuesta semanal</p>
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0"></span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={handleShareApp}
              className="p-2.5 rounded-full bg-stone-50 text-stone-500 border border-stone-100 active:scale-90 transition-all"
              title="Compartir Aplicación"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6a3 3 0 100-2.684l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            {cartCount > 0 && (
              <button 
                onClick={() => setShowCartSummary(true)}
                className="bg-stone-900 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-lg"
              >
                <span className="bg-emerald-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px]">{cartCount}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-10">
        <section className="mb-12">
          <h2 className="text-5xl md:text-8xl font-serif text-stone-900 leading-[0.9] tracking-tighter mb-6">
            La Compra <br/>
            <span className="text-stone-300 italic font-light">Profesional</span>
          </h2>
          <div className="h-1 w-20 bg-emerald-600 mb-6"></div>
          <p className="text-stone-500 text-lg md:text-xl leading-relaxed max-w-2xl font-medium">
            Planifica tus pedidos basándote en pesos medios operativos y precios de mercado de Pirineos Exdim.
          </p>
        </section>

        <div className="flex gap-3 mb-12 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`group flex items-center gap-3 px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap border-2 ${
                categoryFilter === cat 
                  ? 'bg-stone-900 border-stone-900 text-white shadow-2xl shadow-stone-200 -translate-y-1' 
                  : 'bg-white border-stone-100 text-stone-400 hover:border-stone-300 hover:text-stone-600'
              }`}
            >
              {cat}
              <span className={`px-2 py-0.5 rounded-md text-[9px] ${
                categoryFilter === cat ? 'bg-white/20 text-white' : 'bg-stone-50 text-stone-400 group-hover:bg-stone-100'
              }`}>
                {getCount(cat as string)}
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-[2rem] h-[450px] animate-pulse border border-stone-100 overflow-hidden shadow-sm">
                <div className="bg-stone-100 h-1/2 w-full"></div>
                <div className="p-8 space-y-4">
                  <div className="h-8 bg-stone-100 rounded-lg w-3/4"></div>
                </div>
              </div>
            ))
          ) : (
            filteredProducts.map((p) => (
              <div key={p.id} className="product-grid-enter">
                <ProductCard product={p} onClick={setSelectedProduct} />
              </div>
            ))
          )}
        </div>
      </main>

      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-lg z-50 animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-stone-900 text-white rounded-[2rem] p-4 flex items-center justify-between shadow-2xl border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-4 pl-4">
              <div className="relative">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-white text-stone-900 text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              </div>
              <div>
                <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest leading-none">Importe Aprox.</p>
                <p className="text-lg font-black tracking-tighter tabular-nums underline decoration-emerald-500/50 decoration-2 underline-offset-4">{cartTotal.toFixed(2)}€</p>
              </div>
            </div>
            <button 
              onClick={() => setShowCartSummary(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
            >
              Revisar Lista
            </button>
          </div>
        </div>
      )}

      {showCartSummary && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-8 border-b border-stone-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-serif text-stone-900">Tu Lista</h3>
                <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mt-1">Basado en pesos medios</p>
              </div>
              <button onClick={() => setShowCartSummary(false)} className="text-stone-300 hover:text-stone-900 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-8 space-y-6">
              {cart.map(item => {
                const isWeightBased = item.unit.toLowerCase().includes('kg') || item.unit.toLowerCase().includes('l');
                const avgWeight = getAverageWeight(item.specs.format);
                const lineTotal = calculateItemTotal(item);
                return (
                  <div key={item.id} className="flex items-center justify-between border-b border-stone-50 pb-4">
                    <div className="flex-grow">
                      <h4 className="font-bold text-stone-900 text-sm leading-tight uppercase">{item.name}</h4>
                      <p className="text-[9px] text-stone-400 font-bold uppercase">
                        {item.price.toFixed(2)}€ / {item.unit} 
                        {isWeightBased && ` (~${avgWeight} ${item.unit})`}
                        <span className="ml-2 text-emerald-600 font-black bg-emerald-50 px-1.5 py-0.5 rounded">
                          {lineTotal.toFixed(2)}€
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-600">-</button>
                      <span className="text-sm font-black w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-600">+</button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-8 bg-stone-50 border-t border-stone-100 space-y-5">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Total Estimado</span>
                <span className="text-3xl font-black text-stone-900 tabular-nums">
                  {cartTotal.toFixed(2)}€
                </span>
              </div>
              <button 
                onClick={copyToClipboard}
                className="w-full bg-stone-900 text-white py-5 rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-3"
              >
                Copiar Borrador de Pedido
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
