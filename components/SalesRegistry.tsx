
import React, { useState, useMemo } from 'react';
import { AppState, PaymentMethod, Product, Sale } from '../types';
import { 
  ShoppingBag, 
  CheckCircle2, 
  Search, 
  Banknote, 
  X, 
  Minus, 
  Plus, 
  ShoppingCart, 
  ChevronRight, 
  ArrowLeft,
  CreditCard,
  QrCode,
  History,
  RotateCcw,
  Calendar,
  Sparkles,
  ArrowRight,
  UtensilsCrossed,
  UserCheck,
  Share2
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

interface SalesRegistryProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const SalesRegistry: React.FC<SalesRegistryProps> = ({ state, setState }) => {
  const [activeSubTab, setActiveSubTab] = useState<'pos' | 'history'>('pos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [amountReceived, setAmountReceived] = useState<number | undefined>(undefined);
  const [isSuccess, setIsSuccess] = useState(false);

  const canRefund = state.user?.role !== 'Vendedor';

  const filteredProducts = useMemo(() => {
    return state.products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [state.products, searchTerm]);

  const filteredSales = useMemo(() => {
    return state.sales
      .filter(s => s.productName.toLowerCase().includes(historySearch.toLowerCase()) || (s.sellerName && s.sellerName.toLowerCase().includes(historySearch.toLowerCase())))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.sales, historySearch]);

  const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const totalCart = subtotal;
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const changeAmount = (amountReceived || 0) - totalCart;

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
        );
      }
      return [...prev, { product, quantity: 1, discount: 0 }];
    });
  };

  const shareReceipt = (sale: Sale) => {
    const message = `*RECIBO DE VENDA - DOCE CONTROLE* 🧁%0A%0A🎂 *Produto:* ${sale.productName}%0A🔢 *Quantidade:* ${sale.quantity}%0A💰 *Total:* ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.total)}%0A💳 *Pagamento:* ${sale.paymentMethod}%0A📅 *Data:* ${new Date(sale.date).toLocaleDateString('pt-BR')}%0A%0A*Obrigado pela preferência!* ✨`;
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const updateCartQuantity = (productId: string, delta: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleFinalizeSale = () => {
    if (cart.length === 0) return;

    const saleDate = new Date().toISOString();
    const isSeller = state.user?.role === 'Vendedor';
    const commissionRate = state.settings?.commissionRate || 0;

    const newSales: Sale[] = cart.map(item => {
      const total = (item.product.price * item.quantity);
      const commission = isSeller ? (total * commissionRate) / 100 : 0;
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        total: total,
        discount: 0,
        costUnitary: item.product.cost,
        paymentMethod: paymentMethod,
        date: saleDate,
        sellerId: isSeller ? state.user?.email : undefined,
        sellerName: isSeller ? state.user?.email.split('@')[0] : undefined,
        commissionValue: commission
      };
    });

    setState(prev => {
      const updatedProducts = prev.products.map(p => {
        const cartItem = cart.find(ci => ci.product.id === p.id);
        return cartItem ? { ...p, quantity: Math.max(0, p.quantity - cartItem.quantity) } : p;
      });

      return {
        ...prev,
        sales: [...newSales, ...prev.sales],
        products: updatedProducts
      };
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsCheckoutOpen(false);
      setCart([]);
      setAmountReceived(undefined);
    }, 3000); 
  };

  const handleRefundSale = (sale: Sale) => {
    if (!canRefund) return;
    
    const confirmRefund = window.confirm(
      `Deseja estornar a venda de "${sale.productName}"?`
    );

    if (confirmRefund) {
      setState(prev => {
        const updatedProducts = prev.products.map(p => {
          if (p.id === sale.productId) {
            return { ...p, quantity: p.quantity + sale.quantity };
          }
          return p;
        });
        return {
          ...prev,
          products: updatedProducts,
          sales: prev.sales.filter(s => s.id !== sale.id)
        };
      });
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-32 animate-in zoom-in duration-500 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(25)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-2 h-2 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#EC4899', '#10B981', '#F59E0B', '#6366F1', '#8B5CF6'][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.5,
              }}
            ></div>
          ))}
        </div>
        
        <div className="w-28 h-28 bg-emerald-50 text-emerald-500 rounded-[40px] flex items-center justify-center mb-8 shadow-2xl shadow-emerald-100 relative z-10">
          <CheckCircle2 size={64} strokeWidth={2.5} />
        </div>
        <h2 className="text-4xl font-black text-gray-800 text-center tracking-tighter relative z-10">Venda Sucesso!</h2>
        <p className="text-gray-400 font-bold mt-3 italic relative z-10 flex items-center gap-2 text-lg">
          Tudo pronto para o próximo pedido <Sparkles size={20} className="text-amber-400 animate-pulse" />
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-40">
      <div className="flex bg-white p-1.5 rounded-[24px] border border-gray-100 shadow-sm w-full md:w-fit self-start">
        <button 
          onClick={() => setActiveSubTab('pos')}
          className={`flex-1 md:flex-none px-8 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeSubTab === 'pos' ? 'bg-pink-500 text-white shadow-lg' : 'text-gray-400'}`}
        >
          <ShoppingCart size={14} /> Vitrine
        </button>
        <button 
          onClick={() => setActiveSubTab('history')}
          className={`flex-1 md:flex-none px-8 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeSubTab === 'history' ? 'bg-pink-500 text-white shadow-lg' : 'text-gray-400'}`}
        >
          <History size={14} /> Histórico
        </button>
      </div>

      {activeSubTab === 'pos' ? (
        <>
          <header className="px-1">
            <h1 className="text-2xl font-black text-gray-800 tracking-tight leading-none">Ponto de Venda</h1>
            <p className="text-gray-500 text-sm font-medium italic mt-1">Selecione os doces desejados.</p>
          </header>

          <div className="relative group mx-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-pink-500 transition-colors" size={20} />
            <input 
              type="text" placeholder="Buscar na vitrine..."
              className="w-full pl-16 pr-8 py-4 rounded-[28px] border-2 border-transparent bg-white text-gray-800 font-bold focus:bg-white focus:border-pink-500 shadow-sm outline-none transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 px-1 min-h-[200px]">
            {filteredProducts.map(p => {
              const cartItem = cart.find(item => item.product.id === p.id);
              const isOutOfStock = p.quantity <= 0;
              
              return (
                <button
                  key={p.id}
                  disabled={isOutOfStock}
                  onClick={() => addToCart(p)}
                  className={`flex flex-col bg-white rounded-[32px] border-2 transition-all relative overflow-hidden shadow-sm text-left active:scale-[0.96] ${
                    cartItem ? 'border-pink-500 shadow-pink-50' : 'border-transparent hover:border-pink-100'
                  } ${isOutOfStock ? 'opacity-60 grayscale cursor-not-allowed' : ''}`}
                >
                  <div className="relative h-32 bg-gray-50 flex items-center justify-center overflow-hidden">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="p-4 bg-pink-50 text-pink-200"><UtensilsCrossed size={32} /></div>
                    )}
                    {cartItem && (
                       <div className="absolute top-3 right-3 bg-pink-500 text-white px-3 py-1 rounded-full font-black text-[10px] shadow-lg">
                        {cartItem.quantity}x
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-black text-gray-800 text-[11px] leading-tight mb-1 line-clamp-2">{p.name}</h3>
                    <span className="text-sm font-black text-pink-500 mb-3">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}
                    </span>
                    {cartItem ? (
                      <div className="flex items-center justify-between bg-pink-50 rounded-xl p-1 mt-auto">
                        <div onClick={(e) => updateCartQuantity(p.id, -1, e)} className="w-8 h-8 flex items-center justify-center bg-white text-pink-500 rounded-lg shadow-sm"><Minus size={14} /></div>
                        <span className="font-black text-xs text-pink-700 px-2">{cartItem.quantity}</span>
                        <div onClick={(e) => updateCartQuantity(p.id, 1, e)} className="w-8 h-8 flex items-center justify-center bg-white text-pink-500 rounded-lg shadow-sm"><Plus size={14} /></div>
                      </div>
                    ) : (
                      <div className="w-full py-2 bg-gray-50 text-gray-400 font-black text-[9px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-1 mt-auto">
                        {isOutOfStock ? 'Esgotado' : '+ Adicionar'}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {cart.length > 0 && (
            <div className="fixed bottom-[95px] left-4 right-4 md:left-[280px] md:right-8 animate-in slide-in-from-bottom-10 duration-500 z-[150]">
               <button 
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full bg-gray-900 text-white p-5 rounded-[32px] shadow-2xl flex items-center justify-between group hover:bg-black active:scale-[0.98] transition-all"
               >
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-pink-500 rounded-2xl flex items-center justify-center relative shadow-lg">
                        <ShoppingCart size={20} />
                        <span className="absolute -top-1.5 -right-1.5 bg-white text-pink-500 w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] shadow-xl">{totalItems}</span>
                     </div>
                     <div className="text-left">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">Total Carrinho</p>
                        <p className="text-xl font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCart)}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest bg-pink-500 px-6 py-3.5 rounded-2xl">Revisar <ChevronRight size={16} /></div>
               </button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300 px-1">
          <header>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight leading-none">Histórico de Vendas</h1>
            <p className="text-gray-500 text-sm font-medium italic mt-1">Movimentações recentes do seu caixa.</p>
          </header>

          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-pink-500 transition-colors" size={20} />
            <input 
              type="text" placeholder="Filtrar por produto ou vendedor..."
              className="w-full pl-16 pr-8 py-4 rounded-[28px] border-2 border-transparent bg-white text-gray-800 font-bold focus:bg-white focus:border-pink-500 shadow-sm outline-none transition-all text-sm"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {filteredSales.map(sale => (
              <div key={sale.id} className="bg-white p-5 rounded-[30px] border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-pink-200 transition-all">
                <div className="flex items-center gap-5">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm shrink-0 ${
                      sale.paymentMethod === 'PIX' ? 'bg-emerald-50 text-emerald-500' : 
                      sale.paymentMethod === 'Dinheiro' ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-500'
                   }`}>
                      {sale.paymentMethod === 'PIX' ? <QrCode size={24}/> : 
                       sale.paymentMethod === 'Dinheiro' ? <Banknote size={24}/> : <CreditCard size={24}/>}
                   </div>
                   <div className="min-w-0">
                      <h3 className="font-black text-gray-800 text-[13px] leading-tight truncate">{sale.productName}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                          <Calendar size={10} /> {new Date(sale.date).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-[9px] font-black text-pink-500 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100">{sale.quantity}x</span>
                        {sale.sellerName && (
                          <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1">
                             <UserCheck size={9} /> {sale.sellerName}
                          </span>
                        )}
                      </div>
                   </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0">
                   <div className="text-right mr-3">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total</p>
                      <p className="text-lg font-black text-gray-800 tracking-tight">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.total)}</p>
                   </div>
                   <div className="flex gap-2">
                     <button onClick={() => shareReceipt(sale)} className="w-10 h-10 flex items-center justify-center bg-emerald-50 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shrink-0">
                       <Share2 size={18} />
                     </button>
                     {canRefund && (
                       <button onClick={() => handleRefundSale(sale)} className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-300 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all shrink-0">
                         <RotateCcw size={18} />
                       </button>
                     )}
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md z-[200] flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <header className="p-8 pb-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setIsCheckoutOpen(false)} className="p-3 bg-gray-50 text-gray-400 hover:text-gray-600 rounded-xl transition-all"><ArrowLeft size={20} /></button>
                <h2 className="text-xl font-black text-gray-800 tracking-tight leading-none">Checkout</h2>
              </div>
              <button onClick={() => { if(confirm("Esvaziar carrinho?")) { setCart([]); setIsCheckoutOpen(false); } }} className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-red-500">Limpar</button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 custom-scrollbar">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-4 bg-gray-50/40 p-4 rounded-[28px] border border-gray-100">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-sm border border-white">
                    {item.product.image ? (
                      <img src={item.product.image} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-pink-50 flex items-center justify-center text-pink-200"><ShoppingBag size={20}/></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-gray-800 text-xs truncate leading-tight mb-1">{item.product.name}</h4>
                    <p className="text-xs font-black text-pink-500">{item.quantity}x {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.product.price)}</p>
                  </div>
                  <div className="flex items-center bg-white rounded-xl border border-gray-100 p-1 shadow-sm shrink-0">
                    <button onClick={(e) => updateCartQuantity(item.product.id, -1, e)} className="p-2 text-gray-300 hover:text-pink-500"><Minus size={14} /></button>
                    <button onClick={(e) => updateCartQuantity(item.product.id, 1, e)} className="p-2 text-gray-300 hover:text-pink-500"><Plus size={14} /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 bg-gray-50/80 border-t border-gray-100 space-y-6 shrink-0">
              <div className="space-y-3">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.25em] ml-1">Forma de Pagamento</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'PIX', icon: QrCode },
                    { id: 'Dinheiro', icon: Banknote },
                    { id: 'Cartão', icon: CreditCard },
                    { id: 'iFood', icon: ShoppingBag }
                  ].map(method => (
                    <button 
                      key={method.id} 
                      onClick={() => { setPaymentMethod(method.id as PaymentMethod); if(method.id !== 'Dinheiro') setAmountReceived(undefined); }}
                      className={`flex items-center gap-3 p-4 rounded-[20px] border-2 transition-all ${
                        paymentMethod === method.id ? 'bg-white border-pink-500 text-pink-600 shadow-lg' : 'bg-white text-gray-400 border-gray-50'
                      }`}
                    >
                      <method.icon size={18} />
                      <span className="font-black text-[9px] uppercase tracking-widest">{method.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'Dinheiro' && (
                <div className="space-y-3 animate-in slide-in-from-top-4">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Valor Recebido</label>
                  <input 
                    type="number" step="any" placeholder="R$ 0,00"
                    className="w-full px-6 py-4 rounded-[24px] border-2 border-gray-100 bg-white text-gray-800 font-black text-2xl outline-none focus:border-pink-500 shadow-sm"
                    value={amountReceived ?? ''}
                    onChange={(e) => setAmountReceived(e.target.value === '' ? undefined : Number(e.target.value))}
                  />
                  {amountReceived !== undefined && (
                    <div className="flex justify-between items-center px-5 bg-emerald-50 py-3 rounded-2xl border border-emerald-100">
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Troco:</span>
                      <span className="text-xl font-black text-emerald-500">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.max(0, changeAmount))}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-center text-gray-800 font-black px-1">
                  <span className="text-lg">Total</span>
                  <span className="text-3xl text-pink-600 tracking-tighter">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCart)}
                  </span>
                </div>
                <button 
                  disabled={cart.length === 0}
                  onClick={handleFinalizeSale}
                  className="w-full py-5 rounded-[30px] bg-emerald-500 text-white font-black text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                >
                  Confirmar Venda <ArrowRight size={22} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesRegistry;
