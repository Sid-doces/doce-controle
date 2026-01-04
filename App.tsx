
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, ShoppingBasket, Calendar, DollarSign, LogOut, Cake, User, Database, Loader2
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

// --- BACKEND CENTRALIZADO DO MICRO SAAS ---
const MASTER_BACKEND_URL = "https://script.google.com/macros/s/AKfycbys4rGQn519bBVKBSNK5JvUJWC6S2mrYOWwFCJHgQuQ1JaF3gxQMb0PzgBQbz2uAgvG/exec";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'sales' | 'stock' | 'financial' | 'agenda' | 'profile'>('dashboard');
  const [view, setView] = useState<'login' | 'pricing' | 'app'>('login');
  const [state, setState] = useState<AppState | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'online' | 'syncing' | 'error'>('online');
  
  const syncTimer = useRef<any>(null);

  const pullData = useCallback(async (email: string) => {
    try {
      setCloudStatus('syncing');
      // O script central identifica o usuário pelo e-mail na URL
      const res = await fetch(`${MASTER_BACKEND_URL}?email=${email.toLowerCase().trim()}`, { redirect: 'follow' });
      const data = await res.json();
      setCloudStatus('online');
      return data;
    } catch (e) {
      setCloudStatus('error');
      return null;
    }
  }, []);

  const pushData = async (dataToPush: AppState) => {
    const email = dataToPush.user?.email;
    if (!email) return;

    try {
      setCloudStatus('syncing');
      await fetch(MASTER_BACKEND_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(), 
          state: JSON.stringify(dataToPush)
        })
      });
      setCloudStatus('online');
    } catch (e) {
      setCloudStatus('error');
    }
  };

  useEffect(() => {
    const lastUser = localStorage.getItem('doce_last_user');
    if (lastUser) {
      pullData(lastUser).then(data => {
        if (data && data.state) {
          const parsed = typeof data.state === 'string' ? JSON.parse(data.state) : data.state;
          setState(parsed);
          setView('app');
          if (parsed.user?.role === 'Vendedor') setActiveTab('sales');
        }
        setIsLoaded(true);
      });
    } else {
      setIsLoaded(true);
    }
  }, [pullData]);

  useEffect(() => {
    if (state && view === 'app') {
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => pushData(state), 1500);
    }
  }, [state, view]);

  const handleLogin = (userData: AppState) => {
    setState(userData);
    setView('app');
    if (userData.user?.role === 'Vendedor') setActiveTab('sales');
  };

  if (!isLoaded) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#FFF9FB] space-y-4">
      <Loader2 className="animate-spin text-pink-500" size={48} />
      <p className="font-black text-gray-400 text-[10px] uppercase tracking-widest">Acessando Nuvem Central...</p>
    </div>
  );

  return (
    <div className="h-full w-full flex flex-col md:flex-row bg-[#FFF9FB]">
      {view === 'login' ? (
        <Login onLogin={handleLogin} backendUrl={MASTER_BACKEND_URL} />
      ) : view === 'pricing' ? (
        <Pricing userEmail={state?.user?.email} onBack={() => setView('login')} onPlanActivated={() => window.location.reload()} />
      ) : (
        <>
          <aside className="hidden md:flex flex-col w-64 bg-white border-r p-6">
            <div className="flex items-center gap-3 mb-10">
              <div className="p-2 bg-pink-500 rounded-lg text-white shadow-lg shadow-pink-100"><Cake size={20} /></div>
              <h1 className="font-black text-gray-800 tracking-tight">Doce Controle</h1>
            </div>
            
            <nav className="flex-1 space-y-1">
              {[
                { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
                { id: 'sales', label: 'Vendas PDV', icon: ShoppingBasket },
                { id: 'products', label: 'Receitas', icon: Cake },
                { id: 'stock', label: 'Estoque', icon: Database },
                { id: 'financial', label: 'Financeiro', icon: DollarSign },
                { id: 'agenda', label: 'Agenda', icon: Calendar },
                { id: 'profile', label: 'Configurações', icon: User },
              ].filter(item => {
                if (state?.user?.role === 'Vendedor') return ['sales', 'profile'].includes(item.id);
                return true;
              }).map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all border-2 ${activeTab === item.id ? 'bg-pink-50 border-pink-100 text-pink-600 font-black' : 'bg-transparent border-transparent text-gray-400 font-bold'}`}>
                  <item.icon size={18} /> <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="mt-auto border-t pt-4">
              <div className="flex items-center justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">
                <span>Nuvem Ativa</span>
                <div className={`w-2 h-2 rounded-full ${cloudStatus === 'online' ? 'bg-emerald-500' : cloudStatus === 'syncing' ? 'bg-amber-500 animate-pulse' : 'bg-red-50'}`}></div>
              </div>
              <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="flex items-center gap-3 text-gray-400 hover:text-red-500 text-sm font-bold transition-colors">
                <LogOut size={18} /> Sair do App
              </button>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
            {state && (
              <>
                {activeTab === 'dashboard' && <Dashboard state={state} onNavigate={setActiveTab} />}
                {activeTab === 'products' && <ProductManagement state={state} setState={setState as any} />}
                {activeTab === 'sales' && <SalesRegistry state={state} setState={setState as any} />}
                {activeTab === 'stock' && <StockControl state={state} setState={setState as any} />}
                {activeTab === 'financial' && <FinancialControl state={state} setState={setState as any} />}
                {activeTab === 'agenda' && <Agenda state={state} setState={setState as any} />}
                {activeTab === 'profile' && <Profile state={state} setState={setState as any} daysRemaining={30} />}
              </>
            )}
          </main>

          <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-nav border-t flex justify-around p-3 z-50">
            {[{ id: 'sales', icon: ShoppingBasket }, { id: 'agenda', icon: Calendar }, { id: 'dashboard', icon: LayoutDashboard }, { id: 'profile', icon: User }].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`p-4 rounded-2xl ${activeTab === item.id ? 'text-pink-500 bg-pink-50' : 'text-gray-300'}`}>
                <item.icon size={26} />
              </button>
            ))}
          </nav>
        </>
      )}
    </div>
  );
};

export default App;
