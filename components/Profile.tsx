
import React, { useState, useRef, useMemo } from 'react';
import { AppState, Collaborator } from '../types';
import { 
  User, Shield, Users, Mail, Phone, Calendar, Star, Lock, Key, 
  Plus, Trash2, CheckCircle, AtSign, ShieldCheck, Smartphone, 
  ArrowRight, X, Percent, Share2, Download, Link2, Globe, Database, ShieldAlert, CloudLightning, ExternalLink, RefreshCw, Copy, Check, Upload, Eye, Search, BarChart3, Activity
} from 'lucide-react';

interface ProfileProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  daysRemaining: number;
}

const Profile: React.FC<ProfileProps> = ({ state, setState, daysRemaining }) => {
  const [newPassword, setNewPassword] = useState({ current: '', next: '', confirm: '' });
  const [collabEmail, setCollabEmail] = useState('');
  const [collabPass, setCollabPass] = useState('');
  const [collabRole, setCollabRole] = useState<'Auxiliar' | 'Sócio' | 'Vendedor'>('Auxiliar');
  const [showAddCollabModal, setShowAddCollabModal] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [sheetUrlInput, setSheetUrlInput] = useState(state.user?.googleSheetUrl || '');

  const userEmail = state.user?.email || '';
  const usersRaw = localStorage.getItem('doce_users');
  const usersRegistry = useMemo(() => (usersRaw ? JSON.parse(usersRaw) : {}), [usersRaw, showInspector]);
  const userData = usersRegistry[userEmail.toLowerCase().trim()];
  const isOwner = !state.user?.ownerEmail || state.user?.ownerEmail === state.user?.email;

  const dbStats = useMemo(() => ({
    products: state.products.length,
    sales: state.sales.length,
    stock: state.stock.length,
    customers: (state.customers || []).length,
    lastSync: new Date().toLocaleTimeString('pt-BR')
  }), [state]);

  const handleUpdateSheetUrl = () => {
    const email = userEmail.toLowerCase().trim();
    const users = JSON.parse(localStorage.getItem('doce_users') || '{}');
    if (users[email]) {
      const url = sheetUrlInput.trim();
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
      alert("Integração configurada! Seus dados estão sincronizados.");
    }
  };

  const copyInviteLink = () => {
    const currentUrl = (state.user?.googleSheetUrl || localStorage.getItem('doce_temp_cloud_url') || '').trim();
    if (!currentUrl) {
      alert("Configure sua planilha antes de convidar a equipe.");
      return;
    }
    
    // Gerar base64 seguro para URL
    const inviteBase64 = btoa(unescape(encodeURIComponent(currentUrl)));
    const cleanOrigin = window.location.origin + window.location.pathname;
    const inviteLink = `${cleanOrigin}?invite=${inviteBase64}`;
    
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    }).catch(() => {
      alert("Link gerado:\n" + inviteLink);
    });
  };

  const exportBackup = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `doce_controle_backup_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = event.target.files?.[0];
    if (!file) return;

    fileReader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedState = JSON.parse(content);
        
        if (confirm("Isso irá substituir todos os dados atuais. Deseja continuar?")) {
          const finalState = {
            ...importedState,
            user: state.user 
          };
          setState(finalState);
          alert("Backup restaurado com sucesso! 🚀");
        }
      } catch (err) {
        alert("Erro ao ler o arquivo de backup.");
      }
    };
    fileReader.readAsText(file);
  };

  const testConnection = async () => {
    if (!sheetUrlInput) return;
    setIsTesting(true);
    try {
      const res = await fetch(`${sheetUrlInput}?email=${userEmail}`);
      if (res.ok) alert("Conexão estabelecida com sucesso! ✅");
      else alert("Erro na resposta da planilha.");
    } catch (e) {
      alert("Erro ao conectar.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const users = JSON.parse(localStorage.getItem('doce_users') || '{}');
    const userRecord = users[userEmail.toLowerCase().trim()];
    const storedPass = typeof userRecord === 'string' ? userRecord : userRecord.password;
    
    if (newPassword.current !== storedPass) {
      setMessage({ text: 'Senha atual incorreta!', type: 'error' });
      return;
    }
    if (newPassword.next !== newPassword.confirm) {
      setMessage({ text: 'As novas senhas não coincidem!', type: 'error' });
      return;
    }
    
    if (typeof userRecord === 'string') {
      users[userEmail.toLowerCase().trim()] = newPassword.next;
    } else {
      users[userEmail.toLowerCase().trim()] = { ...userRecord, password: newPassword.next };
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
    
    currentUsers[formattedEmail] = {
      password: collabPass,
      role: collabRole,
      ownerEmail: ownerEmail.toLowerCase().trim(),
      plan: 'linked',
      googleSheetUrl: state.user?.googleSheetUrl || localStorage.getItem('doce_temp_cloud_url')
    };
    localStorage.setItem('doce_users', JSON.stringify(currentUsers));

    const newCollab: Collaborator = {
      id: Math.random().toString(36).substr(2, 9),
      email: formattedEmail,
      role: collabRole,
      addedAt: new Date().toISOString()
    };
    setState(prev => ({ ...prev, collaborators: [...(prev.collaborators || []), newCollab] }));
    setShowAddCollabModal(false);
    setCollabEmail('');
    setCollabPass('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex justify-between items-end px-1">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Ajustes & Perfil</h1>
          <p className="text-gray-500 font-medium italic">Gestão administrativa do app.</p>
        </div>
        <button 
          onClick={() => setShowInspector(!showInspector)}
          className={`p-3 rounded-2xl transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest border-2 ${showInspector ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400 shadow-sm'}`}
        >
          {showInspector ? <Activity size={18} className="animate-pulse"/> : <Database size={18}/>}
          {showInspector ? 'Status DB' : 'Inspetor DB'}
        </button>
      </header>

      {showInspector ? (
        <div className="space-y-6 animate-in zoom-in duration-300">
           {/* Estatísticas de Saúde do Banco */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Doces Ativos', val: dbStats.products, color: 'text-pink-500', bg: 'bg-pink-50' },
                { label: 'Vendas Totais', val: dbStats.sales, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                { label: 'Itens Estoque', val: dbStats.stock, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                { label: 'Clientes', val: dbStats.customers, color: 'text-amber-500', bg: 'bg-amber-50' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-5 rounded-[28px] border border-gray-50 shadow-sm text-center">
                   <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                   <p className={`text-2xl font-black ${stat.color}`}>{stat.val}</p>
                </div>
              ))}
           </div>

           <div className="bg-white p-10 rounded-[45px] border border-indigo-100 shadow-xl">
              <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl"><Users size={24}/></div>
                  <div>
                    <h3 className="text-xl font-black text-gray-800">Contas Reconhecidas</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Registros no banco de dados local</p>
                  </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(usersRegistry).map(([email, data]: [string, any]) => (
                    <div key={email} className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${email === userEmail ? 'bg-pink-500 text-white' : 'bg-white text-gray-300'}`}>
                            <AtSign size={18} />
                          </div>
                          <div className="truncate">
                            <p className="font-black text-gray-700 text-sm truncate">{email}</p>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{data.role || 'Dono'}</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase ${data.password ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                            {data.password ? 'Verificado' : 'Pendente'}
                          </span>
                      </div>
                    </div>
                  ))}
              </div>
              
              <div className="mt-8 p-6 bg-indigo-50 rounded-[30px] border border-indigo-100 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <CloudLightning size={20} className="text-indigo-500" />
                    <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Última Escrita Cloud</p>
                 </div>
                 <span className="text-xs font-black text-indigo-600">{dbStats.lastSync}</span>
              </div>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-10 rounded-[45px] border border-pink-50 shadow-sm text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-pink-500"></div>
              <div className="w-20 h-20 bg-pink-50 text-pink-500 rounded-[30px] flex items-center justify-center mx-auto mb-6 shadow-sm">
                <User size={40} />
              </div>
              <h2 className="text-lg font-black text-gray-800 break-all leading-tight mb-2">{userEmail}</h2>
              <span className="px-4 py-1.5 bg-pink-100 text-pink-600 rounded-full text-[9px] font-black uppercase tracking-widest inline-block mb-4">
                {state.user?.role || 'Dono'}
              </span>
              {isOwner && (
                <p className="text-xs font-bold text-gray-400">
                  Acesso ativo: <span className="text-pink-500 font-black">{daysRemaining} dias</span>
                </p>
              )}
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-emerald-50 shadow-sm space-y-4">
              <div className="flex items-center gap-3 text-emerald-600">
                 <Database size={20} />
                 <h3 className="font-black text-sm uppercase tracking-widest">Backup & Portabilidade</h3>
              </div>
              <div className="grid grid-cols-1 gap-2">
                 <button onClick={exportBackup} className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] uppercase transition-all hover:bg-emerald-100 border border-emerald-100"><Download size={16} /> Exportar Backup</button>
                 <input type="file" ref={fileInputRef} onChange={importBackup} className="hidden" accept=".json" />
                 <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-3 bg-white text-gray-400 rounded-xl font-black text-[10px] uppercase transition-all hover:text-gray-600 border border-gray-100"><Upload size={16} /> Importar Dados</button>
              </div>
            </div>

            {isOwner && (
              <div className="bg-indigo-600 p-8 rounded-[40px] text-white shadow-xl shadow-indigo-100 space-y-4">
                <div className="flex items-center gap-3">
                   <Users size={24} />
                   <h3 className="font-black text-sm uppercase tracking-widest">Link de Equipe</h3>
                </div>
                <p className="text-[10px] font-bold opacity-80 leading-relaxed">Convide seus vendedores para acessar este banco de dados de qualquer lugar.</p>
                <button onClick={copyInviteLink} className="w-full flex items-center justify-center gap-2 py-4 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase transition-all active:scale-95">
                  {copiedInvite ? <Check size={18} /> : <Copy size={18} />}
                  {copiedInvite ? "Link Copiado!" : "Copiar Link"}
                </button>
              </div>
            )}

            <div className="bg-white p-8 rounded-[40px] border border-indigo-50 shadow-sm space-y-4">
              <div className="flex items-center gap-3 text-indigo-600">
                 <CloudLightning size={20} />
                 <h3 className="font-black text-sm uppercase tracking-widest">Integração Cloud</h3>
              </div>
              <div className="space-y-4">
                 <textarea 
                   placeholder="Código do Google Script..."
                   className="w-full px-4 py-3 rounded-xl border-2 border-gray-50 bg-gray-50 text-[10px] font-bold focus:border-indigo-500 outline-none h-20 resize-none"
                   value={sheetUrlInput}
                   onChange={e => setSheetUrlInput(e.target.value)}
                 />
                 <div className="flex gap-2">
                    <button onClick={handleUpdateSheetUrl} className="flex-1 py-3 bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase shadow-sm">Salvar ID</button>
                    <button onClick={testConnection} className="w-12 h-12 flex items-center justify-center bg-gray-50 text-gray-400 rounded-xl border border-gray-100"><RefreshCw size={18} className={isTesting ? 'animate-spin' : ''}/></button>
                 </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white p-10 rounded-[45px] border border-gray-100 shadow-sm">
              <h3 className="text-lg font-black text-gray-800 mb-8 flex items-center gap-2"><Lock size={20} className="text-pink-500" /> Segurança da Conta</h3>
              {message && (
                <div className={`mb-6 p-4 rounded-2xl text-xs font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                  {message.text}
                </div>
              )}
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input type="password" required placeholder="Senha Atual" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-500 outline-none font-bold" value={newPassword.current} onChange={e => setNewPassword({...newPassword, current: e.target.value})} />
                  <input type="password" required placeholder="Nova Senha" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-500 outline-none font-bold" value={newPassword.next} onChange={e => setNewPassword({...newPassword, next: e.target.value})} />
                </div>
                <button type="submit" className="w-full py-5 bg-pink-500 text-white rounded-[30px] font-black text-xs uppercase tracking-widest shadow-xl shadow-pink-100">Atualizar Senha</button>
              </form>
            </section>

            {isOwner && (
              <section className="bg-white p-10 rounded-[45px] border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><Users size={20} className="text-pink-500" /> Gestão da Equipe</h3>
                  <button onClick={() => setShowAddCollabModal(true)} className="p-3 bg-pink-50 text-pink-500 rounded-xl"><Plus size={20} /></button>
                </div>
                <div className="space-y-3">
                  {(state.collaborators || []).map(collab => (
                    <div key={collab.id} className="flex items-center justify-between p-5 bg-gray-50/50 rounded-[28px]">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-pink-500 shadow-sm"><Mail size={18} /></div>
                        <div>
                          <div className="font-black text-gray-700 text-xs">{collab.email}</div>
                          <div className="text-[8px] text-gray-400 font-black uppercase tracking-widest">{collab.role}</div>
                        </div>
                      </div>
                      <button onClick={() => { if(confirm("Remover este colaborador?")) { const u = JSON.parse(localStorage.getItem('doce_users') || '{}'); delete u[collab.email]; localStorage.setItem('doce_users', JSON.stringify(u)); setState(prev => ({...prev, collaborators: (prev.collaborators || []).filter(c => c.id !== collab.id)})); } }} className="text-gray-200 hover:text-red-500 p-2"><Trash2 size={18} /></button>
                    </div>
                  ))}
                  {(state.collaborators || []).length === 0 && <p className="text-center py-6 text-gray-300 font-bold italic text-sm">Nenhum funcionário cadastrado.</p>}
                </div>
              </section>
            )}
          </div>
        </div>
      )}

      {showAddCollabModal && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleAddCollaborator} className="bg-white w-full max-w-md p-10 rounded-[45px] shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Adicionar à Equipe</h2>
              <button type="button" onClick={() => setShowAddCollabModal(false)} className="text-gray-400"><X size={24}/></button>
            </div>
            <div className="space-y-6">
              <input type="email" required placeholder="E-mail" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-500 outline-none font-bold text-gray-700" value={collabEmail} onChange={setCollabEmail} />
              <input type="text" required placeholder="Senha Temporária" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-500 outline-none font-bold text-gray-700" value={collabPass} onChange={setCollabPass} />
              <select className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 outline-none font-black text-xs uppercase" value={collabRole} onChange={e => setCollabRole(e.target.value as any)}>
                <option value="Vendedor">Vendedor</option>
                <option value="Auxiliar">Auxiliar</option>
                <option value="Sócio">Sócio</option>
              </select>
              <button type="submit" className="w-full py-5 bg-pink-500 text-white rounded-[30px] font-black shadow-xl shadow-pink-100 text-xs uppercase">Confirmar Acesso</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;
