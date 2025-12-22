
import React, { useState } from 'react';
import { AppState, Order } from '../types';
import { Plus, Calendar, CheckCircle, Clock, Trash2, AlertCircle, X, User } from 'lucide-react';

interface AgendaProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Agenda: React.FC<AgendaProps> = ({ state, setState }) => {
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    clientName: '',
    productName: '',
    deliveryDate: '',
    value: undefined,
    status: 'Pendente'
  });

  const handleAddOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.clientName || !newOrder.deliveryDate || newOrder.value === undefined) return;

    const order: Order = {
      id: Math.random().toString(36).substr(2, 9),
      clientName: newOrder.clientName!,
      productName: newOrder.productName || 'Vários itens',
      deliveryDate: newOrder.deliveryDate!,
      value: Number(newOrder.value),
      status: 'Pendente'
    };

    setState(prev => ({
      ...prev,
      orders: [...prev.orders, order].sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime())
    }));
    setShowAddOrder(false);
    setNewOrder({ clientName: '', productName: '', deliveryDate: '', value: undefined, status: 'Pendente' });
  };

  const toggleStatus = (id: string) => {
    setState(prev => ({
      ...prev,
      orders: prev.orders.map(o => 
        o.id === id ? { ...o, status: o.status === 'Pendente' ? 'Entregue' : 'Pendente' } : o
      )
    }));
  };

  const removeOrder = (id: string) => {
    if(confirm("Deseja excluir este agendamento?")) {
      setState(prev => ({ ...prev, orders: prev.orders.filter(o => o.id !== id) }));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Agenda de Encomendas</h1>
          <p className="text-gray-500 font-medium italic">Suas entregas programadas.</p>
        </div>
        <button 
          onClick={() => setShowAddOrder(true)} 
          className="bg-pink-500 hover:bg-pink-600 text-white font-black px-6 py-4 rounded-2xl flex items-center gap-2 shadow-lg shadow-pink-100 transition-all text-sm"
        >
          <Plus size={18} /> Novo Agendamento
        </button>
      </header>

      <div className="space-y-4">
        {state.orders.length === 0 && (
          <div className="py-20 bg-white rounded-[40px] border border-gray-100 text-center">
             <Calendar className="mx-auto text-gray-100 mb-4" size={48} />
             <p className="text-gray-400 font-black">Nenhuma encomenda agendada.</p>
          </div>
        )}
        {state.orders.map(order => (
          <div key={order.id} className="bg-white p-6 rounded-[32px] border border-pink-50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${order.status === 'Entregue' ? 'bg-emerald-50 text-emerald-500' : 'bg-pink-50 text-pink-500'}`}>
                {order.status === 'Entregue' ? <CheckCircle size={28} /> : <Clock size={28} />}
              </div>
              <div>
                <h3 className="font-black text-gray-800 text-lg leading-tight">{order.clientName}</h3>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-0.5">{order.productName}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] font-black bg-gray-50 text-gray-400 px-3 py-1 rounded-full border border-gray-100 uppercase tracking-widest">
                    {new Date(order.deliveryDate).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="text-pink-500 font-black text-sm">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.value)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => removeOrder(order.id)} className="p-2 text-gray-200 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
              <button 
                onClick={() => toggleStatus(order.id)} 
                className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm ${
                  order.status === 'Entregue' 
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                  : 'bg-pink-500 text-white hover:bg-pink-600'
                }`}
              >
                {order.status === 'Entregue' ? 'Concluído ✨' : 'Lançar Entrega'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddOrder && (
        <div className="fixed inset-0 bg-pink-950/20 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
          <form onSubmit={handleAddOrder} className="bg-white w-full max-w-lg p-10 rounded-[45px] shadow-2xl my-8 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Novo Agendamento</h2>
              <button type="button" onClick={() => setShowAddOrder(false)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={24} /></button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1 flex items-center gap-1"><User size={12}/> Nome do Cliente</label>
                <input type="text" required placeholder="Ex: Maria Oliveira" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-bold focus:bg-white focus:border-pink-500 outline-none transition-all" value={newOrder.clientName} onChange={e => setNewOrder({...newOrder, clientName: e.target.value})} />
              </div>

              <div className="space-y-2">
                <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1">O que vai ser entregue?</label>
                <input type="text" placeholder="Ex: Bolo de Chocolate 2kg" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-bold focus:bg-white focus:border-pink-500 outline-none transition-all" value={newOrder.productName} onChange={e => setNewOrder({...newOrder, productName: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1 flex items-center gap-1"><Calendar size={12}/> Data de Entrega</label>
                  <input type="date" required className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-bold focus:bg-white focus:border-pink-500 outline-none transition-all h-[60px]" value={newOrder.deliveryDate} onChange={e => setNewOrder({...newOrder, deliveryDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1">Valor Final (R$)</label>
                  <input type="number" step="any" required className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-black text-xl focus:bg-white focus:border-pink-500 outline-none transition-all" value={newOrder.value ?? ''} placeholder="0,00" onChange={e => setNewOrder({...newOrder, value: e.target.value === '' ? undefined : Number(e.target.value)})} />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-12">
              <button type="button" onClick={() => setShowAddOrder(false)} className="flex-1 py-4 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-600">Cancelar</button>
              <button type="submit" className="flex-[2] py-5 bg-pink-500 text-white rounded-[30px] font-black text-lg shadow-xl shadow-pink-100 hover:bg-pink-600 transition-all">
                Salvar na Agenda
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Agenda;
