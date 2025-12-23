
import React, { useState } from 'react';
import { AppState, PaymentMethod } from '../types';
import { ShoppingBag, CheckCircle2, Search, Banknote, Tag, TrendingUp, X, Minus, Plus } from 'lucide-react';

interface SalesRegistryProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const SalesRegistry: React.FC<SalesRegistryProps> = ({ state, setState }) => {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number | undefined>(1);
  const [payment, setPayment] = useState<PaymentMethod>('PIX');
  const [discount, setDiscount] = useState<number | undefined>(undefined);
  const [amountReceived, setAmountReceived] = useState<number | undefined>(undefined);
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = state.products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const product = state.products.find(p => p.id === selectedProduct);
  const currentQuantity = quantity || 0;
  const currentDiscount = discount || 0;
  const subtotal = (product?.price || 0) * currentQuantity;
  const totalSale = Math.max(0, subtotal - currentDiscount);
  const currentAmountReceived = amountReceived || 0;
  const changeAmount = currentAmountReceived - totalSale;

  const today = new Date().toISOString().split('T')[0];
  const todayTotal = state.sales
    .filter(s => s.date.startsWith(today))
    .reduce((acc, s) => acc + s.total, 0);

  const handleSale = () => {
    if (!product || !currentQuantity) return;

    const newSale = {
      id: Math.random().toString(36).substr(2, 9),
      productId: product.id,
      productName: product.name,
      quantity: currentQuantity,
      total: totalSale,
      discount: currentDiscount,
      costUnitary: product.cost,
      paymentMethod: payment,
      date: new Date().toISOString()
    };

    setState(prev => {
      const updatedProducts = prev.products.map(p => 
        p.id === product.id ? { ...p, quantity: Math.max(0, p.quantity - currentQuantity) } : p
      );

      return {
        ...prev,
        sales: [newSale, ...prev.sales],
        products: updatedProducts
      };
    });

    setStep(3);
    setTimeout(() => {
      setStep(1);
      setSelectedProduct(null);
      setQuantity(1);
      setDiscount(undefined);
      setAmountReceived(undefined);
    }, 2000);
  };

  if (step === 3) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-in zoom-in duration-300">
        <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-50">
          <CheckCircle2 size={56} strokeWidth={2.5} />
        </div>
        <h2 className="text-3xl font-black text-gray-800 text-center tracking-tight">Venda Realizada!</h2>
        <p className="text-gray-400 font-bold mt-2">Sucesso na cozinha ✨</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Registrar Venda</h1>
          <p className="text-gray-500 font-medium italic">Venda rápida de pronta-entrega.</p>
        </div>
        
