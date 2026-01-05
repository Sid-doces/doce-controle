
import React, { useState, useRef, useMemo } from 'react';
import { AppState, Collaborator } from '../types';
import { 
  User, Shield, Users, Mail, Phone, Calendar, Star, Lock, Key, 
  Plus, Trash2, CheckCircle, AtSign, ShieldCheck, Smartphone, 
  ArrowRight, X, Percent, Share2, Download, Link2, Globe, Database, ShieldAlert, CloudLightning, ExternalLink, RefreshCw, Copy, Check, Upload, Eye, Search, BarChart3, Activity, Save, Sparkles, Cloud, Wifi, WifiOff, Loader2, LogOut
} from 'lucide-react';

interface ProfileProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  daysRemaining: number;
  onSync?: () => void;
  cloudStatus?: 'online' | 'syncing' | 'error';
  backendUrl: string; // Recebe a URL do App.tsx
  onLogout?: () => void; // Nova função recebida
}

const Profile: React.FC<ProfileProps> = ({ state, setState, daysRemaining, onSync, cloudStatus, backendUrl, onLogout }) => {
  const [activeSection, setActiveSection] = useState<'me' | 'team' | 'config' | 'security' | 'cloud'>('me');
  const [showAddCollabModal, setShowAddCollabModal] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [editName, setEditName] = useState(state.user?.name || '');
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [collabEmail, setCollabEmail] = useState('');
  const [collabPass, setCollabPass] = useState('');
  const [collabRole, setCollabRole] = useState<'Auxiliar' | 'Sócio' | 'Vendedor'>('Auxiliar');
  const [collabCommission, setCollabCommission] = useState<number>(0);

  const userEmail = state.user?.email || '';

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedEmail = collabEmail.toLowerCase().trim();
    
    if (!formattedEmail || !collabPass) {
      showToast("Preencha e-mail e senha.", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'create_collaborator',
          companyId: state.user?.companyId,
          email: formattedEmail,
          password: collabPass,
          role: collabRole,
          name: formattedEmail.split('@')[0]
        })
      });

      const result = await response.json();

      if (result.success) {
        const newCollab: Collaborator = {
          id: Math.random().toString(36).substr(2, 9),
          companyId: state.user?.companyId || '',
          email: formattedEmail,
          role: collabRole,
          addedAt: new Date().toISOString(),
          commissionRate: collabRole === 'Vendedor' ? (collabCommission || state.settings?.commissionRate || 0) : 0
        };
        
        setState(prev => ({ 
          ...prev, 
          collaborators: [...(prev.collaborators || []), newCollab] 
        }));
        
        setShowAddCollabModal(false);
        setCollabEmail('');
        setCollabPass('');
        showToast("Perfil de equipe criado e salvo na planilha!");
      } else {
        showToast(result.message || "Erro no servidor.", "error");
      }
    } catch (err) {
      showToast("Falha de conexão com a planilha.", "error");
    } finally {
      setLoading(false);
    }
  };

  const removeCollaborator = (id: string, email: string) => {
    if (confirm(`Remover acesso de ${email}?`)) {
      setState(prev => ({
        ...prev,
        collaborators: prev.collaborators.filter(c => c.id !== id)
      }));
      showToast("Colaborador removido.");
    }
  };

  const handleSaveSettings = () => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings!, commissionRate: collabCommission }
    }));
    showToast("Configurações salvas!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {message && (
        <div className={`fixed top-10 right-10 z-[300] p-5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300 ${message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {message.type === 'success' ? <CheckCircle size={24} /> : <ShieldAlert size={24} />}
          <span className="font-black text-sm uppercase tracking-widest">{message.text}</span>
        </div>
      )}

      <header className="px-1 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Configurações ⚙️</h1>
          <p className="text-gray-500 font-medium italic">Gerencie sua conta e sua equipe.</p>
        </div>
        <div className={`px-4 py-2 rounded-full flex items-center gap-2 border ${cloudStatus === 'online' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : cloudStatus === 'syncing' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
          {cloudStatus === 'online' ? <Wifi size={14} /> : cloudStatus === 'syncing' ? <RefreshCw size={14} className="animate-spin" /> : <WifiOff size={14} />}
          <span className="text-[10px] font-black uppercase tracking-widest">{cloudStatus === 'online' ? 'Nuvem OK' : cloudStatus === 'syncing' ? 'Sincronizando' : 'Erro Nuvem'}</span>
        </div>
      </header>

      <div className="flex bg-white p-2 rounded-[30px] border border-gray-100 shadow-sm overflow-x-auto no-scrollbar">
        {[
          { id: 'me', label: 'Meu Perfil', icon: User },
          { id: 'team', label: 'Equipe', icon: Users },
          { id: 'config', label: 'Geral', icon: Percent },
          { id: 'security', label: 'Segurança', icon: Lock },
          { id: 'cloud', label: 'Nuvem', icon: Cloud },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`flex items-center gap-2 px-8 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeSection === tab.id ? 'bg-pink-500 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {activeSection === 'me' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
            <div className="bg-white p-10 rounded-[45px] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
              <div className="w-32 h-32 bg-pink-50 text-pink-500 rounded-[40px] flex items-center justify-center shadow-inner shrink-0">
                <User size={60} />
              </div>
              <div className="flex-1 text-center md:text-left space-y-4">
                <div>
                   <h2 className="text-2xl font-black text-gray-800">{state.user?.name || 'Chef Doce'}</h2>
                   <p className="text-sm text-gray-400 font-bold">{userEmail}</p>
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                   <span className="px-4 py-2 bg-pink-100 text-pink-600 rounded-xl text-[10px] font-black uppercase tracking-widest">{state.user?.role || 'Dono'}</span>
                   <span className="px-4 py-2 bg-emerald-100 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Ativo</span>
                   <span className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest">ID: {state.user?.companyId}</span>
                </div>
                
                <div className="pt-6 border-t border-gray-50 mt-4">
                  <button 
                    onClick={onLogout}
                    className="flex items-center justify-center gap-3 px-8 py-4 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-red-100 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm w-full md:w-fit"
                  >
                    <LogOut size={16} /> Encerrar Sessão do App
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'team' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
            <div className="bg-indigo-600 p-10 rounded-[45px] text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
               <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                  <div className="text-center md:text-left">
                     <h3 className="text-2xl font-black tracking-tight mb-2">Sua Equipe Doce 👩‍🍳</h3>
                     <p className="text-indigo-100 text-sm font-medium">Crie perfis para seus ajudantes logarem de outros aparelhos.</p>
                  </div>
                  <button onClick={() => setShowAddCollabModal(true)} className="px-8 py-5 bg-white text-indigo-600 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-pink-50 transition-all">
                     <Plus size={20} /> Adicionar Membro
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {state.collaborators?.length > 0 ? (
                 state.collaborators.map(collab => (
                   <div key={collab.id} className="bg-white p-6 rounded-[35px] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center shadow-sm">
                            <AtSign size={20} />
                         </div>
                         <div>
                            <p className="font-black text-gray-800 text-sm leading-tight">{collab.email}</p>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{collab.role}</p>
                         </div>
                      </div>
                      <button onClick={() => removeCollaborator(collab.id, collab.email)} className="p-3 text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                   </div>
                 ))
               ) : (
                 <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-100 rounded-[45px]">
                    <Users className="mx-auto text-gray-100 mb-4" size={48} />
                    <p className="text-gray-400 font-black italic">Ninguém na equipe ainda.</p>
                 </div>
               )}
            </div>
          </div>
        )}

        {activeSection === 'cloud' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
             <div className="bg-white p-10 rounded-[45px] border border-gray-100 shadow-sm flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center shadow-inner">
                   <Database size={40} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-gray-800">Status da Planilha</h3>
                   <p className="text-gray-400 text-sm font-medium px-4">Seus dados estão sendo enviados para a URL configurada.</p>
                </div>
                <div className="w-full p-6 bg-gray-50 rounded-3xl border border-gray-100 text-left overflow-hidden">
                   <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Endpoint de Conexão</p>
                   <code className="text-[10px] text-indigo-600 break-all font-mono">{backendUrl}</code>
                </div>
                <button onClick={onSync} disabled={cloudStatus === 'syncing'} className="w-full py-5 bg-indigo-500 text-white rounded-[28px] font-black shadow-xl shadow-indigo-100 uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                   {cloudStatus === 'syncing' ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                   Testar Conexão Agora
                </button>
             </div>
          </div>
        )}
      </div>

      {showAddCollabModal && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-10 rounded-[45px] shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Novo Acesso 👩‍🍳</h2>
              <button onClick={() => setShowAddCollabModal(false)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><X size={28}/></button>
            </div>
            
            <form onSubmit={handleAddCollaborator} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail para Login</label>
                <input 
                  type="email" required placeholder="Ex: ajudante@seuemail.com"
                  className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-500 outline-none font-bold text-gray-700 h-[62px]"
                  value={collabEmail}
                  onChange={e => setCollabEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
                <input 
                  type="text" required placeholder="Defina uma senha simples"
                  className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-500 outline-none font-bold text-gray-700 h-[62px]"
                  value={collabPass}
                  onChange={e => setCollabPass(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Função da Equipe</label>
                <select 
                  className="w-full px-4 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 outline-none font-black text-[10px] uppercase h-[62px]"
                  value={collabRole}
                  onChange={e => setCollabRole(e.target.value as any)}
                >
                  <option value="Auxiliar">Auxiliar (Produção e Agenda)</option>
                  <option value="Vendedor">Vendedor (Acesso limitado a Vendas)</option>
                  <option value="Sócio">Sócio (Acesso Completo)</option>
                </select>
              </div>

              <button type="submit" disabled={loading} className="w-full py-5 bg-pink-500 text-white rounded-[30px] font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={20} /> : "Criar Perfil na Planilha"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
