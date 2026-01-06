
import React, { useState, useMemo } from 'react';
import { AppState, PaymentMethod, Product, Sale, Customer } from '../types';
import { ShoppingBag, CheckCircle2, Search, Banknote, X, Minus, Plus, ShoppingCart, ChevronRight, ArrowLeft, CreditCard, QrCode, History, RotateCcw, Calendar, Sparkles, ArrowRight, UtensilsCrossed, UserCheck, Share2, User, UserPlus } from 'lucide-react';

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
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [isSuccess, setIsSuccess] = useState(false);

  const [quickCustomer, setQuickCustomer] = useState({ name: '', phone: '' });

  const filteredProducts = useMemo(() => {
    return state.products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [state.products, searchTerm]);

  const filteredSales = useMemo(() => {
    return state.sales
      .filter(s => s.productName.toLowerCase().includes(historySearch.toLowerCase()) || (s.sellerName && s.sellerName.toLowerCase().includes(historySearch.toLowerCase())))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.sales, historySearch]);

  const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const totalCart = subtotal;
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
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

  const handleQuickCustomerSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCustomer.name || !quickCustomer.phone) return;
    
    const newId = Math.random().toString(36).substr(2, 9);
    const customer: Customer = {
      id: newId,
      companyId: state.user?.companyId || '',
      name: quickCustomer.name,
      phone: quickCustomer.phone,
      purchaseCount: 0
    };
    
    setState(prev => ({ ...prev, customers: [customer, ...(prev.customers || [])] }));
    setSelectedCustomerId(newId);
    setShowQuickCustomerModal(false);
    setQuickCustomer({ name: '', phone: '' });
  };

  const handleFinalizeSale = () => {
    if (cart.length === 0) return;

    const saleDate = new Date().toISOString();
    const currentEmail = state.user?.email.toLowerCase().trim() || '';
    const userRole = state.user?.role || 'Dono';
    const isSeller = userRole === 'Vendedor' || userRole === 'Auxiliar';
    
    const collab = state.collaborators.find(c => c.email.toLowerCase().trim() === currentEmail);
    const commissionRate = collab?.commissionRate ?? (state.settings?.commissionRate || 0);

    const newSales: Sale[] = cart.map(item => ({
      id: Math.random().toString(36).substr(2, 9),
      companyId: state.user?.companyId || '',
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      total: (item.product.price * item.quantity),
      discount: 0,
      costUnitary: item.product.cost,
      paymentMethod: paymentMethod,
      date: saleDate,
      sellerId: currentEmail,
      sellerName: isSeller ? (state.user?.name || currentEmail.split('@')[0]) : 'Proprietário',
      commissionValue: isSeller ? ((item.product.price * item.quantity) * commissionRate) / 100 : 0,
      customerId: selectedCustomerId || undefined
    }));

    setState(prev => {
      const updatedProducts = prev.products.map(p => {
        const cartItem = cart.find(ci => ci.product.id === p.id);
        return cartItem ? { ...p, quantity: Math.max(0, p.quantity - cartItem.quantity) } : p;
      });

      const updatedCustomers = prev.customers.map(c => {
        if (c.id === selectedCustomerId) {
          return { ...c, purchaseCount: (c.purchaseCount || 0) + 1 };
        }
        return c;
      });

      return {
        ...prev,
        sales: [...newSales, ...prev.sales],
        products: updatedProducts,
        customers: updatedCustomers
      };
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsCheckoutOpen(false);
      setCart([]);
      setSelectedCustomerId('');
    }, 2000); 
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-40">
      {isSuccess ? (
        <div className="flex flex-col items-center justify-center py-32 animate-in zoom-in duration-500">
           <div className="w-28 h-28 bg-emerald-50 text-emerald-500 rounded-[40px] flex items-center justify-center mb-8 shadow-2xl shadow-emerald-100">
             <CheckCircle2 size={64} strokeWidth={2.5} />
           </div>
           <h2 className="text-4xl font-black text-gray-800 text-center tracking-tighter">Venda Sucesso!</h2>
           <p className="text-gray-400 font-bold mt-3 italic text-lg flex items-center gap-2">Tudo pronto para o próximo pedido <Sparkles size={20} className="text-amber-400" /></p>
        </div>
      ) : (
        <>
          <div className="flex bg-white p-1.5 rounded-[24px] border border-gray-100 shadow-sm w-full md:w-fit self-start">
            <button onClick={() => setActiveSubTab('pos')} className={`flex-1 md:flex-none px-8 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'pos' ? 'bg-pink-500 text-white shadow-lg' : 'text-gray-400'}`}>Vitrine</button>
            <button onClick={() => setActiveSubTab('history')} className={`flex-1 md:flex-none px-8 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'history' ? 'bg-pink-500 text-white shadow-lg' : 'text-gray-400'}`}>Histórico</button>
          </div>

          {activeSubTab === 'pos' ? (
            <>
              <div className="relative group mx-1">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input type="text" placeholder="Buscar na vitrine..." className="w-full pl-16 pr-8 py-4 rounded-[28px] border-2 border-transparent bg-white text-gray-800 font-bold focus:border-pink-500 shadow-sm outline-none transition-all text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 px-1">
                {filteredProducts.map(p => {
                  const cartItem = cart.find(item => item.product.id === p.id);
                  const isOutOfStock = p.quantity <= 0;
                  return (
                    <button key={p.id} disabled={isOutOfStock} onClick={() => addToCart(p)} className={`flex flex-col bg-white rounded-[32px] border-2 relative overflow-hidden shadow-sm text-left active:scale-[0.96] ${cartItem ? 'border-pink-500 shadow-pink-50' : 'border-transparent hover:border-pink-100'} ${isOutOfStock ? 'opacity-60 grayscale cursor-not-allowed' : ''}`}>
                      <div className="h-32 bg-gray-50 flex items-center justify-center">{p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <UtensilsCrossed size={32} className="text-pink-100" />}</div>
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="font-black text-gray-800 text-[11px] leading-tight mb-1 line-clamp-2">{p.name}</h3>
                        <span className="text-sm font-black text-pink-500 mb-3">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}</span>
                        {cartItem ? (
                          <div className="flex items-center justify-between bg-pink-50 rounded-xl p-1 mt-auto">
                            <div onClick={(e) => updateCartQuantity(p.id, -1, e)} className="w-8 h-8 flex items-center justify-center bg-white text-pink-500 rounded-lg shadow-sm"><Minus size={14} /></div>
                            <span className="font-black text-xs text-pink-700 px-2">{cartItem.quantity}</span>
                            <div onClick={(e) => updateCartQuantity(p.id, 1, e)} className="w-8 h-8 flex items-center justify-center bg-white text-pink-500 rounded-lg shadow-sm"><Plus size={14} /></div>
                          </div>
                        ) : <div className="w-full py-2 bg-gray-50 text-gray-400 font-black text-[9px] uppercase tracking-widest rounded-xl text-center mt-auto">{isOutOfStock ? 'Esgotado' : '+ Adicionar'}</div>}
                      </div>
                    </button>
                  );
                })}
              </div>

              {cart.length > 0 && (
                <div className="fixed bottom-[95px] left-4 right-4 md:left-[280px] md:right-8 animate-in slide-in-from-bottom-10 duration-500 z-[150]">
                  <button onClick={() => setIsCheckoutOpen(true)} className="w-full bg-gray-900 text-white p-5 rounded-[32px] shadow-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-pink-500 rounded-2xl flex items-center justify-center relative shadow-lg">
                        <ShoppingCart size={20} />
                        <span className="absolute -top-1.5 -right-1.5 bg-white text-pink-500 w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px]">{totalItems}</span>
                      </div>
                      <p className="text-xl font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCart)}</p>
                    </div>
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest bg-pink-500 px-6 py-3.5 rounded-2xl">Finalizar <ChevronRight size={16} /></div>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4 px-1">
               <div className="relative group mb-4">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input type="text" placeholder="Filtrar por produto ou vendedor..." className="w-full pl-14 pr-8 py-3 rounded-[20px] bg-white text-gray-800 font-bold focus:border-pink-500 shadow-sm outline-none transition-all text-xs" value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} />
              </div>
               {filteredSales.map(sale => (
                 <div key={sale.id} className="bg-white p-5 rounded-[30px] border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                       <h3 className="font-black text-gray-800 text-[13px]">{sale.productName}</h3>
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                          <User size={10}/> {sale.sellerName || 'Proprietário'} • {new Date(sale.date).toLocaleDateString('pt-BR')} • {sale.quantity}x
                       </p>
                    </div>
                    <div className="text-right">
                       <p className="text-lg font-black text-gray-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.total)}</p>
                       <p className="text-[8px] font-black text-pink-500 uppercase">{sale.paymentMethod}</p>
                    </div>
                 </div>
               ))}
               {filteredSales.length === 0 && <p className="py-20 text-center text-gray-300 font-black italic">Nenhuma venda encontrada.</p>}
            </div>
          )}
        </>
      )}

      {/* MODAL CHECKOUT */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md z-[200] flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <header className="p-8 pb-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setIsCheckoutOpen(false)} className="p-3 bg-gray-50 text-gray-400 rounded-xl"><ArrowLeft size={20} /></button>
                <h2 className="text-xl font-black text-gray-800 tracking-tight">Checkout Final</h2>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="space-y-3">
                 <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1"><User size={10}/> Cliente (Perfil Fidelidade)</label>
                    <button 
                      onClick={() => setShowQuickCustomerModal(true)}
                      className="text-[10px] font-black text-pink-500 uppercase flex items-center gap-1 hover:underline"
                    >
                      <UserPlus size={12}/> Novo Perfil
                    </button>
                 </div>
                 <select 
                   className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-bold outline-none focus:border-pink-500 transition-all h-[62px]"
                   value={selectedCustomerId}
                   onChange={e => setSelectedCustomerId(e.target.value)}
                 >
                   <option value="">Consumidor Final (Sem Vínculo)</option>
                   {state.customers?.map(c => (
                     <option key={c.id} value={c.id}>
                       {c.name} ({(c.purchaseCount || 0)} vendas)
                     </option>
                   ))}
                 </select>
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Itens Selecionados</label>
                 {cart.map(item => (
                    <div key={item.product.id} className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                      <div className="font-black text-gray-700 text-xs truncate max-w-[150px]">{item.quantity}x {item.product.name}</div>
                      <div className="font-black text-pink-500 text-xs whitespace-nowrap">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.product.price * item.quantity)}</div>
                    </div>
                 ))}
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Forma de Pagamento</label>
                 <div className="grid grid-cols-2 gap-2">
                    {['PIX', 'Dinheiro', 'Cartão', 'iFood'].map(m => (
                      <button key={m} onClick={() => setPaymentMethod(m as any)} className={`p-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${paymentMethod === m ? 'border-pink-500 bg-pink-50 text-pink-600 shadow-sm' : 'border-gray-50 text-gray-400 bg-gray-50/30'}`}>{m}</button>
                    ))}
                 </div>
              </div>
            </div>

            <div className="p-8 bg-gray-50/80 border-t border-gray-100 shrink-0">
              <div className="flex justify-between items-center mb-6 px-1">
                <span className="text-lg font-black text-gray-800">Total Pago</span>
                <span className="text-3xl font-black text-emerald-600 tracking-tighter">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCart)}</span>
              </div>
              <button onClick={handleFinalizeSale} className="w-full py-5 bg-pink-500 text-white rounded-[30px] font-black text-lg shadow-xl shadow-pink-100 hover:bg-pink-600 active:scale-95 transition-all flex items-center justify-center gap-3">Confirmar Venda <ArrowRight size={22} /></button>
            </div>
          </div>
        </div>
      )}

      {showQuickCustomerModal && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <form onSubmit={handleQuickCustomerSave} className="bg-white w-full max-sm p-10 rounded-[45px] shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-gray-800 mb-6">Cadastrar Cliente</h2>
            <div className="space-y-4">
              <input type="text" required placeholder="Nome do Cliente" className="w-full p-5 bg-gray-50 rounded-2xl border-none font-bold" value={quickCustomer.name} onChange={e => setQuickCustomer({...quickCustomer, name: e.target.value})} />
              <input type="tel" required placeholder="WhatsApp" className="w-full p-5 bg-gray-50 rounded-2xl border-none font-bold" value={quickCustomer.phone} onChange={e => setQuickCustomer({...quickCustomer, phone: e.target.value})} />
            </div>
            <div className="flex gap-4 mt-10">
              <button type="button" onClick={() => setShowQuickCustomerModal(false)} className="flex-1 py-4 text-gray-400 font-black text-[10px] uppercase tracking-widest">Sair</button>
              <button type="submit" className="flex-[2] py-5 bg-indigo-500 text-white rounded-[28px] font-black shadow-xl shadow-indigo-100 uppercase tracking-widest text-xs">Salvar Perfil</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SalesRegistry;