        <div className="bg-white px-5 py-3 rounded-3xl border border-pink-50 shadow-sm flex items-center gap-4">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl"><TrendingUp size={18} /></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Faturado Hoje</p>
            <p className="text-xl font-black text-gray-800">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(todayTotal)}
            </p>
          </div>
        </div>
      </header>

      {step === 1 ? (
        <div className="space-y-6">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-500 transition-colors" size={22} />
            <input 
              type="text" placeholder="Qual doce foi vendido?..."
              className="w-full pl-14 pr-6 py-5 rounded-[28px] border-2 border-transparent bg-white text-gray-800 font-bold focus:border-pink-500 shadow-sm outline-none transition-all placeholder:text-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredProducts.map(p => (
              <button
                key={p.id}
                onClick={() => { setSelectedProduct(p.id); setStep(2); }}
                className="flex flex-col items-center p-6 bg-white rounded-[32px] border-2 border-transparent hover:border-pink-500 hover:-translate-y-1 transition-all text-center group shadow-sm"
              >
                <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-pink-100 transition-colors">
                  <ShoppingBag className="text-pink-500" size={28} />
                </div>
                <span className="font-black text-gray-800 text-sm mb-1 leading-tight">{p.name}</span>
                <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest bg-pink-50 px-2 py-0.5 rounded-full">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}
                </span>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400 italic font-medium">Nenhum produto encontrado.</div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto bg-white p-6 md:p-10 rounded-[35px] md:rounded-[45px] shadow-2xl border border-pink-50 relative overflow-hidden animate-in slide-in-from-bottom duration-300">
          <div className="absolute top-0 left-0 w-full h-2 bg-pink-500"></div>
          
          <div className="flex justify-between items-start mb-6 md:mb-10">
            <div className="flex-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Finalizar Venda</span>
              <p className="text-gray-800 font-black text-xl md:text-2xl tracking-tight leading-tight">{product?.name}</p>
            </div>
            <button onClick={() => setStep(1)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6 md:space-y-8">
            <div className="space-y-3">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Quantidade</span>
              <div className="flex items-center gap-2 md:gap-5">
                <button 
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, (q || 1) - 1))} 
                  className="w-12 h-12 md:w-14 md:h-14 rounded-2xl border-2 border-gray-100 bg-white text-gray-700 flex items-center justify-center shrink-0 shadow-sm active:scale-90 transition-all"
                >
                  <Minus size={20} strokeWidth={3} />
                </button>
                <input 
                  type="number" step="any" value={quantity ?? ''} 
                  placeholder="0"
                  onChange={(e) => setQuantity(e.target.value === '' ? undefined : Number(e.target.value))}
                  className="flex-1 text-center py-3 md:py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 font-black text-2xl md:text-3xl text-gray-800 outline-none focus:bg-white focus:border-pink-200 min-w-0"
                />
                <button 
                  type="button"
                  onClick={() => setQuantity(q => (q || 0) + 1)} 
                  className="w-12 h-12 md:w-14 md:h-14 rounded-2xl border-2 border-gray-100 bg-white text-gray-700 flex items-center justify-center shrink-0 shadow-sm active:scale-90 transition-all"
                >
                  <Plus size={20} strokeWidth={3} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <Tag size={12} className="text-pink-400" /> Desconto (R$)
              </span>
              <input 
                type="number" step="any" placeholder="0,00"
                className="w-full px-5 md:px-6 py-3 md:py-4 rounded-2xl border-2 border-gray-100 bg-gray-50 text-gray-800 font-black text-lg md:text-xl outline-none focus:bg-white focus:border-pink-200"
                value={discount ?? ''}
                onChange={(e) => setDiscount(e.target.value === '' ? undefined : Number(e.target.value))}
              />
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pagamento</span>
              <div className="grid grid-cols-2 gap-2">
                {(['PIX', 'Dinheiro', 'Cartão', 'iFood'] as PaymentMethod[]).map(method => (
                  <button key={method} onClick={() => { setPayment(method); if (method !== 'Dinheiro') setAmountReceived(undefined); }} className={`py-3 md:py-4 rounded-2xl border-2 transition-all font-black text-[10px] md:text-xs uppercase tracking-widest ${payment === method ? 'bg-pink-50 border-pink-500 text-pink-600 shadow-sm shadow-pink-100' : 'bg-white text-gray-400 border-gray-50 hover:bg-gray-50'}`}>{method}</button>
                ))}
              </div>
            </div>

            {payment === 'Dinheiro' && (
              <div className="space-y-4 p-5 md:p-7 bg-pink-50/20 rounded-[28px] md:rounded-[35px] border-2 border-dashed border-pink-100 animate-in slide-in-from-top-4">
                <div className="space-y-2">
                    <span className="text-gray-400 font-black text-[9px] uppercase tracking-widest flex items-center gap-2"><Banknote size={14} /> Valor Recebido</span>
                    <input 
                        type="number" step="any" placeholder="0,00"
                        className="w-full px-5 py-3 rounded-2xl border-2 border-gray-100 bg-white text-gray-800 font-black text-lg outline-none focus:border-pink-500"
                        value={amountReceived ?? ''}
                        onChange={(e) => setAmountReceived(e.target.value === '' ? undefined : Number(e.target.value))}
                    />
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-black text-[9px] uppercase tracking-widest">Troco:</span>
                    <span className={`text-xl font-black ${changeAmount >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.max(0, changeAmount))}
                    </span>
                </div>
              </div>
            )}

            <div className="pt-6 md:pt-8 border-t border-gray-100">
              <div className="flex justify-between items-center mb-6 md:mb-8">
                <span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Total</span>
                <span className="text-3xl md:text-4xl font-black text-pink-600 tracking-tighter">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSale)}
                </span>
              </div>
              <button onClick={handleSale} className="w-full py-5 rounded-[28px] font-black text-lg shadow-xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-100 active:scale-95 transition-all uppercase tracking-widest">
                Confirmar Venda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesRegistry;
