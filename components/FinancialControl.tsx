
import React, { useState } from 'react';
import { AppState, Expense, PaymentMethod } from '../types';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, X, Receipt, Target, Percent, Zap, Calculator, ChefHat, UserCheck, AlertCircle, CheckCircle2, Info, Sparkles, Flag } from 'lucide-react';
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

  // Margem de Contribuição (Faturamento - Custo de Insumos)
  const contributionMarginGlobal = monthRevenue > 0 ? ((monthRevenue - monthSalesCost) / monthRevenue) * 100 : 0;
  
  // Se não houver vendas no mês, usamos a margem média dos produtos cadastrados para estimar o ponto de equilíbrio
  const productsWithCost = state.products.filter(p => p.cost > 0 && p.price > 0);
  const estimatedMargin = productsWithCost.length > 0
    ? (productsWithCost.reduce((acc, p) => acc + ((p.price - p.cost) / p.price), 0) / productsWithCost.length) * 100
    : 30; // 30% como fallback se não houver dados

  const effectiveMargin = monthRevenue > 0 ? contributionMarginGlobal : estimatedMargin;
  const contributionMarginDecimal = effectiveMargin / 100;
  
  // FÓRMULA CORRETA: Ponto de Equilíbrio = Despesas Fixas / Margem Média
  // Incluímos as despesas fixas para saber quanto de faturamento é necessário para pagar o custo fixo da operação
  const breakEvenPoint = contributionMarginDecimal > 0 ? (monthTotalFixed) / contributionMarginDecimal : 0;
  
  // Saúde financeira baseada no faturamento vs ponto de equilíbrio
  const healthPercent = breakEvenPoint > 0 ? (monthRevenue / breakEvenPoint) * 100 : (monthRevenue > 0 ? 100 : 0);

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

  const getProfitExplanation = () => {
    if (monthNetProfit >= 0) {
      return {
        title: "Operação Saudável ✨",
        message: "Parabéns! Suas vendas superaram todos os custos e despesas. Você está gerando lucro real para sua confeitaria.",
        type: 'success' as const
      };
    }

    if (monthCogs > monthRevenue && monthRevenue > 0) {
      return {
        title: "Custo de Produção Elevado ⚠️",
        message: "Atenção: Você gastou mais produzindo (insumos) do que faturou vendendo. Verifique se há desperdícios.",
        type: 'warning' as const
      };
    }

    if (monthRevenue === 0 && totalOut > 0) {
        return {
          title: "Mês em Preparação 🥣",
          message: "Você registrou gastos, mas ainda não lançou vendas. Assim que as vendas começarem, o saldo irá subir!",
          type: 'info' as const
        };
    }

    return {
      title: "Saldo em Recuperação 🛠️",
      message: "O saldo está negativo porque os custos iniciais do mês ainda não foram cobertos pelas vendas. Continue vendendo!",
      type: 'info' as const
    };
  };

  const explanation = getProfitExplanation();

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

      {/* Alerta de Ponto de Equilíbrio */}
      <div className={`p-8 rounded-[40px] border-2 flex flex-col md:flex-row items-center gap-6 shadow-xl ${
        monthRevenue >= breakEvenPoint && breakEvenPoint > 0 
        ? 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-100' 
        : 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-100'
      }`}>
        <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center shrink-0 border border-white/30">
          {monthRevenue >= breakEvenPoint && breakEvenPoint > 0 ? <Flag size={32} /> : <Target size={32} />}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-1">Ponto de Equilíbrio</h3>
          <p className="text-lg font-bold leading-tight">
            {monthRevenue >= breakEvenPoint && breakEvenPoint > 0 
              ? "Meta batida! Todo faturamento a partir de agora é lucro bruto para a operação."
              : `Você precisa faturar ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(breakEvenPoint)} este mês para não ter prejuízo.`
            }
          </p>
        </div>
        {breakEvenPoint > 0 && (
          <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/20 font-black text-xl">
            {healthPercent.toFixed(0)}%
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><TrendingUp size={10} className="text-emerald-500"/> Lucro Real (Caixa)</p>
          <div className={`text-2xl font-black ${monthNetProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthNetProfit)}
          </div>
        </div>

        <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
            <Percent size={10} className="text-indigo-500" /> Margem Média
          </p>
          <div className="text-2xl font-black text-indigo-600">
            {effectiveMargin.toFixed(1)}%
          </div>
        </div>

        <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
            <Calculator size={10} className="text-pink-500" /> Meta de Vendas
          </p>
          <div className="text-2xl font-black text-gray-800 tracking-tighter">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(breakEvenPoint)}
          </div>
        </div>

        <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
            <UserCheck size={10} className="text-amber-500" /> Comissões
          </p>
          <div className="text-2xl font-black text-amber-500">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthCommissions)}
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
             <Target className="text-indigo-500" size={20} /> Progresso do Equilíbrio
          </h2>
          <div className="space-y-8 flex-1 flex flex-col justify-center px-2">
             <div className="space-y-3">
                <div className="flex justify-between items-end">
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Atingido do Ponto de Equilíbrio</span>
                   <span className={`text-sm font-black ${healthPercent >= 100 ? 'text-emerald-500' : 'text-indigo-600'}`}>
                    {healthPercent.toFixed(0)}%
                   </span>
                </div>
                <div className="w-full h-5 bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-1">
                   <div 
                    className={`h-full rounded-full transition-all duration-1000 ${healthPercent >= 100 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-indigo-500'}`} 
                    style={{ width: `${Math.min(100, healthPercent)}%` }}
                   ></div>
                </div>
             </div>
             
             <div className="p-6 bg-gray-50/50 rounded-[30px] border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest text-center">Resumo de Gastos Totais</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Insumos Produzidos:</span>
                    <span className="text-sm font-black text-gray-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthCogs)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Despesas Fixas:</span>
                    <span className="text-sm font-black text-gray-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthTotalFixed)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Despesas Variáveis:</span>
                    <span className="text-sm font-black text-gray-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthTotalVar)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Comissões Pagas:</span>
                    <span className="text-sm font-black text-amber-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthCommissions)}</span>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {showAddExpense && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleAddExpense} className="bg-white w-full max-w-md p-10 rounded-[45px] shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Novo Gasto</h2>
              <button type="button" onClick={() => setShowAddExpense(false)} className="text-gray-400 hover:text-red-500 p-2 transition-colors"><X size={24} /></button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1">Descrição</label>
                <input 
                  type="text" required
                  className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-bold focus:bg-white focus:border-pink-500 outline-none transition-all"
                  placeholder="Ex: Aluguel, MEI, Embalagens..."
                  value={newExpense.description}
                  onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1">Valor (R$)</label>
                <input 
                  type="number" step="any" required
                  className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-black text-xl focus:bg-white focus:border-pink-500 outline-none transition-all"
                  placeholder="0,00"
                  value={newExpense.value ?? ''}
                  onChange={e => setNewExpense({...newExpense, value: e.target.value === '' ? undefined : Number(e.target.value)})}
                />
              </div>

              <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <input 
                  type="checkbox" 
                  id="fixed"
                  className="w-5 h-5 accent-pink-500"
                  checked={newExpense.isFixed}
                  onChange={e => setNewExpense({...newExpense, isFixed: e.target.checked})}
                />
                <label htmlFor="fixed" className="text-xs font-black text-gray-600 uppercase tracking-widest cursor-pointer">Gasto Fixo Mensal?</label>
              </div>
            </div>

            <div className="flex gap-4 mt-12">
              <button type="button" onClick={() => setShowAddExpense(false)} className="flex-1 py-4 text-gray-400 font-black text-xs uppercase tracking-widest">Cancelar</button>
              <button type="submit" className="flex-[2] py-5 bg-pink-500 text-white rounded-[32px] font-black text-lg shadow-xl shadow-pink-100 hover:bg-pink-600 transition-all">
                Salvar Gasto
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default FinancialControl;
