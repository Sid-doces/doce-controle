
import React from 'react';
import { AppState } from '../types';
import { ShoppingBasket, Package, Calendar, TrendingUp, DollarSign, ArrowUpRight, Box, Users, Target, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
  
  const monthSales = state.sales.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === new Date().getMonth();
  });
  const monthRevenue = monthSales.reduce((acc, s) => acc + s.total, 0);
  const monthCogs = monthSales.reduce((acc, s) => acc + (s.costUnitary * s.quantity), 0);
  const monthFixed = state.expenses.filter(e => e.isFixed && new Date(e.date).getMonth() === new Date().getMonth()).reduce((acc, e) => acc + e.value, 0);
  
  const cmGlobal = monthRevenue > 0 ? (monthRevenue - monthCogs) / monthRevenue : 0;
  const breakEven = cmGlobal > 0 ? monthFixed / cmGlobal : 0;
  const breakEvenPercent = breakEven > 0 ? (monthRevenue / breakEven) * 100 : 0;

  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const daySales = state.sales.filter(s => s.date.startsWith(dateStr));
    return { name: d.toLocaleDateString('pt-BR', { weekday: 'short' }), total: daySales.reduce((acc, s) => acc + s.total, 0), date: dateStr };
  });

  const productPerformance = state.products.map(p => {
    const sales = state.sales.filter(s => s.productId === p.id);
    return { name: p.name, total: sales.reduce((acc, s) => acc + s.total, 0) };
  }).sort((a, b) => b.total - a.total).slice(0, 3);

  const stockPotentialValue = state.products.reduce((acc, p) => acc + (p.price * p.quantity), 0);
  const ticketMedio = state.sales.length > 0 ? state.sales.reduce((acc, s) => acc + s.total, 0) / state.sales.length : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Cozinha de {state.user?.email.split('@')[0]} 👋</h1>
          <p className="text-gray-500 font-medium italic">Seu resumo de desempenho hoje.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-[20px] border border-pink-50 shadow-sm">
           <div className="p-2 bg-pink-50 text-pink-500 rounded-xl"><Target size={18}/></div>
           <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ticket Médio</p>
              <p className="text-sm font-black text-gray-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ticketMedio)}</p>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-1 flex items-center gap-1"><DollarSign size={10}/> Lucro Hoje</p>
          <div className="text-2xl font-black text-gray-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(todayProfit)}</div>
        </div>

        <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mb-1 flex items-center gap-1"><Box size={10}/> Valor em Balcão</p>
          <div className="text-2xl font-black text-gray-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stockPotentialValue)}</div>
        </div>

        <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mb-1 flex items-center gap-1"><Target size={10}/> Breakeven Mês</p>
          <div className="text-2xl font-black text-gray-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(breakEven)}</div>
        </div>

        <div className="bg-pink-500 p-7 rounded-[32px] shadow-xl shadow-pink-100 text-white relative overflow-hidden">
          <div className="absolute -right-2 -bottom-2 opacity-10">
            <TrendingUp size={80} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Meta de Lucro</p>
          <div className="text-2xl font-black">{breakEvenPercent.toFixed(0)}% batida</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
             <h2 className="text-lg font-black text-gray-800 flex items-center gap-2"><TrendingUp className="text-emerald-500" size={20} /> Faturamento Semanal</h2>
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">7 dias</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F9FAFB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#D1D5DB'}} dy={10} />
                <Tooltip 
                  cursor={{fill: '#FFF9FB', radius: 10}} 
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 800, fontSize: '12px', color: '#374151'}} 
                  formatter={(value: number) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 'Vendas']} 
                />
                <Bar dataKey="total" radius={[8, 8, 8, 8]} barSize={40}>
                  {last7Days.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.date === today ? '#EC4899' : '#FBCFE8'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <h2 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2"><Zap className="text-pink-500" size={20} /> Top Performance</h2>
          <div className="space-y-6">
             <div className="p-5 bg-gray-50 rounded-[24px] border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cobertura de Custos</span>
                   <span className="text-xs font-black text-gray-800">{breakEvenPercent.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-gray-100 p-0.5">
                   <div className="h-full bg-pink-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, breakEvenPercent)}%` }}></div>
                </div>
             </div>
             
             <div className="space-y-4 pt-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Mais Vendidos do Mês</p>
                {productPerformance.map((prod, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 hover:bg-pink-50/50 rounded-xl transition-colors">
                    <span className="text-xs font-bold text-gray-700">{prod.name}</span>
                    <span className="text-xs font-black text-pink-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prod.total)}</span>
                  </div>
                ))}
                {productPerformance.length === 0 && (
                  <p className="text-center py-4 text-xs italic text-gray-400">Nenhuma venda este mês.</p>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
