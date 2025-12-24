
import React, { useState } from 'react';
import { AppState, Order, Customer, Sale, PaymentMethod } from '../types';
import { Plus, Calendar, CheckCircle, Clock, Trash2, X, User, Users, Phone, MapPin, MessageCircle, ShoppingBag, DollarSign, Wallet, Share2 } from 'lucide-react';

interface AgendaProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Agenda: React.FC<AgendaProps> = ({ state, setState }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'customers'>('orders');
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  
  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    clientName: '',
    productName: '',
    deliveryDate: '',
    value: undefined,
    cost: undefined,
    paymentMethod: 'PIX',
    status: 'Pendente'
  });

  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });

  const handleShareOrder = (order: Order) => {
    const message = `*RECIBO DE PEDIDO - DOCE CONTROLE* 🍰%0A%0AOlá, *${order.clientName}*! Seu pedido foi registrado com sucesso.%0A%0A🎂 *Produto:* ${order.productName}%0A📅 *Entrega:* ${new Date(order.deliveryDate).toLocaleDateString('pt-BR')}%0A💰 *Valor:* ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.value)}%0A💳 *Pagamento:* ${order.paymentMethod}%0A%0A*Doce Controle agradece a preferência!* ✨`;
    
    // Tenta encontrar o telefone do cliente se ele estiver cadastrado
    const customer = state.customers.find(c => c.name.toLowerCase() === order.clientName.toLowerCase());
    const phone = customer ? customer.phone.replace(/\D/g, '') : '';
    
    window.open(`https://wa.me/${phone ? '55' + phone : ''}?text=${message}`, '_blank');
  };

  const handleAddOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.clientName || !newOrder.deliveryDate || newOrder.value === undefined) return;

    const order: Order = {
      id: Math.random().toString(36).substr(2, 9),
      clientName: newOrder.clientName!,
      productName: newOrder.productName || 'Vários itens',
      deliveryDate: newOrder.deliveryDate!,
      value: Number(newOrder.value),
      cost: Number(newOrder.cost || 0),
      paymentMethod: newOrder.paymentMethod || 'PIX',
      status: 'Pendente'
    };

    setState(prev => ({
      ...prev,
      orders: [...prev.orders, order].sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime())
    }));
    setShowAddOrder(false);
    setNewOrder({ clientName: '', productName: '', deliveryDate: '', value: undefined, cost: undefined, paymentMethod: 'PIX', status: 'Pendente' });
  };

  const toggleStatus = (id: string) => {
    setState(prev => {
      const order = prev.orders.find(o => o.id === id);
      if (!order) return prev;
      const isBecomingDelivered = order.status === 'Pendente';
      
      let updatedSales = prev.sales;
      if (isBecomingDelivered) {
        const autoSale: Sale = {
          id: `agenda-${order.id}-${Date.now()}`,
          productId: 'agenda-custom',
          productName: `[Agenda] ${order.clientName}: ${order.productName}`,
          quantity: 1,
          total: order.value,
          discount: 0,
          costUnitary: order.cost || 0,
          paymentMethod: order.paymentMethod,
          date: new Date().toISOString()
        };
        updatedSales = [autoSale, ...prev.sales];
      }

      return {
        ...prev,
        sales: updatedSales,
        orders: prev.orders.map(o => o.id === id ? { ...o, status: isBecomingDelivered ? 'Entregue' : 'Pendente' } : o)
      };
    });
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) return;
    const customer: Customer = {
      id: Math.random().toString(36).substr(2, 9),
      name: newCustomer.name!,
      phone: newCustomer.phone!,
      address: newCustomer.address,
      notes: newCustomer.notes
    };
    setState(prev => ({ ...prev, customers: [...(prev.customers || []), customer] }));
    setShowAddCustomer(false);
    setNewCustomer({ name: '', phone: '', address: '', notes: '' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Agenda & Clientes</h1>
          <p className="text-gray-500 font-medium italic">Gestão de entregas e contatos.</p>
        </div>
        <button 
          onClick={() => activeTab === 'orders' ? setShowAddOrder(true) : setShowAddCustomer(true)} 
          className="bg-pink-500 hover:bg-pink-600 text-white font-black px-6 py-4 rounded-2xl flex items-center gap-2 shadow-lg shadow-pink-100 transition-all text-sm"
        >
          <Plus size={18} /> {activeTab === 'orders' ? 'Encomenda' : 'Novo Cliente'}
        </button>
      </header>

      <div className="flex bg-white p-1.5 rounded-[22px] border border-gray-100 shadow-sm w-full md:w-fit">
        <button onClick={() => setActiveTab('orders')} className={`flex-1 md:flex-none px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-400'}`}>
          <Calendar size={14} className="inline mr-2" /> Encomendas
        </button>
        <button onClick={() => setActiveTab('customers')} className={`flex-1 md:flex-none px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'customers' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-400'}`}>
          <Users size={14} className="inline mr-2" /> Meus Clientes
        </button>
      </div>

      {activeTab === 'orders' ? (
        <div className="space-y-4">
          {state.orders.map(order => (
            <div key={order.id} className="bg-white p-6 rounded-[32px] border border-pink-50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all">
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${order.status === 'Entregue' ? 'bg-emerald-50 text-emerald-500' : 'bg-pink-50 text-pink-500'}`}>
                  {order.status === 'Entregue' ? <CheckCircle size={28} /> : <Clock size={28} />}
                </div>
                <div>
                  <h3 className="font-black text-gray-800 text-lg leading-tight">{order.clientName}</h3>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-0.5">{order.productName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleShareOrder(order)} className="w-11 h-11 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-90" title="Enviar no WhatsApp">
                  <Share2 size={18} />
                </button>
                <button onClick={() => toggleStatus(order.id)} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${order.status === 'Entregue' ? 'bg-emerald-50 text-emerald-600' : 'bg-pink-500 text-white'}`}>
                  {order.status === 'Entregue' ? 'Concluído' : 'Entregar'}
                </button>
                <button onClick={() => { if(confirm("Apagar?")) setState(prev => ({ ...prev, orders: prev.orders.filter(o => o.id !== order.id) })) }} className="p-2 text-gray-200 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {(state.customers || []).map(customer => (
              <div key={customer.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-pink-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-pink-50 text-pink-500 rounded-2xl flex items-center justify-center"><User size={24} /></div>
                  <div>
                    <h3 className="font-black text-gray-800 text-base leading-tight">{customer.name}</h3>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-0.5">{customer.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <a href={`https://wa.me/55${customer.phone.replace(/\D/g, '')}`} target="_blank" className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all"><MessageCircle size={18} /></a>
                   <button onClick={() => setState(prev => ({ ...prev, customers: prev.customers.filter(c => c.id !== customer.id) }))} className="p-2 text-gray-200 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
           ))}
        </div>
      )}

      {showAddOrder && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md flex items-start justify-center z-[200] pt-10 pb-10 px-4 overflow-y-auto">
          <form onSubmit={handleAddOrder} className="bg-white w-full max-w-lg p-10 rounded-[45px] shadow-2xl animate-in zoom-in duration-200 relative mb-10">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Nova Encomenda</h2>
              <button type="button" onClick={() => setShowAddOrder(false)} className="text-gray-400 hover:text-red-500 p-2"><X size={24} /></button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1">Cliente</label>
                <input type="text" required placeholder="Nome do cliente" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-bold outline-none focus:border-pink-500" value={newOrder.clientName} onChange={e => setNewOrder({...newOrder, clientName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1">Doce / Descrição</label>
                <input type="text" placeholder="Ex: Bolo Cenoura 1kg" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-bold outline-none focus:border-pink-500" value={newOrder.productName} onChange={e => setNewOrder({...newOrder, productName: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1">Data</label>
                  <input type="date" required className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-bold outline-none focus:border-pink-500 h-[60px]" value={newOrder.deliveryDate} onChange={e => setNewOrder({...newOrder, deliveryDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1">Valor (R$)</label>
                  <input type="number" step="any" required className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-black outline-none focus:border-pink-500" value={newOrder.value ?? ''} onChange={e => setNewOrder({...newOrder, value: e.target.value === '' ? undefined : Number(e.target.value)})} />
                </div>
              </div>
              <div className="space-y-2">
                  <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1">Pagamento</label>
                  <select className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-bold outline-none h-[60px]" value={newOrder.paymentMethod} onChange={e => setNewOrder({...newOrder, paymentMethod: e.target.value as PaymentMethod})}>
                    <option value="PIX">PIX</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão">Cartão</option>
                  </select>
                </div>
            </div>

            <div className="flex gap-4 mt-12">
              <button type="button" onClick={() => setShowAddOrder(false)} className="flex-1 py-4 text-gray-400 font-black text-xs uppercase tracking-widest">Sair</button>
              <button type="submit" className="flex-[2] py-5 bg-pink-500 text-white rounded-[30px] font-black text-lg shadow-xl shadow-pink-100">Salvar Agenda</button>
            </div>
          </form>
        </div>
      )}

      {showAddCustomer && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md flex items-start justify-center z-[200] pt-20 pb-10 px-4 overflow-y-auto">
          <form onSubmit={handleAddCustomer} className="bg-white w-full max-w-lg p-10 rounded-[45px] shadow-2xl animate-in zoom-in duration-200 relative">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Novo Cliente</h2>
              <button type="button" onClick={() => setShowAddCustomer(false)} className="text-gray-400 hover:text-red-500 p-2"><X size={24} /></button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1">Nome Completo</label>
                <input type="text" required className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-bold outline-none focus:border-pink-500" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1">WhatsApp (DDD + Número)</label>
                <input type="text" required placeholder="11900000000" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-bold outline-none focus:border-pink-500" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-4 mt-12">
              <button type="button" onClick={() => setShowAddCustomer(false)} className="flex-1 py-4 text-gray-400 font-black text-xs uppercase tracking-widest">Sair</button>
              <button type="submit" className="flex-[2] py-5 bg-emerald-500 text-white rounded-[30px] font-black text-lg shadow-xl shadow-emerald-100">Salvar Cliente</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Agenda;
