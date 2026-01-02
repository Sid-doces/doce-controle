
import React, { useMemo } from 'react';
import { AppState } from '../types';
import { 
  ShoppingBasket, 
  TrendingUp, 
  DollarSign, 
  Star, 
  ArrowRight, 
  ChefHat,
  Percent,
  Clock,
  Target,
  Zap
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  state: AppState;
  onNavigate: (tab: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, onNavigate }) => {
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const todayRevenue = state.sales.filter(s => s.date.startsWith(today)).reduce((acc, s) => acc + s.total, 0);
  
  const monthSales = state.sales.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const monthRevenue = monthSales.reduce((acc, s) => acc + s.total, 0);
  
  const productsWithCost = state.products.filter(p => p.cost > 0);
  const avgMargin = productsWithCost.length > 0
    ? (productsWithCost.reduce((acc, p) => acc + ((p.price - p.cost) / p.price), 0) / productsWithCost.length)
    : 0.5; // Default 50% se não houver produtos

  // Ponto de Equilíbrio
  const monthTotalFixed = (state.expenses || []).filter(e => e.isFixed).reduce((acc, e) => acc + e.value, 0);
  const breakEvenPoint = avgMargin > 0 ? (monthTotalFixed / avgMargin) : 0;
  const progressToBreakEven = breakEvenPoint > 0 ? Math.min(100, (monthRevenue / breakEvenPoint) * 100) : 100;

  // Lógica de VIP Mensal (10 compras/mês)
  const vipCount = useMemo(() => {
    const customerBuyCounts: Record<string, number> = {};
    monthSales.forEach(sale => {
      if (sale.customerId) {
        customerBuyCounts[sale.customerId] = (customerBuyCounts[sale.customerId] || 0) + 1;
      }
    });
    return Object.values(customerBuyCounts).filter(count => count >= 10).length;
  }, [monthSales]);

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
          <p className="text-gray-500 font-medium italic">Gestão focada na sua cozinha.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Vendas Hoje', val: todayRevenue, color: 'text-emerald-500', icon: DollarSign },
          { label: 'Margem Média', val: `${(avgMargin * 100).toFixed(0)}%`, color: 'text-indigo-500', icon: Percent },
          { label: 'Faturamento Mês', val: monthRevenue, color: 'text-gray-800', icon: TrendingUp, dark: true },
          { label: 'VIPs do Mês', val: vipCount, color: 'text-amber-500', icon: Star, suffix: ' VIPs' }
        ].map((card, i) => (
          <div key={i} className={`${card.dark ? 'bg-gray-900 text-white shadow-xl' : 'bg-white border border-gray-100 shadow-sm'} p-7 rounded-[32px] transition-transform hover:scale-[1.02]`}>
            <p className={`text-[10px] ${card.dark ? 'text-gray-400' : card.color} font-black uppercase tracking-widest mb-1 flex items-center gap-1`}>
              <card.icon size={10}/> {card.label}
            </p>
            <div className={`text-2xl font-black ${card.dark ? 'text-white' : 'text-gray-800'}`}>
              {typeof card.val === 'number' && !card.suffix ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.val) : `${card.val}${card.suffix || ''}`}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Card de Ponto de Equilíbrio (Break-even) */}
          <div className="bg-white p-8 md:p-10 rounded-[45px] border border-gray-100 shadow-sm relative overflow-hidden">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                   <h2 className="text-lg font-black text-gray-800 flex items-center gap-2"><Target className="text-indigo-500" size={20} /> Ponto de Equilíbrio</h2>
                   <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Quanto falta para pagar as contas fixas?</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-gray-400 uppercase">Meta Mensal</p>
                   <p className="text-xl font-black text-gray-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(breakEvenPoint)}</p>
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
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{progressToBreakEven.toFixed(0)}% Concluído</span>
                   <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest">
                     {monthRevenue >= breakEvenPoint ? 'Você já está no lucro! 🚀' : `Faltam ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(breakEvenPoint - monthRevenue)}`}
                   </span>
                </div>
             </div>
          </div>

          <div className="bg-white p-8 md:p-10 rounded-[45px] border border-gray-100 shadow-sm">
            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2 mb-8"><TrendingUp className="text-emerald-500" size={20} /> Evolução de Vendas</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7Days}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F9FAFB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#D1D5DB'}} dy={10} />
                  <Tooltip cursor={{fill: '#FFF9FB', radius: 12}} contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800}} />
                  <Bar dataKey="total" radius={[10, 10, 10, 10]} barSize={45}>
                    {last7Days.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.date === today ? '#EC4899' : '#FBCFE8'} />)}
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
               { tab: 'sales', label: 'Vender Doce PDV', icon: ShoppingBasket, color: 'text-pink-500' },
               { tab: 'agenda', label: 'Ver Agenda Entrega', icon: Clock, color: 'text-indigo-500' },
               { tab: 'products', label: 'Nova Ficha Técnica', icon: ChefHat, color: 'text-amber-500' }
             ].map((item, i) => (
              <button key={i} onClick={() => onNavigate(item.tab)} className="w-full flex items-center justify-between p-6 bg-gray-50/50 rounded-[30px] border border-transparent hover:border-pink-200 transition-all active:scale-95 group">
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
    </div>
  );
};

export default Dashboard;
