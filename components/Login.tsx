
import React, { useState } from 'react';
import { Cake, Loader2, Mail, ShieldCheck, ArrowRight } from 'lucide-react';
import { AppState } from '../types';

interface LoginProps {
  onLogin: (data: AppState) => void;
  backendUrl: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, backendUrl }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${backendUrl}?email=${email.toLowerCase().trim()}&pass=${password}`, { redirect: 'follow' });
      const data = await res.json();

      if (data && data.error) {
        setError(data.error);
      } else if (data && data.state) {
        localStorage.setItem('doce_last_user', email.toLowerCase().trim());
        const parsed = typeof data.state === 'string' ? JSON.parse(data.state) : data.state;
        
        if (!parsed.user) {
          parsed.user = { email: email.toLowerCase().trim(), role: 'Dono' };
        }
        
        onLogin(parsed);
      } else {
        setError("Não foi possível acessar a confeitaria.");
      }
    } catch (e) {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FFF9FB] flex flex-col items-center justify-center p-6">
      <div className="mb-10 text-center">
        <div className="w-20 h-20 bg-pink-500 rounded-[30px] flex items-center justify-center mx-auto mb-4 shadow-xl text-white rotate-6">
          <Cake size={40} />
        </div>
        <h1 className="text-3xl font-black text-gray-800 tracking-tight">Doce Controle</h1>
        <p className="text-pink-400 font-bold text-sm italic mt-1">Bem-vinda de volta!</p>
      </div>

      <form onSubmit={handleLogin} className="bg-white w-full max-w-sm p-10 rounded-[45px] shadow-2xl border border-pink-50 space-y-6">
        {error && <div className="p-4 bg-red-50 text-red-500 text-[10px] font-black uppercase rounded-2xl text-center tracking-widest">{error}</div>}
        
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full pl-14 pr-6 py-5 bg-gray-50 rounded-[25px] border-2 border-transparent focus:border-pink-200 outline-none font-bold text-gray-700 transition-all" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha</label>
          <div className="relative">
            <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" className="w-full pl-14 pr-6 py-5 bg-gray-50 rounded-[25px] border-2 border-transparent focus:border-pink-200 outline-none font-bold text-gray-700 transition-all" />
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full py-6 bg-pink-500 text-white rounded-[30px] font-black shadow-xl shadow-pink-100 flex items-center justify-center gap-3 active:scale-95 transition-all text-lg hover:bg-pink-600">
          {loading ? <Loader2 className="animate-spin" size={24} /> : <>Entrar <ArrowRight size={24}/></>}
        </button>
      </form>
      
      <p className="mt-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Micro SaaS de Alta Performance</p>
    </div>
  );
};

export default Login;
