
import React, { useState } from 'react';
import { Cake, Loader2, Mail, ShieldCheck, ArrowRight, Sparkles, AlertCircle, User, Store } from 'lucide-react';
import { UserSession } from '../types';

interface LoginProps {
  onLoginSuccess: (session: UserSession) => void;
  backendUrl: string;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, backendUrl }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!backendUrl.includes("exec")) {
      setError("Configure a URL do Script no App.tsx primeiro!");
      setLoading(false);
      return;
    }

    try {
      const payload = isRegister 
        ? { action: 'register', name, company, email: email.toLowerCase().trim(), password: password.trim() }
        : { action: 'login', email: email.toLowerCase().trim(), password: password.trim() };

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success && data.companyId) {
        localStorage.setItem('doce_user_id', data.userId);
        localStorage.setItem('doce_company_id', data.companyId);
        localStorage.setItem('doce_role', data.role || 'Dono');
        localStorage.setItem('doce_email', data.email);
        localStorage.setItem('doce_name', data.name || '');

        onLoginSuccess({
          userId: data.userId,
          companyId: data.companyId,
          email: data.email,
          role: data.role || 'Dono',
          name: data.name
        });
      } else {
        setError(data.message || "Erro ao processar solicitação.");
      }
    } catch (err) {
      console.error("Auth Error:", err);
      setError("Erro ao conectar com o servidor. Verifique sua internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FFF9FB] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-pink-100 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>

      <div className="mb-8 text-center z-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="w-16 h-16 bg-pink-500 rounded-[24px] flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-pink-200 rotate-6">
          <Cake size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tighter mb-1">Doce Controle</h1>
        <p className="text-pink-400 font-bold text-[8px] uppercase tracking-[0.3em] flex items-center justify-center gap-2">
           <Sparkles size={10}/> Gestão Profissional de Doces <Sparkles size={10}/>
        </p>
      </div>

      <div className="bg-white w-full max-w-sm p-8 rounded-[40px] shadow-2xl border border-pink-50 space-y-6 relative z-10">
        <div className="flex bg-gray-50 p-1 rounded-2xl mb-2">
          <button 
            onClick={() => { setIsRegister(false); setError(''); }}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isRegister ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}
          >
            Entrar
          </button>
          <button 
            onClick={() => { setIsRegister(true); setError(''); }}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isRegister ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}
          >
            Criar Conta
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-2xl flex items-center gap-3 animate-in shake">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Seu Nome</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                  <input 
                    type="text" required value={name} onChange={e => setName(e.target.value)}
                    placeholder="Ex: Maria Souza"
                    className="w-full pl-12 pr-6 py-3.5 bg-gray-50 rounded-[20px] border-2 border-transparent focus:border-pink-200 outline-none font-bold text-gray-700 transition-all text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome da Confeitaria</label>
                <div className="relative">
                  <Store className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                  <input 
                    type="text" required value={company} onChange={e => setCompany(e.target.value)}
                    placeholder="Ex: Doces da Vovó"
                    className="w-full pl-12 pr-6 py-3.5 bg-gray-50 rounded-[20px] border-2 border-transparent focus:border-pink-200 outline-none font-bold text-gray-700 transition-all text-sm"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input 
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full pl-12 pr-6 py-3.5 bg-gray-50 rounded-[20px] border-2 border-transparent focus:border-pink-200 outline-none font-bold text-gray-700 transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha</label>
            <div className="relative">
              <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input 
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-6 py-3.5 bg-gray-50 rounded-[20px] border-2 border-transparent focus:border-pink-200 outline-none font-bold text-gray-700 transition-all text-sm"
              />
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full py-4 bg-pink-500 text-white rounded-[24px] font-black shadow-xl shadow-pink-100 flex items-center justify-center gap-3 active:scale-95 transition-all text-sm hover:bg-pink-600 disabled:opacity-50 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (
              <>
                {isRegister ? 'Criar Minha Doceria' : 'Entrar no Sistema'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
      
      <p className="mt-8 text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] opacity-40">Segurança de Dados • Cloud Sheets</p>
    </div>
  );
};

export default Login;
