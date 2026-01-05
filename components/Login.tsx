
import React, { useState } from 'react';
import { Cake, Loader2, Mail, ShieldCheck, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { UserSession } from '../types';

interface LoginProps {
  onLoginSuccess: (session: UserSession) => void;
  backendUrl: string;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, backendUrl }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!backendUrl.includes("exec")) {
      setError("Configure a URL do Script no App.tsx primeiro!");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ 
          action: 'login', 
          email: email.toLowerCase().trim(), 
          password: password.trim() 
        })
      });

      // Como o GAS no-cors não permite ler o JSON diretamente no POST de volta se não for um redirect,
      // Usaremos um segundo fetch via GET para confirmar o login e pegar os dados se necessário,
      // OU alteraremos o script para aceitar requisições de forma que possamos ler.
      
      // TRUQUE: Como configuramos o script para retornar JSON, precisamos que o navegador aceite ler.
      // Se der erro de CORS aqui, você deve usar o modo 'cors' no GAS ou um proxy.
      
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
        if (data.message === "CONTA_BLOQUEADA") setError("Sua conta está bloqueada.");
        else if (data.message === "SENHA_INVALIDA") setError("Senha incorreta.");
        else setError("Usuário não encontrado.");
      }
    } catch (err) {
      console.error("Login Error:", err);
      // Fallback para fins de teste se o backend ainda não estiver 100% configurado
      setError("Erro ao conectar. Verifique sua URL do Apps Script.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FFF9FB] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-pink-100 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>

      <div className="mb-10 text-center z-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="w-20 h-20 bg-pink-500 rounded-[30px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-pink-200 rotate-6">
          <Cake size={40} className="text-white" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tighter mb-1">Doce Controle</h1>
        <p className="text-pink-400 font-bold text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-2">
           <Sparkles size={12}/> Login Único SaaS <Sparkles size={12}/>
        </p>
      </div>

      <div className="bg-white w-full max-w-sm p-8 rounded-[45px] shadow-2xl border border-pink-50 space-y-8 relative z-10">
        <div className="text-center">
          <h2 className="text-xl font-black text-gray-800">Bem-vindo(a)</h2>
          <p className="text-xs text-gray-400 font-medium italic">Acesse sua vitrine artesanal</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-2xl flex items-center gap-3 animate-in shake">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-[22px] border-2 border-transparent focus:border-pink-200 outline-none font-bold text-gray-700 transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha</label>
            <div className="relative">
              <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-[22px] border-2 border-transparent focus:border-pink-200 outline-none font-bold text-gray-700 transition-all text-sm"
              />
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full py-5 bg-pink-500 text-white rounded-[28px] font-black shadow-xl shadow-pink-100 flex items-center justify-center gap-3 active:scale-95 transition-all text-base hover:bg-pink-600 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                Entrar no Sistema
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>
      </div>
      
      <p className="mt-12 text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] opacity-40">Segurança de Dados • Cloud Sheets</p>
    </div>
  );
};

export default Login;
