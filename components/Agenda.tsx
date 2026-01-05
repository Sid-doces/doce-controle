
import React, { useState } from 'react';
import { AppState, Order, Customer } from '../types';
import { Plus, Calendar, Clock, CheckCircle, Trash2, User, MessageCircle, X, Phone, MapPin, FileText } from 'lucide-react';

interface AgendaProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Agenda: React.FC<AgendaProps> = ({ state, setState }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'customers'>('orders');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  
  const [newOrder, setNewOrder] = useState<Partial<Order>>({ clientName: '', productName: '', deliveryDate: '', value: 0, status: 'Pendente' });
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({ name: '', phone: '', address: '', notes: '' });

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
    setShowOrderModal(false);
    setNewOrder({ clientName: '', productName: '', deliveryDate: '', value: 0, status: 'Pendente' });
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) return;
    
    const customer: Customer = {
      id: Math.random().toString(36).substr(2, 9),
      companyId: state.user?.companyId || '',
      name: newCustomer.name,
      phone: newCustomer.phone,
      address: newCustomer.address,
      notes: newCustomer.notes,
      purchaseCount: 0
    };
    
    setState(prev => ({ 
      ...prev, 
      customers: [customer, ...(prev.customers || [])] 
    }));
    setShowCustomerModal(false);
    setNewCustomer({ name: '', phone: '', address: '', notes: '' });
  };

  const removeCustomer = (id: string) => {
    if (confirm("Remover este cliente da lista?")) {
      setState(prev => ({ ...prev, customers: prev.customers.filter(c => c.id !== id) }));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Agenda & Clientes 📅</h1>
          <p className="text-gray-500 font-medium italic text-xs">Organize suas entregas e sua base de fãs.</p>
        </div>
        <button 
          onClick={() => activeTab === 'orders' ? setShowOrderModal(true) : setShowCustomerModal(true)} 
          className="bg-pink-500 text-white p-4 rounded-2xl shadow-lg shadow-pink-100 active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </header>

      <div className="flex bg-white p-1 rounded-[20px] border border-gray-100 shadow-sm w-fit">
        <button onClick={() => setActiveTab('orders')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-400'}`}>Encomendas</button>
        <button onClick={() => setActiveTab('customers')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'customers' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-400'}`}>Meus Clientes</button>
      </div>

      <div className="space-y-4">
        {activeTab === 'orders' ? (
          state.orders.length > 0 ? (
            state.orders.map(o => (
              <div key={o.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${o.status === 'Pendente' ? 'bg-pink-50 text-pink-500' : 'bg-emerald-50 text-emerald-500'}`}>
                    {o.status === 'Pendente' ? <Clock size={24} /> : <CheckCircle size={24} />}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-800 text-base">{o.clientName}</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Entrega: {new Date(o.deliveryDate + 'T12:00:00').toLocaleDateString('pt-BR')} • {o.productName}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <p className="text-lg font-black text-gray-800">R$ {o.value.toFixed(2)}</p>
                    <p className={`text-[8px] font-black uppercase ${o.status === 'Pendente' ? 'text-pink-500' : 'text-emerald-500'}`}>{o.status}</p>
                  </div>
                  <button onClick={() => setState(prev => ({...prev, orders: prev.orders.filter(order => order.id !== o.id)}))} className="p-2 text-gray-100 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[40px] text-gray-300 font-black italic">Nenhuma encomenda agendada.</div>
          )
        ) : (
          state.customers && state.customers.length > 0 ? (
            state.customers.map(c => (
              <div key={c.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center shadow-sm">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-800 text-base">{c.name}</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{c.phone} • {c.purchaseCount || 0} Compras</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`https://wa.me/55${c.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="p-3 bg-emerald-50 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"><MessageCircle size={20} /></a>
                  <button onClick={() => removeCustomer(c.id)} className="p-3 text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={20} /></button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[40px] text-gray-300 font-black italic">Nenhum perfil de cliente cadastrado.</div>
          )
        )}
      </div>

      {/* MODAL NOVA ENCOMENDA */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleSaveOrder} className="bg-white w-full max-w-sm p-10 rounded-[45px] shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Agendar Pedido</h2>
              <button type="button" onClick={() => setShowOrderModal(false)} className="text-gray-300 hover:text-red-500"><X size={28}/></button>
            </div>
            <div className="space-y-4">
              <input type="text" required placeholder="Nome do Cliente" className="w-full p-5 bg-gray-50 rounded-2xl border-none font-bold text-gray-800 outline-none focus:ring-2 ring-pink-500" value={newOrder.clientName} onChange={e => setNewOrder({...newOrder, clientName: e.target.value})} />
              <input type="text" required placeholder="O que ele pediu?" className="w-full p-5 bg-gray-50 rounded-2xl border-none font-bold text-gray-800 outline-none focus:ring-2 ring-pink-500" value={newOrder.productName} onChange={e => setNewOrder({...newOrder, productName: e.target.value})} />
              <input type="date" required className="w-full p-5 bg-gray-50 rounded-2xl border-none font-bold text-gray-800 outline-none focus:ring-2 ring-pink-500" value={newOrder.deliveryDate} onChange={e => setNewOrder({...newOrder, deliveryDate: e.target.value})} />
              <input type="number" required placeholder="Valor do Pedido (R$)" className="w-full p-5 bg-gray-50 rounded-2xl border-none font-black text-2xl text-pink-500 outline-none focus:ring-2 ring-pink-500" value={newOrder.value || ''} onChange={e => setNewOrder({...newOrder, value: Number(e.target.value)})} />
            </div>
            <div className="flex gap-4 mt-10">
              <button type="button" onClick={() => setShowOrderModal(false)} className="flex-1 py-4 text-gray-400 font-black text-[10px] uppercase tracking-widest">Sair</button>
              <button type="submit" className="flex-[2] py-5 bg-pink-500 text-white rounded-[28px] font-black shadow-xl shadow-pink-100 hover:bg-pink-600 transition-all uppercase tracking-widest text-xs">Salvar Agenda</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL NOVO CLIENTE (PERFIL) */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleSaveCustomer} className="bg-white w-full max-w-sm p-10 rounded-[45px] shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Novo Perfil</h2>
              <button type="button" onClick={() => setShowCustomerModal(false)} className="text-gray-300 hover:text-red-500"><X size={28}/></button>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                <input type="text" required placeholder="Nome Completo" className="w-full pl-14 pr-5 py-5 bg-gray-50 rounded-2xl border-none font-bold text-gray-800 outline-none focus:ring-2 ring-indigo-500" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
              </div>
              <div className="relative">
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                <input type="tel" required placeholder="WhatsApp (DDD + Número)" className="w-full pl-14 pr-5 py-5 bg-gray-50 rounded-2xl border-none font-bold text-gray-800 outline-none focus:ring-2 ring-indigo-500" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
              </div>
              <div className="relative">
                <MapPin className="absolute left-5 top-5 text-gray-300" size={18}/>
                <textarea placeholder="Endereço de Entrega" className="w-full pl-14 pr-5 py-5 bg-gray-50 rounded-2xl border-none font-bold text-gray-800 outline-none focus:ring-2 ring-indigo-500 h-24" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} />
              </div>
              <div className="relative">
                <FileText className="absolute left-5 top-5 text-gray-300" size={18}/>
                <textarea placeholder="Observações (Alergias, Preferências)" className="w-full pl-14 pr-5 py-5 bg-gray-50 rounded-2xl border-none font-bold text-gray-800 outline-none focus:ring-2 ring-indigo-500 h-24" value={newCustomer.notes} onChange={e => setNewCustomer({...newCustomer, notes: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-4 mt-10">
              <button type="button" onClick={() => setShowCustomerModal(false)} className="flex-1 py-4 text-gray-400 font-black text-[10px] uppercase tracking-widest">Sair</button>
              <button type="submit" className="flex-[2] py-5 bg-indigo-500 text-white rounded-[28px] font-black shadow-xl shadow-indigo-100 hover:bg-indigo-600 transition-all uppercase tracking-widest text-xs">Criar Perfil</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Agenda;
