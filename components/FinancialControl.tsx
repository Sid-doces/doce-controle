
import React, { useState, useMemo } from 'react';
import { AppState, Expense, Loss, Sale } from '../types';
import { 
  Plus, Trash2, TrendingUp, TrendingDown, X, Target, Percent, Zap, 
  AlertTriangle, PackageX, Receipt, Wallet, Activity, Calculator, PieChart as PieIcon, BarChart3, ArrowDownCircle, ArrowUpCircle, MinusCircle, Users, User, Scale, CheckCircle, Info
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface FinancialControlProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const FinancialControl: React.FC<FinancialControlProps> = ({ state, setState }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'expenses' | 'losses' | 'breakeven'>('overview');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddLoss, setShowAddLoss] = useState(false);
  
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({ description: '', value: undefined, isFixed: false });
  const [newLoss, setNewLoss] = useState<Partial<Loss>>({ type: 'Insumo', refId: '', quantity: 1 });

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthSales = useMemo(() => state.sales.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }), [state.sales, currentMonth, currentYear]);
  
  const monthRevenue = monthSales.reduce((acc, s) => acc + (s.total || 0), 0);
  
  const monthExpenses = useMemo(() => (state.expenses || []).filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }), [state.expenses, currentMonth, currentYear]);

  // Cálculos Base
  const monthCogs = monthSales.reduce((acc, s) => acc + ((s.costUnitary || 0) * (s.quantity || 0)), 0);
  const monthCommissions = monthSales.reduce((acc, s) => acc + (s.commissionValue || 0), 0);
  const monthTotalFixed = monthExpenses.filter(e => e.isFixed).reduce((acc, e) => acc + e.value, 0);
  const monthTotalVar = monthExpenses.filter(e => !e.isFixed).reduce((acc, e) => acc + e.value, 0);
  
  const monthLosses = useMemo(() => (state.losses || []).filter(l => {
    const d = new Date(l.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }), [state.losses, currentMonth, currentYear]);
  const monthTotalLossValue = monthLosses.reduce((acc, l) => acc + l.value, 0);

  // Cálculos do Ponto de Equilíbrio
  const contributionMarginRatio = monthRevenue > 0 ? (monthRevenue - monthCogs - monthCommissions) / monthRevenue : 0;
  
  const estimatedMarginRatio = useMemo(() => {
    if (state.products.length === 0) return 0.5;
    const productsWithCost = state.products.filter(p => p.cost > 0);
    if (productsWithCost.length === 0) return 0.5;
    return productsWithCost.reduce((acc, p) => acc + ((p.price - p.cost) / p.price), 0) / productsWithCost.length;
  }, [state.products]);

  const effectiveMargin = contributionMarginRatio > 0 ? contributionMarginRatio : estimatedMarginRatio;
  const breakEvenPoint = effectiveMargin > 0 ? (monthTotalFixed / effectiveMargin) : 0;
  const progressToBreakEven = breakEvenPoint > 0 ? Math.min(100, (monthRevenue / breakEvenPoint) * 100) : 0;
  const safetyMargin = monthRevenue > breakEvenPoint ? monthRevenue - breakEvenPoint : 0;

  const totalVariableCosts = monthCogs + monthCommissions;
  const salesGrossProfit = monthRevenue - totalVariableCosts;
  const totalOperationalCosts = monthTotalFixed + monthTotalVar + monthTotalLossValue;
  const monthNetProfit = salesGrossProfit - totalOperationalCosts;
  const profitMargin = monthRevenue > 0 ? (monthNetProfit / monthRevenue) * 100 : 0;

  const sellerCommissions = useMemo(() => {
    const map: Record<string, { totalSales: number, totalCommission: number, count: number }> = {};
    monthSales.forEach(s => {
      const name = s.sellerName || 'Proprietário/Geral';
      if (!map[name]) map[name] = { totalSales: 0, totalCommission: 0, count: 0 };
      map[name].totalSales += (s.total || 0);
      map[name].totalCommission += (s.commissionValue || 0);
      map[name].count += 1;
    });
    return Object.entries(map).sort((a, b) => b[1].totalCommission - a[1].totalCommission);
  }, [monthSales]);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.value) return;
    const expense: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      companyId: state.user?.companyId || '',
      description: newExpense.description,
      value: Number(newExpense.value),
      date: new Date().toISOString(),
      isFixed: !!newExpense.isFixed
    };
    setState(prev => ({ ...prev, expenses: [expense, ...(prev.expenses || [])] }));
    setShowAddExpense(false);
    setNewExpense({ description: '', value: undefined, isFixed: false });
  };

  const handleAddLoss = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoss.refId || !newLoss.quantity) return;
    let unitCost = 0;
    let desc = '';
    if (newLoss.type === 'Insumo') {
      const item = state.stock.find(s => s.id === newLoss.refId);
      if (!item) return;
      unitCost = item.unitPrice;
      desc = `Desperdício Insumo: ${item.name}`;
    } else {
      const prod = state.products.find(p => p.id === newLoss.refId);
      if (!prod) return;
      unitCost = prod.cost;
      desc = `Perda de Doce: ${prod.name}`;
    }
    const lossEntry: Loss = {
      id: Math.random().toString(36).substr(2, 9),
      companyId: state.user?.companyId || '',
      description: desc,
      type: newLoss.type as any,
      refId: newLoss.refId,
      quantity: newLoss.quantity,
      value: unitCost * newLoss.quantity,
      date: new Date().toISOString()
    };
    setState(prev => {
      const updatedStock = prev.stock.map(s => (newLoss.type === 'Insumo' && s.id === newLoss.refId) ? { ...s, quantity: Math.max(0, s.quantity - newLoss.quantity!) } : s);
      const updatedProducts = prev.products.map(p => (newLoss.type === 'Produto' && p.id === newLoss.refId) ? { ...p, quantity: Math.max(0, p.quantity - newLoss.quantity!) } : p);
      return { ...prev, stock: updatedStock, products: updatedProducts, losses: [lossEntry, ...(prev.losses || [])] };
    });
    setShowAddLoss(false);
    setNewLoss({ type: 'Insumo', refId: '', quantity: 1 });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight text-pink-600">Fluxo de Caixa 💰</h1>
          <p className="text-gray-500 font-medium italic">Visão clara do desempenho do mês.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddLoss(true)} className="bg-white text-red-500 border border-red-100 font-black px-6 py-4 rounded-[22px] flex items-center gap-2 shadow-sm text-xs uppercase tracking-widest hover:bg-red-50 transition-all">
            <PackageX size={16} /> Lançar Perda
          </button>
          <button onClick={() => setShowAddExpense(true)} className="bg-pink-500 hover:bg-pink-600 text-white font-black px-6 py-4 rounded-[22px] flex items-center gap-2 shadow-lg shadow-pink-100 transition-all text-xs uppercase tracking-widest">
            <Plus size={16} /> Lançar Conta
          </button>
        </div>
      </header>

      <div className="flex bg-white p-1.5 rounded-[24px] border border-gray-100 shadow-sm w-full md:w-fit overflow-x-auto mx-1 no-scrollbar">
        {[
          { id: 'overview', label: 'Balanço Atual', icon: BarChart3 },
          { id: 'breakeven', label: 'Alcançar Empate', icon: Scale },
          { id: 'expenses', label: 'Lista de Contas', icon: Receipt },
          { id: 'losses', label: 'Desperdícios', icon: PackageX },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)} 
            className={`flex items-center gap-2 px-6 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeSubTab === tab.id ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'overview' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-1">
             <div className="bg-white p-8 rounded-[40px] border border-pink-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 text-pink-500"><TrendingUp size={80}/></div>
                <h3 className="text-xs font-black text-pink-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                   <ArrowUpCircle size={16} /> Movimentação de Vendas
                </h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Total Faturado (Bruto)</span>
                      <span className="font-black text-gray-800 text-xl">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthRevenue)}</span>
                   </div>
                   <div className="flex justify-between items-end border-b border-gray-50 pb-2 text-gray-600">
                      <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">Insumos Utilizados</span>
                      <span className="font-black text-xs">-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthCogs)}</span>
                   </div>
                   <div className="flex justify-between items-end border-b border-gray-50 pb-2 text-indigo-500">
                      <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">Provisão de Comissões <Users size={10}/></span>
                      <span className="font-black text-xs">-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthCommissions)}</span>
                   </div>
                   <div className="flex justify-between items-center bg-pink-50 p-6 rounded-3xl mt-4">
                      <div>
                         <p className="text-[9px] font-black text-pink-500 uppercase">Resultado de Operação</p>
                         <p className="text-[8px] font-medium text-pink-400 italic">Após matéria-prima e comissões</p>
                      </div>
                      <span className="text-2xl font-black text-pink-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(salesGrossProfit)}</span>
                   </div>
                </div>
             </div>
             <div className="bg-white p-8 rounded-[40px] border border-indigo-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 text-indigo-500"><MinusCircle size={80}/></div>
                <h3 className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                   <ArrowDownCircle size={16} /> Gastos & Provisões Mensais
                </h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Custos Fixos do Mês</span>
                        <p className="text-[8px] text-indigo-400 font-bold italic">Provisionados integralmente</p>
                      </div>
                      <span className="font-black text-gray-800 text-base">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthTotalFixed)}</span>
                   </div>
                   <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Perdas e Desperdícios</span>
                      <span className="font-black text-red-500 text-base">-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthTotalLossValue)}</span>
                   </div>
                   <div className="flex justify-between items-center bg-indigo-50 p-6 rounded-3xl mt-4">
                      <div>
                         <p className="text-[9px] font-black text-indigo-500 uppercase">Saídas Operacionais</p>
                         <p className="text-[8px] font-medium text-indigo-400 italic">Custo total para manter as portas abertas</p>
                      </div>
                      <span className="text-2xl font-black text-indigo-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalOperationalCosts)}</span>
                   </div>
                </div>
             </div>
          </div>
          <div className="px-1">
             <div className={`p-10 rounded-[45px] border-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 transition-all ${monthNetProfit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-indigo-50 border-indigo-100'}`}>
                <div className="flex items-center gap-6">
                   <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg ${monthNetProfit >= 0 ? 'bg-emerald-500 text-white' : 'bg-indigo-500 text-white'}`}>
                      {monthNetProfit >= 0 ? <TrendingUp size={40} /> : <Activity size={40} />}
                   </div>
                   <div>
                      <h2 className={`text-sm font-black uppercase tracking-widest ${monthNetProfit >= 0 ? 'text-emerald-600' : 'text-indigo-600'}`}>Balanço Mensal (Em Andamento)</h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Vendas vs. Custos provisionados:</p>
                   </div>
                </div>
                <div className="text-center md:text-right">
                   <span className={`text-5xl font-black tracking-tighter ${monthNetProfit >= 0 ? 'text-emerald-700' : 'text-indigo-700'}`}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthNetProfit)}
                   </span>
                   <div className="mt-2">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${monthNetProfit >= 0 ? 'bg-emerald-200 text-emerald-800' : 'bg-indigo-200 text-indigo-800'}`}>
                         {monthNetProfit >= 0 ? 'Margem Real: ' : 'Margem Atual (Parcial): '}{profitMargin.toFixed(1)}%
                      </span>
                   </div>
                   {monthNetProfit < 0 && (
                      <div className="mt-4 flex items-center justify-center md:justify-end gap-2 text-indigo-400">
                         <Info size={12} />
                         <span className="text-[8px] font-bold uppercase italic">Esse valor considera o mês em aberto e custos fixos integrais.</span>
                      </div>
                   )}
                </div>
             </div>
          </div>
        </>
      ) : activeSubTab === 'breakeven' ? (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 px-1">
           <div className="bg-white p-10 rounded-[45px] border border-gray-100 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                       <Scale size={28} />
                    </div>
                    <div>
                       <h2 className="text-xl font-black text-gray-800">Caminho para o Empate</h2>
                       <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Quanto falta para pagar as contas do mês</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Status da Operação</p>
                    {monthRevenue >= breakEvenPoint ? (
                      <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full font-black text-[10px] uppercase flex items-center gap-2">
                        <CheckCircle size={14}/> Já Lucrando
                      </span>
                    ) : (
                      <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full font-black text-[10px] uppercase flex items-center gap-2">
                        <Activity size={14}/> Em busca do Empate
                      </span>
                    )}
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Progresso do Mês</span>
                    <span className="text-lg font-black text-gray-800">{progressToBreakEven.toFixed(0)}%</span>
                 </div>
                 <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                       className={`h-full transition-all duration-1000 ${monthRevenue >= breakEvenPoint ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                       style={{ width: `${progressToBreakEven}%` }}
                    />
                 </div>
                 <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase px-1">
                    <span>Início</span>
                    <span>Meta Mínima: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(breakEvenPoint)}</span>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                 <div className="p-8 bg-gray-50 rounded-[35px] border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Receipt size={12}/> Custos Fixos Totais</p>
                    <p className="text-2xl font-black text-gray-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthTotalFixed)}</p>
                    <p className="text-[8px] text-indigo-400 mt-2 font-bold uppercase italic">Provisionados integralmente</p>
                 </div>
                 <div className="p-8 bg-gray-50 rounded-[35px] border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Percent size={12}/> Margem Contribuição</p>
                    <p className="text-2xl font-black text-indigo-600">{(effectiveMargin * 100).toFixed(1)}%</p>
                    <p className="text-[9px] text-gray-400 mt-2 font-medium italic">O que "sobra" de cada venda para pagar os custos fixos</p>
                 </div>
                 <div className={`p-8 rounded-[35px] border-2 flex flex-col justify-center ${monthRevenue >= breakEvenPoint ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1 ${monthRevenue >= breakEvenPoint ? 'text-emerald-500' : 'text-amber-500'}`}>
                       {monthRevenue >= breakEvenPoint ? <TrendingUp size={12}/> : <Calculator size={12}/>}
                       {monthRevenue >= breakEvenPoint ? 'Margem de Segurança' : 'Faltam Faturar'}
                    </p>
                    <p className={`text-2xl font-black ${monthRevenue >= breakEvenPoint ? 'text-emerald-700' : 'text-amber-700'}`}>
                       {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthRevenue >= breakEvenPoint ? safetyMargin : breakEvenPoint - monthRevenue)}
                    </p>
                 </div>
              </div>
           </div>
        </div>
      ) : activeSubTab === 'expenses' ? (
        <div className="space-y-4 px-1">
           {monthExpenses.length > 0 ? (
             monthExpenses.map(exp => (
               <div key={exp.id} className="bg-white p-6 rounded-[35px] border border-gray-100 shadow-sm flex justify-between items-center group hover:border-pink-200 transition-all">
                 <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${exp.isFixed ? 'bg-indigo-50 text-indigo-500' : 'bg-pink-50 text-pink-500'}`}><Receipt size={24}/></div>
                    <div>
                      <h4 className="font-black text-gray-800 text-sm">{exp.description}</h4>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{exp.isFixed ? 'Custo Fixo (Provisionado)' : 'Despesa Variável'} • {new Date(exp.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                 </div>
                 <div className="text-right flex items-center gap-6">
                    <p className="text-lg font-black text-gray-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(exp.value)}</p>
                    <button onClick={() => setState(prev => ({...prev, expenses: prev.expenses.filter(e => e.id !== exp.id)}))} className="p-3 bg-gray-50 text-gray-200 hover:text-red-500 rounded-xl transition-all"><Trash2 size={18}/></button>
                 </div>
               </div>
             ))
           ) : (
             <div className="py-24 text-center text-gray-300 font-black italic">Sem lançamentos registrados este mês.</div>
           )}
        </div>
      ) : (
        <div className="space-y-4 px-1">
           {monthLosses.map(l => (
             <div key={l.id} className="bg-white p-6 rounded-[35px] border border-red-50 flex justify-between items-center group">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center"><PackageX size={24}/></div>
                  <div>
                    <h4 className="font-black text-gray-800 text-sm">{l.description}</h4>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{l.quantity} un/kg • {new Date(l.date).toLocaleDateString('pt-BR')}</p>
                  </div>
               </div>
               <div className="text-right flex items-center gap-6">
                  <p className="text-lg font-black text-red-500">-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(l.value)}</p>
                  <button onClick={() => setState(prev => ({...prev, losses: prev.losses.filter(ls => ls.id !== l.id)}))} className="p-3 bg-gray-50 text-gray-200 hover:text-red-500 rounded-xl transition-all"><Trash2 size={18}/></button>
               </div>
             </div>
           ))}
           {monthLosses.length === 0 && <div className="py-24 text-center text-gray-300 font-black italic uppercase text-xs">Sem perdas registradas.</div>}
        </div>
      )}
    </div>
  );
};

export default FinancialControl;
