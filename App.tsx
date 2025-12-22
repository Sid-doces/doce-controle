
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
  Clock,
  User,
  Smartphone,
  Download,
  X,
  Share,
  MoreVertical,
  Zap
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
    collaborators: []
  };

  const [state, setState] = useState<AppState>(emptyState);

  useEffect(() => {
    const lastUserEmail = localStorage.getItem('doce_last_user');
    if (lastUserEmail) {
      const users = JSON.parse(localStorage.getItem('doce_users') || '{}');
      const userRecord = users[lastUserEmail];
      if (userRecord) {
        const remaining = calculateDaysRemaining(userRecord.activationDate);
        const userDataKey = `doce_data_${lastUserEmail.toLowerCase().trim()}`;
        const userData = localStorage.getItem(userDataKey);
        if (userRecord.plan && userRecord.plan !== 'none' && remaining > 0) {
          setDaysRemaining(remaining);
          if (userData) setState(JSON.parse(userData));
          else setState({ ...emptyState, user: { email: lastUserEmail } });
          setView('app');
        } else {
          setState({ ...emptyState, user: { email: lastUserEmail } });
          setView('pricing');
        }
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded || !state.user?.email) return;
    const userKey = `doce_data_${state.user.email.toLowerCase().trim()}`;
    localStorage.setItem(userKey, JSON.stringify(state));
    localStorage.setItem('doce_last_user', state.user.email);
  }, [state, isLoaded]);

  const calculateDaysRemaining = (activationDate: string) => {
    if (!activationDate) return 0;
    const start = new Date(activationDate).getTime();
    const now = new Date().getTime();
    const daysPassed = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - daysPassed);
  };

  const handleLogin = (email: string, hasPlan: boolean) => {
    const formattedEmail = email.toLowerCase().trim();
    localStorage.setItem('doce_last_user', formattedEmail);
    const users = JSON.parse(localStorage.getItem('doce_users') || '{}');
    const userRecord = users[formattedEmail];
    const newUserState = { ...emptyState, user: { email: formattedEmail } };
    
    if (hasPlan && userRecord) {
      const remaining = calculateDaysRemaining(userRecord.activationDate);
      if (remaining <= 0) {
        setState(newUserState);
        setView('pricing');
      } else {
        setDaysRemaining(remaining);
        const userDataKey = `doce_data_${formattedEmail}`;
        const existingData = localStorage.getItem(userDataKey);
        if (existingData) setState(JSON.parse(existingData));
        else setState(newUserState);
        setView('app');
      }
    } else {
      setState(newUserState);
      setView('pricing');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('doce_last_user');
    setState(emptyState);
    setView('login');
  };

  if (!isLoaded) return (
    <div className="h-screen bg-[#FFF9FB] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-pink-100 border-t-pink-500 rounded-full animate-spin"></div>
    </div>
  );

  if (view === 'pricing') return <Pricing userEmail={state.user?.email} onBack={() => setView('login')} onPlanActivated={(d) => { setDaysRemaining(d); setView('app'); }} />;
  if (view === 'login' || !state.user) return <Login onLogin={handleLogin} onShowPricing={() => setView('pricing')} />;

  const navItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'sales', label: 'Vender', icon: ShoppingBasket },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'products', label: 'Doces', icon: UtensilsCrossed },
    { id: 'stock', label: 'Estoque', icon: Package },
    { id: 'financial', label: 'Finanças', icon: DollarSign },
    { id: 'profile', label: 'Conta', icon: User },
  ];

  return (
    <div className="h-screen flex flex-col md:flex-row bg-[#FFF9FB] overflow-hidden select-none">
      {/* SIDEBAR DESKTOP - FIXA */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 p-6 h-full shrink-0 z-40">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="p-2 bg-pink-500 rounded-xl shadow-lg shadow-pink-100">
            <Cake className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-black text-gray-800 tracking-tight">Doce Controle</h1>
        </div>

        <nav className="space-y-1 flex-1 overflow-y-auto custom-scrollbar pr-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all border-2 active:scale-95 ${
                activeTab === item.id 
                ? 'bg-pink-50 border-pink-200 text-pink-600 font-black shadow-sm' 
                : 'bg-transparent border-transparent text-gray-400 hover:text-gray-700 font-bold'
              }`}
            >
              <item.icon size={20} />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
          <button onClick={() => setShowInstallGuide(true)} className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-indigo-50 border-2 border-indigo-100 text-indigo-600 font-black shadow-sm mt-4 hover:bg-indigo-100 transition-all active:scale-95">
            <Smartphone size={20} /> <span className="text-sm text-left">Versão Mobile</span>
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-50 shrink-0">
          <div className="px-4 py-4 mb-4 bg-gray-50 rounded-3xl border border-gray-100">
             <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ativo por</p>
                <Clock size={12} className="text-pink-400" />
             </div>
             <p className="text-sm font-black text-gray-700">{daysRemaining} dias</p>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-500 transition-colors font-bold text-sm active:scale-95">
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>

      {/* HEADER MOBILE - FIXO */}
      <header className="md:hidden flex items-center justify-between px-4 h-16 bg-white border-b border-gray-100 sticky top-0 z-50 shrink-0">
        <div className="flex items-center gap-2">
           <Cake className="text-pink-500" size={22} />
           <span className="font-black text-gray-800 text-sm tracking-tight">Doce Controle</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowInstallGuide(true)} className="p-2.5 text-indigo-500 bg-indigo-50 rounded-xl active:scale-90"><Download size={18}/></button>
          <button onClick={handleLogout} className="p-2.5 text-gray-300 active:scale-90"><LogOut size={18}/></button>
        </div>
      </header>

      {/* ÁREA DE CONTEÚDO - ÚNICA COM SCROLL */}
      <main className="flex-1 relative overflow-hidden h-full flex flex-col">
        <div className="flex-1 overflow-y-auto custom-scrollbar app-scroll-area">
          <div className="max-w-5xl mx-auto p-4 md:p-8 pb-32 md:pb-12 tab-content-enter">
            {activeTab === 'dashboard' && <Dashboard state={state} onNavigate={setActiveTab} />}
            {activeTab === 'products' && <ProductManagement state={state} setState={setState} />}
            {activeTab === 'sales' && <SalesRegistry state={state} setState={setState} />}
            {activeTab === 'stock' && <StockControl state={state} setState={setState} />}
            {activeTab === 'financial' && <FinancialControl state={state} setState={setState} />}
            {activeTab === 'agenda' && <Agenda state={state} setState={setState} />}
            {activeTab === 'profile' && <Profile state={state} setState={setState} daysRemaining={daysRemaining} onShowInstall={() => setShowInstallGuide(true)} />}
          </div>
        </div>

        {/* NAV MOBILE - FIXA NO RODAPÉ */}
        <nav className="md:hidden bg-white/90 backdrop-blur-xl border-t border-gray-100 flex justify-around items-center px-2 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] h-20 shrink-0 pb-safe">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all min-w-[48px] active:scale-90 ${
                activeTab === item.id ? 'text-pink-500' : 'text-gray-300'
              }`}
            >
              <item.icon size={22} strokeWidth={activeTab === item.id ? 3 : 2} />
              <span className={`text-[8px] mt-1 font-black uppercase tracking-tight ${activeTab === item.id ? 'text-gray-800' : 'text-gray-400'}`}>{item.label}</span>
            </button>
          ))}
        </nav>
      </main>

      {/* MODAL DE INSTALAÇÃO */}
      {showInstallGuide && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md flex items-center justify-center z-[500] p-4">
          <div className="bg-white w-full max-w-sm rounded-[45px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 text-center bg-indigo-500 text-white relative">
              <button onClick={() => setShowInstallGuide(false)} className="absolute top-6 right-6 text-white/50 hover:text-white active:scale-90"><X size={24}/></button>
              <div className="w-16 h-16 bg-white/20 rounded-[28px] flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <Smartphone size={32} />
              </div>
              <h2 className="text-xl font-black tracking-tight">App no Celular</h2>
              <p className="text-indigo-100 text-[10px] font-bold mt-1 uppercase tracking-widest">Atalho na sua tela inicial</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-5">
                <div className="flex gap-4 items-start">
                  <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center font-black text-xs text-indigo-500 shrink-0">1</div>
                  <p className="text-xs text-gray-500 font-bold leading-relaxed">No <span className="text-gray-800 font-black">Android</span>, abra no Chrome, toque nos 3 pontinhos e escolha "Instalar Aplicativo".</p>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center font-black text-xs text-indigo-500 shrink-0">2</div>
                  <p className="text-xs text-gray-500 font-bold leading-relaxed">No <span className="text-gray-800 font-black">iPhone</span>, abra no Safari, toque em "Compartilhar" e "Adicionar à Tela de Início".</p>
                </div>
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 items-center">
                <Zap size={16} className="text-amber-500 shrink-0" fill="currentColor"/>
                <p className="text-[9px] text-amber-700 font-black uppercase leading-tight">Vantagem: Acesso instantâneo sem precisar digitar o endereço do site!</p>
              </div>
              <button onClick={() => setShowInstallGuide(false)} className="w-full py-5 bg-indigo-500 text-white rounded-[28px] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95">Entendido!</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
