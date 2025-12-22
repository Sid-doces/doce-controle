
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBasket, 
  Package, 
  Calendar, 
  DollarSign, 
  LogOut,
  Cake,
  UtensilsCrossed,
  Clock
} from 'lucide-react';
import { AppState } from './types';
import Dashboard from './components/Dashboard';
import ProductManagement from './components/ProductManagement';
import SalesRegistry from './components/SalesRegistry';
import StockControl from './components/StockControl';
import FinancialControl from './components/FinancialControl';
import Agenda from './components/Agenda';
import Login from './components/Login';
import Pricing from './components/Pricing';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'sales' | 'stock' | 'financial' | 'agenda'>('dashboard');
  const [view, setView] = useState<'login' | 'pricing' | 'app'>('login');
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  
  const emptyState: AppState = {
    user: null,
    products: [],
    stock: [],
    sales: [],
    orders: [],
    expenses: []
  };

  const [state, setState] = useState<AppState>(emptyState);

  // Calcula dias restantes (Recorrência de 30 dias)
  const calculateDaysRemaining = (activationDate: string) => {
    if (!activationDate) return 0;
    const start = new Date(activationDate).getTime();
    const now = new Date().getTime();
    const diff = now - start;
    const daysPassed = Math.floor(diff / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - daysPassed);
  };

  // 1. Carregar sessão inicial
  useEffect(() => {
    const lastUserEmail = localStorage.getItem('doce_last_user');
    if (lastUserEmail) {
      const users = JSON.parse(localStorage.getItem('doce_users') || '{}');
      const userRecord = users[lastUserEmail];
      
      if (userRecord && userRecord.plan && userRecord.plan !== 'none') {
        const remaining = calculateDaysRemaining(userRecord.activationDate);
        
        if (remaining <= 0) {
          // Bloqueia por vencimento
          setState({ ...emptyState, user: { email: lastUserEmail } });
          setView('pricing');
        } else {
          // Acesso liberado
          setDaysRemaining(remaining);
          const userData = localStorage.getItem(`doce_data_${lastUserEmail}`);
          setState(userData ? JSON.parse(userData) : { ...emptyState, user: { email: lastUserEmail } });
          setView('app');
        }
      } else if (userRecord) {
        // Logado mas sem plano (Primeiro Acesso)
        setState({ ...emptyState, user: { email: lastUserEmail } });
        setView('pricing');
      }
    }
  }, []);

  // 2. Persistência de dados
  useEffect(() => {
    if (state.user?.email && view === 'app') {
      localStorage.setItem(`doce_data_${state.user.email}`, JSON.stringify(state));
      localStorage.setItem('doce_last_user', state.user.email);
    }
  }, [state, view]);

  const handleLogin = (email: string, hasPlan: boolean) => {
    const formattedEmail = email.toLowerCase().trim();
    localStorage.setItem('doce_last_user', formattedEmail);
    
    const users = JSON.parse(localStorage.getItem('doce_users') || '{}');
    const userRecord = users[formattedEmail];

    // Atualiza estado do usuário na hora
    const newUserState = { ...emptyState, user: { email: formattedEmail } };
    
    if (hasPlan && userRecord) {
      const remaining = calculateDaysRemaining(userRecord.activationDate);
      if (remaining <= 0) {
        setState(newUserState);
        setView('pricing');
      } else {
        setDaysRemaining(remaining);
        const existingData = localStorage.getItem(`doce_data_${formattedEmail}`);
        setState(existingData ? JSON.parse(existingData) : newUserState);
        setView('app');
      }
    } else {
      setState(newUserState);
      setView('pricing');
    }
  };

  const handlePlanActivated = (days: number) => {
    setDaysRemaining(days);
    setView('app');
  };

  const handleLogout = () => {
    localStorage.removeItem('doce_last_user');
    setState(emptyState);
    setView('login');
  };

  // Itens de navegação
  const navItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'sales', label: 'Vender', icon: ShoppingBasket },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'products', label: 'Meus Doces', icon: UtensilsCrossed },
    { id: 'stock', label: 'Estoque', icon: Package },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
  ];

  if (view === 'pricing') {
    return (
      <Pricing 
        userEmail={state.user?.email} 
        onBack={() => setView('login')} 
        onPlanActivated={handlePlanActivated} 
      />
    );
  }

  if (view === 'login' || !state.user) {
    return <Login onLogin={handleLogin} onShowPricing={() => setView('pricing')} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard state={state} onNavigate={setActiveTab} />;
      case 'products': return <ProductManagement state={state} setState={setState} />;
      case 'sales': return <SalesRegistry state={state} setState={setState} />;
      case 'stock': return <StockControl state={state} setState={setState} />;
      case 'financial': return <FinancialControl state={state} setState={setState} />;
      case 'agenda': return <Agenda state={state} setState={setState} />;
      default: return <Dashboard state={state} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FFF9FB]">
      {/* Sidebar */}
      <nav className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 p-6 fixed h-full shadow-sm">
        <div className="flex items-center gap-2 mb-10">
          <div className="p-2 bg-pink-500 rounded-xl">
            <Cake className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-bold text-black">Doce Controle</h1>
        </div>

        <div className="space-y-2 flex-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all border-2 ${
                activeTab === item.id 
                ? 'bg-white border-pink-500 text-black font-black shadow-sm' 
                : 'bg-white border-transparent text-gray-600 hover:border-gray-100 hover:text-black font-medium'
              }`}
            >
              <item.icon size={20} className={activeTab === item.id ? 'text-pink-500' : 'text-gray-400'} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t border-gray-50">
          <div className="px-4 py-3 mb-4 bg-gray-50 rounded-2xl border border-gray-100">
             <div className="flex items-center justify-between mb-1">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Assinatura</p>
                <Clock size={12} className="text-pink-400" />
             </div>
             <p className="text-xs font-black text-black mb-1">{daysRemaining} dias restantes</p>
             <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-pink-500 transition-all duration-1000" 
                  style={{ width: `${Math.min(100, (daysRemaining / 30) * 100)}%` }}
                ></div>
             </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-500 transition-colors font-bold"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </nav>

      {/* Mobile Nav */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
           <Cake className="text-pink-500" size={24} />
           <div className="flex flex-col">
              <span className="font-bold text-black text-sm">{state.user.email.split('@')[0]}</span>
              <span className="text-[10px] text-pink-400 font-bold">{daysRemaining} dias restantes</span>
           </div>
        </div>
        <button onClick={handleLogout} className="text-gray-400"><LogOut size={20}/></button>
      </div>

      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto">
          {renderContent()}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around p-2 z-50 shadow-sm">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex flex-col items-center p-2 rounded-xl transition-all w-full ${
              activeTab === item.id ? 'text-black font-black' : 'text-gray-400 font-medium'
            }`}
          >
            <item.icon size={22} className={activeTab === item.id ? 'text-pink-500' : 'text-gray-400'} />
            <span className="text-[10px] mt-1">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
