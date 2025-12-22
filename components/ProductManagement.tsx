
import React, { useState } from 'react';
import { AppState, Category, Product, ProductIngredient } from '../types';
// Fixed: Added AlertCircle to lucide-react imports
import { Plus, Trash2, Cake, Coffee, Cherry, MoreHorizontal, ChefHat, X, Box, Info, Calculator, Sparkles, Check, Scale, Zap, AlertCircle } from 'lucide-react';

interface ProductManagementProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const SUGGESTED_PRODUCTS = [
  { name: 'Brigadeiro Gourmet', category: 'Doce' as Category, yield: 30 },
  { name: 'Bolo de Pote Chocolate', category: 'Bolo' as Category, yield: 10 },
  { name: 'Brownie Tradicional', category: 'Outros' as Category, yield: 12 },
  { name: 'Copo da Felicidade', category: 'Doce' as Category, yield: 5 },
  { name: 'Bento Cake', category: 'Bolo' as Category, yield: 1 },
];

const ProductManagement: React.FC<ProductManagementProps> = ({ state, setState }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [showProduceModal, setShowProduceModal] = useState<string | null>(null);
  const [produceQty, setProduceQty] = useState<number | undefined>(1);
  
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    cost: 0,
    price: undefined,
    category: 'Bolo',
    quantity: 0,
    yield: 1,
    ingredients: []
  });

  const calculateUnitCost = (ingredients: ProductIngredient[], yieldQty: number) => {
    const totalCost = ingredients.reduce((total, ing) => {
      const stockItem = state.stock.find(s => s.id === ing.stockItemId);
      return total + (stockItem ? stockItem.unitPrice * ing.quantity : 0);
    }, 0);
    return yieldQty > 0 ? totalCost / yieldQty : 0;
  };

  const calculateMaxPossibleProduction = (product: Product) => {
    if (!product.ingredients || product.ingredients.length === 0) return 0;
    
    let minPossible = Infinity;
    
    product.ingredients.forEach(ing => {
      const stockItem = state.stock.find(s => s.id === ing.stockItemId);
      if (!stockItem || stockItem.quantity <= 0) {
        minPossible = 0;
        return;
      }
      // Quanto de ingrediente é usado para 1 UNIDADE do produto
      const qtyPerUnit = ing.quantity / product.yield;
      const possibleWithThisIng = Math.floor(stockItem.quantity / qtyPerUnit);
      if (possibleWithThisIng < minPossible) {
        minPossible = possibleWithThisIng;
      }
    });
    
    return minPossible === Infinity ? 0 : minPossible;
  };

  const handleOpenAdd = () => {
    setEditingProductId(null);
    setFormData({ name: '', cost: 0, price: undefined, category: 'Bolo', quantity: 0, yield: 1, ingredients: [] });
    setShowAddForm(true);
  };

  const handleSelectSuggestion = (suggestion: typeof SUGGESTED_PRODUCTS[0]) => {
    setEditingProductId(null);
    setFormData({ 
      name: suggestion.name, 
      cost: 0, 
      price: undefined, 
      category: suggestion.category, 
      quantity: 0, 
      yield: suggestion.yield,
      ingredients: [] 
    });
    setShowSuggestions(false);
    setShowAddForm(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProductId(product.id);
    setFormData(product);
    setShowAddForm(true);
  };

  const updateIngredientRow = (index: number, field: keyof ProductIngredient, value: string | number) => {
    setFormData(prev => {
      const updated = [...(prev.ingredients || [])];
      updated[index] = { ...updated[index], [field]: value };
      const newUnitCost = calculateUnitCost(updated, prev.yield || 1);
      return { ...prev, ingredients: updated, cost: newUnitCost };
    });
  };

  const handleYieldChange = (val: string) => {
    const numeric = val === '' ? 1 : Number(val);
    setFormData(prev => ({
      ...prev,
      yield: numeric,
      cost: calculateUnitCost(prev.ingredients || [], numeric)
    }));
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || (formData.price === undefined) || (formData.yield || 0) <= 0) return;

    const finalProduct: Product = {
      id: editingProductId || Math.random().toString(36).substr(2, 9),
      name: formData.name!,
      cost: formData.cost || 0,
      price: Number(formData.price),
      category: formData.category as Category,
      quantity: Number(formData.quantity) || 0,
      yield: Number(formData.yield) || 1,
      ingredients: formData.ingredients || []
    };

    setState(prev => ({
      ...prev,
      products: editingProductId 
        ? prev.products.map(p => p.id === editingProductId ? finalProduct : p)
        : [...prev.products, finalProduct]
    }));
    
    setShowAddForm(false);
  };

  const handleProduce = (productId: string) => {
    const product = state.products.find(p => p.id === productId);
    if (!product || !produceQty) return;

    const hasEnoughStock = product.ingredients.every(ing => {
      const stockItem = state.stock.find(s => s.id === ing.stockItemId);
      const needed = (ing.quantity / product.yield) * produceQty;
      return stockItem && stockItem.quantity >= needed;
    });

    if (!hasEnoughStock) {
      alert("Ops! Ingredientes insuficientes para produzir essa quantidade exata.");
      return;
    }

    setState(prev => {
      const updatedStock = prev.stock.map(s => {
        const recipeIng = product.ingredients.find(ri => ri.stockItemId === s.id);
        if (recipeIng) {
          const needed = (recipeIng.quantity / product.yield) * produceQty;
          return { ...s, quantity: parseFloat((s.quantity - needed).toFixed(3)) };
        }
        return s;
      });

      const updatedProducts = prev.products.map(p => 
        p.id === productId ? { ...p, quantity: p.quantity + produceQty } : p
      );

      return { ...prev, stock: updatedStock, products: updatedProducts };
    });

    setShowProduceModal(null);
    setProduceQty(1);
  };

  const getCategoryIcon = (cat: Category) => {
    switch (cat) {
      case 'Bolo': return <Cake size={20} />;
      case 'Doce': return <Cherry size={20} />;
      case 'Torta': return <Coffee size={20} />;
      default: return <MoreHorizontal size={20} />;
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Meus Doces e Receitas</h1>
          <p className="text-gray-500">Gestão inteligente: custo real e potencial de produção.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSuggestions(true)} className="bg-white hover:bg-gray-50 text-black border-2 border-gray-100 font-bold px-4 py-3 rounded-xl flex items-center gap-2 shadow-sm transition-all">
            <Sparkles size={18} className="text-pink-500" /> Sugestões
          </button>
          <button onClick={handleOpenAdd} className="bg-white hover:bg-gray-50 text-black border-2 border-pink-100 font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-pink-50 transition-all">
            <Plus size={20} className="text-pink-500" /> Novo Doce
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.products.map(product => {
          const margin = ((product.price - product.cost) / product.price) * 100;
          const maxProduction = calculateMaxPossibleProduction(product);
          
          return (
            <div key={product.id} className="bg-white p-6 rounded-2xl border border-pink-100 shadow-sm flex flex-col h-full relative group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-50 text-pink-500 rounded-lg">{getCategoryIcon(product.category)}</div>
                  <div>
                    <h3 className="font-bold text-black text-lg">{product.name}</h3>
                    <span className="text-[10px] text-gray-400 font-black uppercase">Receita p/ {product.yield} un</span>
                  </div>
                </div>
                <button onClick={() => handleOpenEdit(product)} className="text-gray-300 hover:text-blue-500 p-1"><MoreHorizontal size={18} /></button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-3 border border-gray-100">
                <div className="flex items-center gap-2 text-black font-bold text-sm"><Box size={16} /> Prontos p/ Venda:</div>
                <span className="font-black text-xl text-black">{product.quantity} un</span>
              </div>

              {/* Badges de Status */}
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                  <Zap size={12} fill="currentColor" />
                  <span className="text-[10px] font-black uppercase">Produzir até +{maxProduction}</span>
                </div>
                {product.cost > product.price && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 text-red-600 rounded-lg border border-red-100">
                    <AlertCircle size={12} />
                    <span className="text-[10px] font-black uppercase">Prejuízo!</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <span className="text-[10px] text-gray-400 font-black block">PREÇO VENDA</span>
                  <span className="font-black text-pink-600 text-lg">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-black block">LUCRO %</span>
                  <span className={`font-black text-lg ${margin < 0 ? 'text-red-500' : 'text-emerald-600'}`}>{margin.toFixed(0)}%</span>
                </div>
              </div>

              <button 
                onClick={() => setShowProduceModal(product.id)} 
                disabled={maxProduction <= 0}
                className={`w-full mt-auto py-3 rounded-xl font-black shadow-md flex items-center justify-center gap-2 transition-all ${
                  maxProduction > 0 
                  ? 'bg-white hover:bg-emerald-50 text-black border-2 border-emerald-100' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <ChefHat size={18} className={maxProduction > 0 ? "text-emerald-500" : ""} /> {maxProduction > 0 ? 'Produzir Agora' : 'Sem Insumos'}
              </button>
            </div>
          );
        })}
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
          <form onSubmit={handleSaveProduct} className="bg-white w-full max-w-2xl p-8 rounded-3xl shadow-2xl my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-black">Configurar Receita</h2>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={24}/></button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-gray-700 font-bold text-sm">Nome do Doce:</span>
                  <input type="text" required className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 bg-white text-black font-semibold focus:ring-2 focus:ring-pink-500/20 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </label>
                <label className="block">
                  <span className="text-gray-700 font-bold text-sm flex items-center gap-1"><Scale size={14}/> Rendimento da Receita (un):</span>
                  <input 
                    type="number" step="any" inputMode="decimal" required 
                    className="w-full mt-1 px-4 py-3 rounded-xl border border-pink-200 bg-white text-black font-black outline-none" 
                    value={formData.yield ?? ''} placeholder="Ex: 30" 
                    onChange={e => handleYieldChange(e.target.value)} 
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                 <div>
                    <span className="text-[10px] text-gray-400 font-black block">CUSTO UNITÁRIO CALCULADO</span>
                    <span className="text-2xl font-black text-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.cost || 0)}</span>
                 </div>
                 <label className="block">
                  <span className="text-gray-700 font-bold text-sm">Preço de Venda (un):</span>
                  <input 
                    type="number" step="any" inputMode="decimal" required 
                    className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 bg-white text-black font-black text-lg outline-none" 
                    value={formData.price ?? ''} placeholder="R$ 0,00" 
                    onChange={e => setFormData({...formData, price: e.target.value === '' ? undefined : Number(e.target.value)})} 
                  />
                </label>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-black text-sm uppercase tracking-wider">Ingredientes da Receita Inteira</h3>
                  <button type="button" onClick={() => setFormData(prev => ({...prev, ingredients: [...(prev.ingredients || []), {stockItemId: '', quantity: 0}]}))} className="text-pink-600 font-black text-sm hover:underline">+ Insumo</button>
                </div>
                <div className="space-y-2">
                  {formData.ingredients?.map((ing, idx) => {
                    const stockItem = state.stock.find(s => s.id === ing.stockItemId);
                    return (
                      <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-gray-100 shadow-sm animate-in slide-in-from-left-2 duration-150">
                        <select required className="flex-1 bg-white text-sm font-bold text-black outline-none" value={ing.stockItemId} onChange={e => updateIngredientRow(idx, 'stockItemId', e.target.value)}>
                          <option value="">Ingrediente...</option>
                          {state.stock.map(s => <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>)}
                        </select>
                        <input 
                          type="number" step="any" inputMode="decimal" required 
                          className="w-24 bg-white text-sm font-black text-pink-600 text-right outline-none" 
                          placeholder="Ex: 0.5" value={ing.quantity || ''} 
                          onChange={e => updateIngredientRow(idx, 'quantity', e.target.value === '' ? 0 : Number(e.target.value))} 
                        />
                        <span className="text-[10px] font-bold text-gray-400 w-6 uppercase">{stockItem?.unit || '?'}</span>
                        <button type="button" onClick={() => setFormData(prev => ({...prev, ingredients: prev.ingredients?.filter((_, i) => i !== idx)}))} className="text-gray-300 hover:text-red-500 transition-colors p-1"><Trash2 size={16}/></button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-4 text-gray-400 font-black">Cancelar</button>
              <button type="submit" className="flex-2 py-4 bg-white text-black border-2 border-gray-100 rounded-2xl font-black shadow-lg hover:bg-gray-50 transition-all">Salvar Doce</button>
            </div>
          </form>
        </div>
      )}

      {showProduceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white w-full max-sm p-8 rounded-3xl shadow-2xl animate-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-black mb-1">Finalizar Produção</h2>
            <p className="text-xs text-gray-500 mb-6 uppercase font-black">O sistema calculará a baixa exata no estoque</p>
            
            <span className="text-xs font-bold text-gray-400 block mb-2 text-center">Quantas unidades você fez?</span>
            <input 
              type="number" step="any" inputMode="decimal"
              className="w-full px-4 py-4 rounded-2xl border-2 border-pink-500 bg-white text-black font-black text-4xl text-center mb-6 outline-none" 
              value={produceQty ?? ''} 
              onChange={e => setProduceQty(e.target.value === '' ? undefined : Number(e.target.value))} 
            />

            <div className="flex gap-3">
              <button onClick={() => setShowProduceModal(null)} className="flex-1 py-3 text-gray-400 font-black">Cancelar</button>
              <button onClick={() => handleProduce(showProduceModal)} className="flex-1 py-3 bg-white text-black border-2 border-emerald-500 rounded-xl font-black shadow-lg">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {showSuggestions && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl overflow-hidden">
            <h2 className="text-xl font-bold text-black mb-6">Sugestões Rápidas ✨</h2>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {SUGGESTED_PRODUCTS.map((item, idx) => (
                <button key={idx} onClick={() => handleSelectSuggestion(item)} className="w-full flex items-center justify-between p-4 bg-pink-50/50 rounded-2xl hover:bg-pink-100 transition-all text-left group">
                  <div>
                    <span className="font-bold text-black text-sm">{item.name}</span>
                    <span className="text-[10px] text-gray-400 font-black block uppercase">Rende {item.yield} un por receita</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-all shadow-sm">
                    <Plus size={18}/>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setShowSuggestions(false)} className="w-full mt-6 py-4 font-black text-gray-400 hover:text-black">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
