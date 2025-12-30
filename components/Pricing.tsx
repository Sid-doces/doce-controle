
import React, { useState, useEffect } from 'react';
import { Check, Cake, Zap, Trophy, ArrowLeft, MessageCircle, X, Key, ChevronRight, Ticket } from 'lucide-react';

interface PricingProps {
  onBack: () => void;
  onPlanActivated?: (days: number) => void;
  userEmail?: string;
}

interface Plan {
  name: string;
  price: string;
  period?: string;
  desc: string;
  icon: React.ReactNode;
  features: string[];
  color: string;
  button: string;
  highlight: boolean;
}

const MASTER_CODE = "SID10";

const Pricing: React.FC<PricingProps> = ({ onBack, onPlanActivated, userEmail }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentCode, setPaymentCode] = useState(MASTER_CODE);
  const [error, setError] = useState('');
  
  const [customerData, setCustomerData] = useState({
    name: '',
    email: userEmail || localStorage.getItem('doce_last_user') || '',
    whatsapp: ''
  });

  useEffect(() => {
    const last = localStorage.getItem('doce_last_user');
    const emailToUse = (userEmail || last || '').toLowerCase().trim();
    if (emailToUse) {
      setCustomerData(prev => ({ ...prev, email: emailToUse }));
    }
  }, [userEmail]);

  const plans: Plan[] = [
    {
      name: 'Brotinho', price: 'Grátis', desc: 'Para quem está começando agora.', icon: <Cake className="text-pink-400" size={32} />,
      features: ['Até 5 produtos', 'Agenda simples', 'Controle de Vendas'], color: 'border-gray-100', button: 'Escolher Grátis', highlight: false
    },
    {
      name: 'Profissional', price: 'R$ 19,90', period: '/mês', desc: 'O plano perfeito para viver da confeitaria.', icon: <Zap className="text-amber-500" size={32} />,
      features: ['Produtos Ilimitados', 'Estoque Inteligente', 'Financeiro Completo'], color: 'border-pink-500', button: 'Assinar Agora', highlight: true
    },
    {
      name: 'Master Chef', price: 'R$ 39,99', period: '/mês', desc: 'Para equipes e alta produção.', icon: <Trophy className="text-indigo-500" size={32} />,
      features: ['Tudo do Profissional', 'Multi-usuários', 'Relatórios PDF'], color: 'border-gray-100', button: 'Seja Master', highlight: false
    }
  ];

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowForm(true);
    setError('');
    setPaymentCode(MASTER_CODE);
  };

  const handleFinalize = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (paymentCode.trim().toUpperCase() !== MASTER_CODE) {
      setError('Código inválido.');
      return;
    }

    const currentEmail = customerData.email.toLowerCase().trim();
    if (!currentEmail) {
      setError('E-mail não identificado.');
      return;
    }

    const usersRaw = localStorage.getItem('doce_users');
    const users = usersRaw ? JSON.parse(usersRaw) : {};
    
    if (users[currentEmail]) {
      const now = new Date().toISOString();
      users[currentEmail] = {
        ...users[currentEmail],
        plan: selectedPlan?.name,
        activationDate: now,
        lastActivationCode: paymentCode.trim().toUpperCase()
      };
      localStorage.setItem('doce_users', JSON.stringify(users));
      localStorage.setItem('doce_last_user', currentEmail);
      
      if (onPlanActivated) onPlanActivated(30);
    } else {
      setError('Conta não encontrada.');
    }
  };

  return (
    <div className="h-full w-full bg-[#FFF9FB] flex flex-col overflow-hidden">
      <header className="px-6 h-16 bg-white border-b border-gray-100 flex items-center shrink-0 z-20">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-400 active:scale-90 transition-transform">
          <ArrowLeft size={24} />
        </button>
        <span className="ml-2 font-black text-gray-800 text-sm uppercase tracking-widest">Planos</span>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-20">
        <div className="max-w-md mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black text-gray-800 tracking-tight leading-none">Escolha seu Ciclo 🍰</h1>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Ative por 30 dias</p>
          </div>

          <div className="space-y-4">
            {plans.map((plan, idx) => (
              <button 
                key={idx}
                onClick={() => handleSelectPlan(plan)}
                className={`w-full text-left bg-white p-6 rounded-[32px] border-2 transition-all active:scale-[0.97] flex items-center gap-4 relative overflow-hidden shadow-sm ${
                  plan.highlight ? 'border-pink-500 bg-pink-50/10' : 'border-gray-100'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${plan.highlight ? 'bg-pink-500 text-white' : 'bg-gray-50'}`}>
                  {plan.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-black text-gray-800 text-base">{plan.name}</h2>
                    {plan.highlight && <span className="text-[8px] bg-pink-500 text-white px-2 py-0.5 rounded-full font-black uppercase">Vip</span>}
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold leading-tight mt-0.5">{plan.desc}</p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-black text-gray-800 text-lg">{plan.price}</span>
                    <span className="text-[9px] text-gray-400 font-black uppercase">{plan.period}</span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-200" />
              </button>
            ))}
          </div>

          <div className="p-6 bg-indigo-50 rounded-[32px] border border-indigo-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-100">
              <MessageCircle size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Suporte</p>
              <a href="https://wa.me/5511987170732" target="_blank" className="text-xs font-bold text-indigo-600">Falar com Consultor</a>
            </div>
          </div>
        </div>
      </main>

      {showForm && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md flex items-end md:items-center justify-center z-[200] p-0 md:p-4">
          <div className="bg-white w-full max-w-sm rounded-t-[40px] md:rounded-[45px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-8 pb-4 flex justify-between items-center">
              <h2 className="text-xl font-black text-gray-800">Liberar Acesso</h2>
              <button onClick={() => setShowForm(false)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleFinalize} className="p-8 pt-0 space-y-6">
              <div className="p-4 bg-gray-50 rounded-[24px] border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-pink-500 shadow-sm">
                    {selectedPlan?.icon}
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Plano Escolhido</p>
                    <p className="text-sm font-black text-gray-800">{selectedPlan?.name}</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  className="bg-white px-4 py-2 rounded-xl text-[9px] font-black text-pink-500 uppercase border border-pink-100 shadow-sm active:scale-90 transition-all"
                >
                  Trocar
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Ticket size={12} className="text-pink-500" /> Código de Ativação
                </label>
                <div className="relative">
                  <Key size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-pink-500" />
                  <input 
                    type="text" required
                    className="w-full pl-14 pr-6 py-5 bg-pink-50 border-2 border-pink-200 rounded-[28px] outline-none text-gray-800 font-black text-2xl uppercase tracking-[0.2em] focus:border-pink-500 focus:bg-white transition-all text-center"
                    placeholder="CÓDIGO"
                    value={paymentCode}
                    onChange={e => setPaymentCode(e.target.value.toUpperCase())}
                  />
                </div>
                {error && <p className="text-[10px] text-red-500 font-black text-center mt-2 uppercase">{error}</p>}
              </div>

              <button type="submit" className="w-full py-5 bg-pink-500 text-white rounded-[30px] font-black text-base shadow-xl shadow-pink-100 active:scale-95 transition-transform uppercase tracking-widest flex items-center justify-center gap-3">
                Ativar 30 dias <ChevronRight size={20} />
              </button>

              <div className="pt-2 text-center">
                <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Acesso para: {customerData.email}</p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pricing;
