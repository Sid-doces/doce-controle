
import React, { useMemo, useState } from 'react';
import { AppState, Sale } from '../types';
import { 
  ShoppingBasket, TrendingUp, DollarSign, Star, ArrowRight, ChefHat, Percent, Clock, Target, Zap, X, Receipt, Search
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  state: AppState;
  onNavigate: (tab: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, onNavigate }) => {
  const [showDailySales, setShowDailySales] = useState<string | null>(null);
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const todaySales = state.sales.filter(s => s.date.startsWith(today));
  const todayRevenue = todaySales.reduce((acc, s) => acc + s.total, 0);
  
  const monthSales = state.sales.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const monthRevenue = monthSales.reduce((acc, s) => acc + s.total, 0);
  
  const productsWithCost = state.products.filter(p => p.cost > 0);
  const avgMargin = productsWithCost.length > 0
    ? (productsWithCost.reduce((acc, p) => acc + ((p.price - p.cost) / p.price), 0) / productsWithCost.length)
    : 0.5;

  // CÁLCULO DO PONTO DE EQUILÍBRIO
  const monthTotalFixed = (state.expenses || []).filter(e => e.isFixed).reduce((acc, e) => acc + e.value, 0);
  const breakEvenPoint = avgMargin > 0 ? (monthTotalFixed / avgMargin) : 0;
  const progressToBreakEven = breakEvenPoint > 0 ? Math.min(100, (monthRevenue / breakEvenPoint) * 100) : 100;

  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayTotal = state.sales.filter(s => s.date.startsWith(dateStr)).reduce((acc, s) => acc + s.total, 0);
    return { name: d.toLocaleDateString('pt-BR', { weekday: 'short' }), total: dayTotal, date: dateStr };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight leading-none">Painel de Controle 🧁</h1>
          <p className="text-gray-500 font-medium italic">Sua confeitaria em números reais.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button onClick={() => setShowDailySales(today)} className="bg-white border border-gray-100 shadow-sm p-7 rounded-[32px] transition-all hover:scale-[1.02] text-left group">
          <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-1 flex items-center gap-1">
            <DollarSign size={10}/> Vendas Hoje
          </p>
          <div className="text-2xl font-black text-gray-800 flex items-center justify-between">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(todayRevenue)}
            <ArrowRight size={16} className="text-gray-200 group-hover:text-emerald-500 transition-colors" />
          </div>
        </button>

        <div className="bg-white border border-gray-100 shadow-sm p-7 rounded-[32px]">
          <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mb-1 flex items-center gap-1">
            <Percent size={10}/> Margem Média
          </p>
          <div className="text-2xl font-black text-gray-800">
            {(avgMargin * 100).toFixed(0)}%
          </div>
        </div>

        <div className="bg-gray-900 text-white shadow-xl p-7 rounded-[32px]">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1">
            <TrendingUp size={10}/> Faturamento Mês
          </p>
          <div className="text-2xl font-black text-white">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthRevenue)}
          </div>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm p-7 rounded-[32px]">
          <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest mb-1 flex items-center gap-1">
            <Clock size={10}/> Agenda Ativa
          </p>
          <div className="text-2xl font-black text-gray-800">
            {state.orders.filter(o => o.status === 'Pendente').length} <span className="text-xs text-gray-400 font-bold">pedidos</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 md:p-10 rounded-[45px] border border-gray-100 shadow-sm">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                   <h2 className="text-lg font-black text-gray-800 flex items-center gap-2"><Target className="text-indigo-500" size={20} /> Ponto de Equilíbrio</h2>
                   <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Quanto falta para pagar os custos fixos</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-gray-400 uppercase">Faltam p/ o lucro real</p>
                   <p className="text-xl font-black text-gray-800">
                     {monthRevenue >= breakEvenPoint ? 'R$ 0,00' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(breakEvenPoint - monthRevenue)}
                   </p>
                </div>
             </div>

             <div className="space-y-4">
                <div className="h-6 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-1">
                   <div 
                      className="h-full bg-gradient-to-r from-pink-400 to-indigo-500 rounded-full transition-all duration-1000 shadow-sm"
                      style={{ width: `${progressToBreakEven}%` }}
                   />
                </div>
                <div className="flex justify-between items-center px-1">
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{progressToBreakEven.toFixed(0)}% da meta</span>
                   <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest">
                     {monthRevenue >= breakEvenPoint ? 'Você já está lucrando! 🚀' : 'Alcançando o equilíbrio'}
                   </span>
                </div>
             </div>
          </div>

          <div className="bg-white p-8 md:p-10 rounded-[45px] border border-gray-100 shadow-sm">
            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2 mb-8"><TrendingUp className="text-emerald-500" size={20} /> Vendas 7 Dias</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7Days}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F9FAFB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#D1D5DB'}} dy={10} />
                  <Tooltip cursor={{fill: '#FFF9FB', radius: 12}} contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800}} />
                  <Bar dataKey="total" radius={[10, 10, 10, 10]} barSize={45}>
                    {last7Days.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.date === today ? '#EC4899' : '#FBCFE8'} className="cursor-pointer" />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-[45px] border border-gray-100 shadow-sm">
          <h2 className="text-lg font-black text-gray-800 mb-8 flex items-center gap-2"><Star className="text-amber-400" size={20} /> Atalhos Rápidos</h2>
          <div className="space-y-4">
             {[
               { tab: 'sales', label: 'Registrar Venda PDV', icon: ShoppingBasket, color: 'text-pink-500' },
               { tab: 'products', label: 'Nova Ficha Técnica', icon: ChefHat, color: 'text-amber-500' },
               { tab: 'financial', label: 'Ver Lucro Real', icon: DollarSign, color: 'text-emerald-500' }
             ].map((item, i) => (
              <button key={i} onClick={() => onNavigate(item.tab)} className="w-full flex items-center justify-between p-6 bg-gray-50/50 rounded-[30px] border border-transparent hover:border-pink-200 transition-all active:scale-95 group text-left">
                <div className="flex items-center gap-4">
                   <div className={`w-11 h-11 bg-white rounded-2xl flex items-center justify-center ${item.color} shadow-sm transition-all`}>
                      <item.icon size={20} />
                   </div>
                   <span className="font-black text-gray-700 text-xs">{item.label}</span>
                </div>
                <ArrowRight size={16} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
              </button>
             ))}
          </div>
        </div>
      </div>

      {showDailySales && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl p-8 md:p-10 rounded-[45px] shadow-2xl animate-in zoom-in duration-300 max-h-[85vh] flex flex-col">
            <header className="flex justify-between items-center mb-8 shrink-0">
               <div>
                  <h2 className="text-2xl font-black text-gray-800 tracking-tight">Vendas do Dia 📋</h2>
                  <p className="text-[10px] text-pink-500 font-black uppercase tracking-widest mt-1">{new Date(showDailySales + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</p>
               </div>
               <button onClick={() => setShowDailySales(null)} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all"><X size={24}/></button>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
               {state.sales.filter(s => s.date.startsWith(showDailySales)).length > 0 ? (
                 state.sales.filter(s => s.date.startsWith(showDailySales)).map(sale => (
                   <div key={sale.id} className="p-5 bg-gray-50/50 rounded-3xl border border-gray-100 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-pink-500 shadow-sm"><Receipt size={18}/></div>
                         <div>
                            <p className="font-black text-gray-800 text-sm">{sale.productName}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">{sale.quantity}x • {sale.paymentMethod}</p>
                         </div>
                      </div>
                      <p className="font-black text-gray-800 text-base">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.total)}</p>
                   </div>
                 ))
               ) : (
                 <div className="py-20 text-center">
                    <ShoppingBasket size={48} className="mx-auto text-gray-100 mb-4" />
                    <p className="text-gray-400 font-black italic">Nenhuma venda hoje.</p>
                 </div>
               )}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-50 flex justify-between items-center shrink-0">
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Geral</span>
               <span className="text-2xl font-black text-pink-500">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    state.sales.filter(s => s.date.startsWith(showDailySales)).reduce((acc, s) => acc + s.total, 0)
                  )}
               </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
