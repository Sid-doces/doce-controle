
import React, { useState } from 'react';
import { AppState, PaymentMethod } from '../types';
import { ShoppingBag, CheckCircle2, Search, Banknote, Tag, TrendingUp } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 text-center">Venda registrada!</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Registrar Venda</h1>
          <p className="text-gray-500">Venda pronta-entrega.</p>
        </div>
        
        <div className="bg-white px-4 py-2 rounded-2xl border border-pink-100 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={16} /></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase">Vendido Hoje</p>
            <p className="text-lg font-black text-black">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(todayTotal)}
            </p>
          </div>
        </div>
      </header>

      {step === 1 ? (
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" placeholder="Buscar doce..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-transparent bg-white text-black font-semibold focus:border-pink-500 shadow-sm outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(p => (
              <button
                key={p.id}
                onClick={() => { setSelectedProduct(p.id); setStep(2); }}
                className="flex flex-col items-center p-4 bg-white rounded-2xl border-2 border-transparent hover:border-pink-500 transition-all text-center group shadow-sm"
              >
                <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center mb-2">
                  <ShoppingBag className="text-pink-500" size={24} />
                </div>
                <span className="font-bold text-black text-sm mb-1">{p.name}</span>
                <span className="text-xs font-bold text-pink-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto bg-white p-8 rounded-[40px] shadow-xl border border-pink-50 relative">
          <div className="text-center mb-8">
            <p className="text-black font-black text-2xl">{product?.name}</p>
          </div>

          <div className="space-y-6">
            <label className="block">
              <span className="text-gray-600 font-bold text-sm">Quantidade:</span>
              <div className="flex items-center gap-4 mt-2">
                <button onClick={() => setQuantity(q => Math.max(1, (q || 1) - 1))} className="w-12 h-12 rounded-xl border-2 border-gray-100 text-black font-black shadow-sm">-</button>
                <input 
                  type="number" step="any" value={quantity ?? ''} 
                  placeholder="0"
                  onChange={(e) => setQuantity(e.target.value === '' ? undefined : Number(e.target.value))}
                  className="flex-1 text-center py-3 rounded-xl border-2 border-gray-100 font-black text-2xl text-black outline-none focus:border-pink-200"
                />
                <button onClick={() => setQuantity(q => (q || 0) + 1)} className="w-12 h-12 rounded-xl border-2 border-gray-100 text-black font-black shadow-sm">+</button>
              </div>
            </label>

            <label className="block">
              <span className="text-gray-600 font-bold text-sm flex items-center gap-2">
                <Tag size={14} className="text-pink-400" /> Desconto (R$):
              </span>
              <input 
                type="number" step="any" placeholder="0,00"
                className="w-full mt-2 px-4 py-3 rounded-xl border-2 border-gray-100 text-black font-black text-xl outline-none"
                value={discount ?? ''}
                onChange={(e) => setDiscount(e.target.value === '' ? undefined : Number(e.target.value))}
              />
            </label>

            <label className="block">
              <span className="text-gray-600 font-bold text-sm">Forma de Pagamento:</span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {(['PIX', 'Dinheiro', 'Cartão', 'iFood'] as PaymentMethod[]).map(method => (
                  <button key={method} onClick={() => { setPayment(method); if (method !== 'Dinheiro') setAmountReceived(undefined); }} className={`py-3 rounded-xl border-2 transition-all font-black text-sm ${payment === method ? 'bg-white border-pink-500 text-black shadow-sm' : 'bg-white text-gray-400 border-gray-100'}`}>{method}</button>
                ))}
              </div>
            </label>

            {payment === 'Dinheiro' && (
              <div className="space-y-4 p-5 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                <label className="block">
                    <span className="text-gray-600 font-bold text-xs uppercase flex items-center gap-2"><Banknote size={14} /> Recebido (R$)</span>
                    <input 
                        type="number" step="any" placeholder="0,00"
                        className="w-full mt-2 px-4 py-3 rounded-xl border-2 border-gray-200 text-black font-black text-xl outline-none"
                        value={amountReceived ?? ''}
                        onChange={(e) => setAmountReceived(e.target.value === '' ? undefined : Number(e.target.value))}
                    />
                </label>
                <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-bold text-sm uppercase">Troco:</span>
                    <span className={`text-2xl font-black ${changeAmount >= 0 ? 'text-emerald-600' : 'text-red-400'}`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.max(0, changeAmount))}
                    </span>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-gray-50">
              <div className="flex justify-between items-center mb-6">
                <div><span className="text-gray-400 font-black uppercase text-[10px] block">Total</span></div>
                <span className="text-4xl font-black text-pink-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSale)}
                </span>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="flex-1 py-4 text-gray-400 font-black">Voltar</button>
                <button onClick={handleSale} className="flex-[2] py-4 rounded-3xl font-black text-lg shadow-lg bg-emerald-500 text-white">Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesRegistry;
