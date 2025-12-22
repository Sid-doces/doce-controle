
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
  
  // O e-mail deve vir obrigatoriamente do estado global do App
  const [customerData, setCustomerData] = useState({
    name: '',
    email: userEmail || '',
    whatsapp: ''
  });

  // Efeito de segurança: Garante que se o App identificar o usuário, o Pricing reconhece na hora
  useEffect(() => {
    if (userEmail) {
      setCustomerData(prev => ({ ...prev, email: userEmail }));
    } else {
      // Se não há e-mail no estado, tenta buscar o último logado
      const last = localStorage.getItem('doce_last_user');
      if (last) setCustomerData(prev => ({ ...prev, email: last }));
    }
  }, [userEmail]);

  const plans: Plan[] = [
    {
      name: 'Brotinho', price: 'Grátis', desc: 'Início na cozinha de casa.', icon: <Cake className="text-pink-400" size={32} />,
      features: ['Até 5 produtos', 'Agenda simples', 'Controle de Vendas', 'Sem estoque'], color: 'border-gray-100', button: 'Escolher Grátis', highlight: false
    },
    {
      name: 'Profissional', price: 'R$ 19,90', period: '/mês', desc: 'Perfeito para quem vive da confeitaria.', icon: <Zap className="text-amber-500" size={32} />,
      features: ['Ilimitado', 'Estoque Inteligente', 'Financeiro Completo', 'WhatsApp Support'], color: 'border-pink-500', button: 'Assinar Agora', highlight: true
    },
    {
      name: 'Master Chef', price: 'R$ 39,99', period: '/mês', desc: 'Para equipes e alto volume.', icon: <Trophy className="text-indigo-500" size={32} />,
      features: ['Tudo do Profissional', 'Multi-usuários', 'Relatórios PDF', 'Mentoria'], color: 'border-gray-100', button: 'Seja Master', highlight: false
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
      setError('Código inválido! Fale com o suporte para receber seu código de ativação.');
      return;
    }

    const currentEmail = customerData.email.toLowerCase().trim();
    if (!currentEmail) {
      setError('E-mail não identificado. Volte ao login e tente entrar novamente.');
      return;
    }

    const users = JSON.parse(localStorage.getItem('doce_users') || '{}');
    
    if (users[currentEmail]) {
      const now = new Date().toISOString();
      
      // Grava a ativação no registro do usuário
      users[currentEmail] = {
        ...users[currentEmail],
        plan: selectedPlan?.name,
        activationDate: now,
        lastPaymentCode: paymentCode.trim().toUpperCase()
      };
      
      localStorage.setItem('doce_users', JSON.stringify(users));
      localStorage.setItem('doce_last_user', currentEmail);

      // Feedback e redirecionamento
      alert(`Conta ativada com sucesso para: ${currentEmail}\n\nSeja bem-vinda ao seu novo controle! ✨`);
      
      if (onPlanActivated) onPlanActivated(30);
    } else {
      setError('Conta não encontrada. Por favor, crie uma conta antes de ativar o plano.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9FB] p-6 pb-20">
      <div className="max-w-6xl mx-auto">
        {!showForm && (
          <button onClick={onBack} className="flex items-center gap-2 text-gray-400 font-bold hover:text-black mb-12">
            <ArrowLeft size={20} /> Voltar ao Login
          </button>
        )}

        <header className="text-center mb-16">
          <div className="bg-pink-100 text-pink-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-4 shadow-sm">
            Ativação de 30 Dias
          </div>
          <h1 className="text-4xl font-black text-gray-800 mb-4">Selecione seu acesso 🍰</h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto italic leading-relaxed">
            "Para entrar na sua cozinha digital, você precisa de uma ativação válida."
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, idx) => (
            <div key={idx} className={`bg-white rounded-[40px] p-8 border-2 ${plan.color} relative flex flex-col h-full shadow-xl shadow-pink-100/20 transition-all hover:-translate-y-1`}>
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-pink-500 text-white px-6 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Recomendado
                </div>
              )}
              <div className="mb-8">
                <div className="mb-4">{plan.icon}</div>
                <h2 className="text-2xl font-black text-gray-800">{plan.name}</h2>
                <p className="text-gray-400 text-sm mt-2 leading-relaxed">{plan.desc}</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-black text-black">{plan.price}</span>
                {plan.period && <span className="text-gray-400 font-bold ml-1">{plan.period}</span>}
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((feat, fIdx) => (
                  <li key={fIdx} className="flex items-center gap-3 text-sm font-bold text-gray-600">
                    <Check size={14} className="text-emerald-500" strokeWidth={4} /> {feat}
                  </li>
                ))}
              </ul>
              <button onClick={() => handleSelectPlan(plan)} className={`w-full py-5 rounded-3xl font-black text-lg transition-all shadow-lg ${plan.highlight ? 'bg-pink-500 text-white hover:bg-pink-600' : 'bg-white text-black border-2 border-gray-100 hover:border-pink-200'}`}>
                {plan.button}
              </button>
            </div>
          ))}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-md p-10 rounded-[45px] shadow-2xl relative my-8 animate-in zoom-in duration-200">
              <button onClick={() => setShowForm(false)} className="absolute top-8 right-8 text-gray-400 hover:text-black">
                <X size={24} />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-pink-50 text-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {selectedPlan?.icon}
                </div>
                <h2 className="text-2xl font-black text-black">Ativar Acesso ✨</h2>
                <p className="text-[10px] text-gray-400 font-black uppercase mt-1 tracking-wider">
                  Conta: {customerData.email}
                </p>
              </div>

              {error && <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-500 text-xs font-black rounded-2xl">{error}</div>}

              <form onSubmit={handleFinalize} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome da Confeitaria</label>
                  <input type="text" required className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-200 outline-none font-bold" placeholder="Nome para o Dashboard" value={customerData.name} onChange={e => setCustomerData({...customerData, name: e.target.value})} />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Código de Pagamento</label>
                  <input type="text" required className="w-full px-5 py-4 rounded-2xl border-4 border-pink-50 bg-pink-50/30 focus:border-pink-500 outline-none text-black font-black text-center text-xl uppercase tracking-widest" placeholder="INSIRA O CÓDIGO" value={paymentCode} onChange={e => setPaymentCode(e.target.value)} />
                  <p className="text-[9px] text-gray-400 text-center font-bold mt-2">Dica: Use DOCE30 para liberar agora</p>
                </div>

                <button type="submit" className="w-full bg-pink-500 text-white font-black text-lg py-5 rounded-3xl transition-all shadow-xl shadow-pink-100 hover:bg-pink-600 mt-4 flex items-center justify-center gap-2">
                  Liberar Minha Cozinha <Send size={20} />
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="mt-20 flex flex-col items-center">
            <div className="flex items-center gap-4 p-8 bg-emerald-50 rounded-[40px] border-2 border-emerald-100 max-w-2xl">
                <div className="w-16 h-16 bg-emerald-500 text-white rounded-3xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-100">
                    <MessageCircle size={32} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-emerald-900">Suporte e Vendas</h3>
                    <p className="text-emerald-700 font-medium text-sm leading-relaxed mb-3">
                        Não recebeu seu código de 30 dias? Chame nosso time agora.
                    </p>
                    <a href="https://wa.me/5511987170732" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-black hover:underline flex items-center gap-1">
                        Chamar no WhatsApp <ArrowLeft className="rotate-180" size={14} />
                    </a>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
