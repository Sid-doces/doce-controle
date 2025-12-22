
import React, { useState } from 'react';
import { AppState, Order } from '../types';
import { Plus, Calendar, CheckCircle, Clock, Trash2, AlertCircle, X } from 'lucide-react';

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
    if(confirm("Deseja excluir?")) {
      setState(prev => ({ ...prev, orders: prev.orders.filter(o => o.id !== id) }));
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Agenda</h1>
          <p className="text-gray-500">Entregas programadas.</p>
        </div>
        <button onClick={() => setShowAddOrder(true)} className="bg-pink-500 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg"><Plus size={20} /> Agendar</button>
      </header>

      <div className="space-y-4">
        {state.orders.map(order => (
          <div key={order.id} className="bg-white p-5 rounded-2xl border border-pink-50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${order.status === 'Entregue' ? 'bg-emerald-50 text-emerald-500' : 'bg-pink-50 text-pink-500'}`}>
                {order.status === 'Entregue' ? <CheckCircle size={24} /> : <Clock size={24} />}
              </div>
              <div>
                <h3 className="font-black text-black text-lg">{order.clientName}</h3>
                <p className="text-gray-700 text-sm font-bold">{order.productName}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-black bg-gray-100 px-2 py-0.5 rounded">{new Date(order.deliveryDate).toLocaleDateString()}</span>
                  <span className="text-pink-600 font-black text-sm">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.value)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => removeOrder(order.id)} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={20} /></button>
              <button onClick={() => toggleStatus(order.id)} className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all ${order.status === 'Entregue' ? 'bg-emerald-100 text-emerald-700' : 'bg-pink-500 text-white'}`}>{order.status === 'Entregue' ? 'Concluído ✅' : 'Entregar'}</button>
            </div>
          </div>
        ))}
      </div>

      {showAddOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <form onSubmit={handleAddOrder} className="bg-white w-full max-w-lg p-8 rounded-3xl shadow-2xl">
            <h2 className="text-xl font-bold text-black mb-6">Novo Agendamento</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="text-gray-700 font-bold">Cliente:</span>
                <input type="text" required className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 text-black outline-none" value={newOrder.clientName} onChange={e => setNewOrder({...newOrder, clientName: e.target.value})} />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-gray-700 font-bold">Data:</span>
                  <input type="date" required className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 text-black outline-none" value={newOrder.deliveryDate} onChange={e => setNewOrder({...newOrder, deliveryDate: e.target.value})} />
                </label>
                <label className="block">
                  <span className="text-gray-700 font-bold">Valor (R$):</span>
                  <input type="number" step="any" required className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 text-black font-black outline-none" value={newOrder.value ?? ''} placeholder="0,00" onChange={e => setNewOrder({...newOrder, value: e.target.value === '' ? undefined : Number(e.target.value)})} />
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button type="button" onClick={() => setShowAddOrder(false)} className="flex-1 py-4 text-black font-black">Cancelar</button>
              <button type="submit" className="flex-2 py-4 bg-pink-500 text-white rounded-2xl font-black">Salvar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Agenda;
