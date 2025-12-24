
import React, { useState, useRef } from 'react';
import { AppState, Category, Product, ProductIngredient, Production, StockItem } from '../types';
import { Plus, Trash2, Cake, MoreHorizontal, ChefHat, X, Sparkles, DollarSign, TrendingUp, Percent, Zap, ChevronRight, Camera, AlertCircle } from 'lucide-react';

interface ProductManagementProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const ProductManagement: React.FC<ProductManagementProps> = ({ state, setState }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [showProduceModal, setShowProduceModal] = useState<string | null>(null);
  const [produceQty, setProduceQty] = useState<number>(1);
  const [utilityPercent, setUtilityPercent] = useState<number>(10);
  
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    cost: 0,
    price: undefined,
    category: 'Bolo',
    quantity: 0,
    yield: 1,
    ingredients: [],
    image: undefined,
    utilityPercent: 10
  });

  const calculateUnitCost = (ingredients: ProductIngredient[], yieldQty: number, util: number) => {
    const ingredientsCost = ingredients.reduce((total, ing) => {
      const stockItem = state.stock.find(s => s.id === ing.stockItemId);
      return total + (stockItem ? stockItem.unitPrice * ing.quantity : 0);
    }, 0);
    const totalWithUtils = ingredientsCost * (1 + (util / 100));
    return yieldQty > 0 ? totalWithUtils / yieldQty : 0;
  };

  const handleOpenAdd = () => {
    setEditingProductId(null);
    setUtilityPercent(10);
    setFormData({ name: '', cost: 0, price: undefined, category: 'Bolo', quantity: 0, yield: 1, ingredients: [], image: undefined, utilityPercent: 10 });
    setShowAddForm(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProductId(product.id);
    setUtilityPercent(product.utilityPercent || 10);
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
      image: formData.image,
      utilityPercent: utilityPercent
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
    if (!showProduceModal) return;
    const product = state.products.find(p => p.id === showProduceModal);
    if (!product) return;

    // Verificar se tem estoque
    const hasEnoughStock = product.ingredients.every(ing => {
      const stockItem = state.stock.find(s => s.id === ing.stockItemId);
      return stockItem && stockItem.quantity >= (ing.quantity * produceQty);
    });

    if (!hasEnoughStock) {
      alert("Estoque insuficiente de insumos para esta quantidade de produção!");
      return;
    }

    const totalCost = product.cost * (product.yield * produceQty);

    setState(prev => {
      // 1. Baixar Estoque de Insumos
      const updatedStock = prev.stock.map(s => {
        const ingredient = product.ingredients.find(ing => ing.stockItemId === s.id);
        if (ingredient) {
          return { ...s, quantity: Math.max(0, s.quantity - (ingredient.quantity * produceQty)) };
        }
        return s;
      });

      // 2. Aumentar Estoque do Produto Final
      const updatedProducts = prev.products.map(p => {
        if (p.id === product.id) {
          return { ...p, quantity: p.quantity + (product.yield * produceQty) };
        }
        return p;
      });

      // 3. Criar registro de produção
      const newProduction: Production = {
        id: Math.random().toString(36).substr(2, 9),
        productId: product.id,
        productName: product.name,
        quantityProduced: product.yield * produceQty,
        totalCost: totalCost,
        date: new Date().toISOString()
      };

      return {
        ...prev,
        stock: updatedStock,
        products: updatedProducts,
        productions: [newProduction, ...(prev.productions || [])]
      };
    });

    setShowProduceModal(null);
    setProduceQty(1);
    alert("Produção finalizada! Insumos deduzidos e estoque atualizado.");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Fichas Técnicas</h1>
          <p className="text-gray-500 font-medium italic">Gestão de custos e lucratividade.</p>
        </div>
        <button onClick={handleOpenAdd} className="bg-pink-500 hover:bg-pink-600 text-white font-black px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-pink-100 transition-all text-sm">
          <Plus size={18} /> Novo Doce
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.products.map(product => {
          const profit = product.price - product.cost;
          return (
            <div key={product.id} className="bg-white rounded-[32px] border border-pink-50 shadow-sm flex flex-col h-full overflow-hidden hover:shadow-md transition-all">
              <div className="relative h-44 bg-gray-100 flex items-center justify-center overflow-hidden">
                {product.image ? <img src={product.image} className="w-full h-full object-cover" /> : <div className="p-6 bg-pink-50 text-pink-500 rounded-2xl"><Cake size={40} /></div>}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={() => handleOpenEdit(product)} className="bg-white/80 backdrop-blur-md p-2 rounded-xl text-gray-800 shadow-sm"><MoreHorizontal size={18} /></button>
                </div>
              </div>
              <div className="p-7 flex flex-col flex-1">
                <h3 className="font-black text-gray-800 text-lg mb-4">{product.name}</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                   <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Lucro un.</p>
                      <p className="font-black text-emerald-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(profit)}</p>
                   </div>
                   <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Estoque</p>
                      <p className="font-black text-gray-700">{product.quantity} un</p>
                   </div>
                </div>
                <button onClick={() => setShowProduceModal(product.id)} className="w-full mt-auto py-4 bg-pink-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-pink-600 transition-all">
                  <ChefHat size={18} /> Produzir Doce
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
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">{editingProductId ? 'Editar Ficha' : 'Nova Ficha Técnica'}</h2>
              <div className="flex gap-2">
                {editingProductId && <button type="button" onClick={() => { if(confirm("Apagar?")) { setState(prev => ({...prev, products: prev.products.filter(p => p.id !== editingProductId)})); setShowAddForm(false); } }} className="text-red-400 p-2"><Trash2 size={24}/></button>}
                <button type="button" onClick={() => setShowAddForm(false)} className="text-gray-300 hover:text-red-500 p-2"><X size={28}/></button>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1">Nome Comercial</label>
                  <input type="text" required className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-bold outline-none focus:border-pink-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1">Preço de Venda</label>
                  <input type="number" step="any" required className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-black text-xl outline-none focus:border-pink-500" value={formData.price ?? ''} onChange={e => setFormData({...formData, price: e.target.value === '' ? undefined : Number(e.target.value)})} />
                </div>
              </div>

              <div className="p-6 bg-indigo-50/50 rounded-[30px] border-2 border-indigo-100 flex flex-col md:flex-row items-center gap-6">
                 <div className="flex-1">
                    <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-1 flex items-center gap-2"><Zap size={12}/> Custos Fixos (Gás/Energia)</h4>
                    <p className="text-[10px] text-indigo-400 font-medium italic">Adicione de 5 a 15% para cobrir gastos invisíveis.</p>
                 </div>
                 <div className="flex items-center gap-4">
                    <input type="range" min="0" max="30" step="1" className="w-24 accent-indigo-500" value={utilityPercent} onChange={e => {
                        const val = Number(e.target.value);
                        setUtilityPercent(val);
                        setFormData(prev => ({ ...prev, cost: calculateUnitCost(prev.ingredients || [], prev.yield || 1, val) }));
                      }} />
                    <span className="font-black text-indigo-600 text-lg w-10">{utilityPercent}%</span>
                 </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                   <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Custo Un.</p>
                   <p className="text-lg font-black text-gray-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.cost || 0)}</p>
                </div>
                <div className="bg-pink-50 p-4 rounded-2xl text-center">
                   <p className="text-[8px] font-black text-pink-400 uppercase tracking-widest">Margem</p>
                   <p className="text-lg font-black text-pink-600">{formData.price && formData.price > 0 ? (((formData.price - (formData.cost || 0)) / formData.price) * 100).toFixed(0) : 0}%</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                   <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Rendimento</p>
                   <input type="number" className="w-full bg-transparent text-center font-black text-lg text-gray-800 outline-none" value={formData.yield} onChange={e => {
                      const y = Number(e.target.value) || 1;
                      setFormData(prev => ({ ...prev, yield: y, cost: calculateUnitCost(prev.ingredients || [], y, utilityPercent) }));
                   }} />
                </div>
              </div>

              <div>
                <h3 className="font-black text-gray-700 text-[10px] uppercase tracking-widest mb-4">Ingredientes Necessários</h3>
                <div className="space-y-3">
                  {formData.ingredients?.map((ing, idx) => (
                    <div key={idx} className="flex gap-3 items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                      <select required className="flex-1 bg-transparent text-xs font-black text-gray-700 outline-none" value={ing.stockItemId} onChange={e => updateIngredientRow(idx, 'stockItemId', e.target.value)}>
                        <option value="">Ingrediente...</option>
                        {state.stock.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <input type="number" step="any" placeholder="Qtd" className="w-16 bg-white px-2 py-1.5 rounded-lg text-xs font-black text-pink-500 text-center border border-gray-100" value={ing.quantity || ''} onChange={e => updateIngredientRow(idx, 'quantity', e.target.value === '' ? 0 : Number(e.target.value))} />
                      <button type="button" onClick={() => setFormData(prev => ({...prev, ingredients: prev.ingredients?.filter((_, i) => i !== idx)}))} className="text-gray-300 hover:text-red-400 p-1"><Trash2 size={16}/></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setFormData(prev => ({...prev, ingredients: [...(prev.ingredients || []), {stockItemId: '', quantity: 0}]}))} className="w-full py-3 border-2 border-dashed border-gray-100 rounded-2xl text-[9px] font-black uppercase text-gray-400 hover:border-pink-200 transition-all">+ Adicionar Insumo</button>
                </div>
              </div>
            </div>

            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex gap-4">
              <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-4 text-gray-400 font-black text-xs uppercase tracking-widest">Cancelar</button>
              <button type="submit" className="flex-[2] py-5 bg-pink-500 text-white rounded-[30px] font-black text-lg shadow-xl shadow-pink-100">Gravar Ficha</button>
            </div>
          </form>
        </div>
      )}

      {showProduceModal && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md flex items-center justify-center z-[200] p-4">
          <div className="bg-white w-full max-w-sm p-10 rounded-[45px] shadow-2xl animate-in zoom-in duration-200 text-center">
             <div className="w-16 h-16 bg-pink-50 text-pink-500 rounded-[20px] flex items-center justify-center mx-auto mb-6"><ChefHat size={32} /></div>
             <h2 className="text-2xl font-black text-gray-800 tracking-tight mb-2">Novo Lote</h2>
             <p className="text-[10px] text-gray-400 font-bold mb-8 uppercase tracking-widest">Quantas receitas você fez?</p>
             <div className="flex items-center justify-center gap-6 mb-10">
                <button type="button" onClick={() => setProduceQty(q => Math.max(1, q - 1))} className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-xl text-gray-400 active:bg-pink-100 transition-colors">-</button>
                <span className="text-4xl font-black text-gray-800">{produceQty}</span>
                <button type="button" onClick={() => setProduceQty(q => q + 1)} className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-xl text-gray-400 active:bg-pink-100 transition-colors">+</button>
             </div>
             <div className="flex gap-4">
                <button onClick={() => setShowProduceModal(null)} className="flex-1 py-4 text-gray-400 font-black text-xs uppercase tracking-widest">Sair</button>
                <button onClick={confirmProduction} className="flex-[2] py-5 bg-emerald-500 text-white rounded-[28px] font-black shadow-xl shadow-emerald-100">Lançar agora</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
