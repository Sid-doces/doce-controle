
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
  X,
  Lock
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

  const migrateData = (oldData: any, userEmail: string, role: any, ownerEmail?: string): AppState => {
    try {
      const parsed = typeof oldData === 'string' ? JSON.parse(oldData) : oldData;
      return {
        ...emptyState,
        ...parsed,
        user: { 
          email: userEmail.toLowerCase().trim(),
          role: role || 'Dono',
          ownerEmail: ownerEmail || userEmail 
        },
        settings: parsed.settings || { commissionRate: 0 },
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
      console.error("Erro na migração:", e);
      return { ...emptyState, user: { email: userEmail, role: role || 'Dono' } };
    }
  };

  useEffect(() => {
    try {
      const lastUserEmail = localStorage.getItem('doce_last_user');
      if (lastUserEmail) {
        const users = JSON.parse(localStorage.getItem('doce_users') || '{}');
        const userRecord = users[lastUserEmail.toLowerCase().trim()];
        
        if (userRecord) {
          const dataOwnerEmail = userRecord.ownerEmail || lastUserEmail.toLowerCase().trim();
          const ownerRecord = users[dataOwnerEmail];
          
          const remaining = calculateDaysRemaining(ownerRecord?.activationDate);
          const userDataKey = `doce_data_${dataOwnerEmail}`;
          const rawUserData = localStorage.getItem(userDataKey);
          
          if (ownerRecord?.plan && ownerRecord.plan !== 'none' && remaining > 0) {
            setDaysRemaining(remaining);
            if (rawUserData) {
              const newState = migrateData(rawUserData, lastUserEmail, userRecord.role, userRecord.ownerEmail);
              setState(newState);
              if (userRecord.role === 'Vendedor') setActiveTab('sales');
            } else {
              setState({ ...emptyState, user: { email: lastUserEmail, role: userRecord.role || 'Dono', ownerEmail: userRecord.ownerEmail } });
            }
            setView('app');
          } else if (userRecord.role && userRecord.role !== 'Dono') {
            alert("O plano do seu gestor expirou ou está inativo.");
            setView('login');
          } else {
            setState({ ...emptyState, user: { email: lastUserEmail, role: 'Dono' } });
            setView('pricing');
          }
        }
      }
    } catch (e) {
      console.error("Erro no boot:", e);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded || !state.user?.email) return;
    const saveEmail = state.user.ownerEmail || state.user.email;
    const userKey = `doce_data_${saveEmail.toLowerCase().trim()}`;
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
    const users = JSON.parse(localStorage.getItem('doce_users') || '{}');
    const userRecord = users[formattedEmail];
    
    if (!userRecord) return;

    const dataOwnerEmail = userRecord.ownerEmail || formattedEmail;
    const ownerRecord = users[dataOwnerEmail];
    const ownerHasPlan = ownerRecord?.plan && ownerRecord.plan !== 'none';

    if (ownerHasPlan) {
      const remaining = calculateDaysRemaining(ownerRecord.activationDate);
      if (remaining <= 0) {
        if (userRecord.role === 'Dono' || !userRecord.role) {
          setState({ ...emptyState, user: { email: formattedEmail, role: 'Dono' } });
          setView('pricing');
        } else {
          alert("O plano da confeitaria expirou. Fale com seu gestor.");
          setView('login');
        }
      } else {
        setDaysRemaining(remaining);
        const userDataKey = `doce_data_${dataOwnerEmail}`;
        const existingData = localStorage.getItem(userDataKey);
        
        setState(migrateData(existingData || emptyState, formattedEmail, userRecord.role, userRecord.ownerEmail));
        if (userRecord.role === 'Vendedor') setActiveTab('sales');
        setView('app');
      }
    } else {
      if (userRecord.role === 'Dono' || !userRecord.role) {
        setState({ ...emptyState, user: { email: formattedEmail, role: 'Dono' } });
        setView('pricing');
      } else {
        alert("A conta ainda não foi ativada pelo proprietário.");
        setView('login');
      }
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

  const isAuxiliar = state.user?.role === 'Auxiliar';
  const isVendedor = state.user?.role === 'Vendedor';
  
  const navItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard, hidden: isVendedor },
    { id: 'sales', label: 'Vendas', icon: ShoppingBasket, hidden: false },
    { id: 'agenda', label: 'Agenda', icon: Calendar, hidden: isVendedor },
    { id: 'products', label: 'Produtos', icon: UtensilsCrossed, hidden: isAuxiliar || isVendedor },
    { id: 'stock', label: 'Estoque', icon: Package, hidden: isAuxiliar || isVendedor },
    { id: 'financial', label: 'Finanças', icon: DollarSign, hidden: isAuxiliar || isVendedor },
    { id: 'profile', label: 'Perfil', icon: User, hidden: false },
  ].filter(item => !item.hidden);

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
          <div className="p-4 bg-gray-50 rounded-2xl mb-4 overflow-hidden">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Perfil</p>
             <p className="text-xs font-black text-gray-700 truncate">{state.user.role || 'Dono'}</p>
             <p className="text-[9px] text-gray-400 truncate opacity-60">{state.user.email}</p>
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
          <button onClick={handleLogout} className="w-9 h-9 flex items-center justify-center text-gray-300"><LogOut size={18}/></button>
        </header>

        <main className="app-main-view custom-scrollbar w-full">
          <div className="max-w-4xl mx-auto p-4 md:p-8">
            {activeTab === 'dashboard' && !isVendedor && <Dashboard state={state} onNavigate={setActiveTab} />}
            {activeTab === 'products' && !isAuxiliar && !isVendedor && <ProductManagement state={state} setState={setState} />}
            {activeTab === 'sales' && <SalesRegistry state={state} setState={setState} />}
            {activeTab === 'stock' && !isAuxiliar && !isVendedor && <StockControl state={state} setState={setState} />}
            {activeTab === 'financial' && !isAuxiliar && !isVendedor && <FinancialControl state={state} setState={setState} />}
            {activeTab === 'agenda' && !isVendedor && <Agenda state={state} setState={setState} />}
            {activeTab === 'profile' && <Profile state={state} setState={setState} daysRemaining={daysRemaining} onShowInstall={() => setShowInstallGuide(true)} />}
            
            {(isAuxiliar || isVendedor) && ['products', 'stock', 'financial', 'dashboard', 'agenda'].includes(activeTab) && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4"><Lock size={32}/></div>
                <h2 className="text-xl font-black text-gray-800">Acesso Restrito</h2>
                <p className="text-gray-400 font-medium">Seu perfil não possui permissão para esta área.</p>
              </div>
            )}
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

      {showInstallGuide && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md flex items-center justify-center z-[200] p-4">
          <div className="bg-white w-full max-w-sm rounded-[45px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 text-center bg-indigo-500 text-white relative">
              <button onClick={() => setShowInstallGuide(false)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"><X size={24}/></button>
              <Smartphone size={32} className="mx-auto mb-4" />
              <h2 className="text-xl font-black tracking-tight">App no Celular</h2>
            </div>
            <div className="p-8 space-y-4">
               <p className="text-xs text-gray-500 font-bold leading-relaxed">1. Clique nos 3 pontos ou ícone de compartilhar.</p>
               <p className="text-xs text-gray-500 font-bold leading-relaxed">2. Selecione "Instalar App" ou "Adicionar à Tela de Início".</p>
               <button onClick={() => setShowInstallGuide(false)} className="w-full py-5 bg-indigo-500 text-white rounded-[28px] font-black text-xs uppercase tracking-widest">Entendido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
