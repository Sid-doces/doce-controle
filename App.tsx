
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
  User,
  Smartphone,
  Download,
  X
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
import Profile from './components/Profile';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'sales' | 'stock' | 'financial' | 'agenda' | 'profile'>('dashboard');
  const [view, setView] = useState<'login' | 'pricing' | 'app'>('login');
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  
  const emptyState: AppState = {
    user: null,
    products: [],
    stock: [],
    sales: [],
    orders: [],
    expenses: [],
    collaborators: [],
    customers: [],
    productions: []
  };

  const [state, setState] = useState<AppState>(emptyState);

  const migrateData = (oldData: any, email: string): AppState => {
    try {
      const parsed = typeof oldData === 'string' ? JSON.parse(oldData) : oldData;
      return {
        ...emptyState,
        ...parsed,
        user: { email: email.toLowerCase().trim() },
        products: Array.isArray(parsed.products) ? parsed.products : [],
        stock: Array.isArray(parsed.stock) ? parsed.stock : [],
        sales: Array.isArray(parsed.sales) ? parsed.sales : [],
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
        collaborators: Array.isArray(parsed.collaborators) ? parsed.collaborators : [],
        customers: Array.isArray(parsed.customers) ? parsed.customers : [],
        productions: Array.isArray(parsed.productions) ? parsed.productions : []
      };
    } catch (e) {
      console.error("Erro na migração de dados:", e);
      return { ...emptyState, user: { email } };
    }
  };

  useEffect(() => {
    try {
      const lastUserEmail = localStorage.getItem('doce_last_user');
      if (lastUserEmail) {
        const users = JSON.parse(localStorage.getItem('doce_users') || '{}');
        const userRecord = users[lastUserEmail.toLowerCase().trim()];
        
        if (userRecord) {
          const remaining = calculateDaysRemaining(userRecord.activationDate);
          const userDataKey = `doce_data_${lastUserEmail.toLowerCase().trim()}`;
          const rawUserData = localStorage.getItem(userDataKey);
          
          if (userRecord.plan && userRecord.plan !== 'none' && remaining > 0) {
            setDaysRemaining(remaining);
            if (rawUserData) {
              setState(migrateData(rawUserData, lastUserEmail));
            } else {
              setState({ ...emptyState, user: { email: lastUserEmail } });
            }
            setView('app');
          } else {
            setState({ ...emptyState, user: { email: lastUserEmail } });
            setView('pricing');
          }
        }
      }
    } catch (e) {
      console.error("Erro crítico no carregamento inicial:", e);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded || !state.user?.email) return;
    const userKey = `doce_data_${state.user.email.toLowerCase().trim()}`;
    localStorage.setItem(userKey, JSON.stringify(state));
    localStorage.setItem('doce_last_user', state.user.email.toLowerCase().trim());
  }, [state, isLoaded]);

  const calculateDaysRemaining = (activationDate: string) => {
    if (!activationDate) return 0;
    const start = new Date(activationDate).getTime();
    const now = new Date().getTime();
    return Math.max(0, 30 - Math.floor((now - start) / (1000 * 60 * 60 * 24)));
  };

  const handleLogin = (email: string, hasPlan: boolean) => {
    const formattedEmail = email.toLowerCase().trim();
    localStorage.setItem('doce_last_user', formattedEmail);
    const users = JSON.parse(localStorage.getItem('doce_users') || '{}');
    const userRecord = users[formattedEmail];
    
    if (hasPlan && userRecord) {
      const remaining = calculateDaysRemaining(userRecord.activationDate);
      if (remaining <= 0) {
        setState({ ...emptyState, user: { email: formattedEmail } });
        setView('pricing');
      } else {
        setDaysRemaining(remaining);
        const userDataKey = `doce_data_${formattedEmail}`;
        const existingData = localStorage.getItem(userDataKey);
        
        if (existingData) {
          setState(migrateData(existingData, formattedEmail));
        } else {
          setState({ ...emptyState, user: { email: formattedEmail } });
        }
        setView('app');
      }
    } else {
      setState({ ...emptyState, user: { email: formattedEmail } });
      setView('pricing');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('doce_last_user');
    setState(emptyState);
    setView('login');
  };

  if (!isLoaded) return <div className="h-full w-full bg-[#FFF9FB] flex items-center justify-center"><div className="w-10 h-10 border-4 border-pink-100 border-t-pink-500 rounded-full animate-spin"></div></div>;
  if (view === 'pricing') return <Pricing userEmail={state.user?.email} onBack={() => setView('login')} onPlanActivated={(d) => { setDaysRemaining(d); setView('app'); }} />;
  if (view === 'login' || !state.user) return <Login onLogin={handleLogin} onShowPricing={() => setView('pricing')} />;

  const navItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'sales', label: 'Vendas', icon: ShoppingBasket },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'products', label: 'Produtos', icon: UtensilsCrossed },
    { id: 'stock', label: 'Estoque', icon: Package },
    { id: 'financial', label: 'Finanças', icon: DollarSign },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  return (
    <div className="h-full w-full flex flex-col md:flex-row overflow-hidden bg-[#FFF9FB]">
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 h-full shrink-0 z-40 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-pink-500 rounded-xl shadow-lg shadow-pink-100">
            <Cake className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-black text-gray-800 tracking-tight">Doce Controle</h1>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all border-2 ${
                activeTab === item.id 
                ? 'bg-pink-50 border-pink-100 text-pink-600 font-black shadow-sm' 
                : 'bg-transparent border-transparent text-gray-400 hover:text-gray-600 font-bold'
              }`}
            >
              <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-gray-50">
          <div className="p-4 bg-gray-50 rounded-2xl mb-4">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status do Plano</p>
             <p className="text-sm font-black text-gray-700">{daysRemaining} dias ativos</p>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-red-500 transition-colors font-bold text-sm">
            <LogOut size={18} /> Sair da conta
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full w-full relative overflow-hidden">
        <header className="md:hidden flex items-center justify-between px-5 h-16 bg-white border-b border-gray-100 z-50 shrink-0">
          <div className="flex items-center gap-2">
             <Cake className="text-pink-500" size={22} strokeWidth={2.5} />
             <span className="font-black text-gray-800 text-sm tracking-tight">Doce Controle</span>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setShowInstallGuide(true)} className="w-9 h-9 flex items-center justify-center bg-indigo-50 text-indigo-500 rounded-xl active:scale-90 transition-transform"><Download size={18}/></button>
             <button onClick={handleLogout} className="w-9 h-9 flex items-center justify-center text-gray-300"><LogOut size={18}/></button>
          </div>
        </header>

        <main className="app-main-view custom-scrollbar w-full">
          <div className="max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in duration-300">
            {activeTab === 'dashboard' && <Dashboard state={state} onNavigate={setActiveTab} />}
            {activeTab === 'products' && <ProductManagement state={state} setState={setState} />}
            {activeTab === 'sales' && <SalesRegistry state={state} setState={setState} />}
            {activeTab === 'stock' && <StockControl state={state} setState={setState} />}
            {activeTab === 'financial' && <FinancialControl state={state} setState={setState} />}
            {activeTab === 'agenda' && <Agenda state={state} setState={setState} />}
            {activeTab === 'profile' && <Profile state={state} setState={setState} daysRemaining={daysRemaining} onShowInstall={() => setShowInstallGuide(true)} />}
          </div>
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-nav border-t border-gray-100 px-2 h-[85px] z-[100] flex justify-around items-center shadow-[0_-8px_25px_rgba(0,0,0,0.03)] pb-safe">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all min-w-[55px] ${
                activeTab === item.id ? 'text-pink-500 scale-110' : 'text-gray-300'
              }`}
            >
              <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              <span className={`text-[9px] mt-1 font-black uppercase tracking-tight ${activeTab === item.id ? 'text-gray-800' : 'text-gray-400'}`}>
                {item.id === 'dashboard' ? 'Início' : item.label.split(' ')[0]}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {showInstallGuide && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md flex items-center justify-center z-[200] p-4">
          <div className="bg-white w-full max-w-sm rounded-[45px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 text-center bg-indigo-500 text-white relative">
              <button onClick={() => setShowInstallGuide(false)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"><X size={24}/></button>
              <div className="w-16 h-16 bg-white/20 rounded-[24px] flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <Smartphone size={32} />
              </div>
              <h2 className="text-xl font-black tracking-tight">App no Celular</h2>
              <p className="text-indigo-100 text-[10px] font-bold mt-1 uppercase tracking-widest">Sua cozinha sempre com você</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center font-black text-xs text-indigo-500 shrink-0">1</div>
                  <p className="text-xs text-gray-500 font-bold leading-relaxed">No <span className="text-gray-800 font-black">Android</span>: Toque nos 3 pontos e selecione "Instalar Aplicativo".</p>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center font-black text-xs text-indigo-500 shrink-0">2</div>
                  <p className="text-xs text-gray-500 font-bold leading-relaxed">No <span className="text-gray-800 font-black">iPhone</span>: Toque no ícone de compartilhar e selecione "Adicionar à Tela de Início".</p>
                </div>
              </div>
              <button onClick={() => setShowInstallGuide(false)} className="w-full py-5 bg-indigo-500 text-white rounded-[28px] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all">Tudo certo!</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
