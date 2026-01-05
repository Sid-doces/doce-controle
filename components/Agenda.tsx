
import React, { useState, useMemo } from 'react';
import { AppState, Order, Customer, Sale, PaymentMethod } from '../types';
import { Plus, Calendar, CheckCircle, Clock, Trash2, X, User, Users, Phone, MapPin, MessageCircle, ShoppingBag, DollarSign, Wallet, Share2, Star, Sparkles, Edit3 } from 'lucide-react';

interface AgendaProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Agenda: React.FC<AgendaProps> = ({ state, setState }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'customers'>('orders');
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);

  const [newOrder, setNewOrder] = useState<Partial<Order>>({ clientName: '', productName: '', deliveryDate: '', value: undefined, cost: undefined, paymentMethod: 'PIX', status: 'Pendente' });
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({ name: '', phone: '', address: '', notes: '', purchaseCount: 0 });

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Função para verificar se um cliente é VIP no mês atual
  const isVIPMonthly = (customerId?: string) => {
    if (!customerId) return false;
    const monthSalesCount = state.sales.filter(s => {
      const d = new Date(s.date);
      return s.customerId === customerId && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
    return monthSalesCount >= 10;
  };

  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.clientName || !newOrder.deliveryDate || newOrder.value === undefined) return;
    
    // Fix: Adding companyId to Order object
    const orderData: Order = {
      id: editingOrderId || Math.random().toString(36).substr(2, 9),
      companyId: state.user?.companyId || '',
      clientName: newOrder.clientName!,
      productName: newOrder.productName || 'Vários itens',
      deliveryDate: newOrder.deliveryDate!,
      value: Number(newOrder.value),
      cost: Number(newOrder.cost || 0),
      paymentMethod: newOrder.paymentMethod || 'PIX',
      status: (newOrder.status as any) || 'Pendente'
    };

    setState(prev => {
      const filtered = editingOrderId ? prev.orders.filter(o => o.id !== editingOrderId) : prev.orders;
      return { 
        ...prev, 
        orders: [...filtered, orderData].sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime()) 
      };
    });

    setShowAddOrder(false);
    setEditingOrderId(null);
    setNewOrder({ clientName: '', productName: '', deliveryDate: '', value: undefined, cost: undefined, paymentMethod: 'PIX', status: 'Pendente' });
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) return;
    
    // Fix: Adding companyId to Customer object
    const customerData: Customer = {
      id: editingCustomerId || Math.random().toString(36).substr(2, 9),
      companyId: state.user?.companyId || '',
      name: newCustomer.name!,
      phone: newCustomer.phone!,
      address: newCustomer.address,
      notes: newCustomer.notes,
      purchaseCount: newCustomer.purchaseCount || 0
    };

    setState(prev => {
      const filtered = editingCustomerId ? prev.customers.filter(c => c.id !== editingCustomerId) : prev.customers;
      return { ...prev, customers: [...(filtered || []), customerData] };
    });

    setShowAddCustomer(false);
    setEditingCustomerId(null);
    setNewCustomer({ name: '', phone: '', address: '', notes: '', purchaseCount: 0 });
  };

  const toggleStatus = (id: string) => {
    setState(prev => {
      const order = prev.orders.find(o => o.id === id);
      if (!order) return prev;
      const isBecomingDelivered = order.status === 'Pendente';
      return {
        ...prev,
        orders: prev.orders.map(o => o.id === id ? { ...o, status: isBecomingDelivered ? 'Entregue' : 'Pendente' } : o)
      };
    });
  };

  const openEditOrder = (order: Order) => {
    setEditingOrderId(order.id);
    setNewOrder(order);
    setShowAddOrder(true);
  };

  const openEditCustomer = (customer: Customer) => {
    setEditingCustomerId(customer.id);
    setNewCustomer(customer);
    setShowAddCustomer(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Agenda & Clientes</h1>
          <p className="text-gray-500 font-medium italic">Gestão de entregas e fidelidade mensal.</p>
        </div>
        <button onClick={() => activeTab === 'orders' ? setShowAddOrder(true) : setShowAddCustomer(true)} className="bg-pink-500 hover:bg-pink-600 text-white font-black px-6 py-4 rounded-2xl flex items-center gap-2 shadow-lg shadow-pink-100 transition-all text-sm">
          <Plus size={18} /> {activeTab === 'orders' ? 'Encomenda' : 'Novo Cliente'}
        </button>
      </header>

      <div className="flex bg-white p-1.5 rounded-[22px] border border-gray-100 shadow-sm w-full md:w-fit">
        <button onClick={() => setActiveTab('orders')} className={`flex-1 md:flex-none px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-400'}`}>Encomendas</button>
        <button onClick={() => setActiveTab('customers')} className={`flex-1 md:flex-none px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'customers' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-400'}`}>Fidelidade</button>
      </div>

      {activeTab === 'orders' ? (
        <div className="space-y-4">
          {state.orders.map(order => {
             const customer = state.customers.find(c => c.name.toLowerCase() === order.clientName.toLowerCase());
             const isVIP = isVIPMonthly(customer?.id);
             return (
              <div key={order.id} className="bg-white p-6 rounded-[32px] border border-pink-50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${order.status === 'Entregue' ? 'bg-emerald-50 text-emerald-500' : 'bg-pink-50 text-pink-500'}`}>
                    {order.status === 'Entregue' ? <CheckCircle size={28} /> : <Clock size={28} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <h3 className="font-black text-gray-800 text-lg leading-tight">{order.clientName}</h3>
                       {isVIP && <span className="bg-amber-100 text-amber-600 p-1 rounded-lg" title="VIP do Mês!"><Star size={14} fill="currentColor"/></span>}
                    </div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-0.5">{order.productName}</p>
                    {isVIP && <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mt-1 italic flex items-center gap-1"><Sparkles size={10}/> VIP: Cliente fiel do mês!</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleStatus(order.id)} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${order.status === 'Entregue' ? 'bg-emerald-50 text-emerald-600' : 'bg-pink-500 text-white'}`}>
                    {order.status === 'Entregue' ? 'Concluído' : 'Entregar'}
                  </button>
                  <button onClick={() => openEditOrder(order)} className="p-2 text-gray-200 hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100"><Edit3 size={18} /></button>
                  <button onClick={() => { if(confirm("Apagar?")) setState(prev => ({ ...prev, orders: prev.orders.filter(o => o.id !== order.id) })) }} className="p-2 text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                </div>
              </div>
             );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {(state.customers || []).map(customer => {
              const isVIP = isVIPMonthly(customer.id);
              return (
                <div key={customer.id} className={`bg-white p-6 rounded-[32px] border shadow-sm flex items-center justify-between group transition-all ${isVIP ? 'border-amber-200 bg-amber-50/20 shadow-amber-50' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center relative ${isVIP ? 'bg-amber-500 text-white shadow-lg' : 'bg-pink-50 text-pink-500'}`}>
                      <User size={24} />
                      {isVIP && <div className="absolute -top-1 -right-1 bg-white text-amber-500 p-1 rounded-full shadow-sm"><Star size={10} fill="currentColor"/></div>}
                    </div>
                    <div>
                      <h3 className="font-black text-gray-800 text-base leading-tight">{customer.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                         <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">
                           {state.sales.filter(s => s.customerId === customer.id && new Date(s.date).getMonth() === currentMonth).length} compras este mês
                         </p>
                         {isVIP && <span className="text-[8px] font-black text-amber-600 uppercase bg-amber-100 px-2 py-0.5 rounded-full">VIP MENSAL</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <button onClick={() => openEditCustomer(customer)} className="w-10 h-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-500 transition-all"><Edit3 size={18} /></button>
                     <a href={`https://wa.me/55${customer.phone.replace(/\D/g, '')}`} target="_blank" className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all"><MessageCircle size={18} /></a>
                  </div>
                </div>
              );
           })}
        </div>
      )}

      {/* MODAL ENCOMENDA (ADICIONAR/EDITAR) */}
      {showAddOrder && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md flex items-center justify-center z-[200] p-4">
          <form onSubmit={handleSaveOrder} className="bg-white w-full max-w-md p-10 rounded-[45px] shadow-2xl animate-in zoom-in duration-200">
            <h2 className="text-2xl font-black text-gray-800 mb-8">{editingOrderId ? 'Editar Encomenda' : 'Nova Encomenda'}</h2>
            <div className="space-y-4">
              <input type="text" required placeholder="Nome do Cliente" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-bold outline-none h-[60px]" value={newOrder.clientName} onChange={e => setNewOrder({...newOrder, clientName: e.target.value})} />
              <input type="text" placeholder="Produto (ex: Bolo de Cenoura)" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-bold outline-none h-[60px]" value={newOrder.productName} onChange={e => setNewOrder({...newOrder, productName: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="date" required className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-bold outline-none h-[60px]" value={newOrder.deliveryDate ? newOrder.deliveryDate.split('T')[0] : ''} onChange={e => setNewOrder({...newOrder, deliveryDate: e.target.value})} />
                <input type="number" step="any" required placeholder="Valor R$" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-black text-lg outline-none h-[60px]" value={newOrder.value ?? ''} onChange={e => setNewOrder({...newOrder, value: Number(e.target.value)})} />
              </div>
            </div>
            <div className="flex gap-4 mt-12">
              <button type="button" onClick={() => {setShowAddOrder(false); setEditingOrderId(null);}} className="flex-1 py-4 text-gray-400 font-black text-xs uppercase tracking-widest">Sair</button>
              <button type="submit" className="flex-[2] py-5 bg-pink-500 text-white rounded-[30px] font-black text-lg shadow-xl shadow-pink-100">Salvar Encomenda</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL CLIENTE (ADICIONAR/EDITAR) */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md flex items-center justify-center z-[200] p-4">
          <form onSubmit={handleSaveCustomer} className="bg-white w-full max-w-md p-10 rounded-[45px] shadow-2xl animate-in zoom-in duration-200">
            <h2 className="text-2xl font-black text-gray-800 mb-8">{editingCustomerId ? 'Editar Perfil' : 'Novo Cliente'}</h2>
            <div className="space-y-4">
              <input type="text" required placeholder="Nome Completo" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-bold outline-none h-[60px]" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
              <input type="text" required placeholder="WhatsApp (DDD + Número)" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-bold outline-none h-[60px]" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
              <textarea placeholder="Notas ou Observações" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-bold outline-none h-32 resize-none" value={newCustomer.notes} onChange={e => setNewCustomer({...newCustomer, notes: e.target.value})}></textarea>
            </div>
            <div className="flex gap-4 mt-12">
              <button type="button" onClick={() => {setShowAddCustomer(false); setEditingCustomerId(null);}} className="flex-1 py-4 text-gray-400 font-black text-xs uppercase tracking-widest">Sair</button>
              <button type="submit" className="flex-[2] py-5 bg-emerald-500 text-white rounded-[30px] font-black text-lg shadow-xl shadow-emerald-100">Salvar Cliente</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Agenda;
