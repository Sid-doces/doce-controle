
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  LayoutDashboard, ShoppingBasket, DollarSign, LogOut, Cake, User, Database, Loader2, Calendar
} from 'lucide-react';
import { AppState, UserSession } from './types';
import Dashboard from './components/Dashboard';
import ProductManagement from './components/ProductManagement';
import SalesRegistry from './components/SalesRegistry';
import StockControl from './components/StockControl';
import FinancialControl from './components/FinancialControl';
import Agenda from './components/Agenda';
import Login from './components/Login';
import Profile from './components/Profile';

// URL OFICIAL FORNECIDA PELO USUÁRIO
const BACKEND_URL = "https://script.google.com/macros/s/AKfycbw_4htn1h0AXBMbeCkitYuNQK4vOpj0l-yK2wRh7VrH-_SViPkg3CVbN2UO4UPVJCAW/exec";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'sales' | 'stock' | 'financial' | 'agenda' | 'profile'>('dashboard');
  const [state, setState] = useState<AppState | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'online' | 'syncing' | 'error'>('online');
  const syncTimer = useRef<any>(null);

  const fetchFromCloud = useCallback(async (companyId: string) => {
    try {
      setCloudStatus('syncing');
      const res = await fetch(`${BACKEND_URL}?action=sync&companyId=${companyId}`);
      const data = await res.json();
      if (data.success && data.state) {
        const cloudState = JSON.parse(data.state);
        setState(prev => {
          if (!prev) return cloudState;
          return { 
            ...cloudState, 
            user: prev.user // CRITICAL: Mantém a sessão e ROLE do usuário atual
          };
        });
      }
      setCloudStatus('online');
    } catch (e) {
      console.error("Erro Nuvem:", e);
      setCloudStatus('error');
    }
  }, []);

  const syncToCloud = useCallback(async (dataToSync: AppState) => {
    if (!dataToSync.user?.companyId) return;
    // Apenas Donos ou Sócios sincronizam estados globais para evitar conflitos de salvamento
    if (dataToSync.user.role !== 'Dono' && dataToSync.user.role !== 'Sócio') {
        // Colaboradores apenas salvam localmente por segurança, mas o mestre é quem sincroniza o estado global
        localStorage.setItem(`doce_state_${dataToSync.user.companyId}`, JSON.stringify(dataToSync));
        return;
    }
    
    try {
      setCloudStatus('syncing');
      localStorage.setItem(`doce_state_${dataToSync.user.companyId}`, JSON.stringify(dataToSync));
      
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'sync',
          companyId: dataToSync.user.companyId,
          state: JSON.stringify(dataToSync)
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setCloudStatus('online');
      } else {
        setCloudStatus('error');
      }
    } catch (e) {
      setCloudStatus('error');
    }
  }, []);

  useEffect(() => {
    const companyId = localStorage.getItem('doce_company_id');
    const email = localStorage.getItem('doce_email');

    if (companyId && email) {
      const session: UserSession = { 
        userId: localStorage.getItem('doce_user_id') || '',
        companyId, 
        email, 
        role: (localStorage.getItem('doce_role') as any) || 'Dono',
        name: localStorage.getItem('doce_name') || ''
      };
      
      const localData = localStorage.getItem(`doce_state_${companyId}`);
      if (localData) {
        setState({ ...JSON.parse(localData), user: session });
      } else {
        setState({
          user: session,
          products: [], stock: [], sales: [], orders: [],
          expenses: [], losses: [], collaborators: [], customers: [], productions: []
        });
      }
      fetchFromCloud(companyId);
    }
    setIsLoaded(true);
  }, [fetchFromCloud]);

  useEffect(() => {
    if (state && state.user?.companyId) {
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => syncToCloud(state), 3000);
    }
    return () => { if (syncTimer.current) clearTimeout(syncTimer.current); };
  }, [state, syncToCloud]);

  const handleLoginSuccess = (session: UserSession) => {
    setState({
      user: session,
      products: [], stock: [], sales: [], orders: [],
      expenses: [], losses: [], collaborators: [], customers: [], productions: []
    });
    fetchFromCloud(session.companyId);
    // Direciona para aba inicial permitida
    if (session.role === 'Vendedor') setActiveTab('sales');
    else setActiveTab('dashboard');
  };

  const handleLogout = () => {
    if (confirm("Sair do sistema? Seus dados estão salvos na nuvem.")) {
      localStorage.clear();
      setState(null);
      window.location.reload();
    }
  };

  if (!isLoaded) return <div className="h-screen flex items-center justify-center bg-pink-50"><Loader2 className="animate-spin text-pink-500" /></div>;
  if (!state || !state.user) return <Login onLoginSuccess={handleLoginSuccess} backendUrl={BACKEND_URL} />;

  // DEFINIÇÃO DE PERMISSÕES POR ROLE
  const allMenuItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard, roles: ['Dono', 'Sócio', 'Auxiliar'] },
    { id: 'sales', label: 'Vender', icon: ShoppingBasket, roles: ['Dono', 'Sócio', 'Vendedor'] },
    { id: 'products', label: 'Doces', icon: Cake, roles: ['Dono', 'Sócio', 'Auxiliar'] },
    { id: 'agenda', label: 'Agenda', icon: Calendar, roles: ['Dono', 'Sócio', 'Auxiliar'] },
    { id: 'stock', label: 'Estoque', icon: Database, roles: ['Dono', 'Sócio', 'Auxiliar'] },
    { id: 'financial', label: 'Grana', icon: DollarSign, roles: ['Dono', 'Sócio'] },
    { id: 'profile', label: 'Perfil', icon: User, roles: ['Dono', 'Sócio', 'Auxiliar', 'Vendedor'] },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(state.user!.role));

  return (
    <div className="h-full w-full flex flex-col md:flex-row bg-[#FFF9FB] safe-area-bottom">
      <aside className="hidden md:flex flex-col w-64 bg-white border-r p-6 shadow-sm z-20">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-2 bg-pink-500 rounded-xl text-white rotate-3 shadow-lg shadow-pink-100"><Cake size={24} /></div>
          <h1 className="font-black text-gray-800 text-xl tracking-tighter">DoceControle</h1>
        </div>
        <nav className="flex-1 space-y-1">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-pink-500 text-white shadow-lg' : 'text-gray-400 font-bold hover:bg-pink-50'}`}>
              <item.icon size={20} /> <span className="text-xs uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto border-t pt-4">
          <div className="mb-4 flex items-center justify-between px-2">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sincronia</span>
            <div className={`w-2 h-2 rounded-full ${cloudStatus === 'online' ? 'bg-emerald-500' : cloudStatus === 'syncing' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`}></div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-gray-400 hover:text-red-500 font-black text-[10px] uppercase tracking-widest p-2">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto app-main-view">
        <div className="max-w-6xl mx-auto p-4 md:p-8 pt-6">
          {activeTab === 'dashboard' && <Dashboard state={state} onNavigate={setActiveTab} />}
          {activeTab === 'sales' && <SalesRegistry state={state} setState={setState as any} />}
          {activeTab === 'products' && <ProductManagement state={state} setState={setState as any} />}
          {activeTab === 'agenda' && <Agenda state={state} setState={setState as any} />}
          {activeTab === 'stock' && <StockControl state={state} setState={setState as any} />}
          {activeTab === 'financial' && <FinancialControl state={state} setState={setState as any} />}
          {activeTab === 'profile' && <Profile state={state} setState={setState as any} daysRemaining={30} cloudStatus={cloudStatus} onSync={() => syncToCloud(state)} backendUrl={BACKEND_URL} onLogout={handleLogout} />}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-nav border-t border-gray-100 flex justify-around p-2 z-[100] pb-[calc(10px+var(--sab))]">
        {menuItems.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${activeTab === item.id ? 'text-pink-500' : 'text-gray-300'}`}>
            <item.icon size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
