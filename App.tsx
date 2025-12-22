
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
  // Added Zap to resolve "Cannot find name 'Zap'" error on line 310
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

  const calculateDaysRemaining = (activationDate: string) => {
    if (!activationDate) return 0;
    const start = new Date(activationDate).getTime();
    const now = new Date().getTime();
    const diff = now - start;
    const daysPassed = Math.floor(diff / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - daysPassed);
  };

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
          if (userData) {
            setState(JSON.parse(userData));
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
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded || !state.user?.email) return;
    const userKey = `doce_data_${state.user.email.toLowerCase().trim()}`;
    localStorage.setItem(userKey, JSON.stringify(state));
    localStorage.setItem('doce_last_user', state.user.email);
  }, [state, isLoaded]);

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
        if (existingData) {
          setState(JSON.parse(existingData));
        } else {
          setState(newUserState);
        }
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

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#FFF9FB] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-100 border-t-pink-500 rounded-full animate-spin"></div>
      </div>
    );
  }

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
      case 'profile': return <Profile state={state} setState={setState} daysRemaining={daysRemaining} onShowInstall={() => setShowInstallGuide(true)} />;
      default: return <Dashboard state={state} onNavigate={setActiveTab} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'sales', label: 'Vender', icon: ShoppingBasket },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'products', label: 'Meus Doces', icon: UtensilsCrossed },
    { id: 'stock', label: 'Estoque', icon: Package },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'profile', label: 'Minha Conta', icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FFF9FB]">
      {/* Sidebar Desktop */}
      <nav className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 p-6 fixed h-full shadow-sm z-40">
        <div className="flex items-center gap-2 mb-10 px-2">
          <div className="p-2 bg-pink-50 rounded-xl shadow-lg shadow-pink-100">
            <Cake className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-black text-gray-800 tracking-tight">Doce Controle</h1>
        </div>

        <div className="space-y-1 flex-1 overflow-y-auto custom-scrollbar">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all border-2 ${
                activeTab === item.id 
                ? 'bg-pink-50 border-pink-200 text-pink-600 font-black shadow-sm' 
                : 'bg-transparent border-transparent text-gray-400 hover:text-gray-700 font-bold'
              }`}
            >
              <item.icon size={20} />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
          
          <button
            onClick={() => setShowInstallGuide(true)}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-indigo-50 border-2 border-indigo-100 text-indigo-600 font-black shadow-sm mt-4 hover:bg-indigo-100 transition-all"
          >
            <Smartphone size={20} />
            <span className="text-sm">Baixar App</span>
          </button>
        </div>

        <div className="mt-auto pt-6 border-t border-gray-50">
          <div className="px-4 py-4 mb-4 bg-gray-50 rounded-3xl border border-gray-100">
             <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Renovação</p>
                <Clock size={12} className="text-pink-400" />
             </div>
             <p className="text-sm font-black text-gray-700">{daysRemaining} dias</p>
             <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-pink-500 transition-all duration-1000" 
                  style={{ width: `${Math.min(100, (daysRemaining / 30) * 100)}%` }}
                ></div>
             </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-500 transition-colors font-bold text-sm"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </nav>

      {/* Header Mobile */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
           <Cake className="text-pink-500" size={24} />
           <div className="flex flex-col">
              <span className="font-black text-gray-800 text-sm leading-tight">{state.user?.email.split('@')[0]}</span>
              <span className="text-[10px] text-pink-400 font-black uppercase tracking-widest">{daysRemaining} dias ativos</span>
           </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowInstallGuide(true)} className="p-2 text-indigo-500 bg-indigo-50 rounded-lg"><Download size={20}/></button>
          <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500"><LogOut size={20}/></button>
        </div>
      </div>

      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* Nav Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around p-2 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] overflow-x-auto">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex flex-col items-center p-2 rounded-xl transition-all min-w-[60px] ${
              activeTab === item.id ? 'text-pink-500' : 'text-gray-300'
            }`}
          >
            <item.icon size={20} strokeWidth={activeTab === item.id ? 3 : 2} />
            <span className={`text-[9px] mt-1 font-black uppercase tracking-tighter ${activeTab === item.id ? 'text-gray-800' : 'text-gray-400'}`}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* MODAL GUIA DE INSTALAÇÃO (APK/PWA STYLE) */}
      {showInstallGuide && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md flex items-center justify-center z-[250] p-4">
          <div className="bg-white w-full max-w-sm rounded-[45px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 text-center bg-indigo-500 text-white relative">
              <button onClick={() => setShowInstallGuide(false)} className="absolute top-6 right-6 text-white/50 hover:text-white"><X size={24}/></button>
              <div className="w-20 h-20 bg-white/20 rounded-[30px] flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <Smartphone size={40} />
              </div>
              <h2 className="text-2xl font-black tracking-tight">Instalar no Celular</h2>
              <p className="text-indigo-100 text-xs font-bold mt-2">Tenha o Doce Controle sempre à mão!</p>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-black text-gray-400 shrink-0">1</div>
                  <div className="text-sm">
                    <p className="font-black text-gray-800">No Android (Chrome)</p>
                    <p className="text-gray-500 font-medium">Toque nos <span className="inline-block p-1 bg-gray-100 rounded text-gray-800"><MoreVertical size={12}/></span> 3 pontinhos e escolha <span className="text-indigo-500 font-black">"Instalar Aplicativo"</span>.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-black text-gray-400 shrink-0">2</div>
                  <div className="text-sm">
                    <p className="font-black text-gray-800">No iPhone (Safari)</p>
                    <p className="text-gray-500 font-medium">Toque no ícone <span className="inline-block p-1 bg-gray-100 rounded text-gray-800"><Share size={12}/></span> Compartilhar e escolha <span className="text-indigo-500 font-black">"Tela de Início"</span>.</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 items-start">
                <div className="text-amber-500 mt-1"><Zap size={16} fill="currentColor"/></div>
                <p className="text-[10px] text-amber-700 font-black leading-relaxed uppercase">Vantagem: O app abre muito mais rápido, ocupa quase nada de memória e não precisa de atualizações manuais!</p>
              </div>

              <button onClick={() => setShowInstallGuide(false)} className="w-full py-5 bg-indigo-500 text-white rounded-[28px] font-black shadow-xl shadow-indigo-100 hover:bg-indigo-600 transition-all uppercase tracking-widest text-xs">Entendi, vou instalar!</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
