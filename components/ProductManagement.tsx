
import React, { useState, useMemo, useRef } from 'react';
import { AppState, Category, Product, ProductIngredient, Production } from '../types';
import { Plus, Trash2, Cake, MoreHorizontal, ChefHat, X, Box, Sparkles, Scale, AlertCircle, Info, DollarSign, TrendingUp, Percent, Calculator, ChevronRight, Package, Camera, Image as ImageIcon } from 'lucide-react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    cost: 0,
    price: undefined,
    category: 'Bolo',
    quantity: 0,
    yield: 1,
    ingredients: [],
    image: undefined
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateUnitCost = (ingredients: ProductIngredient[], yieldQty: number) => {
    const totalCost = ingredients.reduce((total, ing) => {
      const stockItem = state.stock.find(s => s.id === ing.stockItemId);
      return total + (stockItem ? stockItem.unitPrice * ing.quantity : 0);
    }, 0);
    return yieldQty > 0 ? totalCost / yieldQty : 0;
  };

  const calculateMaxPossibleProduction = (product: Product) => {
    if (!product.ingredients || product.ingredients.length === 0) return 1000;
    let minPossible = Infinity;
    product.ingredients.forEach(ing => {
      const stockItem = state.stock.find(s => s.id === ing.stockItemId);
      if (!stockItem || stockItem.quantity <= 0) {
        minPossible = 0;
        return;
      }
      const qtyPerRecipe = ing.quantity;
      const possibleWithThisIng = Math.floor(stockItem.quantity / qtyPerRecipe);
      if (possibleWithThisIng < minPossible) minPossible = possibleWithThisIng;
    });
    return minPossible === Infinity ? 0 : minPossible;
  };

  const handleOpenAdd = () => {
    setEditingProductId(null);
    setFormData({ name: '', cost: 0, price: undefined, category: 'Bolo', quantity: 0, yield: 1, ingredients: [], image: undefined });
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
      ingredients: formData.ingredients || [],
      image: formData.image
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

    const batchCost = product.ingredients.reduce((acc, ing) => {
      const stockItem = state.stock.find(s => s.id === ing.stockItemId);
      return acc + (stockItem ? stockItem.unitPrice * (ing.quantity * produceQty!) : 0);
    }, 0);

    const newProduction: Production = {
      id: Math.random().toString(36).substr(2, 9),
      productId: product.id,
      productName: product.name,
      quantityProduced: produceQty * product.yield,
      totalCost: batchCost,
      date: new Date().toISOString()
    };

    setState(prev => {
      const updatedStock = prev.stock.map(s => {
        const recipeIng = product.ingredients.find(ri => ri.stockItemId === s.id);
        if (recipeIng) {
          const needed = recipeIng.quantity * produceQty!;
          return { ...s, quantity: parseFloat((s.quantity - needed).toFixed(3)) };
        }
        return s;
      });
      const updatedProducts = prev.products.map(p => 
        p.id === productId ? { ...p, quantity: p.quantity + (produceQty! * p.yield) } : p
      );
      return { 
        ...prev, 
        stock: updatedStock, 
        products: updatedProducts,
        productions: [newProduction, ...(prev.productions || [])]
      };
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
      ingredients: [],
      image: undefined
    });
    setEditingProductId(null);
    setShowAddForm(true);
  };

  const avgMarkup = useMemo(() => {
    const productsWithCost = state.products.filter(p => p.cost > 0);
    return productsWithCost.length > 0 
      ? productsWithCost.reduce((acc, p) => acc + (p.price / p.cost), 0) / productsWithCost.length 
      : 0;
  }, [state.products]);

  const avgMargin = useMemo(() => {
    const productsWithCost = state.products.filter(p => p.cost > 0 && p.price > 0);
    return productsWithCost.length > 0
      ? (productsWithCost.reduce((acc, p) => acc + ((p.price - p.cost) / p.price), 0) / productsWithCost.length) * 100
      : 0;
  }, [state.products]);

  const currentCost = formData.cost || 0;
  const currentPrice = formData.price || 0;
  const currentMarkup = currentCost > 0 ? (currentPrice / currentCost).toFixed(2) : '0.00';
  const currentMargin = currentPrice > 0 ? (((currentPrice - currentCost) / currentPrice) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Meus Doces</h1>
          <p className="text-gray-500 font-medium italic">Sua vitrine e engenharia de preços.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSuggestions(true)} className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-100 font-bold px-4 py-3 rounded-2xl flex items-center gap-2 shadow-sm transition-all text-sm">
            <Sparkles size={16} className="text-pink-400" /> Modelos
          </button>
          <button onClick={handleOpenAdd} className="bg-pink-500 hover:bg-pink-600 text-white font-black px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-pink-100 transition-all text-sm">
            <Plus size={18} /> Novo Doce
          </button>
        </div>
      </header>

      {state.products.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
           <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Calculator size={10} className="text-indigo-400"/> Markup Médio
              </p>
              <p className="text-xl font-black text-gray-800">{avgMarkup.toFixed(2)}x</p>
           </div>
           <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Percent size={10} className="text-pink-400"/> Margem Média
              </p>
              <p className="text-xl font-black text-gray-800">{avgMargin.toFixed(1)}%</p>
           </div>
           <div className="col-span-2 bg-indigo-50/50 p-5 rounded-[28px] border border-indigo-100 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total no Catálogo</p>
                <p className="text-xl font-black text-indigo-900">{state.products.length} Receitas</p>
              </div>
              <div className="p-2 bg-white rounded-2xl text-indigo-500 shadow-sm">
                <Cake size={20} />
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.products.map(product => {
          const margin = product.price > 0 ? ((product.price - product.cost) / product.price) * 100 : 0;
          const markup = product.cost > 0 ? (product.price / product.cost) : 0;
          const profit = Math.max(0, product.price - product.cost);
          const maxProduction = calculateMaxPossibleProduction(product);
          
          return (
            <div key={product.id} className="bg-white rounded-[32px] border border-pink-50 shadow-sm flex flex-col h-full relative group hover:shadow-md transition-all overflow-hidden">
              <div className="relative h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="p-6 bg-pink-50 text-pink-500 rounded-2xl"><Cake size={48} /></div>
                )}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                   <span className="text-[9px] text-white font-black bg-black/40 backdrop-blur-md px-3 py-1 rounded-full uppercase tracking-widest">
                      Rende {product.yield} un
                   </span>
                   <button onClick={(e) => { e.preventDefault(); handleOpenEdit(product); }} className="text-white hover:text-pink-300 p-2 transition-colors pointer-events-auto bg-black/20 rounded-xl backdrop-blur-sm"><MoreHorizontal size={20} /></button>
                </div>
              </div>

              <div className="p-7 pt-5 flex flex-col flex-1">
                <h3 className="font-black text-gray-800 text-lg leading-tight mb-4">{product.name}</h3>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-50 text-center">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Markup</p>
                      <p className={`font-black text-base ${markup < 1.8 ? 'text-red-400' : markup < 2.5 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {markup.toFixed(2)}x
                      </p>
                  </div>
                  <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-50 text-center">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Margem</p>
                      <p className={`font-black text-base ${margin < 30 ? 'text-red-400' : margin < 50 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {margin.toFixed(0)}%
                      </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-emerald-50/30 rounded-2xl mb-6 border border-emerald-50">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Lucro Un.</span>
                    <span className="font-black text-lg text-emerald-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(profit)}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Estoque</span>
                    <span className="font-black text-lg text-gray-700">{product.quantity} un</span>
                  </div>
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
                  <ChefHat size={18} /> {maxProduction > 0 ? `Lançar Produção` : 'Sem Insumos'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL FICHA TÉCNICA - PENTE FINO TECLADO */}
      {showAddForm && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md flex items-start justify-center z-[200] pt-10 pb-10 px-4 overflow-y-auto">
          <form 
            onSubmit={handleSaveProduct} 
            className="bg-white w-full max-w-2xl rounded-[45px] shadow-2xl relative animate-in zoom-in duration-300 flex flex-col mb-10"
          >
            <div className="p-8 pb-4 flex justify-between items-center border-b border-gray-50 shrink-0">
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-pink-50 text-pink-500 rounded-2xl"><Sparkles size={24}/></div>
                 <div>
                    <h2 className="text-2xl font-black text-gray-800 tracking-tight">{editingProductId ? 'Editar Receita' : 'Nova Ficha Técnica'}</h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Engenharia de Preços ✨</p>
                 </div>
              </div>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-gray-300 hover:text-red-500 p-2 transition-colors"><X size={28}/></button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-48 shrink-0 space-y-3">
                   <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1 block">Foto do Doce</label>
                   <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-[35px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-pink-300 hover:bg-pink-50/30 transition-all relative overflow-hidden"
                   >
                     {formData.image ? (
                       <img src={formData.image} className="w-full h-full object-cover" alt="Preview" />
                     ) : (
                       <>
                        <Camera className="text-gray-300" size={32} />
                        <span className="text-[9px] font-black text-gray-400 uppercase text-center px-4">Adicionar Vitrine</span>
                       </>
                     )}
                     <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                   </div>
                </div>

                <div className="flex-1 space-y-6">
                  <div className="space-y-2">
                    <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1">Nome do Doce</label>
                    <input type="text" required placeholder="Ex: Brigadeiro Belga" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-bold focus:bg-white focus:border-pink-500 outline-none transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1 flex items-center gap-1"><Scale size={12}/> Rendimento (unidades)</label>
                    <input type="number" step="any" required className="w-full px-6 py-4 rounded-2xl border-2 border-pink-50 bg-pink-50/30 text-gray-800 font-black outline-none focus:border-pink-500 transition-all text-lg" value={formData.yield ?? ''} onChange={e => handleYieldChange(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="p-8 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <div>
                        <span className="text-[10px] text-gray-400 font-black block uppercase tracking-widest mb-1">Custo unitário calculado</span>
                        <span className="text-3xl font-black text-gray-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentCost)}</span>
                      </div>
                      <div className="space-y-2">
                        <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1 flex items-center gap-1"><DollarSign size={12}/> Preço de Venda Unitário</label>
                        <input 
                          type="number" step="any" required 
                          className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 bg-white text-gray-800 font-black text-2xl outline-none focus:border-pink-500 shadow-sm" 
                          value={formData.price ?? ''} placeholder="0,00" 
                          onChange={e => setFormData({...formData, price: e.target.value === '' ? undefined : Number(e.target.value)})} 
                        />
                      </div>
                   </div>
                   <div className="bg-white p-6 rounded-3xl border border-pink-50 flex flex-col justify-center space-y-4 shadow-sm shadow-pink-50">
                      <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                        <div className="flex items-center gap-2">
                           <Calculator size={14} className="text-indigo-400" />
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Markup</span>
                        </div>
                        <span className={`text-xl font-black ${Number(currentMarkup) < 2 ? 'text-red-400' : 'text-pink-500'}`}>{currentMarkup}x</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                         <div className="flex items-center gap-2">
                           <Percent size={14} className="text-pink-400" />
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Margem (%)</span>
                        </div>
                        <span className={`text-xl font-black ${Number(currentMargin) < 40 ? 'text-amber-500' : 'text-emerald-500'}`}>{currentMargin}%</span>
                      </div>
                   </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-black text-gray-700 text-[11px] uppercase tracking-[0.2em] ml-1">Receita & Insumos</h3>
                  <button type="button" onClick={() => setFormData(prev => ({...prev, ingredients: [...(prev.ingredients || []), {stockItemId: '', quantity: 0}]}))} className="bg-white border border-gray-100 text-pink-500 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:border-pink-200 transition-all flex items-center gap-2">+ <Package size={14}/> Insumo</button>
                </div>
                <div className="space-y-3">
                  {formData.ingredients?.map((ing, idx) => {
                    const stockItem = state.stock.find(s => s.id === ing.stockItemId);
                    return (
                      <div key={idx} className="flex gap-3 items-center bg-white p-4 rounded-[24px] border border-gray-50 hover:border-pink-100 transition-all shadow-sm">
                        <select required className="flex-1 bg-transparent text-sm font-black text-gray-700 outline-none" value={ing.stockItemId} onChange={e => updateIngredientRow(idx, 'stockItemId', e.target.value)}>
                          <option value="">Insumo...</option>
                          {state.stock.map(s => <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>)}
                        </select>
                        <div className="flex items-center gap-2">
                           <input type="number" step="any" required className="w-24 bg-gray-50 px-3 py-2 rounded-xl text-sm font-black text-pink-500 text-right outline-none focus:bg-white" placeholder="0" value={ing.quantity || ''} onChange={e => updateIngredientRow(idx, 'quantity', e.target.value === '' ? 0 : Number(e.target.value))} />
                        </div>
                        <button type="button" onClick={() => setFormData(prev => ({...prev, ingredients: prev.ingredients?.filter((_, i) => i !== idx)}))} className="text-gray-200 hover:text-red-400 p-2"><Trash2 size={18}/></button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-8 bg-gray-50/30 border-t border-gray-100 flex gap-4 shrink-0">
              <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-4 text-gray-400 font-black text-xs uppercase tracking-widest">Cancelar</button>
              <button type="submit" className="flex-[2] py-5 bg-pink-500 text-white rounded-[30px] font-black text-lg shadow-xl shadow-pink-100 hover:bg-pink-600 transition-all flex items-center justify-center gap-3">
                Salvar Doce <ChefHat size={20}/>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL PRODUÇÃO - PENTE FINO TECLADO */}
      {showProduceModal && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md flex items-start justify-center z-[200] pt-20 pb-10 px-4 overflow-y-auto">
          <div className="bg-white w-full max-w-sm p-10 rounded-[45px] shadow-2xl animate-in zoom-in duration-200 relative">
             <div className="text-center mb-8">
                <div className="w-20 h-20 bg-pink-50 text-pink-500 rounded-[30px] flex items-center justify-center mx-auto mb-6 shadow-sm">
                   <ChefHat size={40} />
                </div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Nova Produção?</h2>
                <p className="text-xs text-gray-400 font-bold mt-2">Consome insumos e gera custo financeiro.</p>
             </div>
             <div className="space-y-2 mb-10 text-center">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Quantas receitas fez?</label>
                <div className="flex items-center justify-center gap-6">
                   <button type="button" onClick={() => setProduceQty(q => Math.max(0.5, (q || 1) - 0.5))} className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-xl text-gray-400 hover:text-pink-500">-</button>
                   <input 
                      type="number" step="any" className="w-24 text-center py-4 bg-gray-50 rounded-3xl border-2 border-gray-50 focus:border-pink-500 focus:bg-white text-3xl font-black text-gray-800 outline-none transition-all" 
                      value={produceQty ?? ''} onChange={e => setProduceQty(e.target.value === '' ? undefined : Number(e.target.value))} 
                   />
                   <button type="button" onClick={() => setProduceQty(q => (q || 0) + 0.5)} className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-xl text-gray-400 hover:text-pink-500">+</button>
                </div>
             </div>
             <div className="flex gap-4">
                <button onClick={() => setShowProduceModal(null)} className="flex-1 py-4 text-gray-400 font-black text-xs uppercase tracking-widest">Cancelar</button>
                <button onClick={() => handleProduce(showProduceModal)} className="flex-[2] py-5 bg-pink-500 text-white rounded-[28px] font-black shadow-xl shadow-pink-100 hover:bg-pink-600 transition-all">Confirmar</button>
             </div>
          </div>
        </div>
      )}

      {showSuggestions && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md flex items-center justify-center z-[200] p-4">
          <div className="bg-white w-full max-w-xl p-8 rounded-[45px] shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Modelos Rápidos ✨</h2>
              </div>
              <button onClick={() => setShowSuggestions(false)} className="text-gray-400 hover:text-red-500 p-2"><X size={28} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              {SUGGESTED_PRODUCTS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddSuggested(item)}
                  className="flex items-center justify-between p-6 bg-gray-50/50 rounded-3xl border border-gray-100 hover:border-pink-300 hover:bg-white transition-all text-left group"
                >
                  <div className="flex flex-col">
                    <span className="font-black text-gray-700 text-sm mb-1">{item.name}</span>
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{item.category} • {item.yield} un</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-pink-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
