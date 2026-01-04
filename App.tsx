
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, ShoppingBasket, Calendar, DollarSign, LogOut, Cake, User, Database, Loader2, Cloud, RefreshCw, ChefHat, AlertCircle, CheckCircle2
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
      const res = await fetch(`${MASTER_BACKEND_URL}?email=${email.toLowerCase().trim()}`, { 
        method: 'GET',
        redirect: 'follow' 
      });
      if (!res.ok) throw new Error("Erro de rede ao buscar dados");
      const data = await res.json();
      setCloudStatus('online');
      return data;
    } catch (e) {
      setCloudStatus('error');
      console.error("Erro ao puxar dados da nuvem:", e);
      return null;
    }
  }, []);

  const pushData = async (dataToPush: AppState) => {
    const email = dataToPush.user?.email;
    if (!email) return;

    try {
      setCloudStatus('syncing');
      // Backup local imediato antes de tentar a nuvem
      localStorage.setItem(`doce_backup_${email}`, JSON.stringify(dataToPush));
      
      const usersRegistry = localStorage.getItem('doce_users');
      
      // Google Apps Script doPost geralmente funciona melhor com no-cors para evitar preflight
      // mas não permite ler a resposta. Para fins de "Doce Controle", assumimos sucesso se não houver erro de rede.
      await fetch(MASTER_BACKEND_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(), 
          state: JSON.stringify(dataToPush),
          usersRegistry: usersRegistry 
        })
      });
      
      // Como estamos usando no-cors, aguardamos um pequeno delay para simular o tempo de resposta
      // e marcar como online, assumindo que o browser enviou o pacote.
      setTimeout(() => setCloudStatus('online'), 1000);
    } catch (e) {
      console.error("Erro ao sincronizar com a nuvem:", e);
      setCloudStatus('error');
    }
  };

  // Sincronização automática quando o estado muda
  useEffect(() => {
    if (state && view === 'app') {
      if (syncTimer.current) clearTimeout(syncTimer.current);
      // Aguarda 3 segundos de inatividade para sincronizar (debounce)
      syncTimer.current = setTimeout(() => pushData(state), 3000);
    }
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [state, view]);

  useEffect(() => {
    const lastUser = localStorage.getItem('doce_last_user');
    if (lastUser) {
      const backup = localStorage.getItem(`doce_backup_${lastUser}`);
      if (backup) {
        setState(JSON.parse(backup));
        setView('app');
      }

      pullData(lastUser).then(data => {
        if (data && data.success && data.state) {
          const parsed = typeof data.state === 'string' ? JSON.parse(data.state) : data.state;
          setState(parsed);
          setView('app');
          localStorage.setItem(`doce_backup_${lastUser}`, JSON.stringify(parsed));
        }
        setIsLoaded(true);
      });
    } else {
      setIsLoaded(true);
    }
  }, [pullData]);

  const handleLogin = (userData: AppState) => {
    setState(userData);
    setView('app');
    if (userData.user?.role === 'Vendedor') setActiveTab('sales');
  };

  if (!isLoaded && !state) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#FFF9FB] space-y-4">
      <div className="relative">
        <Loader2 className="animate-spin text-pink-500" size={60} />
        <Cake className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-pink-200" size={24} />
      </div>
      <p className="font-black text-gray-800 text-xs uppercase tracking-[0.3em] animate-pulse">Sincronizando sua Confeitaria...</p>
    </div>
  );

  const menuItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'sales', label: 'Vender (PDV)', icon: ShoppingBasket },
    { id: 'products', label: 'Meus Doces', icon: ChefHat },
    { id: 'stock', label: 'Insumos', icon: Database },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  return (
    <div className="h-full w-full flex flex-col md:flex-row bg-[#FFF9FB]">
      {view === 'login' ? (
        <Login onLogin={handleLogin} backendUrl={MASTER_BACKEND_URL} />
      ) : view === 'pricing' ? (
        <Pricing userEmail={state?.user?.email} onBack={() => setView('login')} onPlanActivated={() => window.location.reload()} />
      ) : (
        <>
          <aside className="hidden md:flex flex-col w-72 bg-white border-r p-6 shadow-sm z-20">
            <div className="flex items-center gap-3 mb-10 px-2">
              <div className="p-2.5 bg-pink-500 rounded-2xl text-white shadow-lg shadow-pink-100 rotate-3"><Cake size={24} /></div>
              <h1 className="font-black text-gray-800 tracking-tight text-xl leading-none">Doce<br/><span className="text-pink-500">Controle</span></h1>
            </div>
            
            <nav className="flex-1 space-y-1.5">
              {menuItems.filter(item => {
                if (state?.user?.role === 'Vendedor') return ['sales', 'profile'].includes(item.id);
                return true;
              }).map(item => (
                <button 
                  key={item.id} 
                  onClick={() => setActiveTab(item.id as any)} 
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all border-2 ${activeTab === item.id ? 'bg-pink-50 border-pink-100 text-pink-600 font-black shadow-sm' : 'bg-transparent border-transparent text-gray-400 font-bold hover:bg-gray-50'}`}
                >
                  <item.icon size={20} /> <span className="text-[13px] tracking-tight">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="mt-auto pt-6 border-t border-gray-50 space-y-4">
              <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className={`w-2 h-2 rounded-full ${cloudStatus === 'online' ? 'bg-emerald-500' : cloudStatus === 'syncing' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`}></div>
                   <span className="text-[10px] font-black text-gray-700 uppercase tracking-tighter">
                     {cloudStatus === 'online' ? 'Nuvem Conectada' : cloudStatus === 'syncing' ? 'Sincronizando...' : 'Erro de Conexão'}
                   </span>
                </div>
                <button 
                  onClick={() => state && pushData(state)} 
                  disabled={cloudStatus === 'syncing'}
                  className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
                  title="Sincronizar Agora"
                >
                  <RefreshCw size={14} className={`text-gray-400 ${cloudStatus === 'syncing' ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <button onClick={() => { if(confirm("Deseja realmente sair?")) { localStorage.removeItem('doce_last_user'); window.location.reload(); } }} className="w-full flex items-center justify-center gap-2 py-4 text-gray-400 hover:text-red-500 text-xs font-black uppercase tracking-widest transition-colors">
                <LogOut size={16} /> Sair do App
              </button>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto bg-[#FFF9FB] pb-32 md:pb-8">
            {state && (
              <div className="max-w-6xl mx-auto p-4 md:p-10 page-transition">
                {activeTab === 'dashboard' && <Dashboard state={state} onNavigate={setActiveTab} />}
                {activeTab === 'products' && <ProductManagement state={state} setState={setState as any} />}
                {activeTab === 'sales' && <SalesRegistry state={state} setState={setState as any} />}
                {activeTab === 'stock' && <StockControl state={state} setState={setState as any} />}
                {activeTab === 'financial' && <FinancialControl state={state} setState={setState as any} />}
                {activeTab === 'agenda' && <Agenda state={state} setState={setState as any} />}
                {activeTab === 'profile' && (
                  <Profile 
                    state={state} 
                    setState={setState as any} 
                    daysRemaining={30} 
                    onSync={() => pushData(state)}
                    cloudStatus={cloudStatus}
                  />
                )}
              </div>
            )}
          </main>

          <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-nav border-t border-gray-100 flex justify-around p-3 z-[100] safe-area-bottom">
            {[
              { id: 'sales', icon: ShoppingBasket, label: 'PDV' }, 
              { id: 'products', icon: ChefHat, label: 'Doces' }, 
              { id: 'dashboard', icon: LayoutDashboard, label: 'Início' },
              { id: 'profile', icon: User, label: 'Perfil' }
            ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${activeTab === item.id ? 'text-pink-500 bg-pink-50 shadow-inner' : 'text-gray-300'}`}>
                <item.icon size={22} />
                <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
          </nav>
        </>
      )}
    </div>
  );
};

export default App;
