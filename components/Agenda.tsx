
import React, { useState } from 'react';
import { AppState, Order, Customer } from '../types';
import { Plus, Calendar, Clock, CheckCircle, Trash2, User, MessageCircle } from 'lucide-react';

interface AgendaProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Agenda: React.FC<AgendaProps> = ({ state, setState }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'customers'>('orders');
  const [showModal, setShowModal] = useState(false);
  const [newOrder, setNewOrder] = useState<Partial<Order>>({ clientName: '', productName: '', deliveryDate: '', value: 0, status: 'Pendente' });

  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const order: Order = {
      id: Math.random().toString(36).substr(2, 9),
      companyId: state.user?.companyId || '',
      clientName: newOrder.clientName || '',
      productName: newOrder.productName || '',
      deliveryDate: newOrder.deliveryDate || '',
      value: Number(newOrder.value),
      cost: 0,
      paymentMethod: 'PIX',
      status: 'Pendente'
    };
    setState(prev => ({ ...prev, orders: [order, ...prev.orders] }));
    setShowModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">Agenda de Pedidos 📅</h1>
        <button onClick={() => setShowModal(true)} className="bg-pink-500 text-white p-4 rounded-2xl shadow-lg shadow-pink-100 active:scale-95 transition-all"><Plus size={24} /></button>
      </header>

      <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-fit">
        <button onClick={() => setActiveTab('orders')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${activeTab === 'orders' ? 'bg-pink-500 text-white' : 'text-gray-400'}`}>Encomendas</button>
        <button onClick={() => setActiveTab('customers')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${activeTab === 'customers' ? 'bg-pink-500 text-white' : 'text-gray-400'}`}>Clientes</button>
      </div>

      <div className="space-y-4">
        {activeTab === 'orders' ? (
          state.orders.map(o => (
            <div key={o.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${o.status === 'Pendente' ? 'bg-pink-50 text-pink-500' : 'bg-emerald-50 text-emerald-500'}`}>
                  {o.status === 'Pendente' ? <Clock size={24} /> : <CheckCircle size={24} />}
                </div>
                <div>
                  <h3 className="font-black text-gray-800 text-base">{o.clientName}</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(o.deliveryDate).toLocaleDateString('pt-BR')} • {o.productName}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-gray-800">R$ {o.value.toFixed(2)}</p>
                <button onClick={() => setState(prev => ({...prev, orders: prev.orders.filter(order => order.id !== o.id)}))} className="text-red-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>
          ))
        ) : (
          state.customers.map(c => (
            <div key={c.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center"><User size={24} /></div>
                <div>
                  <h3 className="font-black text-gray-800 text-base">{c.name}</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{c.phone}</p>
                </div>
              </div>
              <a href={`https://wa.me/${c.phone}`} className="p-3 bg-emerald-50 text-emerald-500 rounded-xl"><MessageCircle size={20} /></a>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleSaveOrder} className="bg-white w-full max-w-sm p-8 rounded-[40px] shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-xl font-black text-gray-800 mb-6">Nova Encomenda</h2>
            <div className="space-y-4">
              <input type="text" required placeholder="Nome do Cliente" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" value={newOrder.clientName} onChange={e => setNewOrder({...newOrder, clientName: e.target.value})} />
              <input type="text" required placeholder="O que ele pediu?" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" value={newOrder.productName} onChange={e => setNewOrder({...newOrder, productName: e.target.value})} />
              <input type="date" required className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-gray-400" value={newOrder.deliveryDate} onChange={e => setNewOrder({...newOrder, deliveryDate: e.target.value})} />
              <input type="number" required placeholder="Valor do Pedido" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-black text-lg text-pink-500" value={newOrder.value || ''} onChange={e => setNewOrder({...newOrder, value: Number(e.target.value)})} />
            </div>
            <div className="flex gap-4 mt-8">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 text-gray-400 font-black text-[10px] uppercase tracking-widest">Sair</button>
              <button type="submit" className="flex-[2] py-4 bg-pink-500 text-white rounded-2xl font-black shadow-lg shadow-pink-100">Agendar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Agenda;
