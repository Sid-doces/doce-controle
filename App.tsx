
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  X,
  Lock,
  Database,
  CloudLightning,
  RefreshCw
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
  const [dbStatus, setDbStatus] = useState<'syncing' | 'synced' | 'cloud' | 'error'>('syncing');
  
  const emptyState: AppState = {
    user: null,
    settings: {
      commissionRate: 0
    },
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
  const isInitialLoad = useRef(true);

  const norm = (email: string) => email.toLowerCase().trim();

  // Função central de sincronização (PUSH)
  const syncToCloud = async (appState: AppState) => {
    const url = appState.user?.googleSheetUrl;
    const ownerEmail = appState.user?.ownerEmail || appState.user?.email;
    if (!url || !url.startsWith('http') || !ownerEmail) return;

    try {
      setDbStatus('syncing');
      const usersRegistry = localStorage.getItem('doce_users') || '{}';
      
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: norm(ownerEmail), 
          state: JSON.stringify(appState),
          usersRegistry: usersRegistry,
          timestamp: new Date().toISOString()
        })
      });
      setDbStatus('cloud');
    } catch (e) {
      console.error("Erro na sincronização Cloud:", e);
      setDbStatus('error');
    }
  };

  const migrateData = useCallback((rawData: any, userEmail: string, role: any, ownerEmail?: string, googleSheetUrl?: string): AppState => {
    try {
      const parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      return {
        ...emptyState,
        ...parsed,
        user: { 
          email: norm(userEmail),
          role: role || 'Dono',
          ownerEmail: norm(ownerEmail || userEmail),
          googleSheetUrl: googleSheetUrl || parsed.user?.googleSheetUrl
        },
        settings: { 
          commissionRate: parsed.settings?.commissionRate ?? (parsed.commissionRate || 0) 
        },
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
      return { ...emptyState, user: { email: norm(userEmail), role: role || 'Dono', googleSheetUrl } };
    }
  }, []);

  const calculateDaysRemaining = (activationDate: string) => {
    if (!activationDate) return 0;
    const start = new Date(activationDate).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - diff);
  };

  // DETECÇÃO DE CONVITE MÁGICO
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteBase64 = params.get('invite');
    
    if (inviteBase64) {
      try {
        const inviteUrl = atob(inviteBase64);
        if (inviteUrl.startsWith('http')) {
          // Salva a URL da planilha no banco local ANTES de qualquer coisa
          localStorage.setItem('doce_temp_cloud_url', inviteUrl);
          
          // Tenta baixar o registro de usuários dessa planilha imediatamente
          fetch(inviteUrl)
            .then(res => res.json())
            .then(data => {
              if (data.usersRegistry) {
                localStorage.setItem('doce_users', JSON.stringify(data.usersRegistry));
                // Remove o parâmetro da URL para limpar a barra de endereço
                window.history.replaceState({}, document.title, window.location.pathname);
                alert("Confeitaria Vinculada! Agora é só entrar com seu e-mail e senha.");
              }
            })
            .catch(e => console.error("Erro ao processar convite:", e));
        }
      } catch (e) { console.error("Link de convite inválido."); }
    }
  }, []);

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        const lastUserEmail = localStorage.getItem('doce_last_user');
        if (!lastUserEmail) {
          setIsLoaded(true);
          return;
        }

        const users = JSON.parse(localStorage.getItem('doce_users') || '{}');
        const userRecord = users[norm(lastUserEmail)];
        
        if (userRecord) {
          const dataOwnerEmail = norm(userRecord.ownerEmail || lastUserEmail);
          const ownerRecord = users[dataOwnerEmail];
          // Prioridade para URL do convite se não houver no registro
          const currentSheetUrl = ownerRecord?.googleSheetUrl || userRecord.googleSheetUrl || localStorage.getItem('doce_temp_cloud_url');
          const remaining = calculateDaysRemaining(ownerRecord?.activationDate);
          
          if (ownerRecord?.plan && ownerRecord.plan !== 'none' && remaining > 0) {
            setDaysRemaining(remaining);
            const userDataKey = `doce_data_${dataOwnerEmail}`;
            let rawUserData = localStorage.getItem(userDataKey);

            if (currentSheetUrl) {
               try {
                  const cloudRes = await fetch(`${currentSheetUrl}?email=${dataOwnerEmail}`);
                  if (cloudRes.ok) {
                    const cloudJson = await cloudRes.json();
                    if (cloudJson && cloudJson.state) {
                      rawUserData = JSON.stringify(cloudJson.state);
                      localStorage.setItem(userDataKey, rawUserData);
                      if (cloudJson.usersRegistry) {
                        localStorage.setItem('doce_users', JSON.stringify(cloudJson.usersRegistry));
                      }
                    }
                  }
               } catch(err) { console.warn("Cloud pull indisponível."); }
            }

            const newState = migrateData(rawUserData || {}, lastUserEmail, userRecord.role, dataOwnerEmail, currentSheetUrl);
            setState(newState);
            setDbStatus(currentSheetUrl ? 'cloud' : 'synced');
            if (userRecord.role === 'Vendedor') setActiveTab('sales');
            setView('app');
          } else if (userRecord.role && userRecord.role !== 'Dono') {
            setView('login');
          } else {
            setState({ ...emptyState, user: { email: norm(lastUserEmail), role: 'Dono' } });
            setView('pricing');
          }
        }
      } catch (e) { setDbStatus('error'); }
      setIsLoaded(true);
    };
    initializeDatabase();
  }, [migrateData]);

  useEffect(() => {
    if (!isLoaded || !state.user?.email) return;
    
    const timer = setTimeout(() => {
      try {
        const ownerEmail = norm(state.user?.ownerEmail || state.user?.email || '');
        const userKey = `doce_data_${ownerEmail}`;
        
        if (ownerEmail) {
          localStorage.setItem(userKey, JSON.stringify(state));
          localStorage.setItem('doce_last_user', norm(state.user?.email || ''));
          
          if (isInitialLoad.current) {
            isInitialLoad.current = false;
            return;
          }
          
          if (state.user?.googleSheetUrl) {
            syncToCloud(state);
          } else {
            setDbStatus('synced');
          }
        }
      } catch (e) { setDbStatus('error'); }
    }, 1500);

    return () => clearTimeout(timer);
  }, [state, isLoaded]);

  const handleLogin = async (email: string) => {
    const formattedEmail = norm(email);
    const users = JSON.parse(localStorage.getItem('doce_users') || '{}');
    const userRecord = users[formattedEmail];
    if (!userRecord) return;

    const dataOwnerEmail = norm(userRecord.ownerEmail || formattedEmail);
    const ownerRecord = users[dataOwnerEmail];
    const currentSheetUrl = ownerRecord?.googleSheetUrl || userRecord.googleSheetUrl || localStorage.getItem('doce_temp_cloud_url');

    if (ownerRecord?.plan && ownerRecord.plan !== 'none') {
      const remaining = calculateDaysRemaining(ownerRecord.activationDate);
      if (remaining <= 0 && userRecord.role === 'Dono') {
        setState({ ...emptyState, user: { email: formattedEmail, role: 'Dono', googleSheetUrl: currentSheetUrl } });
        setView('pricing');
      } else if (remaining > 0) {
        setDaysRemaining(remaining);
        const userDataKey = `doce_data_${dataOwnerEmail}`;
        let existingData = localStorage.getItem(userDataKey);

        if (currentSheetUrl) {
          try {
             const cloudRes = await fetch(`${currentSheetUrl}?email=${dataOwnerEmail}`);
             if (cloudRes.ok) {
                const cloudJson = await cloudRes.json();
                if (cloudJson && cloudJson.state) {
                  existingData = JSON.stringify(cloudJson.state);
                  if (cloudJson.usersRegistry) localStorage.setItem('doce_users', JSON.stringify(cloudJson.usersRegistry));
                }
             }
          } catch(e) {}
        }
        
        setState(migrateData(existingData || {}, formattedEmail, userRecord.role, dataOwnerEmail, currentSheetUrl));
        if (userRecord.role === 'Vendedor') setActiveTab('sales');
        setView('app');
      } else { setView('login'); }
    } else if (userRecord.role === 'Dono') {
      setState({ ...emptyState, user: { email: formattedEmail, role: 'Dono', googleSheetUrl: currentSheetUrl } });
      setView('pricing');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('doce_last_user');
    setState(emptyState);
    setView('login');
    isInitialLoad.current = true;
  };

  const isVendedor = state.user?.role === 'Vendedor';
  const isAuxiliar = state.user?.role === 'Auxiliar';

  const navItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'sales', label: 'Vendas PDV', icon: ShoppingBasket },
    { id: 'products', label: 'Doces & Fichas', icon: Cake },
    { id: 'stock', label: 'Controle Estoque', icon: Database },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'agenda', label: 'Agenda Entregas', icon: Calendar },
    { id: 'profile', label: 'Ajustes Perfil', icon: User },
  ].filter(item => {
    if (item.id === 'dashboard') return !isVendedor;
    if (item.id === 'products') return !isAuxiliar && !isVendedor;
    if (item.id === 'stock') return !isAuxiliar && !isVendedor;
    if (item.id === 'financial') return !isAuxiliar && !isVendedor;
    if (item.id === 'agenda') return !isVendedor;
    return true;
  });

  return (
    <div className="h-full w-full flex flex-col md:flex-row overflow-hidden bg-[#FFF9FB]">
      {view === 'login' ? (
        <Login onLogin={handleLogin} onShowPricing={() => setView('pricing')} />
      ) : view === 'pricing' ? (
        <Pricing userEmail={state.user?.email} onBack={() => setView('login')} onPlanActivated={(d) => { setDaysRemaining(d); setView('app'); }} />
      ) : (
        <>
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
              <div className="p-4 bg-gray-50 rounded-2xl mb-4 overflow-hidden">
                 <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Conexão Nuvem</p>
                    <div className={`w-2 h-2 rounded-full ${dbStatus === 'cloud' ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]' : 'bg-emerald-400'}`}></div>
                 </div>
                 <p className="text-xs font-black text-gray-700 truncate">{state.user?.role || 'Dono'}</p>
                 <p className="text-[9px] text-gray-400 truncate opacity-60 flex items-center gap-1">
                   {dbStatus === 'cloud' && <CloudLightning size={8} className="text-indigo-400" />} {state.user?.email}
                 </p>
              </div>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-red-500 transition-colors font-bold text-sm">
                <LogOut size={18} /> Sair
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
                 <div className={`w-2 h-2 rounded-full ${dbStatus === 'cloud' ? 'bg-indigo-400' : 'bg-emerald-400'}`}></div>
                 <button onClick={handleLogout} className="w-9 h-9 flex items-center justify-center text-gray-300"><LogOut size={18}/></button>
              </div>
            </header>

            <main className="app-main-view custom-scrollbar w-full">
              <div className="max-w-4xl mx-auto p-4 md:p-8">
                {activeTab === 'dashboard' && !isVendedor && <Dashboard state={state} onNavigate={setActiveTab} />}
                {activeTab === 'products' && !isAuxiliar && !isVendedor && <ProductManagement state={state} setState={setState} />}
                {activeTab === 'sales' && <SalesRegistry state={state} setState={setState} />}
                {activeTab === 'stock' && !isAuxiliar && !isVendedor && <StockControl state={state} setState={setState} />}
                {activeTab === 'financial' && !isAuxiliar && !isVendedor && <FinancialControl state={state} setState={setState} />}
                {activeTab === 'agenda' && !isVendedor && <Agenda state={state} setState={setState} />}
                {activeTab === 'profile' && <Profile state={state} setState={setState} daysRemaining={daysRemaining} />}
              </div>
            </main>

            <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-nav border-t border-gray-100 px-2 h-[85px] z-[100] flex justify-around items-center pb-safe">
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
        </>
      )}
    </div>
  );
};

export default App;
