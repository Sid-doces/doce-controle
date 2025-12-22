
import React, { useState } from 'react';
import { AppState, StockItem } from '../types';
import { Plus, AlertCircle, Info, Edit2, Trash2, X, Sparkles, Check } from 'lucide-react';

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
    if (confirm('Tem certeza que deseja excluir este insumo?')) {
      setState(prev => ({
        ...prev,
        stock: prev.stock.filter(item => item.id !== id)
      }));
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Meus Ingredientes</h1>
          <p className="text-gray-500">Cadastre quanto você paga nos insumos para calcular seu lucro.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowSuggestions(true)}
            className="bg-white hover:bg-gray-50 text-black border-2 border-gray-100 font-bold px-4 py-3 rounded-xl flex items-center gap-2 shadow-sm transition-all"
          >
            <Sparkles size={18} className="text-amber-500" />
            Sugestões
          </button>
          <button 
            onClick={handleOpenAdd}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-100 transition-all"
          >
            <Plus size={20} />
            Novo Insumo
          </button>
        </div>
      </header>

      <div className="bg-white p-4 rounded-2xl border border-blue-50 flex items-start gap-3 text-blue-700 font-semibold text-sm">
        <Info className="shrink-0" size={20} />
        <p>Use valores decimais para frações (ex: 0,5 para meio quilo).</p>
      </div>

      {showSuggestions && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white w-full max-w-xl p-8 rounded-[40px] shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-black text-black">Sugestões de Ingredientes</h2>
                <p className="text-sm text-gray-500">Adicione rapidamente os itens mais comuns.</p>
              </div>
              <button onClick={() => setShowSuggestions(false)} className="text-gray-400 p-2"><X size={24} /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {SUGGESTED_ITEMS.map((item, idx) => {
                const isAdded = state.stock.some(s => s.name.toLowerCase() === item.name.toLowerCase());
                return (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex flex-col">
                      <span className="font-bold text-black text-sm">{item.name}</span>
                      <span className="text-[10px] text-gray-400 font-black uppercase">Unidade: {item.unit}</span>
                    </div>
                    <button
                      onClick={() => handleAddSuggested(item)}
                      disabled={isAdded}
                      className={`p-2 rounded-xl transition-all ${
                        isAdded 
                        ? 'bg-emerald-100 text-emerald-600' 
                        : 'bg-white text-black border border-gray-200 hover:border-amber-500'
                      }`}
                    >
                      {isAdded ? <Check size={18} /> : <Plus size={18} />}
                    </button>
                  </div>
                );
              })}
            </div>

            <button 
              onClick={() => setShowSuggestions(false)}
              className="w-full mt-8 py-4 bg-white text-black border-2 border-gray-100 rounded-2xl font-black shadow-lg hover:bg-gray-50 transition-all"
            >
              Fechar Sugestões
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <form 
            onSubmit={handleSave}
            className="bg-white w-full max-w-lg p-8 rounded-3xl shadow-2xl animate-in zoom-in duration-200"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-black">
                {editingItem ? 'Editar Insumo' : 'Novo Insumo'}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400"><X size={24} /></button>
            </div>
            
            <div className="space-y-4">
              <label className="block">
                <span className="text-gray-700 font-bold">Nome do Insumo:</span>
                <input 
                  type="text" required
                  className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 bg-white text-black font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  placeholder="Ex: Leite Condensado"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-gray-700 font-bold">Unidade de Medida:</span>
                  <select 
                    className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 bg-white text-black font-semibold focus:outline-none"
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                  >
                    <option value="un">un (unidades)</option>
                    <option value="kg">kg (quilos)</option>
                    <option value="g">g (gramas)</option>
                    <option value="l">l (litros)</option>
                    <option value="ml">ml (mililitros)</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-gray-700 font-bold text-sm">Preço Pago (por {formData.unit}):</span>
                  <input 
                    type="number" step="any" required
                    className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 bg-white text-black font-semibold focus:outline-none"
                    placeholder="R$ 0,00"
                    value={formData.unitPrice ?? ''}
                    onChange={e => setFormData({...formData, unitPrice: e.target.value === '' ? undefined : Number(e.target.value)})}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <label className="block">
                  <span className="text-gray-700 font-bold text-sm">Quantidade Atual:</span>
                  <input 
                    type="number" step="any" required
                    className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 bg-white text-black font-semibold focus:outline-none"
                    value={formData.quantity ?? ''}
                    placeholder="Ex: 0.5"
                    onChange={e => setFormData({...formData, quantity: e.target.value === '' ? undefined : Number(e.target.value)})}
                  />
                </label>
                <label className="block">
                  <span className="text-gray-700 font-bold text-sm">Aviso de Baixo Estoque:</span>
                  <input 
                    type="number" step="any" required
                    className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 bg-white text-black font-semibold focus:outline-none"
                    value={formData.minQuantity ?? ''}
                    placeholder="Ex: 0.1"
                    onChange={e => setFormData({...formData, minQuantity: e.target.value === '' ? undefined : Number(e.target.value)})}
                  />
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 text-black font-black">Cancelar</button>
              <button type="submit" className="flex-2 py-4 bg-amber-500 text-white rounded-2xl font-black shadow-lg">
                Salvar Insumo
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-pink-100 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-pink-50 text-black text-xs uppercase font-black">
            <tr>
              <th className="px-6 py-4 text-left">Insumo</th>
              <th className="px-6 py-4 text-center">Preço Unit.</th>
              <th className="px-6 py-4 text-center">Estoque</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {state.stock.map(item => {
              const isLow = item.quantity <= item.minQuantity;
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-black">{item.name}</div>
                      {isLow && <AlertCircle className="text-amber-500 animate-pulse" size={16} />}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-black font-bold text-sm">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice)}
                      <span className="text-[10px] text-gray-400 ml-1">/{item.unit}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full font-black text-lg ${isLow ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {item.quantity} <small className="text-[10px] uppercase">{item.unit}</small>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenEdit(item)} className="p-2 text-black hover:text-blue-500"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-black hover:text-red-500"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockControl;
