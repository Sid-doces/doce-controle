
import React, { useState, useRef, useMemo } from 'react';
import { AppState, Collaborator } from '../types';
import { 
  User, Shield, Users, Mail, Phone, Calendar, Star, Lock, Key, 
  Plus, Trash2, CheckCircle, AtSign, ShieldCheck, Smartphone, 
  ArrowRight, X, Percent, Share2, Download, Link2, Globe, Database, ShieldAlert, CloudLightning, ExternalLink, RefreshCw, Copy, Check, Upload, Eye, Search, BarChart3, Activity, Save, Sparkles, Cloud, Wifi, WifiOff
} from 'lucide-react';

interface ProfileProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  daysRemaining: number;
  onSync?: () => void;
  cloudStatus?: 'online' | 'syncing' | 'error';
}

const Profile: React.FC<ProfileProps> = ({ state, setState, daysRemaining, onSync, cloudStatus }) => {
  const [activeSection, setActiveSection] = useState<'me' | 'team' | 'config' | 'security' | 'cloud'>('me');
  const [showAddCollabModal, setShowAddCollabModal] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  
  // States para edição de perfil
  const [editName, setEditName] = useState(state.user?.name || '');
  
  // States para troca de senha
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });

  // States para novo colaborador
  const [collabEmail, setCollabEmail] = useState('');
  const [collabPass, setCollabPass] = useState('');
  const [collabRole, setCollabRole] = useState<'Auxiliar' | 'Sócio' | 'Vendedor'>('Auxiliar');
  const [collabCommission, setCollabCommission] = useState<number>(0);

  const userEmail = state.user?.email || '';

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, name: editName } : null
    }));
    showToast("Perfil atualizado com sucesso!");
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) {
      showToast("As senhas não coincidem!", "error");
      return;
    }

    const email = userEmail.toLowerCase().trim();
    const users = JSON.parse(localStorage.getItem('doce_users') || '{}');
    
    if (users[email] && users[email].password === passwords.current) {
      users[email].password = passwords.next;
      localStorage.setItem('doce_users', JSON.stringify(users));
      setPasswords({ current: '', next: '', confirm: '' });
      showToast("Senha alterada com sucesso!");
    } else {
      showToast("Senha atual incorreta!", "error");
    }
  };

  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedEmail = collabEmail.toLowerCase().trim();
    
    if (!formattedEmail || !collabPass) {
      showToast("Preencha todos os campos.", "error");
      return;
    }

    const ownerEmail = (state.user?.ownerEmail || state.user?.email || '').toLowerCase().trim();
    const currentUsers = JSON.parse(localStorage.getItem('doce_users') || '{}');
    
    currentUsers[formattedEmail] = {
      password: String(collabPass),
      role: collabRole,
      ownerEmail: ownerEmail,
      plan: 'linked',
      googleSheetUrl: state.user?.googleSheetUrl || localStorage.getItem('doce_temp_cloud_url'),
      commissionRate: collabRole === 'Vendedor' ? collabCommission : 0
    };
    localStorage.setItem('doce_users', JSON.stringify(currentUsers));

    // Fix: Adding companyId to the new Collaborator object
    const newCollab: Collaborator = {
      id: Math.random().toString(36).substr(2, 9),
      companyId: state.user?.companyId || '',
      email: formattedEmail,
      role: collabRole,
      addedAt: new Date().toISOString(),
      commissionRate: collabRole === 'Vendedor' ? collabCommission : 0
    };
    
    setState(prev => ({ 
      ...prev, 
      collaborators: [...(prev.collaborators || []), newCollab] 
    }));
    
    setShowAddCollabModal(false);
    setCollabEmail('');
    setCollabPass('');
    setCollabCommission(0);
    showToast("Colaborador autorizado!");
  };

  const handleRemoveCollaborator = (collabId: string, emailToRemove: string) => {
    if (!confirm(`Remover acesso de ${emailToRemove}?`)) return;

    const formattedEmail = emailToRemove.toLowerCase().trim();
    const currentUsers = JSON.parse(localStorage.getItem('doce_users') || '{}');
    delete currentUsers[formattedEmail];
    localStorage.setItem('doce_users', JSON.stringify(currentUsers));

    setState(prev => ({
      ...prev,
      collaborators: (prev.collaborators || []).filter(c => c.id !== collabId)
    }));
    showToast("Acesso removido.");
  };

  const updateGlobalCommission = (rate: number) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, commissionRate: rate }
    }));
  };

  const handleTestConnection = () => {
    if (onSync) {
      onSync();
      showToast("Iniciando teste de sincronização...");
    }
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
          <p className="text-gray-500 font-medium italic">Sua conta, sua equipe, seu controle.</p>
        </div>
        <div className={`px-4 py-2 rounded-full flex items-center gap-2 border ${cloudStatus === 'online' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : cloudStatus === 'syncing' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
          {cloudStatus === 'online' ? <Wifi size={14} /> : cloudStatus === 'syncing' ? <RefreshCw size={14} className="animate-spin" /> : <WifiOff size={14} />}
          <span className="text-[10px] font-black uppercase tracking-widest">{cloudStatus === 'online' ? 'Nuvem OK' : cloudStatus === 'syncing' ? 'Sincronizando' : 'Offline'}</span>
        </div>
      </header>

      {/* Menu de Abas */}
      <div className="flex bg-white p-2 rounded-[30px] border border-gray-100 shadow-sm overflow-x-auto no-scrollbar">
        {[
          { id: 'me', label: 'Meu Perfil', icon: User },
          { id: 'team', label: 'Equipe', icon: Users },
          { id: 'config', label: 'Comissões', icon: Percent },
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
                   <h2 className="text-2xl font-black text-gray-800">{state.user?.name || 'Chef Confeiteiro'}</h2>
                   <p className="text-sm text-gray-400 font-bold">{userEmail}</p>
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                   <span className="px-4 py-2 bg-pink-100 text-pink-600 rounded-xl text-[10px] font-black uppercase tracking-widest">{state.user?.role || 'Dono'}</span>
                   <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest">Plano Ativo: {daysRemaining} dias</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="bg-white p-10 rounded-[45px] border border-gray-100 shadow-sm space-y-8">
              <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><User size={20} className="text-pink-500"/> Editar Dados Básicos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo / Nome Fantasia</label>
                    <input 
                      type="text" 
                      className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-500 outline-none font-bold transition-all"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Como você quer ser chamado?"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 opacity-50">E-mail (Não alterável)</label>
                    <input 
                      disabled
                      type="email" 
                      className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-400 font-bold outline-none cursor-not-allowed"
                      value={userEmail}
                    />
                 </div>
              </div>
              <button type="submit" className="px-10 py-5 bg-pink-500 text-white rounded-[28px] font-black text-sm uppercase tracking-widest shadow-xl shadow-pink-100 hover:scale-[1.02] transition-all">Salvar Alterações</button>
            </form>
          </div>
        )}

        {activeSection === 'team' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
            <div className="bg-indigo-600 p-10 rounded-[45px] text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
               <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                  <div className="text-center md:text-left">
                     <h3 className="text-2xl font-black tracking-tight mb-2">Sua Equipe Doce</h3>
                     <p className="text-indigo-100 text-sm font-medium">Gerencie quem pode vender e ajudar na produção.</p>
                  </div>
                  <button onClick={() => setShowAddCollabModal(true)} className="px-8 py-5 bg-white text-indigo-600 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-pink-50 transition-all">
                     <Plus size={20} /> Convidar Membro
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {state.collaborators?.map(collab => (
                 <div key={collab.id} className="bg-white p-6 rounded-[35px] border border-gray-100 shadow-sm flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center shadow-sm">
                          <AtSign size={20} />
                       </div>
                       <div>
                          <p className="font-black text-gray-800 text-sm leading-tight">{collab.email}</p>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{collab.role} • {collab.role === 'Vendedor' ? `${collab.commissionRate}% Comis.` : 'Sem Comissão'}</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveCollaborator(collab.id, collab.email)}
                      className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                 </div>
               ))}
               {(!state.collaborators || state.collaborators.length === 0) && (
                 <div className="col-span-full py-20 text-center text-gray-300 font-black italic border-2 border-dashed border-gray-100 rounded-[45px]">
                    Sua equipe ainda está pequena. Convide alguém!
                 </div>
               )}
            </div>
          </div>
        )}

        {activeSection === 'config' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
             <div className="bg-white p-10 rounded-[45px] border border-gray-100 shadow-sm space-y-8 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center gap-6">
                   <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[30px] flex items-center justify-center shadow-inner">
                      <Percent size={40} />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black text-gray-800 tracking-tight">Regras de Comissão 💸</h3>
                      <p className="text-gray-400 font-medium text-sm">Configure quanto seus vendedores ganham por venda.</p>
                   </div>
                </div>

                <div className="p-8 bg-gray-50 rounded-[40px] border border-gray-100 space-y-6">
                   <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div>
                         <h4 className="font-black text-gray-700 text-sm uppercase tracking-widest">Comissão Global PDV</h4>
                         <p className="text-xs text-gray-400 font-medium">Taxa padrão para novos vendedores.</p>
                      </div>
                      <div className="relative w-full md:w-32">
                         <input 
                           type="number" 
                           className="w-full px-6 py-5 rounded-2xl bg-white border-2 border-gray-100 font-black text-2xl text-emerald-500 outline-none focus:border-emerald-300 transition-all text-center pr-10"
                           value={state.settings?.commissionRate || 0}
                           onChange={e => updateGlobalCommission(Number(e.target.value))}
                         />
                         <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 font-black">%</span>
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-pink-500 p-10 rounded-[45px] text-white shadow-xl shadow-pink-100">
                <h4 className="font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles size={18}/> Dica de Gestão</h4>
                <p className="text-base font-medium opacity-90 leading-relaxed">Vendedores motivados vendem mais! Uma comissão entre 5% e 15% é o ideal para o mercado de doces artesanais.</p>
             </div>
          </div>
        )}

        {activeSection === 'security' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
             <form onSubmit={handleUpdatePassword} className="bg-white p-10 rounded-[45px] border border-gray-100 shadow-sm space-y-8">
                <h3 className="text-xl font-black text-gray-800 flex items-center gap-2"><Lock size={20} className="text-pink-500" /> Alterar Senha de Acesso</h3>
                
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha Atual</label>
                      <input 
                        type="password" required
                        className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-500 outline-none font-bold transition-all"
                        value={passwords.current}
                        onChange={e => setPasswords({...passwords, current: e.target.value})}
                      />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nova Senha</label>
                         <input 
                           type="password" required
                           className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-500 outline-none font-bold transition-all"
                           value={passwords.next}
                           onChange={e => setPasswords({...passwords, next: e.target.value})}
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirmar Nova Senha</label>
                         <input 
                           type="password" required
                           className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-500 outline-none font-bold transition-all"
                           value={passwords.confirm}
                           onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                         />
                      </div>
                   </div>
                </div>

                <button type="submit" className="w-full md:w-auto px-10 py-5 bg-gray-900 text-white rounded-[28px] font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Atualizar Credenciais</button>
             </form>
          </div>
        )}

        {activeSection === 'cloud' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
             <div className="bg-white p-10 rounded-[45px] border border-gray-100 shadow-sm space-y-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                   <div className="flex items-center gap-6">
                      <div className={`w-20 h-20 rounded-[30px] flex items-center justify-center shadow-inner ${cloudStatus === 'online' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                         <Database size={40} />
                      </div>
                      <div>
                         <h3 className="text-2xl font-black text-gray-800 tracking-tight">Diagnóstico de Nuvem ☁️</h3>
                         <p className="text-gray-400 font-medium text-sm">Status da sua conexão com o servidor.</p>
                      </div>
                   </div>
                   <button 
                     onClick={handleTestConnection}
                     disabled={cloudStatus === 'syncing'}
                     className="px-8 py-5 bg-gray-900 text-white rounded-[28px] font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-black transition-all disabled:opacity-50"
                   >
                     <RefreshCw size={20} className={cloudStatus === 'syncing' ? 'animate-spin' : ''} /> Testar Conexão
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="p-6 bg-gray-50 rounded-[30px] border border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status Atual</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${cloudStatus === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                        <span className="font-black text-gray-800">{cloudStatus === 'online' ? 'Conectado e Seguro' : cloudStatus === 'syncing' ? 'Sincronizando Dados...' : 'Erro de Conexão'}</span>
                      </div>
                   </div>
                   <div className="p-6 bg-gray-50 rounded-[30px] border border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Último Backup Local</p>
                      <div className="flex items-center gap-2">
                        <Save size={14} className="text-indigo-500" />
                        <span className="font-black text-gray-800">{new Date().toLocaleTimeString('pt-BR')}</span>
                      </div>
                   </div>
                </div>

                <div className="p-8 bg-indigo-50 rounded-[40px] border border-indigo-100 flex items-start gap-4">
                   <ShieldCheck size={32} className="text-indigo-500 shrink-0" />
                   <div>
                      <h4 className="font-black text-gray-800 text-sm uppercase tracking-widest mb-1">Sincronização Ativa</h4>
                      <p className="text-xs text-indigo-700 font-medium">O Doce Controle salva seus dados localmente instantaneamente e na nuvem a cada 3 segundos de inatividade. Mesmo sem internet, você continua vendendo!</p>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* MODAL ADICIONAR COLABORADOR */}
      {showAddCollabModal && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-10 rounded-[45px] shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Novo Acesso 👩‍🍳</h2>
              <button onClick={() => setShowAddCollabModal(false)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><X size={28}/></button>
            </div>
            
            <form onSubmit={handleAddCollaborator} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail do Membro</label>
                <input 
                  type="email" required placeholder="ex: ajudante@doce.com"
                  className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-500 outline-none font-bold text-gray-700"
                  value={collabEmail}
                  onChange={e => setCollabEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
                <input 
                  type="text" required placeholder="Defina uma senha simples"
                  className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-500 outline-none font-bold text-gray-700"
                  value={collabPass}
                  onChange={e => setCollabPass(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Função</label>
                  <select 
                    className="w-full px-4 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 outline-none font-black text-[10px] uppercase h-[60px]"
                    value={collabRole}
                    onChange={e => setCollabRole(e.target.value as any)}
                  >
                    <option value="Vendedor">Vendedor</option>
                    <option value="Auxiliar">Auxiliar</option>
                    <option value="Sócio">Sócio</option>
                  </select>
                </div>
                {collabRole === 'Vendedor' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Comissão (%)</label>
                    <input 
                      type="number"
                      className="w-full px-4 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 outline-none font-black text-lg text-pink-500 text-center h-[60px]"
                      value={collabCommission}
                      onChange={e => setCollabCommission(Number(e.target.value))}
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 space-y-4">
                <button type="submit" className="w-full py-5 bg-pink-500 text-white rounded-[30px] font-black text-xs uppercase tracking-widest shadow-xl shadow-pink-100 hover:bg-pink-600 active:scale-95 transition-all">Liberar Acesso Agora</button>
                <p className="text-[9px] text-gray-400 font-bold text-center uppercase tracking-tight italic">O colaborador deve usar o e-mail e senha acima para logar.</p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
