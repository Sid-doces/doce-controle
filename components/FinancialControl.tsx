
import React, { useState } from 'react';
import { AppState, Expense, PaymentMethod } from '../types';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, X, Receipt, Target, Percent, Zap, Calculator, ChefHat, UserCheck } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface FinancialControlProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const FinancialControl: React.FC<FinancialControlProps> = ({ state, setState }) => {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    description: '',
    value: undefined,
    isFixed: false
  });

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthSales = state.sales.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  
  const monthRevenue = monthSales.reduce((acc, s) => acc + s.total, 0);

  const monthSalesCost = monthSales.reduce((acc, s) => {
    return acc + (s.costUnitary * s.quantity);
  }, 0);

  // Comissões geradas no mês
  const monthCommissions = monthSales.reduce((acc, s) => acc + (s.commissionValue || 0), 0);

  const monthProductions = (state.productions || []).filter(p => {
    const d = new Date(p.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const monthCogs = monthProductions.reduce((acc, p) => acc + p.totalCost, 0);
  
  const monthExpenses = state.expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const monthTotalFixed = monthExpenses.filter(e => e.isFixed).reduce((acc, e) => acc + e.value, 0);
  const monthTotalVar = monthExpenses.filter(e => !e.isFixed).reduce((acc, e) => acc + e.value, 0);
  
  // Lucro líquido descontando comissões
  const totalOut = monthCogs + monthTotalFixed + monthTotalVar + monthCommissions;
  const monthNetProfit = monthRevenue - totalOut;

  const contributionMarginGlobal = monthRevenue > 0 ? ((monthRevenue - monthSalesCost) / monthRevenue) * 100 : 0;
  const contributionMarginDecimal = contributionMarginGlobal / 100;
  
  const breakEvenPoint = contributionMarginDecimal > 0 ? (monthTotalFixed + monthTotalVar + monthCommissions) / contributionMarginDecimal : 0;
  const healthPercent = breakEvenPoint > 0 ? (monthRevenue / breakEvenPoint) * 100 : 0;

  const expenseDistribution = [
    { name: 'Produção (Insumos)', value: monthCogs, color: '#FBCFE8' },
    { name: 'Fixas', value: monthTotalFixed, color: '#EC4899' },
    { name: 'Variáveis', value: monthTotalVar, color: '#F472B6' },
    { name: 'Comissões', value: monthCommissions, color: '#8B5CF6' },
  ].filter(d => d.value > 0);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description || newExpense.value === undefined) return;
    const expense: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      description: newExpense.description!,
      value: Number(newExpense.value),
      date: new Date().toISOString(),
      isFixed: !!newExpense.isFixed
    };
    setState(prev => ({ ...prev, expenses: [expense, ...prev.expenses] }));
    setShowAddExpense(false);
    setNewExpense({ description: '', value: undefined, isFixed: false });
  };

  const removeExpense = (id: string) => {
    if(confirm("Deseja apagar este registro de gasto?")) {
      setState(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Análise Financeira</h1>
          <p className="text-gray-500 font-medium italic">Visão baseada em fluxo de produção e vendas.</p>
        </div>
        <button 
          onClick={() => setShowAddExpense(true)}
          className="bg-white hover:bg-gray-50 text-gray-800 border-2 border-pink-50 font-black px-6 py-4 rounded-[20px] flex items-center gap-2 shadow-sm transition-all text-sm"
        >
          <Plus size={18} className="text-pink-500" /> Registrar Gasto
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><TrendingUp size={10} className="text-emerald-500"/> Lucro Real (Caixa)</p>
          <div className={`text-2xl font-black ${monthNetProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthNetProfit)}
          </div>
        </div>

        <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
            <UserCheck size={10} className="text-indigo-500" /> Comissões do Mês
          </p>
          <div className="text-2xl font-black text-indigo-600">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthCommissions)}
          </div>
        </div>

        <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
            <ChefHat size={10} className="text-pink-500" /> Meta para Equilíbrio
          </p>
          <div className="text-2xl font-black text-gray-800">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(breakEvenPoint)}
          </div>
        </div>

        <div className={`p-7 rounded-[32px] shadow-xl flex flex-col justify-center ${healthPercent >= 100 ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-amber-500 text-white shadow-amber-100'}`}>
           <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Status do Mês</p>
           <div className="text-xl font-black">
              {healthPercent >= 100 ? 'No Lucro ✨' : 'Abaixo do Equilíbrio'}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <h2 className="text-lg font-black text-gray-800 mb-8 flex items-center gap-2">
            <Zap className="text-pink-500" size={20} /> Distribuição de Saídas
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {expenseDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '20px', border: 'none', fontWeight: 800, fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                  formatter={(v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)}
                />
                <Legend iconType="circle" wrapperStyle={{fontWeight: 800, fontSize: '10px', textTransform: 'uppercase', color: '#9CA3AF', paddingTop: '20px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col">
          <h2 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
             <Target className="text-indigo-500" size={20} /> Progresso Financeiro
          </h2>
          <div className="space-y-8 flex-1 flex flex-col justify-center px-2">
             <div className="space-y-3">
                <div className="flex justify-between items-end">
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ponto de Equilíbrio</span>
                   <span className="text-sm font-black text-gray-800">{healthPercent.toFixed(0)}%</span>
                </div>
                <div className="w-full h-4 bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-0.5">
                   <div 
                    className={`h-full rounded-full transition-all duration-1000 ${healthPercent >= 100 ? 'bg-emerald-500' : 'bg-pink-500'}`} 
                    style={{ width: `${Math.min(100, healthPercent)}%` }}
                   ></div>
                </div>
             </div>
             <div className="p-6 bg-gray-50/50 rounded-[30px] border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest text-center">Detalhamento de Saídas</p>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                   <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Custo de Produção (Insumos):</span>
                   <span className="text-sm font-black text-gray-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthCogs)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                   <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Comissões Devidas:</span>
                   <span className="text-sm font-black text-indigo-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthCommissions)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                   <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Despesas Fixas:</span>
                   <span className="text-sm font-black text-gray-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthTotalFixed)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                   <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Despesas Variáveis:</span>
                   <span className="text-sm font-black text-gray-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthTotalVar)}</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialControl;
