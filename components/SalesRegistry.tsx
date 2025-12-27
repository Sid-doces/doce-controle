
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
  UserCheck
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
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-40">
      <div className="flex bg-white p-2 rounded-[28px] border border-gray-100 shadow-sm w-full md:w-fit self-start">
        <button 
          onClick={() => setActiveSubTab('pos')}
          className={`px-10 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeSubTab === 'pos' ? 'bg-pink-500 text-white shadow-lg' : 'text-gray-400'}`}
        >
          <ShoppingCart size={16} /> Vitrine
        </button>
        <button 
          onClick={() => setActiveSubTab('history')}
          className={`px-10 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeSubTab === 'history' ? 'bg-pink-500 text-white shadow-lg' : 'text-gray-400'}`}
        >
          <History size={16} /> Relatórios
        </button>
      </div>

      {activeSubTab === 'pos' ? (
        <>
          <header>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">Ponto de Venda</h1>
            <p className="text-gray-500 font-medium italic">Selecione os doces para iniciar o pedido.</p>
          </header>

          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-pink-500 transition-colors" size={20} />
            <input 
              type="text" placeholder="Buscar doce na vitrine..."
              className="w-full pl-16 pr-8 py-5 rounded-[30px] border-2 border-transparent bg-white text-gray-800 font-bold focus:bg-white focus:border-pink-500 shadow-sm outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 min-h-[200px]">
            {filteredProducts.map(p => {
              const cartItem = cart.find(item => item.product.id === p.id);
              const isOutOfStock = p.quantity <= 0;
              
              return (
                <button
                  key={p.id}
                  disabled={isOutOfStock}
                  onClick={() => addToCart(p)}
                  className={`flex flex-col bg-white rounded-[35px] border-2 transition-all relative overflow-hidden shadow-sm text-left active:scale-[0.96] ${
                    cartItem ? 'border-pink-500 shadow-pink-50' : 'border-transparent hover:border-pink-100'
                  } ${isOutOfStock ? 'opacity-60 grayscale cursor-not-allowed' : ''}`}
                >
                  <div className="relative h-36 bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="p-4 bg-pink-50 text-pink-200"><UtensilsCrossed size={40} /></div>
                    )}
                    {cartItem && (
                       <div className="absolute top-4 right-4 bg-pink-500 text-white px-3.5 py-1.5 rounded-full font-black text-[11px] shadow-xl animate-in zoom-in">
                        {cartItem.quantity}x
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-black text-gray-800 text-xs leading-tight mb-1 line-clamp-1">{p.name}</h3>
                    <span className="text-base font-black text-pink-500 mb-5">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}
                    </span>
                    {cartItem ? (
                      <div className="flex items-center justify-between bg-pink-50 rounded-2xl p-2">
                        <div onClick={(e) => updateCartQuantity(p.id, -1, e)} className="w-9 h-9 flex items-center justify-center bg-white text-pink-500 rounded-xl shadow-sm"><Minus size={16} /></div>
                        <span className="font-black text-sm text-pink-700 px-3">{cartItem.quantity}</span>
                        <div onClick={(e) => updateCartQuantity(p.id, 1, e)} className="w-9 h-9 flex items-center justify-center bg-white text-pink-500 rounded-xl shadow-sm"><Plus size={16} /></div>
                      </div>
                    ) : (
                      <div className="w-full py-3.5 bg-gray-50 text-gray-400 font-black text-[10px] uppercase tracking-[0.15em] rounded-2xl flex items-center justify-center gap-2">
                        {isOutOfStock ? 'Esgotado' : '+ Adicionar'}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {cart.length > 0 && (
            <div className="fixed bottom-[100px] left-4 right-4 md:left-[280px] md:right-8 animate-in slide-in-from-bottom-10 duration-700 z-[150]">
               <button 
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full bg-gray-900 text-white p-6 rounded-[35px] shadow-2xl flex items-center justify-between group hover:bg-black active:scale-[0.98] transition-all"
               >
                  <div className="flex items-center gap-5">
                     <div className="w-14 h-14 bg-pink-500 rounded-2xl flex items-center justify-center relative shadow-lg">
                        <ShoppingCart size={24} />
                        <span className="absolute -top-2 -right-2 bg-white text-pink-500 w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shadow-xl">{totalItems}</span>
                     </div>
                     <div className="text-left">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Total no Carrinho</p>
                        <p className="text-2xl font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCart)}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 font-black text-xs uppercase tracking-widest bg-pink-500 px-7 py-4 rounded-2xl group-hover:gap-5 transition-all">Revisar <ChevronRight size={18} /></div>
               </button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          <header>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">Histórico de Vendas</h1>
            <p className="text-gray-500 font-medium italic">Confira as movimentações recentes do seu caixa.</p>
          </header>

          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-pink-500 transition-colors" size={20} />
            <input 
              type="text" placeholder="Filtrar por doce ou vendedor..."
              className="w-full pl-16 pr-8 py-5 rounded-[30px] border-2 border-transparent bg-white text-gray-800 font-bold focus:bg-white focus:border-pink-500 shadow-sm outline-none transition-all"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            {filteredSales.map(sale => (
              <div key={sale.id} className="bg-white p-7 rounded-[35px] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 group hover:border-pink-200 transition-all">
                <div className="flex items-center gap-6">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
                      sale.paymentMethod === 'PIX' ? 'bg-emerald-50 text-emerald-500' : 
                      sale.paymentMethod === 'Dinheiro' ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-500'
                   }`}>
                      {sale.paymentMethod === 'PIX' ? <QrCode size={30}/> : 
                       sale.paymentMethod === 'Dinheiro' ? <Banknote size={30}/> : <CreditCard size={30}/>}
                   </div>
                   <div>
                      <h3 className="font-black text-gray-800 text-sm leading-tight">{sale.productName}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                          <Calendar size={11} /> {new Date(sale.date).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-[10px] font-black text-pink-500 bg-pink-50 px-2.5 py-1 rounded-full uppercase tracking-widest border border-pink-100">{sale.quantity}x</span>
                        {sale.sellerName && (
                          <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-widest border border-indigo-100 flex items-center gap-1">
                             <UserCheck size={10} /> {sale.sellerName}
                          </span>
                        )}
                      </div>
                   </div>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-8">
                   <div className="text-right">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Faturado</p>
                      <p className="text-xl font-black text-gray-800 tracking-tight">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.total)}</p>
                   </div>
                   {canRefund && (
                     <button onClick={() => handleRefundSale(sale)} className="w-12 h-12 flex items-center justify-center bg-gray-50 text-gray-300 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all">
                       <RotateCcw size={20} />
                     </button>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md z-[200] flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <header className="p-10 pb-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <button onClick={() => setIsCheckoutOpen(false)} className="p-3 bg-gray-50 text-gray-400 hover:text-gray-600 rounded-2xl transition-all"><ArrowLeft size={24} /></button>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight leading-none">Checkout</h2>
              </div>
              <button onClick={() => { if(confirm("Esvaziar carrinho?")) setCart([]); }} className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-red-500">Limpar</button>
            </header>

            <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-5 custom-scrollbar">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-5 bg-gray-50/40 p-5 rounded-[30px] border border-gray-100">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                    {item.product.image ? (
                      <img src={item.product.image} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-pink-50 flex items-center justify-center text-pink-200"><ShoppingBag size={24}/></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-gray-800 text-sm truncate leading-tight">{item.product.name}</h4>
                    <p className="text-sm font-black text-pink-500 mt-1">{item.quantity}x {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.product.price)}</p>
                  </div>
                  <div className="flex items-center bg-white rounded-2xl border border-gray-100 p-1.5 shadow-sm">
                    <button onClick={(e) => updateCartQuantity(item.product.id, -1, e)} className="p-2 text-gray-400 hover:text-pink-500"><Minus size={16} /></button>
                    <button onClick={(e) => updateCartQuantity(item.product.id, 1, e)} className="p-2 text-gray-400 hover:text-pink-500"><Plus size={16} /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-10 bg-gray-50/50 border-t border-gray-100 space-y-8 shrink-0">
              <div className="space-y-4">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] ml-1">Forma de Pagamento</span>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'PIX', icon: QrCode },
                    { id: 'Dinheiro', icon: Banknote },
                    { id: 'Cartão', icon: CreditCard },
                    { id: 'iFood', icon: ShoppingBag }
                  ].map(method => (
                    <button 
                      key={method.id} 
                      onClick={() => { setPaymentMethod(method.id as PaymentMethod); if(method.id !== 'Dinheiro') setAmountReceived(undefined); }}
                      className={`flex items-center gap-4 p-5 rounded-[24px] border-2 transition-all ${
                        paymentMethod === method.id ? 'bg-white border-pink-500 text-pink-600 shadow-xl' : 'bg-white text-gray-400 border-gray-50'
                      }`}
                    >
                      <method.icon size={20} />
                      <span className="font-black text-[10px] uppercase tracking-widest">{method.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'Dinheiro' && (
                <div className="space-y-4 animate-in slide-in-from-top-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Quanto recebeu?</label>
                  <input 
                    type="number" step="any" placeholder="R$ 0,00"
                    className="w-full px-8 py-5 rounded-[28px] border-2 border-gray-100 bg-white text-gray-800 font-black text-3xl outline-none focus:border-pink-500 shadow-sm"
                    value={amountReceived ?? ''}
                    onChange={(e) => setAmountReceived(e.target.value === '' ? undefined : Number(e.target.value))}
                  />
                  {amountReceived !== undefined && (
                    <div className="flex justify-between items-center px-4 bg-emerald-50 py-3 rounded-2xl border border-emerald-100">
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Troco:</span>
                      <span className="text-2xl font-black text-emerald-500">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.max(0, changeAmount))}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-center text-gray-800 font-black">
                  <span className="text-xl">Total do Pedido</span>
                  <span className="text-4xl text-pink-600 tracking-tighter">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCart)}
                  </span>
                </div>
                <button 
                  disabled={cart.length === 0}
                  onClick={handleFinalizeSale}
                  className="w-full py-6 rounded-[35px] bg-emerald-500 text-white font-black text-xl shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                >
                  Concluir Venda <ArrowRight size={24} />
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
