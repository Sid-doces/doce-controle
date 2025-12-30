
import React, { useState, useEffect } from 'react';
import { Cake, ShieldAlert, Sparkles, Loader2, RefreshCw, Smartphone, Key, Mail, Search, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, hasPlan: boolean) => void;
  onShowPricing: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onShowPricing }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [diagnosis, setDiagnosis] = useState<string | null>(null);

  const norm = (email: string) => email.toLowerCase().trim();

  const handleManualSync = async () => {
    setSyncing(true);
    setError('');
    setDiagnosis(null);
    const cloudUrl = localStorage.getItem('doce_temp_cloud_url');
    
    if (!cloudUrl) {
      setError("Aparelho não vinculado. Use o Link de Convite oficial.");
      setSyncing(false);
      return;
    }

    try {
      const res = await fetch(cloudUrl);
      const data = await res.json();
      if (data && data.usersRegistry) {
        const localUsers = JSON.parse(localStorage.getItem('doce_users') || '{}');
        const merged = { ...localUsers, ...data.usersRegistry };
        localStorage.setItem('doce_users', JSON.stringify(merged));
        setDiagnosis("Conexão OK! ✅ Equipe atualizada.");
      } else {
        setDiagnosis("Script respondeu, mas sem dados de usuários. ⚠️");
      }
    } catch (e) {
      setError("Falha na conexão com o Google. Verifique a internet e o Script.");
      setDiagnosis("Erro de Rede: O script não está acessível.");
    } finally {
      setSyncing(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formattedEmail = norm(email);
    let users = JSON.parse(localStorage.getItem('doce_users') || '{}');
    let user = users[formattedEmail];

    if (!user) {
      const cloudUrl = localStorage.getItem('doce_temp_cloud_url');
      if (cloudUrl) {
        try {
          const res = await fetch(cloudUrl);
          const data = await res.json();
          if (data && data.usersRegistry) {
            users = { ...users, ...data.usersRegistry };
            localStorage.setItem('doce_users', JSON.stringify(users));
            user = users[formattedEmail];
          }
        } catch(e) {}
      }
    }

    if (!user) {
      setError('E-mail não encontrado. Você já foi convidado pelo Dono?');
      setLoading(false);
      return;
    }

    const storedPass = typeof user === 'string' ? user : user.password;
    if (storedPass !== pass) {
      setError('Sua senha está incorreta!');
      setLoading(false);
      return;
    }

    const dataOwnerEmail = norm(user.ownerEmail || formattedEmail);
    const ownerRecord = users[dataOwnerEmail];
    const hasPlan = ownerRecord?.plan && ownerRecord.plan !== 'none';

    localStorage.setItem('doce_last_user', formattedEmail);
    onLogin(formattedEmail, hasPlan);
    setLoading(false);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const formattedEmail = norm(email);
    const users = JSON.parse(localStorage.getItem('doce_users') || '{}');
    
    if (users[formattedEmail]) {
      setError('Este e-mail já possui uma conta.');
      setLoading(false);
      return;
    }
    
    users[formattedEmail] = { 
      password: pass, 
      plan: 'none', 
      role: 'Dono', 
      activationDate: null, 
      ownerEmail: formattedEmail 
    };
    
    localStorage.setItem('doce_users', JSON.stringify(users));
    localStorage.setItem('doce_last_user', formattedEmail);
    setIsRegistering(false);
    setLoading(false);
    onLogin(formattedEmail, false);
  };

  const hasAnchorUrl = !!localStorage.getItem('doce_temp_cloud_url');

  return (
    <div className="min-h-screen w-full bg-[#FFF9FB] flex flex-col items-center justify-center p-6 overflow-y-auto">
      <div className="mb-8 text-center animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-pink-100 rotate-6">
          <Cake className="text-white" size={40} />
        </div>
        <h1 className="text-3xl font-black text-gray-800 tracking-tight leading-none">Doce Controle</h1>
        <p className="text-pink-400 font-bold mt-2 italic text-sm">A gestão doce da sua confeitaria</p>
      </div>

      <div className="bg-white w-full max-w-md p-10 rounded-[45px] shadow-2xl border border-pink-50 relative animate-in zoom-in duration-500">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-pink-500"></div>

        <div className="mb-8 flex bg-gray-50 p-1.5 rounded-2xl">
          <button onClick={() => setIsRegistering(false)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest ${!isRegistering ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}>Acessar</button>
          <button onClick={() => setIsRegistering(true)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest ${isRegistering ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}>Nova Conta</button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-500 text-[10px] font-black uppercase rounded-2xl flex items-center gap-2">
            <ShieldAlert size={14} /> {error}
          </div>
        )}

        {diagnosis && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 text-indigo-500 text-[10px] font-black uppercase rounded-2xl flex items-center gap-2">
            <AlertCircle size={14} /> {diagnosis}
          </div>
        )}

        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Mail size={10}/> E-mail</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@doce.com" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-200 outline-none font-bold text-gray-700" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Key size={10}/> Senha</label>
            <input type="password" required value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-200 outline-none font-bold text-gray-700" />
          </div>

          <button type="submit" disabled={loading} className="w-full text-white font-black text-sm py-5 rounded-3xl transition-all shadow-xl bg-pink-500 hover:bg-pink-600 shadow-pink-100 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isRegistering ? "Criar Minha Conta" : "Entrar no App")}
          </button>
        </form>

        {!isRegistering && (
          <div className="mt-8 pt-6 border-t border-gray-50 text-center space-y-4">
            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-3 text-left">
               <Smartphone size={16} className="text-indigo-500 shrink-0 mt-0.5" />
               <div className="flex-1">
                 <p className="text-[10px] text-indigo-700 font-bold leading-relaxed">
                   {hasAnchorUrl ? "Aparelho Vinculado à Nuvem!" : "Funcionário? Peça o Link de Convite para vincular este aparelho."}
                 </p>
                 {hasAnchorUrl && (
                   <button onClick={handleManualSync} className="mt-2 text-[8px] font-black uppercase text-indigo-600 flex items-center gap-1">
                     {syncing ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />} Forçar Sincronia de Equipe
                   </button>
                 )}
               </div>
            </div>
            <button onClick={onShowPricing} className="text-pink-500 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 w-full">Ver Planos <Sparkles size={14}/></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
