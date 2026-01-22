
import React, { useState, useMemo } from 'react';
import { AppState, Expense, Loss, Sale } from '../types';
import { 
  Plus, Trash2, TrendingUp, X, Scale, Receipt, PackageX, CalendarDays, ArrowUpCircle, ArrowDownCircle, MinusCircle, Users, CheckCircle, Info, Calculator, Percent, BarChart3, Activity
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

  // Dados sanitizados
  const sales = state.sales || [];
  const expenses = state.expenses || [];
  const losses = state.losses || [];

  // Cálculos Mês Atual
  const monthSales = useMemo(() => sales.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }), [sales, currentMonth, currentYear]);

  const monthRevenue = monthSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
  const monthCogs = monthSales.reduce((acc, s) => acc + ((Number(s.costUnitary) || 0) * (Number(s.quantity) || 0)), 0);
  const monthCommissions = monthSales.reduce((acc, s) => acc + (Number(s.commissionValue) || 0), 0);
  
  const monthExpensesList = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const monthFixed = monthExpensesList.filter(e => e.isFixed).reduce((acc, e) => acc + (Number(e.value) || 0), 0);
  const monthVar = monthExpensesList.filter(e => !e.isFixed).reduce((acc, e) => acc + (Number(e.value) || 0), 0);
  const monthTotalLoss = losses.filter(l => {
    const d = new Date(l.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).reduce((acc, l) => acc + (Number(l.value) || 0), 0);

  const grossProfit = monthRevenue - (monthCogs + monthCommissions);
  const netProfit = grossProfit - (monthFixed + monthVar + monthTotalLoss);

  // Relatório Histórico
  const history = useMemo(() => {
    const map: Record<string, { rev: number, cost: number, profit: number, label: string }> = {};
    sales.forEach(s => {
      const d = new Date(s.date);
      const k = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!map[k]) map[k] = { rev: 0, cost: 0, profit: 0, label: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) };
      map[k].rev += Number(s.total) || 0;
      map[k].cost += ((Number(s.costUnitary) || 0) * (Number(s.quantity) || 0)) + (Number(s.commissionValue) || 0);
    });
    expenses.forEach(e => {
      const d = new Date(e.date);
      const k = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (map[k]) map[k].cost += Number(e.value) || 0;
    });
    return Object.entries(map).map(([k, v]) => ({ ...v, profit: v.rev - v.cost, key: k })).sort((a,b) => b.key.localeCompare(a.key));
  }, [sales, expenses, losses]);

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
      <header className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-2xl font-black text-pink-600">Financeiro 💰</h1>
          <p className="text-gray-400 text-sm font-medium">Controle de caixa e lucratividade.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddLoss(true)} className="p-4 bg-white text-red-500 rounded-2xl border border-red-100 shadow-sm hover:bg-red-50"><PackageX size={20}/></button>
          <button onClick={() => setShowAddExpense(true)} className="px-6 py-4 bg-pink-500 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-pink-100 flex items-center gap-2"><Plus size={16}/> Lançar Conta</button>
        </div>
      </header>

      <div className="flex bg-white p-1.5 rounded-[24px] border border-gray-100 shadow-sm w-fit overflow-x-auto no-scrollbar mx-1">
        {[
          { id: 'overview', label: 'Balanço', icon: BarChart3 },
          { id: 'reports', label: 'Mensal', icon: CalendarDays },
          { id: 'breakeven', label: 'Meta', icon: Scale },
          { id: 'expenses', label: 'Contas', icon: Receipt },
          { id: 'losses', label: 'Perdas', icon: PackageX },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveSubTab(t.id as any)} className={`flex items-center gap-2 px-6 py-3 rounded-[20px] text-[10px] font-black uppercase transition-all ${activeSubTab === t.id ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>
            <t.icon size={14}/> {t.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'overview' && (
        <div className="space-y-6 px-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[40px] border border-pink-100 shadow-sm">
              <h3 className="text-[10px] font-black text-pink-500 uppercase mb-4 flex items-center gap-2"><ArrowUpCircle size={16}/> Faturamento</h3>
              <p className="text-3xl font-black text-gray-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthRevenue)}</p>
              <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase"><span>Insumos</span> <span>-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthCogs)}</span></div>
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase"><span>Comissões</span> <span>-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthCommissions)}</span></div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-indigo-100 shadow-sm">
              <h3 className="text-[10px] font-black text-indigo-500 uppercase mb-4 flex items-center gap-2"><ArrowDownCircle size={16}/> Custos & Perdas</h3>
              <p className="text-3xl font-black text-gray-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthFixed + monthVar + monthTotalLoss)}</p>
              <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase"><span>Fixos</span> <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthFixed)}</span></div>
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase"><span>Desperdício</span> <span className="text-red-500">-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthTotalLoss)}</span></div>
              </div>
            </div>
          </div>
          <div className={`p-10 rounded-[45px] border-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 ${netProfit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
            <div>
              <h2 className="text-[10px] font-black uppercase text-gray-400">Resultado Líquido</h2>
              <p className={`text-5xl font-black ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(netProfit)}</p>
            </div>
            <div className={`px-6 py-2 rounded-full font-black text-xs uppercase ${netProfit >= 0 ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'}`}>
              Margem: {((netProfit / (monthRevenue || 1)) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'reports' && (
        <div className="space-y-4 px-1">
          {history.map(m => (
            <div key={m.key} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group">
              <div>
                <p className="font-black text-gray-800 text-sm capitalize">{m.label}</p>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Faturamento: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(m.rev)}</p>
              </div>
              <div className="text-right">
                <p className={`font-black text-lg ${m.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(m.profit)}</p>
                <p className="text-[8px] font-bold text-gray-400 uppercase">Lucro Líquido</p>
              </div>
            </div>
          ))}
          {history.length === 0 && <p className="py-20 text-center text-gray-300 italic font-black">Nenhum histórico disponível.</p>}
        </div>
      )}

      {activeSubTab === 'expenses' && (
        <div className="space-y-4 px-1">
          {monthExpensesList.map(e => (
            <div key={e.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${e.isFixed ? 'bg-indigo-50 text-indigo-500' : 'bg-pink-50 text-pink-500'}`}><Receipt size={20}/></div>
                <div><h4 className="font-black text-gray-800 text-sm">{e.description}</h4><p className="text-[8px] font-black text-gray-400 uppercase">{e.isFixed ? 'Custo Fixo' : 'Variável'}</p></div>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-black text-gray-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(e.value)}</p>
                <button onClick={() => setState(prev => ({ ...prev, expenses: prev.expenses.filter(ex => ex.id !== e.id) }))} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL GASTO */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleAddExpense} className="bg-white w-full max-w-sm p-10 rounded-[45px] shadow-2xl animate-in zoom-in">
            <h2 className="text-xl font-black mb-6">Lançar Conta</h2>
            <div className="space-y-4">
              <input type="text" required placeholder="Ex: Aluguel" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} />
              <input type="number" required placeholder="Valor R$" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-black text-xl" value={newExpense.value} onChange={e => setNewExpense({...newExpense, value: Number(e.target.value)})} />
              <label className="flex items-center gap-2 p-4 bg-gray-50 rounded-2xl cursor-pointer">
                <input type="checkbox" checked={newExpense.isFixed} onChange={e => setNewExpense({...newExpense, isFixed: e.target.checked})} className="w-5 h-5 accent-pink-500"/>
                <span className="text-[10px] font-black uppercase text-gray-500">Este é um custo fixo</span>
              </label>
            </div>
            <div className="flex gap-4 mt-8">
              <button type="button" onClick={() => setShowAddExpense(false)} className="flex-1 py-4 text-gray-400 font-black text-xs uppercase">Sair</button>
              <button type="submit" className="flex-[2] py-4 bg-pink-500 text-white rounded-2xl font-black shadow-lg">Salvar</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL PERDA */}
      {showAddLoss && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleAddLoss} className="bg-white w-full max-w-sm p-10 rounded-[45px] shadow-2xl animate-in zoom-in">
            <h2 className="text-xl font-black mb-6 text-red-500">Lançar Perda</h2>
            <div className="space-y-4">
              <select required className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" value={newLoss.refId} onChange={e => setNewLoss({...newLoss, refId: e.target.value})}>
                <option value="">O que foi perdido?</option>
                {state.stock.map(s => <option key={s.id} value={s.id}>{s.name} (Insumo)</option>)}
                {state.products.map(p => <option key={p.id} value={p.id}>{p.name} (Doce)</option>)}
              </select>
              <input type="number" required placeholder="Quantidade" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-black text-xl" value={newLoss.quantity} onChange={e => setNewLoss({...newLoss, quantity: Number(e.target.value)})} />
            </div>
            <div className="flex gap-4 mt-8">
              <button type="button" onClick={() => setShowAddLoss(false)} className="flex-1 py-4 text-gray-400 font-black text-xs uppercase">Sair</button>
              <button type="submit" className="flex-[2] py-4 bg-red-500 text-white rounded-2xl font-black shadow-lg">Registrar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default FinancialControl;
