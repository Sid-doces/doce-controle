
import React, { useState, useEffect } from 'react';
import { Check, Cake, Zap, Trophy, ArrowLeft, MessageCircle, X, Send, User, Mail, Phone, Key } from 'lucide-react';

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

const MASTER_CODE = "DOCE30";

const Pricing: React.FC<PricingProps> = ({ onBack, onPlanActivated, userEmail }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentCode, setPaymentCode] = useState('');
  const [error, setError] = useState('');
  
  const [customerData, setCustomerData] = useState({
    name: '',
    email: userEmail || localStorage.getItem('doce_last_user') || '',
    whatsapp: ''
  });

  useEffect(() => {
    const last = localStorage.getItem('doce_last_user');
    const emailToUse = userEmail || last || '';
    if (emailToUse) {
      setCustomerData(prev => ({ ...prev, email: emailToUse }));
    }
  }, [userEmail]);

  const plans: Plan[] = [
    {
      name: 'Brotinho', price: 'Grátis', desc: 'Para quem está começando agora.', icon: <Cake className="text-pink-400" size={32} />,
      features: ['Até 5 produtos', 'Agenda simples', 'Controle de Vendas', 'Sem estoque'], color: 'border-gray-100', button: 'Escolher Grátis', highlight: false
    },
    {
      name: 'Profissional', price: 'R$ 19,90', period: '/mês', desc: 'O plano perfeito para viver da confeitaria.', icon: <Zap className="text-amber-500" size={32} />,
      features: ['Produtos Ilimitados', 'Estoque Inteligente', 'Financeiro Completo', 'Acesso Mobile'], color: 'border-pink-500', button: 'Assinar Agora', highlight: true
    },
    {
      name: 'Master Chef', price: 'R$ 39,99', period: '/mês', desc: 'Para equipes e alta produção.', icon: <Trophy className="text-indigo-500" size={32} />,
      features: ['Tudo do Profissional', 'Multi-usuários', 'Relatórios PDF', 'Prioridade no Suporte'], color: 'border-gray-100', button: 'Seja Master', highlight: false
    }
  ];

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowForm(true);
    setError('');
  };

  const handleFinalize = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (paymentCode.trim().toUpperCase() !== MASTER_CODE) {
      setError('Código inválido! Entre em contato com o suporte para renovar.');
      return;
    }

    const currentEmail = customerData.email.toLowerCase().trim();
    if (!currentEmail) {
      setError('E-mail não identificado. Volte ao login e entre novamente.');
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

      alert(`Sucesso! Sua conta (${currentEmail}) foi ativada por mais 30 dias. ✨`);
      
      if (onPlanActivated) onPlanActivated(30);
    } else {
      setError('Esta conta não existe no sistema. Crie uma conta primeiro.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9FB] p-6 pb-20 animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto">
        {!showForm && (
          <button onClick={onBack} className="flex items-center gap-2 text-gray-400 font-bold hover:text-gray-800 mb-12 transition-colors">
            <ArrowLeft size={20} /> Voltar ao Login
          </button>
        )}

        <header className="text-center mb-16">
          <div className="bg-pink-100 text-pink-500 px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-4 shadow-sm">
            Ativação de Ciclo
          </div>
          <h1 className="text-4xl font-black text-gray-800 mb-4 tracking-tight">Acesse sua Confeitaria 🍰</h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto italic leading-relaxed font-medium">
            "Para entrar na sua cozinha digital, você precisa de uma ativação de 30 dias válida."
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, idx) => (
            <div key={idx} className={`bg-white rounded-[45px] p-8 border-2 ${plan.color} relative flex flex-col h-full shadow-xl shadow-pink-100/20 transition-all hover:-translate-y-1`}>
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-pink-500 text-white px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-pink-100">
                  Recomendado
                </div>
              )}
              <div className="mb-8">
                <div className="mb-5 p-4 bg-gray-50 rounded-3xl inline-block">{plan.icon}</div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">{plan.name}</h2>
                <p className="text-gray-400 text-sm mt-2 leading-relaxed font-medium">{plan.desc}</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-black text-gray-800 tracking-tighter">{plan.price}</span>
                {plan.period && <span className="text-gray-400 font-black ml-1 text-sm uppercase tracking-widest">{plan.period}</span>}
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((feat, fIdx) => (
                  <li key={fIdx} className="flex items-center gap-3 text-sm font-bold text-gray-600">
                    <Check size={16} className="text-emerald-500" strokeWidth={4} /> {feat}
                  </li>
                ))}
              </ul>
              <button onClick={() => handleSelectPlan(plan)} className={`w-full py-5 rounded-[28px] font-black text-lg transition-all shadow-lg ${plan.highlight ? 'bg-pink-500 text-white hover:bg-pink-600 shadow-pink-200' : 'bg-white text-gray-800 border-2 border-gray-100 hover:border-pink-300'}`}>
                {plan.button}
              </button>
            </div>
          ))}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-pink-950/20 backdrop-blur-sm flex items-center justify-center z-[110] p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-md p-10 rounded-[45px] shadow-2xl relative my-8 animate-in zoom-in duration-200">
              <button onClick={() => setShowForm(false)} className="absolute top-8 right-8 text-gray-400 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-pink-50 text-pink-500 rounded-[24px] flex items-center justify-center mx-auto mb-5">
                  {selectedPlan?.icon}
                </div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Ativar Plano ✨</h2>
                <p className="text-[10px] text-gray-400 font-black uppercase mt-1 tracking-widest italic">
                  Usuário: {customerData.email}
                </p>
              </div>

              {error && <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-500 text-xs font-black rounded-2xl animate-in slide-in-from-top-4">{error}</div>}

              <form onSubmit={handleFinalize} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail Vinculado</label>
                  <input 
                    type="email" required readOnly
                    className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50 text-gray-400 font-bold outline-none cursor-not-allowed text-sm" 
                    value={customerData.email}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                    <Key size={12} className="text-pink-500" /> Código de Ativação
                  </label>
                  <input 
                    type="text" required
                    className="w-full px-6 py-5 rounded-2xl border-4 border-pink-50 bg-pink-50/30 focus:border-pink-500 focus:bg-white outline-none text-gray-800 font-black text-center text-2xl uppercase tracking-widest transition-all" 
                    placeholder="DOCE-XXXX-XXXX" 
                    value={paymentCode} 
                    onChange={e => setPaymentCode(e.target.value)} 
                  />
                  <p className="text-[9px] text-gray-400 text-center font-black mt-3 uppercase tracking-widest italic">Dica: Use o código <span className="text-pink-500">DOCE30</span> para testar agora</p>
                </div>

                <button type="submit" className="w-full bg-pink-500 text-white font-black text-lg py-5 rounded-[30px] transition-all shadow-xl shadow-pink-100 hover:bg-pink-600 mt-6 flex items-center justify-center gap-2">
                  Ativar Meu Acesso <Send size={20} />
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="mt-20 flex flex-col items-center">
            <div className="flex items-center gap-6 p-8 bg-emerald-50 rounded-[45px] border-2 border-emerald-100 max-w-2xl shadow-sm">
                <div className="w-16 h-16 bg-emerald-500 text-white rounded-[24px] flex items-center justify-center shrink-0 shadow-lg shadow-emerald-100">
                    <MessageCircle size={32} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-emerald-900 tracking-tight">Suporte à Confeiteira</h3>
                    <p className="text-emerald-700 font-medium text-sm leading-relaxed mb-3">
                        Precisa de um código personalizado ou ajuda com seu plano?
                    </p>
                    <a href="https://wa.me/5511987170732" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-black hover:text-emerald-700 transition-colors flex items-center gap-2 text-sm uppercase tracking-widest">
                        Chamar Suporte <ArrowLeft className="rotate-180" size={14} />
                    </a>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
