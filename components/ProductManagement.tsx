
import React, { useState } from 'react';
import { AppState, Category, Product, ProductIngredient } from '../types';
// Adicionando DollarSign que estava faltando nos imports da lucide-react para corrigir o erro na linha 295
import { Plus, Trash2, Cake, MoreHorizontal, ChefHat, X, Box, Sparkles, Scale, AlertCircle, Info, DollarSign } from 'lucide-react';

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
  { name: 'Cookies com Gotas', category: 'Outros' as Category, yield: 15 },
  { name: 'Palha Italiana', category: 'Doce' as Category, yield: 20 },
  { name: 'Pão de Mel', category: 'Doce' as Category, yield: 12 }
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
      const qtyPerUnit = ing.quantity / product.yield;
      const possibleWithThisIng = Math.floor(stockItem.quantity / qtyPerUnit);
      if (possibleWithThisIng < minPossible) minPossible = possibleWithThisIng;
    });
    return minPossible === Infinity ? 0 : minPossible;
  };

  const handleOpenAdd = () => {
    setEditingProductId(null);
    setFormData({ name: '', cost: 0, price: undefined, category: 'Bolo', quantity: 0, yield: 1, BI: [], ingredients: [] });
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

  const handleAddSuggested = (suggestion: typeof SUGGESTED_PRODUCTS[0]) => {
    setShowSuggestions(false);
    setFormData({
      name: suggestion.name,
      category: suggestion.category,
      yield: suggestion.yield,
      cost: 0,
      price: undefined,
      quantity: 0,
      ingredients: []
    });
    setEditingProductId(null);
    setTimeout(() => {
        setShowAddForm(true);
    }, 150);
  };

  const currentCost = formData.cost || 0;
  const currentPrice = formData.price || 0;
  const currentMarkup = currentCost > 0 ? (currentPrice / currentCost).toFixed(2) : '0.00';
  const currentMargin = currentPrice > 0 ? (((currentPrice - currentCost) / currentPrice) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Doces e Receitas</h1>
          <p className="text-gray-500 font-medium">Controle de ficha técnica e produção.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSuggestions(true)} className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-100 font-bold px-4 py-3 rounded-2xl flex items-center gap-2 shadow-sm transition-all text-sm">
            <Sparkles size={16} className="text-pink-400" /> Sugestões
          </button>
          <button onClick={handleOpenAdd} className="bg-pink-500 hover:bg-pink-600 text-white font-black px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-pink-100 transition-all text-sm">
            <Plus size={18} /> Novo Doce
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.products.map(product => {
          const margin = ((product.price - product.cost) / product.price) * 100;
          const markup = product.cost > 0 ? (product.price / product.cost) : 0;
          const maxProduction = calculateMaxPossibleProduction(product);
          
          return (
            <div key={product.id} className="bg-white p-7 rounded-[32px] border border-pink-50 shadow-sm flex flex-col h-full relative group hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-pink-50 text-pink-500 rounded-2xl"><Cake size={24} /></div>
                  <div>
                    <h3 className="font-black text-gray-800 text-lg leading-tight">{product.name}</h3>
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Receita p/ {product.yield} un</span>
                  </div>
                </div>
                <button onClick={() => handleOpenEdit(product)} className="text-gray-300 hover:text-pink-500 p-1.5 transition-colors"><MoreHorizontal size={20} /></button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-50 text-center">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Markup</p>
                    <p className="font-black text-gray-700 text-lg">{markup.toFixed(2)}x</p>
                </div>
                <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-50 text-center">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Margem</p>
                    <p className={`font-black text-lg ${margin >= 40 ? 'text-emerald-500' : 'text-amber-500'}`}>{margin.toFixed(0)}%</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-pink-50/20 rounded-2xl mb-6 border border-pink-50/50">
                <div className="flex items-center gap-2 text-gray-600 font-bold text-sm"><Box size={16} className="text-pink-400" /> Prontos para Venda:</div>
                <span className="font-black text-xl text-gray-800">{product.quantity}</span>
              </div>

              <button 
                onClick={() => setShowProduceModal(product.id)} 
                disabled={maxProduction <= 0}
                className={`w-full mt-auto py-4 rounded-2xl font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all ${
                  maxProduction > 0 
                  ? 'bg-pink-500 hover:bg-pink-600 text-white shadow-pink-100' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-100'
                }`}
              >
                <ChefHat size={18} /> {maxProduction > 0 ? `Lançar Produção (+${maxProduction})` : 'Sem Insumos no Estoque'}
              </button>
            </div>
          );
        })}
        {state.products.length === 0 && (
          <div className="lg:col-span-3 py-20 bg-white rounded-[40px] border-2 border-dashed border-gray-100 text-center">
             <div className="p-4 bg-gray-50 rounded-full inline-block mb-4"><Cake size={40} className="text-gray-200" /></div>
             <p className="text-gray-500 font-black">Nenhum doce cadastrado ainda.</p>
             <button onClick={handleOpenAdd} className="mt-4 text-pink-500 font-black text-sm hover:underline">Começar agora ✨</button>
          </div>
        )}
      </div>

      {/* Modal de Sugestões */}
      {showSuggestions && (
        <div className="fixed inset-0 bg-pink-950/20 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white w-full max-w-xl p-8 rounded-[40px] shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-black text-gray-800">Modelos de Doces</h2>
                <p className="text-sm text-gray-500 font-medium italic">Selecione para configurar sua ficha técnica.</p>
              </div>
              <button onClick={() => setShowSuggestions(false)} className="text-gray-400 hover:text-red-500 p-2"><X size={24} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {SUGGESTED_PRODUCTS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddSuggested(item)}
                  className="flex items-center justify-between p-5 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-pink-300 transition-all text-left group"
                >
                  <div className="flex flex-col">
                    <span className="font-black text-gray-700 text-sm">{item.name}</span>
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{item.category} • {item.yield} un</span>
                  </div>
                  <Plus size={18} className="text-gray-300 group-hover:text-pink-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Engenharia de Preço */}
      {showAddForm && (
        <div className="fixed inset-0 bg-pink-950/20 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
          <form onSubmit={handleSaveProduct} className="bg-white w-full max-w-2xl p-8 md:p-10 rounded-[45px] shadow-2xl my-8">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-pink-50 text-pink-500 rounded-xl"><Sparkles size={20}/></div>
                 <h2 className="text-2xl font-black text-gray-800 tracking-tight">Ficha Técnica ✨</h2>
              </div>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={24}/></button>
            </div>
            
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1">Nome da Receita</label>
                  <input type="text" required placeholder="Ex: Brigadeiro Belga" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-bold focus:bg-white focus:border-pink-500 outline-none transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1 flex items-center gap-1"><Scale size={12}/> Rendimento Unitário</label>
                  <input type="number" step="any" required className="w-full px-6 py-4 rounded-2xl border-2 border-pink-50 bg-pink-50/30 text-gray-800 font-black outline-none focus:border-pink-500 transition-all text-lg" value={formData.yield ?? ''} onChange={e => handleYieldChange(e.target.value)} />
                </div>
              </div>

              <div className="p-8 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <div>
                        <span className="text-[10px] text-gray-400 font-black block uppercase tracking-widest mb-1">Custo Insumos (Unitário)</span>
                        <span className="text-3xl font-black text-gray-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentCost)}</span>
                      </div>
                      <div className="space-y-2">
                        <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1 flex items-center gap-1"><DollarSign size={12}/> Seu Preço de Venda</label>
                        <input 
                          type="number" step="any" required 
                          className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 bg-white text-gray-800 font-black text-xl outline-none focus:border-pink-500 shadow-sm" 
                          value={formData.price ?? ''} placeholder="0,00" 
                          onChange={e => setFormData({...formData, price: e.target.value === '' ? undefined : Number(e.target.value)})} 
                        />
                      </div>
                   </div>
                   <div className="bg-white p-6 rounded-3xl border border-pink-50 flex flex-col justify-center space-y-4 shadow-sm shadow-pink-50">
                      <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Markup Sugerido</span>
                        <span className="text-xl font-black text-pink-500">{currentMarkup}x</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lucro Líquido Unit.</span>
                        <span className="text-xl font-black text-emerald-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.max(0, currentPrice - currentCost))}</span>
                      </div>
                   </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-black text-gray-700 text-[11px] uppercase tracking-[0.2em] ml-1">Ingredientes & Proporções</h3>
                  <button type="button" onClick={() => setFormData(prev => ({...prev, ingredients: [...(prev.ingredients || []), {stockItemId: '', quantity: 0}]}))} className="bg-white border border-gray-100 text-pink-500 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:border-pink-200 transition-all">+ Novo Item</button>
                </div>
                <div className="space-y-3">
                  {formData.ingredients?.map((ing, idx) => {
                    const stockItem = state.stock.find(s => s.id === ing.stockItemId);
                    return (
                      <div key={idx} className="flex gap-3 items-center bg-white p-3 rounded-2xl border border-gray-50 hover:border-pink-100 transition-all shadow-sm">
                        <select required className="flex-1 bg-transparent text-sm font-black text-gray-700 outline-none" value={ing.stockItemId} onChange={e => updateIngredientRow(idx, 'stockItemId', e.target.value)}>
                          <option value="">Selecionar Insumo...</option>
                          {state.stock.map(s => <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>)}
                        </select>
                        <input type="number" step="any" required className="w-24 bg-gray-50 px-3 py-2 rounded-xl text-sm font-black text-pink-500 text-right outline-none focus:bg-white focus:border-pink-200 border border-transparent" placeholder="Qtd" value={ing.quantity || ''} onChange={e => updateIngredientRow(idx, 'quantity', e.target.value === '' ? 0 : Number(e.target.value))} />
                        <span className="text-[10px] font-black text-gray-300 w-6 uppercase">{stockItem?.unit || 'un'}</span>
                        <button type="button" onClick={() => setFormData(prev => ({...prev, ingredients: prev.ingredients?.filter((_, i) => i !== idx)}))} className="text-gray-200 hover:text-red-400 p-2 transition-colors"><Trash2 size={16}/></button>
                      </div>
                    );
                  })}
                  {(!formData.ingredients || formData.ingredients.length === 0) && (
                    <p className="text-center py-4 text-xs italic text-gray-400">Adicione os ingredientes desta receita.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-12">
              <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-4 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-600 transition-colors">Cancelar</button>
              <button type="submit" className="flex-[2] py-5 bg-pink-500 text-white rounded-[30px] font-black text-lg shadow-xl shadow-pink-100 hover:bg-pink-600 transition-all">Salvar Doce</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Lançar Produção */}
      {showProduceModal && (
        <div className="fixed inset-0 bg-pink-950/20 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white w-full max-w-sm p-10 rounded-[45px] shadow-2xl animate-in zoom-in duration-200">
             <div className="text-center mb-8">
                <div className="w-16 h-16 bg-pink-50 text-pink-500 rounded-[24px] flex items-center justify-center mx-auto mb-5">
                   <ChefHat size={32} />
                </div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Nova Fornada?</h2>
                <p className="text-xs text-gray-400 font-bold mt-2 leading-relaxed">O estoque de insumos será abatido automaticamente.</p>
             </div>
             <div className="space-y-2 mb-8 text-center">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Quantas Receitas fez?</label>
                <input 
                    type="number" step="any" className="w-full text-center py-6 bg-gray-50 rounded-3xl border-4 border-gray-50 focus:border-pink-500 focus:bg-white text-4xl font-black text-gray-800 outline-none transition-all" 
                    value={produceQty ?? ''} onChange={e => setProduceQty(e.target.value === '' ? undefined : Number(e.target.value))} 
                />
             </div>
             <div className="flex gap-3">
                <button onClick={() => setShowProduceModal(null)} className="flex-1 py-4 text-gray-400 font-black text-xs uppercase tracking-widest">Cancelar</button>
                <button onClick={() => handleProduce(showProduceModal)} className="flex-[2] py-5 bg-pink-500 text-white rounded-[24px] font-black shadow-lg shadow-pink-100 hover:bg-pink-600 transition-all">Confirmar</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
