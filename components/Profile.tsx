
import React, { useState } from 'react';
import { AppState, Collaborator } from '../types';
import { User, Shield, Users, Mail, Phone, Calendar, Star, Lock, Key, Plus, Trash2, CheckCircle, AtSign, ShieldCheck, Smartphone, ArrowRight, X, Percent } from 'lucide-react';

interface ProfileProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  daysRemaining: number;
  onShowInstall?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ state, setState, daysRemaining, onShowInstall }) => {
  const [newPassword, setNewPassword] = useState({ current: '', next: '', confirm: '' });
  const [collabEmail, setCollabEmail] = useState('');
  const [collabPass, setCollabPass] = useState('');
  const [collabRole, setCollabRole] = useState<'Auxiliar' | 'Sócio' | 'Vendedor'>('Auxiliar');
  const [showAddCollabModal, setShowAddCollabModal] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const userEmail = state.user?.email || '';
  const usersRaw = localStorage.getItem('doce_users');
  const users = usersRaw ? JSON.parse(usersRaw) : {};
  const userData = users[userEmail.toLowerCase().trim()];
  const isOwner = !state.user?.ownerEmail || state.user?.ownerEmail === state.user?.email;

  const handleUpdateSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, commissionRate: val }
    }));
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const storedPass = typeof userData === 'string' ? userData : userData.password;
    if (newPassword.current !== storedPass) {
      setMessage({ text: 'Senha atual incorreta!', type: 'error' });
      return;
    }
    if (newPassword.next !== newPassword.confirm) {
      setMessage({ text: 'As novas senhas não coincidem!', type: 'error' });
      return;
    }
    if (newPassword.next.length < 3) {
      setMessage({ text: 'A nova senha deve ter pelo menos 3 caracteres.', type: 'error' });
      return;
    }
    if (typeof userData === 'string') {
      users[userEmail.toLowerCase().trim()] = newPassword.next;
    } else {
      users[userEmail.toLowerCase().trim()] = { ...userData, password: newPassword.next };
    }
    localStorage.setItem('doce_users', JSON.stringify(users));
    setMessage({ text: 'Senha alterada com sucesso!', type: 'success' });
    setNewPassword({ current: '', next: '', confirm: '' });
  };

  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabEmail.includes('@') || collabPass.length < 3) return;
    
    const formattedEmail = collabEmail.toLowerCase().trim();
    const ownerEmail = state.user?.ownerEmail || state.user?.email || '';

    const currentUsers = JSON.parse(localStorage.getItem('doce_users') || '{}');
    if (currentUsers[formattedEmail]) {
      alert("Este e-mail já está cadastrado no sistema.");
      return;
    }

    currentUsers[formattedEmail] = {
      password: collabPass,
      role: collabRole,
      ownerEmail: ownerEmail.toLowerCase().trim(),
      plan: 'linked'
    };
    localStorage.setItem('doce_users', JSON.stringify(currentUsers));

    const newCollab: Collaborator = {
      id: Math.random().toString(36).substr(2, 9),
      email: formattedEmail,
      role: collabRole,
      addedAt: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      collaborators: [...(prev.collaborators || []), newCollab]
    }));
    
    setCollabEmail('');
    setCollabPass('');
    setShowAddCollabModal(false);
    alert(`Colaborador ${formattedEmail} cadastrado! Ele já pode logar.`);
  };

  const removeCollaborator = (collab: Collaborator) => {
    if (!confirm(`Deseja remover ${collab.email}? O acesso dele será bloqueado imediatamente.`)) return;
    
    const currentUsers = JSON.parse(localStorage.getItem('doce_users') || '{}');
    delete currentUsers[collab.email.toLowerCase().trim()];
    localStorage.setItem('doce_users', JSON.stringify(currentUsers));

    setState(prev => ({
      ...prev,
      collaborators: prev.collaborators.filter(c => c.id !== collab.id)
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">Minha Conta</h1>
        <p className="text-gray-500 font-medium italic">Dados cadastrais e gestão de acessos.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-10 rounded-[45px] border border-pink-50 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-pink-500"></div>
            <div className="w-24 h-24 bg-pink-50 text-pink-500 rounded-[35px] flex items-center justify-center mx-auto mb-6 shadow-sm">
              <User size={48} />
            </div>
            <h2 className="text-xl font-black text-gray-800 break-all leading-tight mb-4">{userEmail}</h2>
            <div className="flex flex-col items-center gap-3">
              <span className="px-4 py-1.5 bg-pink-100 text-pink-600 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                Perfil: {state.user?.role || 'Dono'}
              </span>
              {isOwner && (
                <p className="text-sm font-bold text-gray-400">
                  Plano ativo por mais <span className="text-pink-500 font-black">{daysRemaining} dias</span>
                </p>
              )}
            </div>
          </div>

          {isOwner && (
            <div className="bg-white p-8 rounded-[40px] border border-indigo-50 shadow-sm space-y-4">
              <div className="flex items-center gap-3 text-indigo-600">
                 <Percent size={20} />
                 <h3 className="font-black text-sm uppercase tracking-widest">Ajustes de Venda</h3>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Comissão Vendedores (%)</label>
                 <input 
                   type="number" 
                   className="w-full px-5 py-4 rounded-2xl bg-indigo-50/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all outline-none font-black text-indigo-700 text-lg"
                   value={state.settings?.commissionRate || 0}
                   onChange={handleUpdateSettings}
                 />
                 <p className="text-[9px] text-gray-400 font-bold italic leading-tight">Valor calculado sobre o total da venda para o perfil Vendedor.</p>
              </div>
            </div>
          )}

          <button 
            onClick={onShowInstall}
            className="w-full bg-white p-8 rounded-[40px] border-2 border-dashed border-indigo-100 flex items-center gap-5 hover:border-indigo-500 transition-all text-left group shadow-sm shadow-indigo-50/50"
          >
            <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-all">
              <Smartphone size={28} />
            </div>
            <div>
              <p className="font-black text-gray-800 text-sm leading-tight">Leve para o Celular</p>
              <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest flex items-center gap-1">
                Instalar App <ArrowRight size={10}/>
              </p>
            </div>
          </button>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-10 rounded-[45px] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-black text-gray-800 mb-8 flex items-center gap-2">
              <Lock size={20} className="text-pink-500" /> Segurança de Acesso
            </h3>
            
            {message && (
              <div className={`mb-8 p-5 rounded-3xl text-xs font-black flex items-center gap-3 animate-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-500 border border-red-100'}`}>
                {message.type === 'success' ? <CheckCircle size={18}/> : <Shield size={18}/>}
                {message.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha Atual</label>
                  <input 
                    type="password" required placeholder="••••••••"
                    className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-500 outline-none font-bold text-gray-800 transition-all"
                    value={newPassword.current}
                    onChange={e => setNewPassword({...newPassword, current: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nova Senha</label>
                  <input 
                    type="password" required placeholder="Mínimo 3 dígitos"
                    className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-500 outline-none font-bold text-gray-800 transition-all"
                    value={newPassword.next}
                    onChange={e => setNewPassword({...newPassword, next: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Repetir Nova Senha</label>
                <input 
                  type="password" required placeholder="Confirme a nova senha"
                  className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-500 outline-none font-bold text-gray-800 transition-all"
                  value={newPassword.confirm}
                  onChange={e => setNewPassword({...newPassword, confirm: e.target.value})}
                />
              </div>
              <button type="submit" className="w-full py-5 bg-pink-500 text-white rounded-[30px] font-black shadow-xl shadow-pink-100 hover:bg-pink-600 transition-all text-sm uppercase tracking-widest mt-2">
                Atualizar Senha
              </button>
            </form>
          </section>

          {isOwner && (
            <section className="bg-white p-10 rounded-[45px] border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                  <Users size={20} className="text-pink-500" /> Equipe & Ajudantes
                </h3>
                <button onClick={() => setShowAddCollabModal(true)} className="p-3 bg-pink-50 text-pink-500 rounded-xl hover:bg-pink-500 hover:text-white transition-all">
                  <Plus size={20} />
                </button>
              </div>

              <div className="space-y-3">
                {(state.collaborators || []).length === 0 && (
                  <div className="text-center py-10 bg-gray-50/50 rounded-[35px] border-2 border-dashed border-gray-100">
                    <p className="text-gray-400 font-medium italic text-sm">Nenhum ajudante cadastrado.</p>
                  </div>
                )}
                {(state.collaborators || []).map(collab => (
                  <div key={collab.id} className="flex items-center justify-between p-5 bg-gray-50/50 rounded-[28px] border border-transparent hover:border-pink-100 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-[20px] flex items-center justify-center text-pink-500 shadow-sm">
                        <Mail size={20} />
                      </div>
                      <div>
                        <div className="font-black text-gray-700 text-sm leading-tight">{collab.email}</div>
                        <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-1">Cargo: {collab.role} • {new Date(collab.addedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <button onClick={() => removeCollaborator(collab)} className="text-gray-200 hover:text-red-500 transition-colors p-2"><Trash2 size={20} /></button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {showAddCollabModal && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleAddCollaborator} className="bg-white w-full max-w-md p-10 rounded-[45px] shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Novo Acesso</h2>
              <button type="button" onClick={() => setShowAddCollabModal(false)} className="text-gray-400"><X size={24}/></button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail do Ajudante</label>
                <input 
                  type="email" required placeholder="ajudante@doce.com"
                  className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-500 outline-none font-bold text-gray-800 transition-all"
                  value={collabEmail}
                  onChange={e => setCollabEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha Provisória</label>
                <input 
                  type="text" required placeholder="Crie uma senha"
                  className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-500 outline-none font-bold text-gray-800 transition-all"
                  value={collabPass}
                  onChange={e => setCollabPass(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nível de Acesso</label>
                <select 
                  className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 outline-none font-black text-xs uppercase tracking-widest h-[60px]"
                  value={collabRole}
                  onChange={e => setCollabRole(e.target.value as any)}
                >
                  <option value="Vendedor">Vendedor (Somente Aba Vendas)</option>
                  <option value="Auxiliar">Auxiliar (Vendas e Agenda)</option>
                  <option value="Sócio">Sócio (Acesso Total)</option>
                </select>
              </div>
              
              <button type="submit" className="w-full py-5 bg-pink-500 text-white rounded-[30px] font-black shadow-xl shadow-pink-100 hover:bg-pink-600 transition-all text-sm uppercase tracking-widest">
                Liberar Acesso
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;
