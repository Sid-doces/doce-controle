import React, { useMemo, useState } from 'react';
import { AppState, Sale } from '../types';
import { 
  ShoppingBasket, TrendingUp, DollarSign, Star, ArrowRight, ChefHat, Percent, Clock, Target, Zap, X, Receipt, Search, Users, Award, User
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

  // PERFORMANCE POR VENDEDOR
  const sellerPerformance = useMemo(() => {
    const stats: Record<string, { total: number, commission: number, salesCount: number }> = {};
    
    monthSales.forEach(sale => {
      const name = sale.sellerName || 'Proprietário';
      if (!stats[name]) stats[name] = { total: 0, commission: 0, salesCount: 0 };
      stats[name].total += sale.total;
      stats[name].commission += sale.commissionValue || 0;
      stats[name].salesCount += 1;
    });

    return Object.entries(stats).sort((a, b) => b[1].total - a[1].total);
  }, [monthSales]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight leading-none">Painel de Controle 🧁</h1>
          <p className="text-gray-500 font-medium italic tracking-tight">Gestão inteligente e lucrativa.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button 
          onClick={() => setShowDailySales(today)} 
          className="bg-white border border-gray-100 shadow-sm p-7 rounded-[32px] transition-all hover:scale-[1.02] text-left group"
        >
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
          {/* PERFORMANCE DA EQUIPE - NOVO */}
          <div className="bg-white p-8 md:p-10 rounded-[45px] border border-gray-100 shadow-sm">
             <h2 className="text-lg font-black text-gray-800 flex items-center gap-2 mb-8"><Users className="text-indigo-500" size={20} /> Performance da Equipe (Mês)</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sellerPerformance.map(([name, data], idx) => (
                  <div key={name} className="p-6 bg-gray-50/50 border border-gray-100 rounded-[30px] flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${idx === 0 ? 'bg-amber-400' : 'bg-indigo-400'}`}>
                           {/* Fix: use User icon instead of Users for individual sellers */}
                           {idx === 0 ? <Award size={20} /> : <User size={20} />}
                        </div>
                        <div>
                           <p className="font-black text-gray-800 text-xs">{name}</p>
                           <p className="text-[8px] font-black text-gray-400 uppercase">{data.salesCount} vendas realizadas</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="font-black text-gray-800 text-sm">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.total)}</p>
                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter">Comissão: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.commission)}</p>
                     </div>
                  </div>
                ))}
                {sellerPerformance.length === 0 && <p className="col-span-full py-10 text-center text-gray-300 font-black italic">Nenhuma venda registrada este mês.</p>}
             </div>
          </div>

          <div className="bg-white p-8 md:p-10 rounded-[45px] border border-gray-100 shadow-sm">
            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2 mb-8"><TrendingUp className="text-emerald-500" size={20} /> Vendas da Semana</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={last7Days}
                  onClick={(data) => {
                    if (data && data.activePayload) {
                      setShowDailySales(data.activePayload[0].payload.date);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F9FAFB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#D1D5DB'}} dy={10} />
                  <Tooltip cursor={{fill: '#FFF9FB', radius: 12}} contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800}} />
                  <Bar dataKey="total" radius={[10, 10, 10, 10]} barSize={45}>
                    {last7Days.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.date === today ? '#EC4899' : '#FBCFE8'} className="cursor-pointer" />
                    ))}
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
               { tab: 'sales', label: 'Lançar Venda PDV', icon: ShoppingBasket, color: 'text-pink-500' },
               { tab: 'products', label: 'Ajustar Custos/Markup', icon: ChefHat, color: 'text-amber-500' },
               { tab: 'financial', label: 'Gestão de Gastos', icon: DollarSign, color: 'text-emerald-500' }
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
          
          <div className="mt-8 bg-pink-500 p-8 rounded-[35px] text-white shadow-xl shadow-pink-100 relative overflow-hidden group">
             <div className="absolute top-[-20px] right-[-20px] opacity-10 group-hover:rotate-12 transition-transform"><Zap size={100} /></div>
             <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Meta de Vendas</p>
             <h3 className="text-2xl font-black">Em breve</h3>
             <p className="text-[10px] font-bold mt-2 leading-tight">Crie metas mensais para incentivar sua equipe de rua!</p>
          </div>
        </div>
      </div>

      {/* MODAL DETALHADO DE VENDAS DIÁRIAS */}
      {showDailySales && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl p-8 md:p-10 rounded-[45px] shadow-2xl animate-in zoom-in duration-300 max-h-[85vh] flex flex-col">
            <header className="flex justify-between items-center mb-8 shrink-0">
               <div>
                  <h2 className="text-2xl font-black text-gray-800 tracking-tight">Vendas do Dia 📋</h2>
                  <p className="text-[10px] text-pink-500 font-black uppercase tracking-widest mt-1">
                    {new Date(showDailySales + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
               </div>
               <button onClick={() => setShowDailySales(null)} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all"><X size={24}/></button>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
               {state.sales.filter(s => s.date.startsWith(showDailySales)).length > 0 ? (
                 state.sales.filter(s => s.date.startsWith(showDailySales)).map(sale => (
                   <div key={sale.id} className="p-5 bg-gray-50/50 rounded-3xl border border-gray-100 flex items-center justify-between group hover:border-pink-100 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-pink-500 shadow-sm"><Receipt size={18}/></div>
                         <div>
                            <p className="font-black text-gray-800 text-sm leading-tight">{sale.productName}</p>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase flex items-center gap-1">
                                {/* Fix: use User icon instead of Users for individual seller display */}
                                <User size={10}/> {sale.sellerName || 'Proprietário'} 
                                <span className="text-gray-400 ml-1">• {sale.quantity}x • {sale.paymentMethod}</span>
                            </p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="font-black text-gray-800 text-base">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.total)}</p>
                         <p className="text-[8px] font-black text-indigo-400 uppercase">Comissão: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.commissionValue || 0)}</p>
                      </div>
                   </div>
                 ))
               ) : (
                 <div className="py-20 text-center">
                    <ShoppingBasket size={48} className="mx-auto text-gray-100 mb-4" />
                    <p className="text-gray-400 font-black italic">Nenhuma venda registrada neste dia.</p>
                 </div>
               )}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-50 flex justify-between items-center shrink-0 px-2">
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Faturado</span>
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