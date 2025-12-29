
import React, { useState, useMemo } from 'react';
import { AppState, StockItem } from '../types';
import { 
  Plus, 
  AlertCircle, 
  Info, 
  Edit2, 
  Trash2, 
  X, 
  Sparkles, 
  Check, 
  PackageOpen, 
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  TrendingDown
} from 'lucide-react';

interface StockControlProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const SUGGESTED_ITEMS = [
  { name: 'Leite Condensado', unit: 'un', unitPrice: 0 },
  { name: 'Creme de Leite', unit: 'un', unitPrice: 0 },
  { name: 'Chocolate em Barra', unit: 'kg', unitPrice: 0 },
  { name: 'Farinha de Trigo', unit: 'kg', unitPrice: 0 },
  { name: 'Açúcar Refinado', unit: 'kg', unitPrice: 0 },
  { name: 'Manteiga s/ Sal', unit: 'kg', unitPrice: 0 },
  { name: 'Ovos', unit: 'un', unitPrice: 0 },
  { name: 'Cacau em Pó 50%', unit: 'g', unitPrice: 0 },
  { name: 'Granulado Gourmet', unit: 'g', unitPrice: 0 },
  { name: 'Chantilly', unit: 'l', unitPrice: 0 },
  { name: 'Morango Fresco', unit: 'kg', unitPrice: 0 },
  { name: 'Embalagem p/ Bolo', unit: 'un', unitPrice: 0 },
];

