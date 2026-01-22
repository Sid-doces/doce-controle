
import React, { useState, useMemo } from 'react';
import { AppState, Expense, Loss, Sale } from '../types';
import { 
  Plus, Trash2, X, Scale, Receipt, PackageX, CalendarDays, ArrowUpCircle, ArrowDownCircle, Target, Percent, BarChart3, Calculator, TrendingUp, CheckCircle2
} from 'lucide-react';

interface FinancialControlProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const FinancialControl: React.FC<FinancialControlProps> = ({ state, setState }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'expenses' | 'losses' | 'breakeven' | 'reports'>('overview');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddLoss, setShowAddLoss] = useState(false);
  
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({ description: '', value: undefined, isFixed: false });
  const [newLoss, setNewLoss] = useState<Partial<Loss>>({ type: 'Insumo', refId: '', quantity: 1 });

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filtros de tempo
  const monthSales = useMemo(() => (state.sales || []).filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }), [state.sales, currentMonth, currentYear]);

  const monthExpensesList = useMemo(() => (state.expenses || []).filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }), [state.expenses, currentMonth, currentYear]);

  // Cálculos Financeiros
  const revenue = monthSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
  const cogs = monthSales.reduce((acc, s) => acc + ((Number(s.costUnitary) || 0) * (Number(s.quantity) || 0)), 0);
  const commissions = monthSales.reduce((acc, s) => acc + (Number(s.commissionValue) || 0), 0);
  
  const totalFixed = monthExpensesList.filter(e => e.isFixed).reduce((acc, e) => acc + (Number(e.value) || 0), 0);
  const totalVar = monthExpensesList.filter(e => !e.isFixed).reduce((acc, e) => acc + (Number(e.value) || 0), 0);
  const lossesVal = (state.losses || []).filter(l => {
    const d = new Date(l.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).reduce((acc, l) => acc + (Number(l.value) || 0), 0);

  const grossProfit = revenue - (cogs + commissions);
  const netProfit = grossProfit - (totalFixed + totalVar + lossesVal);

  // Ponto de Equilíbrio
  const contributionMarginRatio = revenue > 0 ? grossProfit / revenue : 0;
  const breakEvenPoint = contributionMarginRatio > 0 ? totalFixed / contributionMarginRatio : 0;

  // Metas (Simulando uma meta de faturamento de 2.5x o ponto de equilíbrio se não houver configurações)
  const monthlyGoal = totalFixed * 4; 
  const goalProgress = Math.min(100, (revenue / (monthlyGoal || 1)) * 100);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.value) return;
    const exp: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      companyId: state.user?.companyId || '',
      description: newExpense.description,
      value: Number(newExpense.value),
      date: new Date().toISOString(),
      isFixed: !!newExpense.isFixed
    };
    setState(prev => ({ ...prev, expenses: [exp, ...(prev.expenses || [])] }));
    setShowAddExpense(false);
    setNewExpense({ description: '', value: undefined, isFixed: false });
  };

  const handleAddLoss = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoss.refId || !newLoss.quantity) return;
    const item = state.stock.find(s => s.id === newLoss.refId) || state.products.find(p => p.id === newLoss.refId);
    if (!item) return;
    const unitCost = 'unitPrice' in item ? Number(item.unitPrice) : Number(item.cost);
    const loss: Loss = {
      id: Math.random().toString(36).substr(2, 9),
      companyId: state.user?.companyId || '',
      description: `Perda: ${item.name}`,
      type: 'unitPrice' in item ? 'Insumo' : 'Produto',
      refId: newLoss.refId,
      quantity: Number(newLoss.quantity),
      value: unitCost * Number(newLoss.quantity),
      date: new Date().toISOString()
    };
    setState(prev => ({ ...prev, losses: [loss, ...(prev.losses || [])] }));
    setShowAddLoss(false);
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1">
        <div>
          <h1 className="text-2xl font-black text-pink-600 tracking-tight">Financeiro 💰</h1>
          <p className="text-gray-400 text-sm font-medium">Controle de lucros e sustentabilidade.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => setShowAddLoss(true)} className="flex-1 md:flex-none p-4 bg-white text-red-500 rounded-2xl border border-red-100 shadow-sm hover:bg-red-50 flex justify-center"><PackageX size={20}/></button>
          <button onClick={() => setShowAddExpense(true)} className="flex-[3] md:flex-none px-6 py-4 bg-pink-500 text-white rounded-2xl font-black text-xs uppercase shadow-lg flex items-center justify-center gap-2"><Plus size={16}/> Lançar Gasto</button>
        </div>
      </header>

      <div className="flex bg-white p-1.5 rounded-[24px] border border-gray-100 shadow-sm w-fit overflow-x-auto no-scrollbar mx-1">
        {[
          { id: 'overview', label: 'Balanço', icon: BarChart3 },
          { id: 'breakeven', label: 'Metas & PE', icon: Scale },
          { id: 'reports', label: 'Mensal', icon: CalendarDays },
          { id: 'expenses', label: 'Gastos', icon: Receipt },
          { id: 'losses', label: 'Perdas', icon: PackageX },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveSubTab(t.id as any)} className={`flex items-center gap-2 px-6 py-3 rounded-[20px] text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeSubTab === t.id ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>
            <t.icon size={14}/> {t.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'overview' && (
        <div className="space-y-6 px-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[40px] border border-pink-100 shadow-sm">
              <h3 className="text-[10px] font-black text-pink-500 uppercase mb-4 flex items-center gap-2"><ArrowUpCircle size={16}/> Entrada Bruta</h3>
              <p className="text-3xl font-black text-gray-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(revenue)}</p>
              <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase"><span>CMV (Insumos)</span> <span>-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cogs)}</span></div>
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase"><span>Comissões</span> <span>-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(commissions)}</span></div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-indigo-100 shadow-sm">
              <h3 className="text-[10px] font-black text-indigo-500 uppercase mb-4 flex items-center gap-2"><ArrowDownCircle size={16}/> Saídas de Caixa</h3>
              <p className="text-3xl font-black text-gray-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalFixed + totalVar + lossesVal)}</p>
              <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase"><span>Custos Fixos</span> <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalFixed)}</span></div>
                <div className="flex justify-between text-[10px] font-bold text-red-400 uppercase"><span>Perdas/Desperdício</span> <span>-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lossesVal)}</span></div>
              </div>
            </div>
          </div>
          <div className={`p-10 rounded-[45px] border-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 ${netProfit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
            <div>
              <h2 className="text-[10px] font-black uppercase text-gray-400">Lucro Líquido Real</h2>
              <p className={`text-5xl font-black ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(netProfit)}</p>
            </div>
            <div className={`px-6 py-2 rounded-full font-black text-xs uppercase ${netProfit >= 0 ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'}`}>
              Eficiência: {((netProfit / (revenue || 1)) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'breakeven' && (
        <div className="space-y-6 px-1 animate-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-900 p-10 rounded-[45px] text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><Scale size={120}/></div>
               <h3 className="text-[10px] font-black text-pink-400 uppercase tracking-[0.2em] mb-4">Ponto de Equilíbrio</h3>
               <p className="text-4xl font-black mb-2">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(breakEvenPoint)}</p>
               <p className="text-xs text-gray-400 font-medium">Este é o valor que você precisa vender no mês apenas para pagar todos os custos e empatar (zero a zero).</p>
               <div className="mt-8 flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center"><Calculator size={20}/></div>
                  <div>
                    <p className="text-[8px] font-black uppercase text-pink-300">Margem de Contribuição</p>
                    <p className="text-sm font-black">{(contributionMarginRatio * 100).toFixed(1)}%</p>
                  </div>
               </div>
            </div>

            <div className="bg-white p-10 rounded-[45px] border border-gray-100 shadow-sm flex flex-col justify-between">
               <div>
                 <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><Target size={16}/> Meta de Faturamento</h3>
                 <div className="flex justify-between items-end mb-2">
                    <p className="text-3xl font-black text-gray-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(revenue)}</p>
                    <p className="text-xs font-black text-gray-400 uppercase">da meta de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyGoal)}</p>
                 </div>
                 <div className="w-full h-4 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${goalProgress}%` }}></div>
                 </div>
                 <p className="text-[10px] font-black text-indigo-400 mt-4 uppercase tracking-widest">{goalProgress.toFixed(1)}% Concluído</p>
               </div>
               
               <div className="mt-8 p-6 bg-indigo-50 rounded-[30px] border border-indigo-100 flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm"><TrendingUp size={24}/></div>
                  <p className="text-xs font-bold text-indigo-800 leading-tight">Mantenha seu faturamento acima do Ponto de Equilíbrio para gerar lucro real!</p>
               </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'expenses' && (
        <div className="space-y-4 px-1">
          {monthExpensesList.length > 0 ? monthExpensesList.map(e => (
            <div key={e.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex justify-between items-center group">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${e.isFixed ? 'bg-indigo-50 text-indigo-500' : 'bg-pink-50 text-pink-500'}`}><Receipt size={20}/></div>
                <div><h4 className="font-black text-gray-800 text-sm">{e.description}</h4><p className="text-[8px] font-black text-gray-400 uppercase">{e.isFixed ? 'Custo Fixo' : 'Variável'}</p></div>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-black text-gray-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(e.value)}</p>
                <button onClick={() => setState(prev => ({ ...prev, expenses: prev.expenses.filter(ex => ex.id !== e.id) }))} className="p-2 text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
              </div>
            </div>
          )) : (
            <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[40px] text-gray-300 font-black italic">Nenhum gasto lançado este mês.</div>
          )}
        </div>
      )}

      {/* MODAL GASTO */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleAddExpense} className="bg-white w-full max-w-sm p-10 rounded-[45px] shadow-2xl animate-in zoom-in">
            <h2 className="text-xl font-black mb-6">Lançar Saída</h2>
            <div className="space-y-4">
              <input type="text" required placeholder="Ex: Energia / Aluguel" className="w-full p-5 bg-gray-50 rounded-2xl border-none font-bold" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} />
              <input type="number" required placeholder="Valor R$" className="w-full p-5 bg-gray-50 rounded-2xl border-none font-black text-xl" value={newExpense.value} onChange={e => setNewExpense({...newExpense, value: Number(e.target.value)})} />
              <label className="flex items-center gap-3 p-5 bg-gray-50 rounded-2xl cursor-pointer">
                <input type="checkbox" checked={newExpense.isFixed} onChange={e => setNewExpense({...newExpense, isFixed: e.target.checked})} className="w-6 h-6 accent-pink-500"/>
                <span className="text-[10px] font-black uppercase text-gray-500">Este é um custo fixo mensal</span>
              </label>
            </div>
            <div className="flex gap-4 mt-8">
              <button type="button" onClick={() => setShowAddExpense(false)} className="flex-1 py-4 text-gray-400 font-black text-xs uppercase">Sair</button>
              <button type="submit" className="flex-[2] py-5 bg-pink-500 text-white rounded-2xl font-black shadow-lg uppercase tracking-widest text-xs">Confirmar</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL PERDA */}
      {showAddLoss && (
        <div className="fixed inset-0 bg-red-950/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleAddLoss} className="bg-white w-full max-w-sm p-10 rounded-[45px] shadow-2xl animate-in zoom-in">
            <h2 className="text-xl font-black mb-6 text-red-500">Lançar Perda</h2>
            <div className="space-y-4">
              <select required className="w-full p-5 bg-gray-50 rounded-2xl border-none font-bold" value={newLoss.refId} onChange={e => setNewLoss({...newLoss, refId: e.target.value})}>
                <option value="">O que foi perdido?</option>
                {state.stock.map(s => <option key={s.id} value={s.id}>{s.name} (Insumo)</option>)}
                {state.products.map(p => <option key={p.id} value={p.id}>{p.name} (Doce)</option>)}
              </select>
              <input type="number" required placeholder="Quantidade" className="w-full p-5 bg-gray-50 rounded-2xl border-none font-black text-xl" value={newLoss.quantity} onChange={e => setNewLoss({...newLoss, quantity: Number(e.target.value)})} />
            </div>
            <div className="flex gap-4 mt-8">
              <button type="button" onClick={() => setShowAddLoss(false)} className="flex-1 py-4 text-gray-400 font-black text-xs uppercase">Sair</button>
              <button type="submit" className="flex-[2] py-5 bg-red-500 text-white rounded-2xl font-black shadow-lg uppercase tracking-widest text-xs">Registrar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default FinancialControl;
