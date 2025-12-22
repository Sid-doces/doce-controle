
import React, { useState } from 'react';
import { AppState, Collaborator } from '../types';
import { User, Shield, Users, Mail, Phone, Calendar, Star, Lock, Key, Plus, Trash2, CheckCircle, AtSign, ShieldCheck } from 'lucide-react';

interface ProfileProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  daysRemaining: number;
}

const Profile: React.FC<ProfileProps> = ({ state, setState, daysRemaining }) => {
  const [newPassword, setNewPassword] = useState({ current: '', next: '', confirm: '' });
  const [collabEmail, setCollabEmail] = useState('');
  const [collabRole, setCollabRole] = useState<'Auxiliar' | 'Sócio'>('Auxiliar');
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const userEmail = state.user?.email || '';
  const usersRaw = localStorage.getItem('doce_users');
  const users = usersRaw ? JSON.parse(usersRaw) : {};
  const userData = users[userEmail.toLowerCase().trim()];

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
    if (!collabEmail.includes('@')) return;
    const newCollab: Collaborator = {
      id: Math.random().toString(36).substr(2, 9),
      email: collabEmail.toLowerCase().trim(),
      role: collabRole,
      addedAt: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      collaborators: [...(prev.collaborators || []), newCollab]
    }));
    setCollabEmail('');
  };

  const removeCollaborator = (id: string) => {
    setState(prev => ({
      ...prev,
      collaborators: prev.collaborators.filter(c => c.id !== id)
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">Minha Conta</h1>
        <p className="text-gray-500 font-medium italic">Dados cadastrais e gestão de acessos.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Info do Plano */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-10 rounded-[45px] border border-pink-50 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-pink-500"></div>
            <div className="w-24 h-24 bg-pink-50 text-pink-500 rounded-[35px] flex items-center justify-center mx-auto mb-6 shadow-sm">
              <User size={48} />
            </div>
            <h2 className="text-xl font-black text-gray-800 break-all leading-tight mb-4">{userEmail}</h2>
            <div className="flex flex-col items-center gap-3">
              <span className="px-4 py-1.5 bg-pink-100 text-pink-600 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                Plano {userData?.plan || 'Profissional'}
              </span>
              <p className="text-sm font-bold text-gray-400">
                Ativo por mais <span className="text-pink-500 font-black">{daysRemaining} dias</span>
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-8 rounded-[40px] shadow-xl shadow-indigo-100 text-white relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
              <ShieldCheck size={100} />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <Star size={24} className="fill-white" />
              <h3 className="font-black text-lg">Área do Sócio</h3>
            </div>
            <p className="text-indigo-100 text-sm leading-relaxed font-medium">
              Utilize o controle de colaboradores para permitir que sua equipe lance vendas sem acessar seus dados financeiros sensíveis.
            </p>
          </div>
        </div>

        {/* Segurança e Colaboradores */}
        <div className="lg:col-span-2 space-y-8">
          {/* Alterar Senha */}
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

          {/* Colaboradores */}
          <section className="bg-white p-10 rounded-[45px] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-black text-gray-800 mb-8 flex items-center gap-2">
              <Users size={20} className="text-pink-500" /> Equipe & Ajudantes
            </h3>

            <form onSubmit={handleAddCollaborator} className="flex flex-col md:flex-row gap-4 mb-10">
              <div className="flex-1 relative group">
                <AtSign size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-pink-500" />
                <input 
                  type="email" required placeholder="E-mail do auxiliar..."
                  className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-[24px] border-2 border-gray-50 outline-none font-bold text-sm focus:bg-white focus:border-pink-500 transition-all"
                  value={collabEmail}
                  onChange={e => setCollabEmail(e.target.value)}
                />
              </div>
              <select 
                className="px-6 py-4 bg-gray-50 rounded-[24px] border-2 border-gray-50 font-black text-[10px] uppercase tracking-widest outline-none h-[60px]"
                value={collabRole}
                onChange={e => setCollabRole(e.target.value as any)}
              >
                <option value="Auxiliar">Auxiliar</option>
                <option value="Sócio">Sócio</option>
              </select>
              <button type="submit" className="px-10 py-4 bg-gray-800 text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-gray-700 transition-all flex items-center gap-3 justify-center">
                <Plus size={16} /> Incluir
              </button>
            </form>

            <div className="space-y-3">
              {(state.collaborators || []).length === 0 && (
                <div className="text-center py-10 bg-gray-50/50 rounded-[35px] border-2 border-dashed border-gray-100">
                  <p className="text-gray-400 font-medium italic text-sm">Sua equipe aparece aqui.</p>
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
                  <button onClick={() => removeCollaborator(collab.id)} className="text-gray-200 hover:text-red-500 transition-colors p-2"><Trash2 size={20} /></button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
