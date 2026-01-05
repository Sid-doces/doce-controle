
import React, { useState, useMemo } from 'react';
import { AppState, Expense, Loss } from '../types';
import { 
  Plus, Trash2, TrendingUp, TrendingDown, X, Target, Percent, Zap, 
  AlertTriangle, PackageX, Receipt, Wallet, Activity, Calculator, PieChart as PieIcon, BarChart3, ArrowDownCircle, ArrowUpCircle, MinusCircle
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface FinancialControlProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const FinancialControl: React.FC<FinancialControlProps> = ({ state, setState }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'expenses' | 'losses'>('overview');
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
  
  // 1. Custo das Vendas (Ingredientes + Comissões)
  const monthCogs = monthSales.reduce((acc, s) => acc + (s.costUnitary * s.quantity), 0);
  const monthCommissions = monthSales.reduce((acc, s) => acc + (s.commissionValue || 0), 0);
  const totalVariableCosts = monthCogs + monthCommissions;

  // 2. Lucro Bruto das Vendas (O que sobrou da venda do doce)
  const salesGrossProfit = monthRevenue - totalVariableCosts;

  // 3. Custos Fixos e Operacionais (Contas da casa + Perdas)
  const monthExpenses = useMemo(() => (state.expenses || []).filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }), [state.expenses, currentMonth, currentYear]);

  const monthTotalFixed = monthExpenses.filter(e => e.isFixed).reduce((acc, e) => acc + e.value, 0);
  const monthTotalVar = monthExpenses.filter(e => !e.isFixed).reduce((acc, e) => acc + e.value, 0);
  
  const monthLosses = useMemo(() => (state.losses || []).filter(l => {
    const d = new Date(l.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }), [state.losses, currentMonth, currentYear]);
  const monthTotalLossValue = monthLosses.reduce((acc, l) => acc + l.value, 0);
  
  const totalOperationalCosts = monthTotalFixed + monthTotalVar + monthTotalLossValue;

  // 4. Lucro Líquido Final (O que sobra no seu bolso)
  const monthNetProfit = salesGrossProfit - totalOperationalCosts;

  // Porcentagem de Eficiência
  const profitMargin = monthRevenue > 0 ? (monthNetProfit / monthRevenue) * 100 : 0;

  const expenseDistribution = [
    { name: 'Matéria-Prima', value: monthCogs, color: '#FBCFE8' },
    { name: 'Gastos Fixos', value: monthTotalFixed, color: '#EC4899' },
    { name: 'Contas Variáveis', value: monthTotalVar, color: '#F472B6' },
    { name: 'Perdas', value: monthTotalLossValue, color: '#EF4444' },
    { name: 'Comissões', value: monthCommissions, color: '#8B5CF6' },
  ].filter(d => d.value > 0);

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

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight text-pink-600">Fluxo de Caixa 💰</h1>
          <p className="text-gray-500 font-medium italic">Entenda para onde vai cada centavo.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddLoss(true)} className="bg-white text-red-500 border border-red-100 font-black px-6 py-4 rounded-[22px] flex items-center gap-2 shadow-sm text-xs uppercase tracking-widest hover:bg-red-50 transition-all">
            <PackageX size={16} /> Perda
          </button>
          <button onClick={() => setShowAddExpense(true)} className="bg-pink-500 hover:bg-pink-600 text-white font-black px-6 py-4 rounded-[22px] flex items-center gap-2 shadow-lg shadow-pink-100 transition-all text-xs uppercase tracking-widest">
            <Plus size={16} /> Gasto
          </button>
        </div>
      </header>

      <div className="flex bg-white p-1.5 rounded-[24px] border border-gray-100 shadow-sm w-full md:w-fit overflow-x-auto mx-1">
        {[
          { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
          { id: 'expenses', label: 'Contas do Mês', icon: Receipt },
          { id: 'losses', label: 'Perdas/Quebra', icon: PackageX },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)} 
            className={`flex items-center gap-2 px-6 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === tab.id ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'overview' ? (
        <>
          {/* Nova Seção: Separação de Vendas vs Gastos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-1">
             {/* Coluna 1: Resultado de Vendas */}
             <div className="bg-white p-8 rounded-[40px] border border-pink-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 text-pink-500"><TrendingUp size={80}/></div>
                <h3 className="text-xs font-black text-pink-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                   <ArrowUpCircle size={16} /> Resultado das Vendas
                </h3>
                <div className="space-y-6">
                   <div className="flex justify-between items-end border-b border-gray-50 pb-4">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Dinheiro que Entrou (Bruto)</span>
                      <span className="font-black text-gray-800 text-xl">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthRevenue)}</span>
                   </div>
                   <div className="flex justify-between items-end border-b border-gray-50 pb-4 text-red-500">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Custo dos Ingredientes (CMV)</span>
                      <span className="font-black text-sm">-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthCogs)}</span>
                   </div>
                   <div className="flex justify-between items-center bg-pink-50 p-6 rounded-3xl">
                      <div>
                         <p className="text-[9px] font-black text-pink-500 uppercase">Lucro de Vitrine</p>
                         <p className="text-[8px] font-medium text-pink-400 italic">O que sobrou dos produtos vendidos</p>
                      </div>
                      <span className="text-2xl font-black text-pink-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(salesGrossProfit)}</span>
                   </div>
                </div>
             </div>

             {/* Coluna 2: Custos Operacionais */}
             <div className="bg-white p-8 rounded-[40px] border border-indigo-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 text-indigo-500"><MinusCircle size={80}/></div>
                <h3 className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                   <ArrowDownCircle size={16} /> Custos da Empresa
                </h3>
                <div className="space-y-6">
                   <div className="flex justify-between items-end border-b border-gray-50 pb-4">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Gastos Fixos (Aluguel, Luz, etc)</span>
                      <span className="font-black text-gray-800 text-base">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthTotalFixed)}</span>
                   </div>
                   <div className="flex justify-between items-end border-b border-gray-50 pb-4">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Perdas e Desperdícios</span>
                      <span className="font-black text-red-500 text-base">-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthTotalLossValue)}</span>
                   </div>
                   <div className="flex justify-between items-center bg-indigo-50 p-6 rounded-3xl">
                      <div>
                         <p className="text-[9px] font-black text-indigo-500 uppercase">Total Operacional</p>
                         <p className="text-[8px] font-medium text-indigo-400 italic">O custo para manter as portas abertas</p>
                      </div>
                      <span className="text-2xl font-black text-indigo-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalOperationalCosts)}</span>
                   </div>
                </div>
             </div>
          </div>

          {/* Resultado Final (O Lucro no Bolso) */}
          <div className="px-1">
             <div className={`p-10 rounded-[45px] border-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 transition-all ${monthNetProfit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                <div className="flex items-center gap-6">
                   <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg ${monthNetProfit >= 0 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                      {monthNetProfit >= 0 ? <TrendingUp size={40} /> : <TrendingDown size={40} />}
                   </div>
                   <div>
                      <h2 className={`text-sm font-black uppercase tracking-widest ${monthNetProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Lucro Líquido Final</h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Sobrou livre no seu bolso este mês:</p>
                   </div>
                </div>
                <div className="text-center md:text-right">
                   <span className={`text-5xl font-black tracking-tighter ${monthNetProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthNetProfit)}
                   </span>
                   <div className="mt-2">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${monthNetProfit >= 0 ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'}`}>
                         Margem Real: {profitMargin.toFixed(1)}%
                      </span>
                   </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-1">
            <div className="bg-white p-8 rounded-[45px] border border-gray-100 shadow-sm">
              <h2 className="text-lg font-black text-gray-800 mb-8 flex items-center gap-2"><PieIcon className="text-pink-500" size={20} /> Composição de Gastos</h2>
              <div className="h-72">
                {expenseDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expenseDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={10} dataKey="value">
                        {expenseDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{borderRadius: '24px', border: 'none', fontWeight: 800, fontSize: '12px'}} formatter={(v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)} />
                      <Legend iconType="circle" wrapperStyle={{fontWeight: 800, fontSize: '10px', textTransform: 'uppercase'}} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-300 font-black italic">Sem dados suficientes no mês</div>
                )}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[45px] border border-gray-100 shadow-sm flex flex-col justify-center">
               <h2 className="text-lg font-black text-gray-800 mb-8 flex items-center gap-2"><Target className="text-indigo-500" size={20} /> Metas & Balanço</h2>
               <div className="space-y-6">
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Comprometimento de Renda</span>
                        <span className="text-[10px] font-black text-gray-800 uppercase">{(100 - profitMargin).toFixed(1)}% em custos</span>
                     </div>
                     <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                           className={`h-full transition-all duration-1000 ${monthNetProfit >= 0 ? 'bg-pink-500' : 'bg-red-500'}`} 
                           style={{ width: `${Math.min(100, (totalVariableCosts + totalOperationalCosts) / (monthRevenue || 1) * 100)}%` }}
                        />
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-center">
                        <p className="text-[9px] font-black uppercase mb-1">Entradas</p>
                        <p className="font-black text-sm">+{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthRevenue)}</p>
                     </div>
                     <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-center">
                        <p className="text-[9px] font-black uppercase mb-1">Saídas Totais</p>
                        <p className="font-black text-sm">-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalVariableCosts + totalOperationalCosts)}</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </>
      ) : activeSubTab === 'expenses' ? (
        <div className="space-y-4 px-1">
           {monthExpenses.length > 0 ? (
             monthExpenses.map(exp => (
               <div key={exp.id} className="bg-white p-6 rounded-[35px] border border-gray-100 shadow-sm flex justify-between items-center group hover:border-pink-200 transition-all">
                 <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${exp.isFixed ? 'bg-indigo-50 text-indigo-500' : 'bg-pink-50 text-pink-500'}`}><Receipt size={24}/></div>
                    <div>
                      <h4 className="font-black text-gray-800 text-sm">{exp.description}</h4>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{exp.isFixed ? 'Gasto Fixo' : 'Gasto Variável'} • {new Date(exp.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                 </div>
                 <div className="text-right flex items-center gap-6">
                    <p className="text-lg font-black text-gray-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(exp.value)}</p>
                    <button onClick={() => setState(prev => ({...prev, expenses: prev.expenses.filter(e => e.id !== exp.id)}))} className="p-3 bg-gray-50 text-gray-200 hover:text-red-500 rounded-xl transition-all"><Trash2 size={18}/></button>
                 </div>
               </div>
             ))
           ) : (
             <div className="py-24 text-center text-gray-300 font-black italic">Sem gastos lançados este mês.</div>
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

      {/* MODAL DESPESA */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleAddExpense} className="bg-white w-full max-w-md p-10 rounded-[45px] shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-gray-800 tracking-tight mb-8">Novo Gasto</h2>
            <div className="space-y-6">
              <input type="text" required placeholder="Ex: Aluguel do Ateliê" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-bold outline-none h-[62px] focus:border-pink-500 transition-all" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} />
              <input type="number" step="any" required placeholder="Valor R$" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-black text-xl outline-none focus:border-pink-500 transition-all" value={newExpense.value} onChange={e => setNewExpense({...newExpense, value: Number(e.target.value)})} />
              <label className="flex items-center gap-3 p-5 bg-gray-50 rounded-2xl cursor-pointer border-2 border-transparent hover:border-indigo-100 transition-all">
                 <input type="checkbox" className="w-6 h-6 accent-indigo-500" checked={newExpense.isFixed} onChange={e => setNewExpense({...newExpense, isFixed: e.target.checked})} />
                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Este é um custo fixo mensal</span>
              </label>
            </div>
            <div className="flex gap-4 mt-12">
              <button type="button" onClick={() => setShowAddExpense(false)} className="flex-1 py-4 text-gray-400 font-black text-[10px] uppercase tracking-widest">Sair</button>
              <button type="submit" className="flex-[2] py-5 bg-pink-500 text-white rounded-[30px] font-black text-lg shadow-xl shadow-pink-100">Lançar Gasto</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL PERDA */}
      {showAddLoss && (
        <div className="fixed inset-0 bg-red-950/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleAddLoss} className="bg-white w-full max-w-md p-10 rounded-[45px] shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-gray-800 tracking-tight mb-8">Registrar Perda</h2>
            <div className="space-y-6">
              <div className="flex bg-gray-50 p-1.5 rounded-2xl">
                 <button type="button" onClick={() => setNewLoss({...newLoss, type: 'Insumo', refId: ''})} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${newLoss.type === 'Insumo' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-400'}`}>Insumo</button>
                 <button type="button" onClick={() => setNewLoss({...newLoss, type: 'Produto', refId: ''})} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${newLoss.type === 'Produto' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-400'}`}>Doce Pronto</button>
              </div>
              <select required className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-bold outline-none h-[62px] focus:border-red-500 transition-all" value={newLoss.refId} onChange={e => setNewLoss({...newLoss, refId: e.target.value})}>
                <option value="">O que foi perdido?</option>
                {newLoss.type === 'Insumo' ? 
                  state.stock.map(s => <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>) :
                  state.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                }
              </select>
              <input type="number" step="any" required placeholder="Quantidade" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-800 font-black text-xl outline-none focus:border-red-500 transition-all" value={newLoss.quantity} onChange={e => setNewLoss({...newLoss, quantity: Number(e.target.value)})} />
            </div>
            <div className="flex gap-4 mt-12">
              <button type="button" onClick={() => setShowAddLoss(false)} className="flex-1 py-4 text-gray-400 font-black text-[10px] uppercase tracking-widest">Sair</button>
              <button type="submit" className="flex-[2] py-5 bg-red-500 text-white rounded-[30px] font-black text-lg shadow-xl shadow-red-100">Registrar Perda</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default FinancialControl;
