
import React, { useState } from 'react';
import { Cake, Loader2, Mail, ShieldCheck, ArrowRight, UserPlus, LogIn, Sparkles, AlertCircle } from 'lucide-react';
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
    const passInput = password.trim();

    try {
      if (mode === 'login') {
        // MODO LOGIN: Validação total na nuvem para suportar novos dispositivos
        const url = `${backendUrl}?email=${encodeURIComponent(emailKey)}&pass=${encodeURIComponent(passInput)}`;
        
        const res = await fetch(url, { 
          method: 'GET',
          redirect: 'follow'
        });
        
        if (!res.ok) throw new Error("Erro na comunicação com o servidor.");
        
        const data = await res.json();

        if (data.success && data.state) {
          // 1. Salva o e-mail como último usuário logado
          localStorage.setItem('doce_last_user', emailKey);
          
          // 2. Sincroniza a senha no LocalStorage deste novo navegador
          const localUsers = JSON.parse(localStorage.getItem('doce_users') || '{}');
          localUsers[emailKey] = { 
            password: passInput, 
            role: data.role || 'Dono',
            ownerEmail: data.ownerEmail || null
          };
          localStorage.setItem('doce_users', JSON.stringify(localUsers));

          // 3. Processa o estado vindo da nuvem
          const parsedState = typeof data.state === 'string' ? JSON.parse(data.state) : data.state;
          
          // 4. Cria backup local imediato
          localStorage.setItem(`doce_backup_${emailKey}`, JSON.stringify(parsedState));
          
          // 5. Entra no App
          onLogin(parsedState);
        } else {
          // Se a nuvem diz que falhou, verificamos se é erro de senha ou usuário inexistente
          setError(data.error || "E-mail ou senha incorretos na nuvem.");
        }
      } else {
        // MODO SIGNUP: Registro de Nova Confeitaria
        const checkRes = await fetch(`${backendUrl}?email=${encodeURIComponent(emailKey)}`, { redirect: 'follow' });
        const checkData = await checkRes.json();

        if (checkData.exists) {
          setError("Este e-mail já possui uma conta. Tente fazer login.");
          setMode('login');
          setLoading(false);
          return;
        }

        const initialState: AppState = {
          user: { email: emailKey, role: 'Dono' },
          products: [], stock: [], sales: [], orders: [], expenses: [], losses: [], collaborators: [], customers: [], productions: [], collaborators_list: []
        } as any;

        // Salva local inicial
        const localUsers = JSON.parse(localStorage.getItem('doce_users') || '{}');
        localUsers[emailKey] = { password: passInput, role: 'Dono' };
        localStorage.setItem('doce_users', JSON.stringify(localUsers));
        localStorage.setItem('doce_last_user', emailKey);
        localStorage.setItem(`doce_backup_${emailKey}`, JSON.stringify(initialState));

        // Envia para a nuvem
        await fetch(backendUrl, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({ 
            email: emailKey, 
            pass: passInput,
            state: JSON.stringify(initialState)
          })
        });

        onLogin(initialState);
      }
    } catch (e) {
      console.error("Login Error:", e);
      setError("Falha na conexão. Verifique sua internet ou tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FFF9FB] flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-pink-100 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>

      <div className="mb-10 text-center z-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="w-24 h-24 bg-pink-500 rounded-[35px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-pink-200 rotate-6 hover:rotate-0 transition-all">
          <Cake size={48} className="text-white" />
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">Doce Controle</h1>
        <p className="text-pink-400 font-bold text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-2">
           <Sparkles size={12}/> Gestão em Nuvem Multi-Dispositivo <Sparkles size={12}/>
        </p>
      </div>

      <div className="bg-white w-full max-w-sm p-10 rounded-[50px] shadow-2xl border border-pink-50 space-y-8 relative z-10">
        <div className="flex bg-gray-50 p-1.5 rounded-2xl">
          <button 
            onClick={() => { setMode('login'); setError(''); }} 
            className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'login' ? 'bg-white text-pink-500 shadow-md' : 'text-gray-400'}`}
          >
            <LogIn size={14}/> Entrar
          </button>
          <button 
            onClick={() => { setMode('signup'); setError(''); }} 
            className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'signup' ? 'bg-white text-pink-500 shadow-md' : 'text-gray-400'}`}
          >
            <UserPlus size={14}/> Criar Perfil
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleAction} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
              <input 
                type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                placeholder="seu@email.com" 
                className="w-full pl-16 pr-8 py-5 bg-gray-50 rounded-[28px] border-2 border-transparent focus:border-pink-200 outline-none font-bold text-gray-700 transition-all shadow-inner focus:bg-white" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sua Senha</label>
            <div className="relative">
              <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
              <input 
                type="password" required value={password} onChange={e => setPassword(e.target.value)} 
                placeholder="••••••" 
                className="w-full pl-16 pr-8 py-5 bg-gray-50 rounded-[28px] border-2 border-transparent focus:border-pink-200 outline-none font-bold text-gray-700 transition-all shadow-inner focus:bg-white" 
              />
            </div>
          </div>

          <button 
            type="submit" disabled={loading} 
            className="w-full py-6 bg-pink-500 text-white rounded-[32px] font-black shadow-xl shadow-pink-100 flex items-center justify-center gap-3 active:scale-95 transition-all text-lg hover:bg-pink-600 group disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : (
              <>
                {mode === 'login' ? 'Acessar Nuvem' : 'Começar Agora'} 
                <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
      
      <p className="mt-12 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Micro SaaS • Autenticação Centralizada</p>
    </div>
  );
};

export default Login;
