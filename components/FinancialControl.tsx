
import React, { useState } from 'react';
import { AppState, Expense } from '../types';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, X } from 'lucide-react';

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
  const monthSales = state.sales.filter(s => new Date(s.date).getMonth() === currentMonth);
  
  // Total que entrou (Vendas)
  const monthRevenue = monthSales.reduce((acc, s) => acc + s.total, 0);
  
  // Gastos (Insumos vendidos + Despesas fixas/variáveis)
  const monthCogs = monthSales.reduce((acc, s) => acc + (s.costUnitary * s.quantity), 0);
  const monthExpenses = state.expenses.filter(e => new Date(e.date).getMonth() === currentMonth);
  const monthTotalExpenses = monthExpenses.reduce((acc, e) => acc + e.value, 0);
  
  const totalOut = monthCogs + monthTotalExpenses;
  const monthNetProfit = monthRevenue - totalOut;

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
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Financeiro</h1>
          <p className="text-gray-500 italic text-sm">Controle de entradas e saídas.</p>
        </div>
        <button 
          onClick={() => setShowAddExpense(true)}
          className="bg-white text-black border-2 border-red-100 font-black px-6 py-4 rounded-2xl flex items-center gap-2 shadow-lg shadow-red-50 active:scale-95 transition-all"
        >
          <Plus size={20} className="text-red-500" /> Registrar Gasto
        </button>
      </header>

      {/* Cards de Resumo - Linguagem Simples */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-[30px] border border-emerald-100 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-500 mb-2 font-black text-[10px] uppercase tracking-widest">
            <TrendingUp size={14} /> Total que Entrou
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthRevenue)}
          </div>
          <p className="text-[10px] text-gray-400 mt-1 font-bold">ESTE MÊS</p>
        </div>

        <div className="bg-white p-6 rounded-[30px] border border-red-100 shadow-sm">
          <div className="flex items-center gap-2 text-red-500 mb-2 font-black text-[10px] uppercase tracking-widest">
            <TrendingDown size={14} /> Total de Gastos
          </div>
          <div className="text-2xl font-black text-red-600">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalOut)}
          </div>
          <p className="text-[10px] text-gray-400 mt-1 font-bold">INSUMOS + DESPESAS</p>
        </div>

        <div className="bg-pink-500 p-6 rounded-[30px] shadow-xl shadow-pink-100 text-white">
          <div className="flex items-center gap-2 mb-2 font-black text-[10px] uppercase tracking-widest opacity-80">
            <Wallet size={14} /> Este mês sobrou
          </div>
          <div className="text-3xl font-black">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthNetProfit)}
          </div>
          <p className="text-[10px] mt-1 font-bold">LUCRO LIMPO NO CAIXA</p>
        </div>
      </div>

      {/* Lista de Gastos Manual */}
      <section className="bg-white p-6 rounded-[35px] border border-gray-100 shadow-sm">
        <h2 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
           Outros Gastos <span className="text-xs font-normal text-gray-400">(Luz, Aluguel, Embalagens extra...)</span>
        </h2>
        
        <div className="space-y-3">
          {state.expenses.length === 0 && (
            <div className="text-center py-10 text-gray-400 italic font-medium">
              Nenhum gasto extra registrado este mês.
            </div>
          )}
          {state.expenses.map(expense => (
            <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all group">
              <div>
                <div className="font-bold text-gray-800 text-sm">{expense.description}</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase">{new Date(expense.date).toLocaleDateString()}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-black text-red-500">
                  -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense.value)}
                </span>
                <button 
                  onClick={() => removeExpense(expense.id)} 
                  className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal de Cadastro Simples */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <form 
            onSubmit={handleAddExpense} 
            className="bg-white w-full max-w-lg p-8 rounded-[40px] shadow-2xl animate-in zoom-in duration-200"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-black">O que você pagou?</h2>
              <button type="button" onClick={() => setShowAddExpense(false)} className="text-gray-400 hover:text-black transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="text-gray-500 font-bold text-xs uppercase ml-1">Descrição do Gasto</span>
                <input 
                  type="text" required autoFocus
                  className="w-full mt-1 px-5 py-4 rounded-2xl border-2 border-gray-50 bg-white focus:bg-white focus:border-pink-200 text-black font-bold outline-none transition-all" 
                  placeholder="Ex: Conta de Luz, Aluguel..."
                  value={newExpense.description} 
                  onChange={e => setNewExpense({...newExpense, description: e.target.value})} 
                />
              </label>

              <label className="block">
                <span className="text-gray-500 font-bold text-xs uppercase ml-1">Valor (R$)</span>
                <input 
                  type="number" step="any" inputMode="decimal" required 
                  className="w-full mt-1 px-5 py-4 rounded-2xl border-2 border-gray-50 bg-white focus:bg-white focus:border-pink-200 text-black font-black text-2xl outline-none transition-all" 
                  value={newExpense.value ?? ''} 
                  placeholder="0,00" 
                  onChange={e => setNewExpense({...newExpense, value: e.target.value === '' ? undefined : Number(e.target.value)})} 
                />
              </label>
            </div>

            <div className="flex gap-4 mt-10">
              <button 
                type="button" 
                onClick={() => setShowAddExpense(false)} 
                className="flex-1 py-4 text-gray-400 font-black hover:text-black transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="flex-[2] py-4 bg-white text-black border-2 border-gray-100 rounded-3xl font-black text-lg shadow-lg hover:bg-gray-50 active:scale-95 transition-all"
              >
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
