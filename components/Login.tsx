
import React, { useState } from 'react';
import { Cake, Heart, ArrowRight, UserPlus, Lock, Mail, CloudLightning, Globe, ShieldAlert, Sparkles } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, hasPlan: boolean) => void;
  onShowPricing: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onShowPricing }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getUsers = () => {
    const users = localStorage.getItem('doce_users');
    return users ? JSON.parse(users) : {};
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formattedEmail = email.toLowerCase().trim();

    setTimeout(() => {
      const users = getUsers();
      const user = users[formattedEmail];

      if (!user) {
        setError('E-mail não autorizado ou não vinculado a esta confeitaria.');
        setLoading(false);
        return;
      }

      const storedPass = typeof user === 'string' ? user : user.password;
      
      if (storedPass !== pass) {
        setError('Senha incorreta!');
        setLoading(false);
        return;
      }

      const dataOwnerEmail = (user.ownerEmail || formattedEmail).toLowerCase().trim();
      const ownerRecord = users[dataOwnerEmail];
      const hasPlan = ownerRecord?.plan && ownerRecord.plan !== 'none';

      localStorage.setItem('doce_last_user', formattedEmail);
      onLogin(formattedEmail, hasPlan);
      setLoading(false);
    }, 800);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (pass.length < 3) {
      setError('Senha muito curta.');
      setLoading(false);
      return;
    }
    const formattedEmail = email.toLowerCase().trim();
    setTimeout(() => {
      const users = getUsers();
      if (users[formattedEmail]) {
        setError('E-mail já cadastrado.');
        setLoading(false);
        return;
      }
      users[formattedEmail] = { password: pass, plan: 'none', role: 'Dono', activationDate: null, ownerEmail: formattedEmail };
      localStorage.setItem('doce_users', JSON.stringify(users));
      setIsRegistering(false);
      setLoading(false);
      onLogin(formattedEmail, false);
    }, 800);
  };

  return (
    <div className="min-h-screen w-full bg-[#FFF9FB] flex flex-col items-center justify-center p-6 overflow-y-auto">
      <div className="mb-8 text-center animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-pink-100 rotate-6">
          <Cake className="text-white" size={40} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Doce Controle</h1>
        <p className="text-pink-400 font-medium mt-1 italic">Gestão profissional para confeitarias</p>
      </div>

      <div className="bg-white w-full max-w-md p-10 rounded-[40px] shadow-2xl border border-pink-50 relative overflow-hidden animate-in zoom-in duration-500">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-pink-500"></div>

        <div className="mb-8 flex bg-gray-50 p-1 rounded-2xl">
          <button 
            onClick={() => { setIsRegistering(false); setError(''); }}
            className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${!isRegistering ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}
          >
            Entrar
          </button>
          <button 
            onClick={() => { setIsRegistering(true); setError(''); }}
            className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isRegistering ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}
          >
            Sou Proprietário
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-500 text-[10px] font-black uppercase rounded-2xl flex items-center gap-2">
            <ShieldAlert size={14} /> {error}
          </div>
        )}

        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
            <input 
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-200 outline-none transition-all font-semibold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha</label>
            <input 
              type="password" required value={pass} onChange={e => setPass(e.target.value)}
              placeholder="••••••••"
              className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-200 outline-none transition-all font-semibold"
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full text-white font-black text-base py-5 rounded-3xl transition-all shadow-lg active:scale-[0.98] mt-4 flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 shadow-pink-100"
          >
            {loading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : (
              isRegistering ? "Criar Minha Confeitaria" : "Acessar Painel"
            )}
          </button>
        </form>

        {!isRegistering && (
          <div className="mt-8 pt-6 border-t border-gray-50 text-center space-y-4">
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
               <p className="text-[10px] text-indigo-700 font-bold leading-relaxed">
                 <Sparkles size={12} className="inline mr-1 mb-1"/> 
                 Funcionário? Entre pelo <b>Link de Convite</b> enviado pelo seu gerente.
               </p>
            </div>
            <button onClick={onShowPricing} className="text-pink-500 font-black text-xs hover:text-pink-600 transition-colors uppercase tracking-widest">Ver Planos de Assinatura ✨</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
