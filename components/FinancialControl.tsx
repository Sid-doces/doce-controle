
import React, { useState, useMemo } from 'react';
import { AppState, Expense, Loss, StockItem, Product } from '../types';
import { Plus, Trash2, TrendingUp, TrendingDown, X, Target, Percent, Zap, Calculator, UserCheck, Info, Sparkles, Flag, History, AlertTriangle, PackageX } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface FinancialControlProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const FinancialControl: React.FC<FinancialControlProps> = ({ state, setState }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'commissions' | 'losses'>('overview');
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
  
  const monthRevenue = monthSales.reduce((acc, s) => acc + s.total, 0);
  const monthSalesCost = monthSales.reduce((acc, s) => acc + (s.costUnitary * s.quantity), 0);
  const monthCommissions = monthSales.reduce((acc, s) => acc + (s.commissionValue || 0), 0);

  const monthProductions = (state.productions || []).filter(p => {
    const d = new Date(p.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const monthCogs = monthProductions.reduce((acc, p) => acc + p.totalCost, 0);
  
  const allFixedExpenses = useMemo(() => (state.expenses || []).filter(e => e.isFixed), [state.expenses]);
  const monthTotalFixed = allFixedExpenses.reduce((acc, e) => acc + e.value, 0);

  const monthVarExpenses = useMemo(() => (state.expenses || []).filter(e => {
    const d = new Date(e.date);
    return !e.isFixed && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }), [state.expenses, currentMonth, currentYear]);
  const monthTotalVar = monthVarExpenses.reduce((acc, e) => acc + e.value, 0);

  // CÁLCULO DE PERDAS
  const monthLosses = useMemo(() => (state.losses || []).filter(l => {
    const d = new Date(l.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }), [state.losses, currentMonth, currentYear]);
  const monthTotalLossValue = monthLosses.reduce((acc, l) => acc + l.value, 0);
  
  const totalOut = monthCogs + monthTotalFixed + monthTotalVar + monthCommissions + monthTotalLossValue;
  const monthNetProfit = monthRevenue - totalOut;

  const effectiveMargin = monthRevenue > 0 ? ((monthRevenue - monthSalesCost) / monthRevenue) * 100 : 30;
  const breakEvenPoint = effectiveMargin > 0 ? (monthTotalFixed) / (effectiveMargin / 100) : 0;
  const healthPercent = breakEvenPoint > 0 ? (monthRevenue / breakEvenPoint) * 100 : (monthRevenue > 0 ? 100 : 0);

  const handleAddLoss = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoss.refId || !newLoss.quantity) return;

    let unitCost = 0;
    let desc = '';
    
    if (newLoss.type === 'Insumo') {
      const item = state.stock.find(s => s.id === newLoss.refId);
      if (!item) return;
      unitCost = item.unitPrice;
      desc = `Perda de ${item.name}`;
    } else {
      const prod = state.products.find(p => p.id === newLoss.refId);
      if (!prod) return;
      unitCost = prod.cost;
      desc = `Desperdício de ${prod.name}`;
    }

    const lossValue = unitCost * newLoss.quantity;
    const lossEntry: Loss = {
      id: Math.random().toString(36).substr(2, 9),
      description: desc,
      type: newLoss.type as any,
      refId: newLoss.refId,
      quantity: newLoss.quantity,
      value: lossValue,
      date: new Date().toISOString()
    };

    setState(prev => {
      // Baixa no estoque real
      const updatedStock = prev.stock.map(s => (newLoss.type === 'Insumo' && s.id === newLoss.refId) ? { ...s, quantity: Math.max(0, s.quantity - newLoss.quantity!) } : s);
      const updatedProducts = prev.products.map(p => (newLoss.type === 'Produto' && p.id === newLoss.refId) ? { ...p, quantity: Math.max(0, p.quantity - newLoss.quantity!) } : p);

      return {
        ...prev,
        stock: updatedStock,
        products: updatedProducts,
        losses: [lossEntry, ...(prev.losses || [])]
      };
    });

    setShowAddLoss(false);
    setNewLoss({ type: 'Insumo', refId: '', quantity: 1 });
  };

  const deleteLoss = (id: string) => {
    if(confirm("Deseja remover este registro de perda? O estoque não será reposto automaticamente.")) {
      setState(prev => ({ ...prev, losses: prev.losses.filter(l => l.id !== id) }));
    }
  };

  const expenseDistribution = [
    { name: 'Produção', value: monthCogs, color: '#FBCFE8' },
    { name: 'Fixas', value: monthTotalFixed, color: '#EC4899' },
    { name: 'Variáveis', value: monthTotalVar, color: '#F472B6' },
    { name: 'Comissões', value: monthCommissions, color: '#8B5CF6' },
    { name: 'Perdas/Desperdício', value: monthTotalLossValue, color: '#EF4444' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Análise Financeira</h1>
          <p className="text-gray-500 font-medium italic">Visão baseada em fluxo de produção e vendas.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowAddLoss(true)}
            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 font-black px-6 py-4 rounded-[20px] flex items-center gap-2 shadow-sm transition-all text-sm"
          >
            <PackageX size={18} /> Registrar Perda
          </button>
          <button 
            onClick={() => setShowAddExpense(true)}
            className="bg-white hover:bg-gray-50 text-gray-800 border-2 border-pink-50 font-black px-6 py-4 rounded-[20px] flex items-center gap-2 shadow-sm transition-all text-sm"
          >
            <Plus size={18} className="text-pink-500" /> Registrar Gasto
          </button>
        </div>
      </header>

      <div className="flex bg-white p-1.5 rounded-[24px] border border-gray-100 shadow-sm w-full md:w-fit self-start overflow-x-auto">
        <button onClick={() => setActiveSubTab('overview')} className={`flex-1 md:flex-none px-6 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'overview' ? 'bg-pink-500 text-white shadow-lg' : 'text-gray-400'}`}>Overview</button>
        <button onClick={() => setActiveSubTab('commissions')} className={`flex-1 md:flex-none px-6 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'commissions' ? 'bg-pink-500 text-white shadow-lg' : 'text-gray-400'}`}>Comissões</button>
        <button onClick={() => setActiveSubTab('losses')} className={`flex-1 md:flex-none px-6 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'losses' ? 'bg-pink-500 text-white shadow-lg' : 'text-gray-400'}`}>Relatório de Perdas</button>
      </div>

      {activeSubTab === 'overview' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Lucro Líquido Real</p>
              <div className={`text-2xl font-black ${monthNetProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthNetProfit)}
              </div>
            </div>
            <div className="bg-white p-7 rounded-[32px] border border-red-50 shadow-sm">
              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1">Perdas no Mês <AlertTriangle size={10}/></p>
              <div className="text-2xl font-black text-red-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthTotalLossValue)}</div>
            </div>
            <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Custo Fixo</p>
              <div className="text-2xl font-black text-gray-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthTotalFixed)}</div>
            </div>
            <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Faturamento</p>
              <div className="text-2xl font-black text-gray-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthRevenue)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
              <h2 className="text-lg font-black text-gray-800 mb-8 flex items-center gap-2"><Zap className="text-pink-500" size={20} /> Onde está indo o dinheiro?</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expenseDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value">
                      {expenseDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '20px', border: 'none', fontWeight: 800}} formatter={(v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)} />
                    <Legend iconType="circle" wrapperStyle={{fontWeight: 800, fontSize: '10px'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col justify-center text-center">
               <Target className="text-pink-500 mx-auto mb-4" size={40} />
               <h3 className="text-xl font-black text-gray-800">Eficiência de Estoque</h3>
               <p className="text-gray-400 font-bold mb-6 italic text-sm">Relação entre vendas e desperdício.</p>
               <div className="text-4xl font-black text-pink-600 mb-2">
                 {monthRevenue > 0 ? (100 - (monthTotalLossValue / monthRevenue * 100)).toFixed(1) : 100}%
               </div>
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Aproveitamento Total</p>
            </div>
          </div>
        </>
      ) : activeSubTab === 'losses' ? (
        <div className="space-y-4 animate-in slide-in-from-right duration-300">
           {monthLosses.map(l => (
             <div key={l.id} className="bg-white p-6 rounded-[30px] border border-red-100 shadow-sm flex justify-between items-center group">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center"><PackageX size={24}/></div>
                  <div>
                    <h4 className="font-black text-gray-800 text-sm">{l.description}</h4>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{l.quantity} un/kg • {new Date(l.date).toLocaleDateString('pt-BR')}</p>
                  </div>
               </div>
               <div className="text-right flex items-center gap-4">
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase">Prejuízo</p>
                    <p className="text-lg font-black text-red-500">-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(l.value)}</p>
                  </div>
                  <button onClick={() => deleteLoss(l.id)} className="text-gray-200 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
               </div>
             </div>
           ))}
           {monthLosses.length === 0 && (
             <p className="py-20 text-center text-gray-300 font-black italic">Parabéns! Nenhuma perda registrada este mês.</p>
           )}
        </div>
      ) : null}

      {/* MODAL REGISTRO PERDA */}
      {showAddLoss && (
        <div className="fixed inset-0 bg-red-950/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleAddLoss} className="bg-white w-full max-w-md p-10 rounded-[45px] shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-gray-800 tracking-tight mb-8">Registrar Desperdício</h2>
            <div className="space-y-6">
              <div className="flex bg-gray-50 p-1 rounded-2xl">
                 <button type="button" onClick={() => setNewLoss({...newLoss, type: 'Insumo', refId: ''})} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase ${newLoss.type === 'Insumo' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-400'}`}>Insumo</button>
                 <button type="button" onClick={() => setNewLoss({...newLoss, type: 'Produto', refId: ''})} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase ${newLoss.type === 'Produto' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-400'}`}>Doce Pronto</button>
              </div>

              <div className="space-y-2">
                <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1">O que foi perdido?</label>
                <select required className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-bold outline-none h-[62px]" value={newLoss.refId} onChange={e => setNewLoss({...newLoss, refId: e.target.value})}>
                  <option value="">Selecione...</option>
                  {newLoss.type === 'Insumo' ? 
                    state.stock.map(s => <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>) :
                    state.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                  }
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-1">Quantidade</label>
                <input type="number" step="any" required className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-black text-xl outline-none" value={newLoss.quantity} onChange={e => setNewLoss({...newLoss, quantity: Number(e.target.value)})} />
              </div>
            </div>
            <div className="flex gap-4 mt-12">
              <button type="button" onClick={() => setShowAddLoss(false)} className="flex-1 py-4 text-gray-400 font-black text-xs uppercase tracking-widest">Sair</button>
              <button type="submit" className="flex-[2] py-5 bg-red-500 text-white rounded-[32px] font-black text-lg shadow-xl shadow-red-100">Confirmar Perda</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default FinancialControl;
