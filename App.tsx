
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, ShoppingBasket, DollarSign, LogOut, Cake, User, Database, Loader2, RefreshCw, ChefHat
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

const MASTER_BACKEND_URL = "https://script.google.com/macros/s/AKfycbys4rGQn519bBVKBSNK5JvUJWC6S2mrYOWwFCJHgQuQ1JaF3gxQMb0PzgBQbz2uAgvG/exec";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'sales' | 'stock' | 'financial' | 'profile'>('dashboard');
  const [state, setState] = useState<AppState | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'online' | 'syncing' | 'error'>('online');
  
  const syncTimer = useRef<any>(null);

  // Inicialização e Verificação de Sessão (Regra 3)
  useEffect(() => {
    const userId = localStorage.getItem('doce_user_id');
    const companyId = localStorage.getItem('doce_company_id');
    const role = localStorage.getItem('doce_role') as any;
    const email = localStorage.getItem('doce_email');
    // Restoration of additional session fields
    const name = localStorage.getItem('doce_name') || undefined;
    const ownerEmail = localStorage.getItem('doce_owner_email') || undefined;
    const googleSheetUrl = localStorage.getItem('doce_gs_url') || undefined;

    if (userId && companyId && role && email) {
      const session: UserSession = { userId, companyId, role, email, name, ownerEmail, googleSheetUrl };
      
      // Carregar dados iniciais filtrados por companyId (Regra 4)
      const backup = localStorage.getItem(`doce_backup_${companyId}`);
      if (backup) {
        setState(JSON.parse(backup));
      } else {
        setState({
          user: session,
          products: [],
          stock: [],
          sales: [],
          orders: [],
          expenses: [],
          losses: [],
          collaborators: [],
          customers: [],
          productions: []
        });
      }
      // Tentar sincronizar com nuvem
      pullData(companyId);
    }
    setIsLoaded(true);
  }, []);

  const pullData = async (companyId: string) => {
    try {
      setCloudStatus('syncing');
      const res = await fetch(`${MASTER_BACKEND_URL}?companyId=${encodeURIComponent(companyId)}&action=sync`, { 
        method: 'GET',
        redirect: 'follow' 
      });
      const data = await res.json();
      if (data && data.success && data.state) {
        const parsed = typeof data.state === 'string' ? JSON.parse(data.state) : data.state;
        // Garantir que os dados puxados pertencem apenas a esta empresa (Filtro automático regra 4)
        setState(prev => ({ ...parsed, user: prev?.user || parsed.user }));
        localStorage.setItem(`doce_backup_${companyId}`, JSON.stringify(parsed));
      }
      setCloudStatus('online');
    } catch (e) {
      setCloudStatus('error');
    }
  };

  const pushData = async (dataToPush: AppState) => {
    const companyId = dataToPush.user?.companyId;
    if (!companyId) return;

    try {
      setCloudStatus('syncing');
      localStorage.setItem(`doce_backup_${companyId}`, JSON.stringify(dataToPush));
      
      await fetch(MASTER_BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors', 
        body: JSON.stringify({ 
          action: 'sync',
          companyId: companyId, 
          state: JSON.stringify(dataToPush)
        })
      });
      
      setTimeout(() => setCloudStatus('online'), 1000);
    } catch (e) {
      setCloudStatus('error');
    }
  };

  useEffect(() => {
    if (state && state.user) {
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => pushData(state), 3000);
    }
    return () => { if (syncTimer.current) clearTimeout(syncTimer.current); };
  }, [state]);

  const handleLoginSuccess = (session: UserSession) => {
    const initialState: AppState = {
      user: session,
      products: [],
      stock: [],
      sales: [],
      orders: [],
      expenses: [],
      losses: [],
      collaborators: [],
      customers: [],
      productions: []
    };
    setState(initialState);
    pullData(session.companyId);
  };

  const handleLogout = () => {
    if (confirm("Deseja encerrar a sessão? Seus dados estão salvos na nuvem.")) {
      localStorage.removeItem('doce_user_id');
      localStorage.removeItem('doce_company_id');
      localStorage.removeItem('doce_role');
      localStorage.removeItem('doce_email');
      // Cleanup of additional session fields from localStorage
      localStorage.removeItem('doce_name');
      localStorage.removeItem('doce_owner_email');
      localStorage.removeItem('doce_gs_url');
      setState(null);
      window.location.reload();
    }
  };

  if (!isLoaded) return (
    <div className="h-screen flex items-center justify-center bg-[#FFF9FB]">
      <Loader2 className="animate-spin text-pink-500" size={40} />
    </div>
  );

  if (!state || !state.user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Filtrar dados por segurança redundante (Regra 4)
  const filteredState: AppState = {
    ...state,
    products: state.products.filter(p => p.companyId === state.user?.companyId),
    stock: state.stock.filter(s => s.companyId === state.user?.companyId),
    sales: state.sales.filter(s => s.companyId === state.user?.companyId),
    orders: state.orders.filter(o => o.companyId === state.user?.companyId),
    expenses: state.expenses.filter(e => e.companyId === state.user?.companyId),
    losses: state.losses.filter(l => l.companyId === state.user?.companyId),
    customers: state.customers.filter(c => c.companyId === state.user?.companyId),
  };

  const menuItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'sales', label: 'Vender', icon: ShoppingBasket },
    { id: 'products', label: 'Doces', icon: ChefHat },
    { id: 'stock', label: 'Estoque', icon: Database },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  return (
    <div className="h-full w-full flex flex-col md:flex-row bg-[#FFF9FB]">
      <aside className="hidden md:flex flex-col w-72 bg-white border-r p-6 shadow-sm z-20">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="p-2 bg-pink-500 rounded-2xl text-white rotate-3"><Cake size={24} /></div>
          <h1 className="font-black text-gray-800 tracking-tight text-xl leading-none">Doce<br/><span className="text-pink-500">Controle</span></h1>
        </div>
        
        <nav className="flex-1 space-y-1">
          {menuItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id as any)} 
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-pink-50 text-pink-600 font-black shadow-sm' : 'text-gray-400 font-bold hover:bg-gray-50'}`}
            >
              <item.icon size={20} /> <span className="text-xs uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-50 space-y-4">
          <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">SaaS Online</span>
            <div className={`w-2 h-2 rounded-full ${cloudStatus === 'online' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-4 text-gray-400 hover:text-red-500 text-[10px] font-black uppercase tracking-widest transition-colors">
            <LogOut size={16} /> Encerrar Sessão
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[#FFF9FB] pb-32 md:pb-8 app-main-view">
        <div className="max-w-6xl mx-auto p-4 md:p-10 page-transition">
          {activeTab === 'dashboard' && <Dashboard state={filteredState} onNavigate={setActiveTab} />}
          {activeTab === 'products' && <ProductManagement state={filteredState} setState={setState as any} />}
          {activeTab === 'sales' && <SalesRegistry state={filteredState} setState={setState as any} />}
          {activeTab === 'stock' && <StockControl state={filteredState} setState={setState as any} />}
          {activeTab === 'financial' && <FinancialControl state={filteredState} setState={setState as any} />}
          {activeTab === 'profile' && <Profile state={filteredState} setState={setState as any} daysRemaining={30} onSync={() => pullData(state.user!.companyId)} cloudStatus={cloudStatus} />}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-nav border-t border-gray-100 flex justify-around p-2 z-[100] safe-area-bottom">
        {menuItems.slice(1).map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === item.id ? 'text-pink-500 bg-pink-50' : 'text-gray-300'}`}>
            <item.icon size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;