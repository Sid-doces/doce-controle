
import React from 'react';
import { AppState } from '../types';
import { ShoppingBasket, Package, Calendar, TrendingUp, DollarSign, ArrowUpRight, Box } from 'lucide-react';

interface DashboardProps {
  state: AppState;
  onNavigate: (tab: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, onNavigate }) => {
  const today = new Date().toISOString().split('T')[0];
  const todaySales = state.sales.filter(s => s.date.startsWith(today));
  
  const todayRevenue = todaySales.reduce((acc, s) => acc + s.total, 0);
  const todayCogs = todaySales.reduce((acc, s) => acc + (s.costUnitary * s.quantity), 0);
  const todayProfit = todayRevenue - todayCogs;
  
  const currentMonth = new Date().getMonth();
  const monthSales = state.sales.filter(s => new Date(s.date).getMonth() === currentMonth);
  const monthRevenue = monthSales.reduce((acc, s) => acc + s.total, 0);
  const monthCogs = monthSales.reduce((acc, s) => acc + (s.costUnitary * s.quantity), 0);
  
  const monthExpenses = state.expenses.filter(e => new Date(e.date).getMonth() === currentMonth);
  const monthTotalExpenses = monthExpenses.reduce((acc, e) => acc + e.value, 0);
  
  const monthNetProfit = monthRevenue - monthCogs - monthTotalExpenses;

  // Novo cálculo: Valor total dos produtos prontos no estoque
  const stockPotentialValue = state.products.reduce((acc, p) => acc + (p.price * p.quantity), 0);

  const lowStock = state.stock.filter(i => i.quantity <= i.minQuantity);
  const pendingOrders = state.orders.filter(o => o.status === 'Pendente');

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Cozinha de {state.user?.email.split('@')[0]} 👋</h1>
        <p className="text-gray-500">Acompanhe seu desempenho em tempo real.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card Hoje */}
        <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <TrendingUp size={64} className="text-emerald-500" />
          </div>
          <div className="flex items-center gap-2 text-emerald-600 mb-2 font-black text-[10px] uppercase tracking-widest">
            <DollarSign size={14} /> Lucro Limpo Hoje
          </div>
          <div className="text-3xl font-black text-black">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(todayProfit)}
          </div>
          <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">
            Vendas: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(todayRevenue)}
          </p>
        </div>

        {/* Card Valor em Estoque - NOVA INOVAÇÃO */}
        <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Box size={64} className="text-blue-500" />
          </div>
          <div className="flex items-center gap-2 text-blue-600 mb-2 font-black text-[10px] uppercase tracking-widest">
            <Box size={14} /> Valor Pronto p/ Venda
          </div>
          <div className="text-3xl font-black text-black">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stockPotentialValue)}
          </div>
          <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">
            Dinheiro parado no estoque
          </p>
        </div>

        {/* Card Mês */}
        <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <ArrowUpRight size={64} className="text-pink-500" />
          </div>
          <div className="flex items-center gap-2 text-pink-600 mb-2 font-black text-[10px] uppercase tracking-widest">
            <ArrowUpRight size={14} /> Lucro Real no Mês
          </div>
          <div className="text-3xl font-black text-black">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthNetProfit)}
          </div>
          <div className="mt-2">
            <span className="text-[9px] bg-red-50 text-red-500 px-2 py-1 rounded-lg font-black uppercase">
               Total Gastos: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthCogs + monthTotalExpenses)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-black flex items-center gap-2">
              <Calendar className="text-pink-500" size={20} /> Pedidos Próximos ({pendingOrders.length})
            </h2>
            <button onClick={() => onNavigate('agenda')} className="text-pink-500 text-sm font-black hover:underline">Ver Agenda</button>
          </div>
          <div className="space-y-4">
            {pendingOrders.slice(0, 3).map(order => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-pink-50/50 rounded-2xl border border-pink-100/30">
                <div>
                  <div className="font-black text-black">{order.clientName}</div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase">{order.productName} • {new Date(order.deliveryDate).toLocaleDateString()}</div>
                </div>
                <div className="font-black text-pink-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.value)}
                </div>
              </div>
            ))}
            {pendingOrders.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400 font-bold italic text-sm">Nenhuma encomenda para os próximos dias.</p>
              </div>
            )}
          </div>
          <button 
             onClick={() => onNavigate('agenda')}
             className="w-full mt-4 py-3 bg-white border-2 border-pink-100 text-pink-500 rounded-xl font-black text-xs uppercase hover:bg-pink-50 transition-colors"
          >
             Novo Agendamento
          </button>
        </section>

        <section className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-black flex items-center gap-2">
              <Package className="text-amber-500" size={20} /> Estoque de Insumos
            </h2>
            <button onClick={() => onNavigate('stock')} className="text-amber-600 text-sm font-black hover:underline">Gerenciar</button>
          </div>
          <div className="space-y-3">
            {lowStock.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className="font-bold text-amber-900 text-sm">{item.name}</div>
                <div className="text-xs font-black text-amber-700">{item.quantity} {item.unit}</div>
              </div>
            ))}
            {lowStock.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400 font-bold italic text-sm">Tudo abastecido por aqui! 🍓</p>
              </div>
            )}
          </div>
          <div className="mt-6 p-4 bg-gray-50 rounded-2xl">
             <div className="flex justify-between items-center text-xs font-black text-gray-400 uppercase mb-2">
                <span>Total de Itens</span>
                <span className="text-black">{state.stock.length}</span>
             </div>
             <button 
                onClick={() => onNavigate('sales')}
                className="w-full mt-2 bg-pink-500 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
             >
               <ShoppingBasket size={18} /> Venda Rápida
             </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