const StockControl: React.FC<StockControlProps> = ({ state, setState }) => {
  const [showModal, setShowModal] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [formData, setFormData] = useState<Partial<StockItem>>({
    name: '',
    quantity: undefined,
    minQuantity: undefined,
    unit: 'un',
    unitPrice: undefined
  });

  // Cálculos de resumo
  const stockSummary = useMemo(() => {
    const items = state.stock;
    return {
      critical: items.filter(i => i.quantity <= i.minQuantity).length,
      warning: items.filter(i => i.quantity > i.minQuantity && i.quantity <= i.minQuantity * 1.25).length,
      ok: items.filter(i => i.quantity > i.minQuantity * 1.25).length,
      totalValue: items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0)
    };
  }, [state.stock]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', quantity: undefined, minQuantity: undefined, unit: 'un', unitPrice: undefined });
    setShowModal(true);
  };

  const handleOpenEdit = (item: StockItem) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const finalItem = {
      ...formData,
      quantity: Number(formData.quantity) || 0,
      minQuantity: Number(formData.minQuantity) || 0,
      unitPrice: Number(formData.unitPrice) || 0
    } as StockItem;

    if (editingItem) {
      setState(prev => ({
        ...prev,
        stock: prev.stock.map(item => 
          item.id === editingItem.id ? { ...item, ...finalItem } : item
        )
      }));
    } else {
      const newItem: StockItem = {
        ...finalItem,
        id: Math.random().toString(36).substr(2, 9),
      };
      setState(prev => ({
        ...prev,
        stock: [...prev.stock, newItem]
      }));
    }
    setShowModal(false);
  };

  const handleAddSuggested = (suggestion: typeof SUGGESTED_ITEMS[0]) => {
    const alreadyExists = state.stock.some(s => s.name.toLowerCase() === suggestion.name.toLowerCase());
    if (alreadyExists) return;

    const newItem: StockItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: suggestion.name,
      quantity: 0,
      minQuantity: 0,
      unit: suggestion.unit,
      unitPrice: 0
    };

    setState(prev => ({
      ...prev,
      stock: [...prev.stock, newItem]
    }));
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja excluir este insumo? Isso afetará fichas técnicas vinculadas.')) {
      setState(prev => ({
        ...prev,
        stock: prev.stock.filter(item => item.id !== id)
      }));
    }
  };

  const getStatusInfo = (item: StockItem) => {
    if (item.quantity <= item.minQuantity) {
      return { 
        label: 'Crítico', 
        color: 'bg-red-50 text-red-600 border-red-100', 
        dot: 'bg-red-500', 
        icon: AlertCircle 
      };
    }
    if (item.quantity <= item.minQuantity * 1.25) {
      return { 
        label: 'Atenção', 
        color: 'bg-amber-50 text-amber-600 border-amber-100', 
        dot: 'bg-amber-500', 
        icon: AlertTriangle 
      };
    }
    return { 
      label: 'OK', 
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100', 
      dot: 'bg-emerald-500', 
      icon: CheckCircle2 
    };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Estoque Inteligente</h1>
          <p className="text-gray-500 font-medium italic">Sua lista de compras automatizada.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowSuggestions(true)}
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-100 font-bold px-5 py-3 rounded-2xl flex items-center gap-2 shadow-sm transition-all text-sm"
          >
            <Sparkles size={16} className="text-amber-500" />
            Sugestões
          </button>
          <button 
            onClick={handleOpenAdd}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-black px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-100 transition-all text-sm"
          >
            <Plus size={18} />
            Novo Insumo
          </button>
        </div>
      </header>

      {/* Resumo do Estoque */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-red-100 flex items-center gap-5 shadow-sm">
           <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shrink-0">
              <TrendingDown size={24} />
           </div>
           <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Abaixo do Mínimo</p>
              <p className="text-2xl font-black text-red-600">{stockSummary.critical} <span className="text-xs text-gray-400">insumos</span></p>
           </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-amber-100 flex items-center gap-5 shadow-sm">
           <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shrink-0">
              <AlertTriangle size={24} />
           </div>
           <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Próximos do Fim</p>
              <p className="text-2xl font-black text-amber-600">{stockSummary.warning} <span className="text-xs text-gray-400">itens</span></p>
           </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-emerald-100 flex items-center gap-5 shadow-sm">
           <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
              <CheckCircle2 size={24} />
           </div>
           <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nível Saudável</p>
              <p className="text-2xl font-black text-emerald-600">{stockSummary.ok} <span className="text-xs text-gray-400">itens</span></p>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="bg-gray-50/30 text-gray-400 text-[10px] uppercase font-black tracking-widest">
            <tr>
              <th className="px-8 py-6 text-left">Insumo</th>
              <th className="px-8 py-6 text-center">Status</th>
              <th className="px-8 py-6 text-center">Preço Compra</th>
              <th className="px-8 py-6 text-center">Saldo / Mín</th>
              <th className="px-8 py-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {state.stock.map(item => {
              const status = getStatusInfo(item);
              const StatusIcon = status.icon;
              return (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="font-black text-gray-700">{item.name}</div>
                    <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Unidade: {item.unit}</div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest border ${status.color}`}>
                       <StatusIcon size={12} />
                       {status.label}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-gray-700 font-black text-sm">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice)}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-gray-800 font-black text-sm">{item.quantity} {item.unit}</span>
                      <span className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">Mín: {item.minQuantity}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenEdit(item)} className="p-2 text-gray-300 hover:text-indigo-500 transition-colors"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {state.stock.length === 0 && (
              <tr>
                <td colSpan={5} className="px-8 py-24 text-center">
                   <PackageOpen className="mx-auto text-gray-100 mb-5" size={60} />
                   <p className="text-gray-400 font-black italic tracking-tight">Nenhum ingrediente cadastrado ainda.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE SUGESTÕES */}
      {showSuggestions && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md flex items-center justify-center z-[200] p-4">
          <div className="bg-white w-full max-w-xl p-10 rounded-[45px] shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Insumos Frequentes ✨</h2>
                <p className="text-sm text-gray-500 font-medium italic">Adicione rapidamente os itens básicos.</p>
              </div>
              <button onClick={() => setShowSuggestions(false)} className="text-gray-400 hover:text-red-500 p-2 transition-colors"><X size={28} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              {SUGGESTED_ITEMS.map((item, idx) => {
                const alreadyExists = state.stock.some(s => s.name.toLowerCase() === item.name.toLowerCase());
                return (
                  <button
                    key={idx}
                    onClick={() => handleAddSuggested(item)}
                    disabled={alreadyExists}
                    className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all text-left group ${
                      alreadyExists 
                      ? 'bg-gray-50 border-transparent opacity-50 cursor-not-allowed' 
                      : 'bg-white border-gray-100 hover:border-amber-400 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-black text-gray-700 text-sm mb-1">{item.name}</span>
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Unid: {item.unit}</span>
                    </div>
                    {alreadyExists ? <Check size={20} className="text-emerald-500" /> : <Plus size={20} className="text-gray-300 group-hover:text-amber-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo/Editar Insumo */}
      {showModal && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md flex items-center justify-center z-[200] p-4 overflow-y-auto">
          <form 
            onSubmit={handleSave}
            className="bg-white w-full max-w-lg p-10 rounded-[45px] shadow-2xl my-8 animate-in zoom-in duration-300"
          >
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">
                {editingItem ? 'Editar Insumo' : 'Novo Insumo'}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-300 hover:text-red-500 transition-colors"><X size={28} /></button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1">Nome do Insumo</label>
                <input 
                  type="text" required
                  className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all placeholder:text-gray-300"
                  placeholder="Ex: Leite Moça Lata"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1">Unidade</label>
                  <select 
                    className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-black outline-none h-[62px] transition-all"
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                  >
                    <option value="un">un (unidade)</option>
                    <option value="kg">kg (quilo)</option>
                    <option value="g">g (grama)</option>
                    <option value="l">l (litro)</option>
                    <option value="ml">ml (mili)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1">Preço de Compra (por {formData.unit})</label>
                  <input 
                    type="number" step="any" required
                    className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-black text-xl focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    placeholder="0,00"
                    value={formData.unitPrice ?? ''}
                    onChange={e => setFormData({...formData, unitPrice: e.target.value === '' ? undefined : Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                  <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1">Saldo em Estoque</label>
                  <input 
                    type="number" step="any" required
                    className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-black text-xl focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    value={formData.quantity ?? ''}
                    placeholder="0"
                    onChange={e => setFormData({...formData, quantity: e.target.value === '' ? undefined : Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1 flex items-center gap-1">Estoque Mínimo <AlertCircle size={10} /></label>
                  <input 
                    type="number" step="any" required
                    className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-black text-xl focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    value={formData.minQuantity ?? ''}
                    placeholder="Abaixo disso o app avisa"
                    onChange={e => setFormData({...formData, minQuantity: e.target.value === '' ? undefined : Number(e.target.value)})}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-12">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-600 transition-colors">Cancelar</button>
              <button type="submit" className="flex-[2] py-5 bg-indigo-500 text-white rounded-[32px] font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-600 transition-all">
                Salvar Insumo
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default StockControl;
