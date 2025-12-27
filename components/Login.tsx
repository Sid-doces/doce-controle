
import React, { useState } from 'react';
import { Cake, Heart, ArrowRight, UserPlus, Lock, Mail } from 'lucide-react';

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

    setTimeout(() => {
      const users = getUsers();
      const user = users[email.toLowerCase().trim()];

      if (!user) {
        setError('E-mail não cadastrado. Verifique com seu gestor.');
        setLoading(false);
        return;
      }

      const storedPass = typeof user === 'string' ? user : user.password;
      // Colaboradores têm user.plan === 'linked', o que é considerado true para o login
      const hasPlan = typeof user === 'string' ? false : (user.plan && user.plan !== 'none');

      if (storedPass !== pass) {
        setError('Senha incorreta!');
        setLoading(false);
        return;
      }

      onLogin(email, hasPlan);
      setLoading(false);
    }, 800);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (pass.length < 3) {
      setError('A senha deve ter pelo menos 3 caracteres.');
      setLoading(false);
      return;
    }

    setTimeout(() => {
      const users = getUsers();
      const formattedEmail = email.toLowerCase().trim();

      if (users[formattedEmail]) {
        setError('Este e-mail já possui uma conta.');
        setLoading(false);
        return;
      }

      users[formattedEmail] = {
        password: pass,
        plan: 'none',
        role: 'Dono',
        activationDate: null
      };
      localStorage.setItem('doce_users', JSON.stringify(users));
      
      alert("Conta de proprietário criada! Agora escolha seu plano.");
      setIsRegistering(false);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#FFF9FB] flex flex-col items-center justify-center p-6">
      <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="w-20 h-20 bg-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-pink-100 rotate-6">
          <Cake className="text-white" size={40} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Doce Controle</h1>
        <p className="text-pink-400 font-medium mt-1 italic">Sua confeitaria na palma da mão</p>
      </div>

      <div className="bg-white w-full max-w-md p-10 rounded-[40px] shadow-2xl border border-pink-50 relative overflow-hidden animate-in zoom-in duration-500">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-400 to-pink-600"></div>

        <div className="mb-8 flex bg-gray-50 p-1 rounded-2xl">
          <button 
            onClick={() => { setIsRegistering(false); setError(''); }}
            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${!isRegistering ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}
          >
            Entrar
          </button>
          <button 
            onClick={() => { setIsRegistering(true); setError(''); }}
            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${isRegistering ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}
          >
            Criar Conta
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-500 text-xs font-bold rounded-2xl">
            {error}
          </div>
        )}

        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail de Acesso</label>
            <input 
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="exemplo@doce.com"
              className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-200 outline-none transition-all text-black font-semibold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha</label>
            <input 
              type="password" required value={pass} onChange={e => setPass(e.target.value)}
              placeholder="••••••••"
              className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-200 outline-none transition-all text-black font-semibold"
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className={`w-full text-white font-black text-lg py-5 rounded-3xl transition-all shadow-lg active:scale-[0.98] mt-4 flex items-center justify-center gap-2 ${
              isRegistering ? 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-100' : 'bg-pink-500 hover:bg-pink-600 shadow-pink-100'
            }`}
          >
            {loading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : (isRegistering ? "Cadastrar Agora" : "Entrar na Cozinha")}
          </button>
        </form>

        {!isRegistering && (
          <div className="mt-10 pt-8 border-t border-gray-50 text-center">
            <p className="text-gray-400 text-sm">Não tem conta ou plano?</p>
            <button onClick={onShowPricing} className="mt-2 text-pink-500 font-black hover:text-pink-600 transition-colors">Ver Planos ✨</button>
          </div>
        )}
      </div>
      
      <div className="mt-12 flex items-center gap-2 text-pink-200">
        <Heart size={14} fill="currentColor" />
        <span className="text-xs font-bold uppercase tracking-widest">Feito para Confeiteiras de Sucesso</span>
      </div>
    </div>
  );
};

export default Login;
