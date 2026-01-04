
import React, { useState } from 'react';
import { Cake, Loader2, Mail, ShieldCheck, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { AppState } from '../types';

interface LoginProps {
  onLogin: (data: AppState) => void;
  backendUrl: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, backendUrl }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const emailKey = email.toLowerCase().trim();

    try {
      if (mode === 'login') {
        // Tenta logar na Nuvem (Google Script)
        const res = await fetch(`${backendUrl}?email=${emailKey}&pass=${password}`, { redirect: 'follow' });
        const data = await res.json();

        if (data && data.state) {
          localStorage.setItem('doce_last_user', emailKey);
          const parsed = typeof data.state === 'string' ? JSON.parse(data.state) : data.state;
          onLogin(parsed);
          return;
        }
        
        // Se não achou na nuvem, verifica local (migração)
        const localUsers = JSON.parse(localStorage.getItem('doce_users') || '{}');
        const localAccount = localUsers[emailKey];
        if (localAccount && String(localAccount.password) === String(password)) {
          localStorage.setItem('doce_last_user', emailKey);
          onLogin({
            user: { email: emailKey, role: localAccount.role || 'Dono', ownerEmail: localAccount.ownerEmail },
            products: [], stock: [], sales: [], orders: [], expenses: [], losses: [], collaborators: [], customers: [], productions: []
          });
          return;
        }

        setError(data.error || "Dados incorretos ou conta não encontrada.");
      } else {
        // MODO SIGNUP: Criar nova conta
        // 1. Verifica se já existe na nuvem antes de criar
        const checkRes = await fetch(`${backendUrl}?email=${emailKey}`, { redirect: 'follow' });
        const checkData = await checkRes.json();

        if (checkData.exists) {
          setError("Este e-mail já possui uma confeitaria vinculada.");
          setLoading(false);
          return;
        }

        // 2. Cria o estado inicial do SaaS para o novo Dono
        const initialState: AppState = {
          user: { email: emailKey, role: 'Dono' },
          products: [], stock: [], sales: [], orders: [], expenses: [], losses: [], collaborators: [], customers: [], productions: []
        };

        // 3. Registra no Google Script e no LocalStorage de usuários
        const localUsers = JSON.parse(localStorage.getItem('doce_users') || '{}');
        localUsers[emailKey] = { password: password, role: 'Dono' };
        localStorage.setItem('doce_users', JSON.stringify(localUsers));
        localStorage.setItem('doce_last_user', emailKey);

        // 4. Envia para a nuvem para persistência definitiva
        await fetch(backendUrl, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({ 
            email: emailKey, 
            pass: password, // O script salva a senha no primeiro registro
            state: JSON.stringify(initialState)
          })
        });

        onLogin(initialState);
      }
    } catch (e) {
      setError("Erro de conexão. Verifique sua internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FFF9FB] flex flex-col items-center justify-center p-6">
      <div className="mb-10 text-center animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="w-20 h-20 bg-pink-500 rounded-[30px] flex items-center justify-center mx-auto mb-4 shadow-xl text-white rotate-6 transition-transform hover:rotate-0">
          <Cake size={40} />
        </div>
        <h1 className="text-3xl font-black text-gray-800 tracking-tight">Doce Controle</h1>
        <p className="text-pink-400 font-bold text-xs uppercase tracking-widest mt-1">
          {mode === 'login' ? 'Bem-vinda de volta!' : 'Comece sua jornada doce'}
        </p>
      </div>

      <div className="bg-white w-full max-w-sm p-10 rounded-[45px] shadow-2xl border border-pink-50 space-y-6 relative overflow-hidden">
        <div className="flex bg-gray-50 p-1.5 rounded-2xl mb-4">
          <button 
            onClick={() => { setMode('login'); setError(''); }} 
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'login' ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}
          >
            <LogIn size={14}/> Entrar
          </button>
          <button 
            onClick={() => { setMode('signup'); setError(''); }} 
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'signup' ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}
          >
            <UserPlus size={14}/> Criar Conta
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-500 text-[10px] font-black uppercase rounded-2xl text-center tracking-widest animate-pulse">
            {error}
          </div>
        )}
        
        <form onSubmit={handleAction} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Seu E-mail</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                placeholder="exemplo@doce.com" 
                className="w-full pl-14 pr-6 py-5 bg-gray-50 rounded-[25px] border-2 border-transparent focus:border-pink-200 outline-none font-bold text-gray-700 transition-all shadow-inner" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sua Senha</label>
            <div className="relative">
              <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="password" required value={password} onChange={e => setPassword(e.target.value)} 
                placeholder="••••••" 
                className="w-full pl-14 pr-6 py-5 bg-gray-50 rounded-[25px] border-2 border-transparent focus:border-pink-200 outline-none font-bold text-gray-700 transition-all shadow-inner" 
              />
            </div>
          </div>

          <button 
            type="submit" disabled={loading} 
            className="w-full py-6 bg-pink-500 text-white rounded-[30px] font-black shadow-xl shadow-pink-100 flex items-center justify-center gap-3 active:scale-95 transition-all text-lg hover:bg-pink-600 group"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : (
              <>
                {mode === 'login' ? 'Acessar Painel' : 'Criar Minha Confeitaria'} 
                <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
      
      <p className="mt-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Micro SaaS • Nuvem Habilitada</p>
    </div>
  );
};

export default Login;
