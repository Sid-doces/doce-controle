
import React, { useState, useRef, useMemo } from 'react';
import { AppState, Collaborator } from '../types';
import { 
  User, Shield, Users, Mail, Phone, Calendar, Star, Lock, Key, 
  Plus, Trash2, CheckCircle, AtSign, ShieldCheck, Smartphone, 
  ArrowRight, X, Percent, Share2, Download, Link2, Globe, Database, ShieldAlert, CloudLightning, ExternalLink, RefreshCw, Copy, Check, Upload, Eye, Search, BarChart3, Activity, Save
} from 'lucide-react';

interface ProfileProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  daysRemaining: number;
}

const Profile: React.FC<ProfileProps> = ({ state, setState, daysRemaining }) => {
  const [newPassword, setNewPassword] = useState({ current: '', next: '', confirm: '' });
  
  // Estados locais limpos para o modal de colaboradores
  const [collabEmail, setCollabEmail] = useState('');
  const [collabPass, setCollabPass] = useState('');
  const [collabRole, setCollabRole] = useState<'Auxiliar' | 'Sócio' | 'Vendedor'>('Auxiliar');
  const [collabCommission, setCollabCommission] = useState<number>(0);
  
  const [showAddCollabModal, setShowAddCollabModal] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [sheetUrlInput, setSheetUrlInput] = useState(state.user?.googleSheetUrl || localStorage.getItem('doce_temp_cloud_url') || '');

  const userEmail = state.user?.email || '';
  const usersRaw = localStorage.getItem('doce_users');
  const usersRegistry = useMemo(() => (usersRaw ? JSON.parse(usersRaw) : {}), [usersRaw, showInspector]);
  const isOwner = !state.user?.ownerEmail || state.user?.ownerEmail === state.user?.email;

  const dbStats = useMemo(() => ({
    products: state.products.length,
    sales: state.sales.length,
    stock: state.stock.length,
    customers: (state.customers || []).length,
    lastSync: new Date().toLocaleTimeString('pt-BR')
  }), [state]);

  const handleUpdateSheetUrl = () => {
    let url = sheetUrlInput.trim();
    if (!url) {
      alert("Por favor, insira o ID ou URL do seu Script.");
      return;
    }

    if (!url.startsWith('http')) {
      url = `https://script.google.com/macros/s/${url}/exec`;
    }

    localStorage.setItem('doce_temp_cloud_url', url);

    const email = userEmail.toLowerCase().trim();
    const users = JSON.parse(localStorage.getItem('doce_users') || '{}');
    if (users[email]) {
      users[email].googleSheetUrl = url;
      localStorage.setItem('doce_users', JSON.stringify(users));
    }
    
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, googleSheetUrl: url } : null
    }));
    
    setSheetUrlInput(url);
    alert("ID Salvo com Sucesso! 🚀");
  };

  const updateGlobalCommission = (rate: number) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, commissionRate: rate }
    }));
  };

  const copyInviteLink = () => {
    const currentUrl = (state.user?.googleSheetUrl || localStorage.getItem('doce_temp_cloud_url') || '').trim();
    if (!currentUrl) {
      alert("Configure sua planilha antes de convidar a equipe.");
      return;
    }
    
    const inviteBase64 = btoa(unescape(encodeURIComponent(currentUrl)));
    const cleanOrigin = window.location.origin + window.location.pathname;
    const inviteLink = `${cleanOrigin}?invite=${inviteBase64}`;
    
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    }).catch(() => {
      alert("Link de Convite:\n" + inviteLink);
    });
  };

  const testConnection = async () => {
    let url = sheetUrlInput.trim();
    if (!url) {
      alert("Insira o ID antes de testar.");
      return;
    }
    if (!url.startsWith('http')) url = `https://script.google.com/macros/s/${url}/exec`;

    setIsTesting(true);
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${url}?email=${encodeURIComponent(userEmail)}`, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal
      });
      
      clearTimeout(id);

      if (response.ok) {
        const data = await response.json();
        if (data) {
          alert("Conexão Estabelecida! ✅\nO Google respondeu corretamente.");
        } else {
          alert("Conexão OK, mas o Google enviou dados vazios.");
        }
      } else {
        alert("Erro no Google (" + response.status + ").");
      }
    } catch (e: any) {
      alert("ERRO DE CONEXÃO ❌\nVerifique as permissões do seu Script.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedEmail = collabEmail.toLowerCase().trim();
    
    if (!formattedEmail || !collabPass) {
      alert("Preencha todos os campos corretamente.");
      return;
    }

    const ownerEmail = (state.user?.ownerEmail || state.user?.email || '').toLowerCase().trim();
    const currentUsers = JSON.parse(localStorage.getItem('doce_users') || '{}');
    
    // 1. Salva no banco de login (localStorage)
    currentUsers[formattedEmail] = {
      password: String(collabPass),
      role: collabRole,
      ownerEmail: ownerEmail,
      plan: 'linked',
      googleSheetUrl: state.user?.googleSheetUrl || localStorage.getItem('doce_temp_cloud_url'),
      commissionRate: collabRole === 'Vendedor' ? collabCommission : 0
    };
    localStorage.setItem('doce_users', JSON.stringify(currentUsers));

    // 2. Adiciona à lista visual do app
    const newCollab: Collaborator = {
      id: Math.random().toString(36).substr(2, 9),
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
    alert("Colaborador autorizado!");
  };

  const handleRemoveCollaborator = (collabId: string, emailToRemove: string) => {
    if (!confirm(`Deseja realmente remover o acesso de ${emailToRemove}?`)) return;

    const formattedEmail = emailToRemove.toLowerCase().trim();
    
    // 1. Remove do banco de login
    const currentUsers = JSON.parse(localStorage.getItem('doce_users') || '{}');
    delete currentUsers[formattedEmail];
    localStorage.setItem('doce_users', JSON.stringify(currentUsers));

    // 2. Remove da lista visual
    setState(prev => ({
      ...prev,
      collaborators: (prev.collaborators || []).filter(c => c.id !== collabId)
    }));
    
    alert("Acesso removido.");
  };

  const clearUserCache = () => {
    if (confirm("ATENÇÃO: Isso limpará todos os usuários salvos NESTE aparelho. Útil se houver erros de login. Deseja continuar?")) {
      localStorage.removeItem('doce_users');
      localStorage.removeItem('doce_last_user');
      window.location.reload();
    }
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
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Doces Ativos', val: dbStats.products, color: 'text-pink-500' },
                { label: 'Vendas Totais', val: dbStats.sales, color: 'text-emerald-500' },
                { label: 'Itens Estoque', val: dbStats.stock, color: 'text-indigo-500' },
                { label: 'Clientes', val: dbStats.customers, color: 'text-amber-500' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm text-center">
                   <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                   <p className={`text-2xl font-black ${stat.color}`}>{stat.val}</p>
                </div>
              ))}
           </div>

           <div className="bg-white p-10 rounded-[45px] border border-indigo-100 shadow-xl">
              <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl"><Users size={24}/></div>
                    <div>
                      <h3 className="text-xl font-black text-gray-800">Contas na Equipe</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Registros locais reconhecidos</p>
                    </div>
                  </div>
                  <button onClick={clearUserCache} className="text-[9px] font-black text-red-400 uppercase tracking-widest hover:text-red-600">Limpar Cache Login</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(usersRegistry).map(([email, data]: [string, any]) => (
                    <div key={email} className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${email === userEmail ? 'bg-pink-500 text-white' : 'bg-white text-gray-300'}`}>
                            <AtSign size={18} />
                          </div>
                          <div className="truncate">
                            <p className="font-black text-gray-700 text-sm truncate">{String(email)}</p>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{String(data.role || 'Dono')}</p>
                          </div>
                      </div>
                    </div>
                  ))}
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

            {isOwner && (
              <div className="bg-white p-8 rounded-[40px] border border-pink-50 shadow-sm space-y-4">
                <div className="flex items-center gap-3 text-pink-500">
                   <Percent size={20} />
                   <h3 className="font-black text-sm uppercase tracking-widest">Comissão Global</h3>
                </div>
                <div className="space-y-4">
                   <div className="relative">
                      <input 
                        type="number"
                        placeholder="Taxa padrão (%)"
                        className="w-full px-4 py-4 rounded-xl border-2 border-gray-50 bg-gray-50 text-lg font-black focus:border-pink-500 outline-none pr-12"
                        value={state.settings?.commissionRate || 0}
                        onChange={e => updateGlobalCommission(Number(e.target.value))}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 font-black">%</span>
                   </div>
                   <p className="text-[8px] text-gray-400 font-bold italic leading-tight uppercase">Taxa aplicada a todos os vendedores sem comissão personalizada.</p>
                </div>
              </div>
            )}

            <div className="bg-white p-8 rounded-[40px] border border-indigo-50 shadow-sm space-y-4">
              <div className="flex items-center gap-3 text-indigo-600">
                 <CloudLightning size={20} />
                 <h3 className="font-black text-sm uppercase tracking-widest">Integração Cloud</h3>
              </div>
              <div className="space-y-4">
                 <div className="relative">
                    <input 
                      type="text"
                      placeholder="Cole aqui seu ID do Script..."
                      className="w-full px-4 py-4 rounded-xl border-2 border-gray-50 bg-gray-50 text-[10px] font-bold focus:border-indigo-500 outline-none pr-12"
                      value={sheetUrlInput}
                      onChange={e => setSheetUrlInput(e.target.value)}
                    />
                    <Database className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                 </div>
                 <div className="flex gap-2">
                    <button onClick={handleUpdateSheetUrl} className="flex-1 py-4 bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase shadow-md flex items-center justify-center gap-2">
                      <Save size={14} /> Salvar ID
                    </button>
                    <button onClick={testConnection} className="w-12 h-12 flex items-center justify-center bg-gray-50 text-gray-400 rounded-xl border border-gray-100">
                      <RefreshCw size={18} className={isTesting ? 'animate-spin' : ''}/>
                    </button>
                 </div>
              </div>
            </div>

            {isOwner && (
              <div className="bg-indigo-600 p-8 rounded-[40px] text-white shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                   <Users size={24} />
                   <h3 className="font-black text-sm uppercase tracking-widest">Link de Equipe</h3>
                </div>
                <button onClick={copyInviteLink} className="w-full flex items-center justify-center gap-2 py-4 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase active:scale-95 transition-all">
                  {copiedInvite ? <Check size={18} /> : <Copy size={18} />}
                  {copiedInvite ? "Link Copiado!" : "Gerar Link Mágico"}
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white p-10 rounded-[45px] border border-gray-100 shadow-sm">
              <h3 className="text-lg font-black text-gray-800 mb-8 flex items-center gap-2"><Lock size={20} className="text-pink-500" /> Segurança</h3>
              <form onSubmit={e => { e.preventDefault(); alert("Use a opção de nova senha se desejar trocar."); }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input type="password" placeholder="Nova Senha" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-500 outline-none font-bold" />
                  <button type="button" onClick={() => alert("Função em desenvolvimento")} className="py-5 bg-pink-500 text-white rounded-[30px] font-black text-xs uppercase tracking-widest shadow-xl">Atualizar</button>
                </div>
              </form>
            </section>

            {isOwner && (
              <section className="bg-white p-10 rounded-[45px] border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><Users size={20} className="text-pink-500" /> Funcionários</h3>
                  <button onClick={() => setShowAddCollabModal(true)} className="p-3 bg-pink-50 text-pink-500 rounded-xl hover:bg-pink-100 transition-colors"><Plus size={20} /></button>
                </div>
                <div className="space-y-3">
                  {(state.collaborators || []).map(collab => (
                    <div key={collab.id} className="flex items-center justify-between p-5 bg-gray-50/50 rounded-[28px] border border-transparent hover:border-pink-100 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-pink-500 shadow-sm"><Mail size={18} /></div>
                        <div>
                          <div className="font-black text-gray-700 text-xs">{String(collab.email)}</div>
                          <div className="flex items-center gap-2">
                             <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest">{String(collab.role)}</span>
                             {collab.role === 'Vendedor' && (
                               <span className="text-[8px] text-pink-500 font-black uppercase tracking-widest bg-pink-50 px-2 py-0.5 rounded-full">Comissão: {collab.commissionRate || 0}%</span>
                             )}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveCollaborator(collab.id, collab.email)} 
                        className="text-gray-300 hover:text-red-500 p-2 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {(state.collaborators || []).length === 0 && (
                    <p className="text-center py-10 text-gray-300 font-bold text-xs">Nenhum funcionário cadastrado.</p>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      )}

      {showAddCollabModal && (
        <div className="fixed inset-0 bg-pink-950/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-10 rounded-[45px] shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Novo Acesso</h2>
              <button onClick={() => setShowAddCollabModal(false)} className="text-gray-400"><X size={24}/></button>
            </div>
            <form onSubmit={handleAddCollaborator} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">E-mail</label>
                <input 
                  type="email" 
                  required 
                  placeholder="exemplo@doce.com" 
                  className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-500 outline-none font-bold text-gray-700" 
                  value={collabEmail} 
                  onChange={e => setCollabEmail(String(e.target.value))} 
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Senha Provisória</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Senha para o funcionário" 
                  className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-pink-500 outline-none font-bold text-gray-700" 
                  value={collabPass} 
                  onChange={e => setCollabPass(String(e.target.value))} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Nível</label>
                  <select 
                    className="w-full px-4 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 outline-none font-black text-[10px] uppercase" 
                    value={collabRole} 
                    onChange={e => setCollabRole(e.target.value as any)}
                  >
                    <option value="Vendedor">Vendedor</option>
                    <option value="Auxiliar">Auxiliar</option>
                    <option value="Sócio">Sócio</option>
                  </select>
                </div>
                {collabRole === 'Vendedor' && (
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Comissão (%)</label>
                    <input 
                      type="number"
                      className="w-full px-4 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 outline-none font-black text-lg text-pink-500 text-center"
                      value={collabCommission}
                      onChange={e => setCollabCommission(Number(e.target.value))}
                    />
                  </div>
                )}
              </div>
              <button type="submit" className="w-full py-5 bg-pink-500 text-white rounded-[30px] font-black shadow-xl text-xs uppercase tracking-widest hover:bg-pink-600 transition-all">Autorizar Aparelho</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
