
import React, { useState, useMemo } from 'react';
import { AppState, Category, Product, ProductIngredient, Production } from '../types';
import { Plus, Trash2, Cake, MoreHorizontal, ChefHat, X, Sparkles, DollarSign, TrendingUp, Percent, Zap, ChevronRight, AlertCircle, Wand2, Package, Calculator } from 'lucide-react';

interface ProductManagementProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const ProductManagement: React.FC<ProductManagementProps> = ({ state, setState }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [showProduceModal, setShowProduceModal] = useState<string | null>(null);
  const [produceQty, setProduceQty] = useState<number>(0); 
  const [utilityPercent, setUtilityPercent] = useState<number>(15);
  const [targetMargin, setTargetMargin] = useState<number>(60);
  
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    cost: 0,
    price: undefined,
    category: 'Bolo',
    quantity: 0,
    yield: 1,
    ingredients: [],
    utilityPercent: 15,
    targetMargin: 60
  });

  const calculateUnitCost = (ingredients: ProductIngredient[], yieldQty: number, util: number) => {
    const ingredientsCost = ingredients.reduce((total, ing) => {
      const stockItem = state.stock.find(s => s.id === ing.stockItemId);
      return total + (stockItem ? stockItem.unitPrice * ing.quantity : 0);
    }, 0);
    const totalWithUtils = ingredientsCost * (1 + (util / 100));
    return yieldQty > 0 ? totalWithUtils / yieldQty : 0;
  };

  const suggestedPrice = useMemo(() => {
    const cost = formData.cost || 0;
    const margin = targetMargin / 100;
    if (margin >= 1) return cost * 2.5;
    const result = cost / (1 - margin);
    return isFinite(result) ? result : cost * 2;
  }, [formData.cost, targetMargin]);

  const handleOpenAdd = () => {
    setEditingProductId(null);
    setUtilityPercent(15);
    setTargetMargin(60);
    setFormData({ 
      name: '', 
      cost: 0, 
      price: undefined, 
      category: 'Bolo', 
      quantity: 0, 
      yield: 1, 
      ingredients: [], 
      utilityPercent: 15,
      targetMargin: 60
    });
    setShowAddForm(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProductId(product.id);
    setUtilityPercent(product.utilityPercent || 15);
    setTargetMargin(product.targetMargin || 60);
    setFormData({ ...product });
    setShowAddForm(true);
  };

  const updateIngredientRow = (index: number, field: keyof ProductIngredient, value: string | number) => {
    setFormData(prev => {
      const updated = [...(prev.ingredients || [])];
      updated[index] = { ...updated[index], [field]: value };
      const newCost = calculateUnitCost(updated, prev.yield || 1, utilityPercent);
      return { ...prev, ingredients: updated, cost: newCost };
    });
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.price === undefined) return;
    
    const finalProduct: Product = {
      id: editingProductId || Math.random().toString(36).substr(2, 9),
      name: formData.name!,
      cost: formData.cost || 0,
      price: Number(formData.price),
      category: formData.category as Category,
      quantity: Number(formData.quantity) || 0,
      yield: Number(formData.yield) || 1,
      ingredients: formData.ingredients || [],
      utilityPercent: utilityPercent,
      targetMargin: targetMargin
    };

    setState(prev => ({
      ...prev,
      products: editingProductId 
        ? prev.products.map(p => p.id === editingProductId ? finalProduct : p)
        : [...prev.products, finalProduct]
    }));
    setShowAddForm(false);
  };

  const confirmProduction = () => {
    if (!showProduceModal || produceQty <= 0) return;
    const product = state.products.find(p => p.id === showProduceModal);
    if (!product) return;

    setState(prev => {
      const updatedStock = prev.stock.map(s => {
        const ingredient = product.ingredients.find(ing => ing.stockItemId === s.id);
        if (ingredient) {
          const used = (ingredient.quantity / product.yield) * produceQty;
          return { ...s, quantity: Math.max(0, s.quantity - used) };
        }
        return s;
      });

      const updatedProducts = prev.products.map(p => {
        if (p.id === product.id) return { ...p, quantity: p.quantity + produceQty };
        return p;
      });

      return {
        ...prev,
        stock: updatedStock,
        products: updatedProducts
      };
    });

    setShowProduceModal(null);
    setProduceQty(0);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Meus Doces 🧁</h1>
          <p className="text-gray-500 font-medium italic">Fichas técnicas e gestão de lucro.</p>
        </div>
        <button onClick={handleOpenAdd} className="bg-pink-500 hover:bg-pink-600 text-white font-black px-6 py-4 rounded-2xl flex items-center gap-2 shadow-lg shadow-pink-100 transition-all text-xs uppercase tracking-widest">
          <Plus size={18} /> Novo Doce
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.products.map(product => {
          const isAtLoss = product.price < product.cost;
          const currentMargin = product.price > 0 ? ((product.price - product.cost) / product.price) * 100 : 0;

          return (
            <div key={product.id} className={`bg-white rounded-[35px] border-2 shadow-sm flex flex-col h-full overflow-hidden transition-all group ${isAtLoss ? 'border-red-400 animate-pulse' : 'border-transparent hover:border-pink-200'}`}>
              <div className="p-7 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-6">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${isAtLoss ? 'bg-red-50 text-red-500' : 'bg-pink-50 text-pink-500'}`}><Cake size={28} /></div>
                   <button onClick={() => handleOpenEdit(product)} className="p-2 text-gray-300 hover:text-indigo-500 rounded-lg transition-colors"><MoreHorizontal size={24} /></button>
                </div>

                <h3 className="font-black text-gray-800 text-lg mb-1 leading-tight">{product.name}</h3>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-6">{product.category}</p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                   <div className={`p-4 rounded-2xl border ${isAtLoss ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Preço Sugerido</p>
                      <p className={`font-black text-base ${isAtLoss ? 'text-red-700' : 'text-emerald-700'}`}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}</p>
                      {isAtLoss && <p className="text-[8px] font-black text-red-500 uppercase mt-1">Prejuízo!</p>}
                   </div>
                   <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Estoque</p>
                      <p className="font-black text-gray-800 text-base">{product.quantity} un</p>
                      <p className="text-[8px] font-black text-indigo-500 uppercase mt-1">Margem: {currentMargin.toFixed(0)}%</p>
                   </div>
                </div>

                <button onClick={() => { setProduceQty(0); setShowProduceModal(product.id); }} className="w-full mt-auto py-4 bg-pink-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-pink-600 shadow-md transition-all active:scale-95">
                  <ChefHat size={16} /> Entrada de Loja
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md flex items-start justify-center z-[200] pt-10 pb-10 px-4 overflow-y-auto">
          <form onSubmit={handleSaveProduct} className="bg-white w-full max-w-2xl rounded-[45px] shadow-2xl relative animate-in zoom-in duration-300 flex flex-col mb-10">
            <div className="p-8 pb-4 flex justify-between items-center border-b border-gray-50 shrink-0">
              <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Ficha Técnica ✨</h2>
                <p className="text-[10px] text-pink-500 font-black uppercase tracking-widest">Defina seu custo e lucro real</p>
              </div>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-gray-300 hover:text-red-500 p-3"><X size={28}/></button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1">Nome do Doce</label>
                  <input type="text" required className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-bold outline-none focus:border-pink-500 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1">Preço de Venda Final</label>
                  <div className="relative">
                    <input type="number" step="any" required className="w-full px-6 py-5 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-black text-2xl outline-none focus:border-pink-500 transition-all" value={formData.price ?? ''} onChange={e => setFormData({...formData, price: e.target.value === '' ? undefined : Number(e.target.value)})} />
                    <DollarSign className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300" size={24} />
                  </div>
                </div>
              </div>

              <div className="p-8 bg-gradient-to-br from-indigo-50 to-pink-50 rounded-[40px] border border-indigo-100 shadow-sm space-y-6">
                 <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2"><Sparkles size={16} className="text-pink-500"/> Recomendação de Preço</h4>
                    <div className="bg-white px-5 py-2 rounded-full border border-indigo-100 shadow-sm">
                       <span className="text-[9px] font-black text-indigo-600 uppercase">Sugerido: </span>
                       <span className="text-base font-black text-pink-500 ml-1">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(suggestedPrice)}</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <label className="text-[10px] font-black text-indigo-800 uppercase tracking-widest flex items-center gap-1">Custos Invisíveis (Gás/Luz) <Zap size={10}/></label>
                            <span className="font-black text-indigo-600 text-sm">{utilityPercent}%</span>
                        </div>
                        <input type="range" min="0" max="40" step="1" className="w-full accent-pink-500" value={utilityPercent} onChange={e => {
                            const val = Number(e.target.value);
                            setUtilityPercent(val);
                            setFormData(prev => ({ ...prev, cost: calculateUnitCost(prev.ingredients || [], prev.yield || 1, val) }));
                        }} />
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <label className="text-[10px] font-black text-indigo-800 uppercase tracking-widest flex items-center gap-1">Margem Desejada <TrendingUp size={10}/></label>
                            <span className="font-black text-pink-600 text-sm">{targetMargin}%</span>
                        </div>
                        <input type="range" min="10" max="95" step="5" className="w-full accent-indigo-500" value={targetMargin} onChange={e => setTargetMargin(Number(e.target.value))} />
                    </div>
                 </div>

                 <button 
                   type="button" 
                   onClick={() => setFormData(prev => ({ ...prev, price: Number(suggestedPrice.toFixed(2)) }))}
                   className="w-full py-4 bg-white border-2 border-indigo-200 text-indigo-600 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                 >
                    <Wand2 size={16} /> Aplicar Sugestão de Preço
                 </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-50 p-6 rounded-[30px] border border-gray-100">
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1"><Calculator size={10}/> Custo Unitário</p>
                   <p className="text-xl font-black text-gray-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.cost || 0)}</p>
                </div>
                <div className={`p-6 rounded-[30px] border ${formData.price && formData.price < (formData.cost || 0) ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                   <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${formData.price && formData.price < (formData.cost || 0) ? 'text-red-400' : 'text-emerald-400'}`}>Lucro Limpo</p>
                   <p className={`text-xl font-black ${formData.price && formData.price < (formData.cost || 0) ? 'text-red-600' : 'text-emerald-600'}`}>
                     {formData.price ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.price - (formData.cost || 0)) : 'R$ 0,00'}
                   </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-gray-700 text-[10px] uppercase tracking-widest">Ingredientes da Receita</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-gray-400 uppercase">Rendimento (unidades):</span>
                    <input type="number" required className="w-16 px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs font-black text-center" value={formData.yield} onChange={e => {
                      const y = Math.max(1, Number(e.target.value));
                      setFormData(prev => ({ ...prev, yield: y, cost: calculateUnitCost(prev.ingredients || [], y, utilityPercent) }));
                    }} />
                  </div>
                </div>
                <div className="space-y-3">
                  {formData.ingredients?.map((ing, idx) => (
                    <div key={idx} className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm group">
                      <div className="flex-1">
                        <select required className="w-full bg-transparent text-sm font-black text-gray-700 outline-none" value={ing.stockItemId} onChange={e => updateIngredientRow(idx, 'stockItemId', e.target.value)}>
                            <option value="">Escolha o insumo...</option>
                            {state.stock.map(s => <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>)}
                        </select>
                      </div>
                      <div className="w-24">
                        <input type="number" step="any" placeholder="Qtd" className="w-full bg-gray-50 px-3 py-2 rounded-xl text-sm font-black text-pink-500 text-center border border-gray-100 outline-none" value={ing.quantity || ''} onChange={e => updateIngredientRow(idx, 'quantity', e.target.value === '' ? 0 : Number(e.target.value))} />
                      </div>
                      <button type="button" onClick={() => setFormData(prev => ({...prev, ingredients: prev.ingredients?.filter((_, i) => i !== idx)}))} className="text-gray-300 hover:text-red-400 p-2"><Trash2 size={18}/></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setFormData(prev => ({...prev, ingredients: [...(prev.ingredients || []), {stockItemId: '', quantity: 0}]}))} className="w-full py-5 border-2 border-dashed border-gray-100 rounded-[30px] text-[10px] font-black uppercase text-gray-400 hover:border-pink-200 hover:text-pink-500 transition-all bg-gray-50/50">+ Adicionar Insumo</button>
                </div>
              </div>
            </div>

            <div className="p-10 bg-gray-50/80 border-t border-gray-100 flex gap-4 shrink-0">
              <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-4 text-gray-400 font-black text-xs uppercase tracking-widest">Sair</button>
              <button type="submit" className="flex-[2] py-6 bg-pink-500 text-white rounded-[35px] font-black text-lg shadow-xl shadow-pink-200 hover:scale-[1.02] active:scale-[0.98] transition-all">Gravar Ficha Técnica</button>
            </div>
          </form>
        </div>
      )}

      {showProduceModal && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md flex items-center justify-center z-[200] p-4">
          <div className="bg-white w-full max-w-sm p-10 rounded-[45px] shadow-2xl animate-in zoom-in duration-200 text-center">
             <div className="w-16 h-16 bg-pink-50 text-pink-500 rounded-[20px] flex items-center justify-center mx-auto mb-6"><ChefHat size={32} /></div>
             <h2 className="text-2xl font-black text-gray-800 tracking-tight mb-2">Entrada de Loja</h2>
             <p className="text-[10px] text-gray-400 font-bold mb-8 uppercase tracking-widest">Produção realizada para vitrine</p>
             
             <div className="mb-10 flex items-center justify-center gap-6">
                <button type="button" onClick={() => setProduceQty(q => Math.max(0, q - 1))} className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-xl">-</button>
                <input type="number" className="w-20 bg-transparent text-center font-black text-4xl text-gray-800 outline-none" value={produceQty} onChange={e => setProduceQty(Number(e.target.value))} />
                <button type="button" onClick={() => setProduceQty(q => q + 1)} className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-xl">+</button>
             </div>

             <div className="flex gap-4">
                <button onClick={() => setShowProduceModal(null)} className="flex-1 py-4 text-gray-400 font-black text-xs uppercase tracking-widest">Sair</button>
                <button onClick={confirmProduction} disabled={produceQty <= 0} className="flex-[2] py-5 bg-emerald-500 text-white rounded-[28px] font-black shadow-xl shadow-emerald-100 disabled:opacity-50 transition-all uppercase tracking-widest text-xs">Confirmar Entrada</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
