
import React, { useState } from 'react';
import { AppState, Collaborator } from '../types';
import { 
  User, Shield, Users, Mail, Phone, Calendar, Star, Lock, Key, 
  Plus, Trash2, CheckCircle, AtSign, ShieldCheck, Smartphone, 
  ArrowRight, X, Percent, Share2, Download, Link2, Globe, Database, ShieldAlert, CloudLightning, ExternalLink, RefreshCw
} from 'lucide-react';

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
  const [isTesting, setIsTesting] = useState(false);
  
  const [sheetUrlInput, setSheetUrlInput] = useState(state.user?.googleSheetUrl || '');

  const userEmail = state.user?.email || '';
  const usersRaw = localStorage.getItem('doce_users');
  const users = usersRaw ? JSON.parse(usersRaw) : {};
  const userData = users[userEmail.toLowerCase().trim()];
  const isOwner = !state.user?.ownerEmail || state.user?.ownerEmail === state.user?.email;

  const handleUpdateSheetUrl = () => {
    const email = userEmail.toLowerCase().trim();
    if (users[email]) {
      const url = sheetUrlInput.trim();
      // Se o usuário colou apenas o ID, montamos a URL completa
      const finalUrl = url.length > 50 && !url.startsWith('http') 
        ? `https://script.google.com/macros/s/${url}/exec`
        : url;

      users[email].googleSheetUrl = finalUrl;
      localStorage.setItem('doce_users', JSON.stringify(users));
      
      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, googleSheetUrl: finalUrl } : null
      }));
      setSheetUrlInput(finalUrl);
      alert("Integração configurada! O sistema agora enviará seus dados para o Google Sheets em tempo real.");
    }
  };

  const testConnection = async () => {
    if (!sheetUrlInput) return;
    setIsTesting(true);
    try {
      const res = await fetch(`${sheetUrlInput}?email=${userEmail}`);
      if (res.ok) alert("Conexão estabelecida com sucesso! ✅");
      else alert("Conectado, mas a planilha retornou um erro. Verifique o Script.");
    } catch (e) {
      alert("Erro ao conectar. Verifique se o Script está implantado como 'Qualquer pessoa'.");
    } finally {
      setIsTesting(false);
    }
  };

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `doce_controle_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
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
      alert("Este e-mail já está em uso.");
      return;
    }

    currentUsers[formattedEmail] = {
      password: collabPass,
      role: collabRole,
      ownerEmail: ownerEmail.toLowerCase().trim(),
      plan: 'linked',
      googleSheetUrl: state.user?.googleSheetUrl
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
  };

  const removeCollaborator = (collab: Collaborator) => {
    if (!confirm(`Excluir acesso de ${collab.email}?`)) return;
    const currentUsers = JSON.parse(localStorage.getItem('doce_users') || '{}');
    delete currentUsers[collab.email.toLowerCase().trim()];
    localStorage.setItem('doce_users', JSON.stringify(currentUsers));
    setState(prev => ({ ...prev, collaborators: prev.collaborators.filter(c => c.id !== collab.id) }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">Configurações</h1>
        <p className="text-gray-500 font-medium italic">Sua central de dados e equipe.</p>
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
                  Ciclo ativo: <span className="text-pink-500 font-black">{daysRemaining} dias</span>
                </p>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-indigo-50 shadow-sm space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
               <CloudLightning size={20} />
               <h3 className="font-black text-sm uppercase tracking-widest">Google Sheets API</h3>
            </div>
            <div className="space-y-4">
               <div className="space-y-2">
                 <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">URL da Implantação (Script)</label>
                 <textarea 
                   placeholder="https://script.google.com/macros/s/..."
                   className="w-full px-4 py-3 rounded-xl border-2 border-gray-50 bg-gray-50 text-[10px] font-bold focus:border-indigo-500 outline-none h-24 resize-none"
                   value={sheetUrlInput}
                   onChange={e => setSheetUrlInput(e.target.value)}
                 />
                 <div className="flex gap-2">
                    <button 
                      onClick={handleUpdateSheetUrl}
                      className="flex-1 py-3 bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                    >
                      Conectar
                    </button>
                    <button 
                      onClick={testConnection}
                      disabled={isTesting || !sheetUrlInput}
                      className="w-12 h-12 flex items-center justify-center bg-gray-50 text-gray-400 rounded-xl border border-gray-100 hover:text-indigo-500 disabled:opacity-50"
                    >
                      <RefreshCw size={18} className={isTesting ? 'animate-spin' : ''} />
                    </button>
                 </div>
               </div>
               <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <p className="text-[9px] font-black text-amber-800 leading-relaxed italic">
                    Utilize o script fornecido no Laboratório para que a planilha funcione como seu banco de dados em tempo real.
                  </p>
               </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3 text-gray-400">
               <Database size={20} />
               <h3 className="font-black text-sm uppercase tracking-widest">Segurança Local</h3>
            </div>
            <button 
              onClick={exportData}
              className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-pink-300 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                  <Download size={18} className="text-gray-400 group-hover:text-pink-500" />
                  <span className="text-xs font-black text-gray-700">Backup em JSON</span>
              </div>
              <ArrowRight size={14} className="text-gray-300" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-10 rounded-[45px] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-black text-gray-800 mb-8 flex items-center gap-2">
              <Lock size={20} className="text-pink-500" /> Alterar Senha
            </h3>
            {message && <div className={`mb-6 p-4 rounded-2xl text-[10px] font-black ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>{message.text}</div>}
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="password" required placeholder="Senha Atual" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-500 outline-none font-bold" value={newPassword.current} onChange={e => setNewPassword({...newPassword, current: e.target.value})} />
                <input type="password" required placeholder="Nova Senha" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-500 outline-none font-bold" value={newPassword.next} onChange={e => setNewPassword({...newPassword, next: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-5 bg-pink-500 text-white rounded-[30px] font-black shadow-xl shadow-pink-100 hover:bg-pink-600 transition-all text-xs uppercase tracking-widest">Atualizar Acesso</button>
            </form>
          </section>

          {isOwner && (
            <section className="bg-white p-10 rounded-[45px] border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                  <Users size={20} className="text-pink-500" /> Gestão de Colaboradores
                </h3>
                <button onClick={() => setShowAddCollabModal(true)} className="p-3 bg-pink-50 text-pink-500 rounded-xl hover:bg-pink-500 hover:text-white transition-all"><Plus size={20} /></button>
              </div>
              <div className="space-y-3">
                {(state.collaborators || []).map(collab => (
                  <div key={collab.id} className="flex items-center justify-between p-5 bg-gray-50/50 rounded-[28px] border border-transparent hover:border-pink-100 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-pink-500 shadow-sm"><Mail size={18} /></div>
                      <div>
                        <div className="font-black text-gray-700 text-xs">{collab.email}</div>
                        <div className="text-[8px] text-gray-400 font-black uppercase tracking-widest">{collab.role}</div>
                      </div>
                    </div>
                    <button onClick={() => removeCollaborator(collab)} className="text-gray-200 hover:text-red-500 transition-colors p-2"><Trash2 size={18} /></button>
                  </div>
                ))}
                {(!state.collaborators || state.collaborators.length === 0) && (
                    <div className="text-center py-10 text-gray-300 font-bold italic text-sm">Nenhum colaborador adicionado.</div>
                )}
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
              <input type="email" required placeholder="E-mail do Ajudante" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-500 outline-none font-bold" value={collabEmail} onChange={e => setCollabEmail(e.target.value)} />
              <input type="text" required placeholder="Senha Provisória" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-500 outline-none font-bold" value={collabPass} onChange={e => setCollabPass(e.target.value)} />
              <select className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 outline-none font-black text-xs uppercase" value={collabRole} onChange={e => setCollabRole(e.target.value as any)}>
                <option value="Vendedor">Vendedor</option>
                <option value="Auxiliar">Auxiliar</option>
                <option value="Sócio">Sócio</option>
              </select>
              <button type="submit" className="w-full py-5 bg-pink-500 text-white rounded-[30px] font-black shadow-xl shadow-pink-100 text-xs uppercase">Liberar Acesso</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;
