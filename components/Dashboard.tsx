
import React, { useMemo, useState, useEffect } from 'react';
import { AppState } from '../types';
import { 
  ShoppingBasket, 
  TrendingUp, 
  DollarSign, 
  Star, 
  ArrowRight, 
  ChefHat,
  Sparkles,
  X,
  Loader2,
  Lightbulb,
  Percent,
  Beaker,
  MessageCircle,
  Clock,
  Key
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Moving AIStudio interface inside declare global to properly merge with global types
// and avoid the "Subsequent property declarations must have the same type" error.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}

interface DashboardProps {
  state: AppState;
  onNavigate: (tab: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, onNavigate }) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isBrainstorming, setIsBrainstorming] = useState(false);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [brainstormResult, setBrainstormResult] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showBrainstormModal, setShowBrainstormModal] = useState(false);
  const [needsKey, setNeedsKey] = useState(false);

  useEffect(() => {
    checkKeyStatus();
  }, []);

  const checkKeyStatus = async () => {
    if (window.aistudio) {
      try {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setNeedsKey(!hasKey);
      } catch (e) {
        setNeedsKey(true);
      }
    }
  };

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume sucesso imediato para evitar race conditions conforme diretrizes
      setNeedsKey(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const todayRevenue = state.sales.filter(s => s.date.startsWith(today)).reduce((acc, s) => acc + s.total, 0);
  
  const currentMonth = new Date().getMonth();
  const monthSales = state.sales.filter(s => new Date(s.date).getMonth() === currentMonth);
  const monthRevenue = monthSales.reduce((acc, s) => acc + s.total, 0);
  
  const productsWithCost = state.products.filter(p => p.cost > 0);
  const avgMargin = productsWithCost.length > 0
    ? (productsWithCost.reduce((acc, p) => acc + ((p.price - p.cost) / p.price), 0) / productsWithCost.length) * 100
    : 0;

  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayTotal = state.sales.filter(s => s.date.startsWith(dateStr)).reduce((acc, s) => acc + s.total, 0);
    return { name: d.toLocaleDateString('pt-BR', { weekday: 'short' }), total: dayTotal, date: dateStr };
  });

  const getAiInsights = async () => {
    if (needsKey) {
      await handleSelectKey();
      return;
    }

    if (aiInsights.length > 0) {
      setShowAiModal(true);
      return;
    }

    setIsAiLoading(true);
    setShowAiModal(true);
    
    try {
      // Criação da instância no momento do uso para pegar a chave atualizada
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Como consultor de confeitaria, analise: Faturamento Mensal R$ ${monthRevenue.toFixed(2)}, Margem Média ${avgMargin.toFixed(1)}%. Dê 3 dicas curtas e práticas de como aumentar o lucro ou girar estoque.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: "Você é um consultor de negócios para confeitarias artesanais. Responda APENAS um JSON com o campo 'tips' (array de strings). Seja curto e direto.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: { tips: { type: Type.ARRAY, items: { type: Type.STRING } } },
            required: ["tips"]
          }
        },
      });

      const data = JSON.parse(response.text || '{"tips":[]}');
      setAiInsights(data.tips || ["Revise seus custos fixos mensalmente.", "Invista em fotos de alta qualidade.", "Crie combos para datas comemorativas."]);
    } catch (err: any) {
      console.error("AI Error:", err);
      if (err.message?.includes("entity was not found") || err.message?.includes("API_KEY")) {
        setNeedsKey(true);
        setShowAiModal(false);
        alert("Chave de API não encontrada ou expirada. Por favor, ative a IA novamente.");
      } else {
        setAiInsights(["Foque em reduzir o desperdício de insumos.", "Mantenha seu cardápio sempre atualizado.", "Fidelize seus clientes com brindes pequenos."]);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleBrainstorm = async () => {
    if (needsKey) {
      await handleSelectKey();
      return;
    }

    setIsBrainstorming(true);
    setShowBrainstormModal(true);
    setBrainstormResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stockSummary = state.stock.filter(s => s.quantity > 0).map(s => s.name).join(', ');
      const prompt = `Com base nestes ingredientes em estoque: ${stockSummary || 'Chocolate, Leite Condensado'}, sugira uma receita de "Doce do Mês" lucrativa.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { systemInstruction: "Especialista em inovação de cardápio para confeitarias. Sugira um nome, ingredientes e um 'segredo do sucesso' em 3 parágrafos curtos." }
      });
      
      setBrainstormResult(response.text || "Tente novamente mais tarde!");
    } catch (err: any) {
      console.error("AI Error:", err);
      if (err.message?.includes("entity was not found")) {
        setNeedsKey(true);
      }
      setBrainstormResult("Que tal criar um 'Bolo de Pote Supremo' hoje? Use seus melhores ingredientes!");
    } finally {
      setIsBrainstorming(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight leading-tight">Painel de Controle 🧁</h1>
          <p className="text-gray-500 font-medium italic">Gestão inteligente para sua cozinha.</p>
        </div>
        <div className="flex gap-2">
           {needsKey && (
             <button onClick={handleSelectKey} className="bg-amber-500 text-white px-5 py-4 rounded-[26px] shadow-lg animate-pulse flex items-center gap-2 font-black text-xs uppercase tracking-widest border-2 border-amber-300">
                <Key size={18} /> Ativar IA
             </button>
           )}
           <button onClick={handleBrainstorm} className="bg-white text-indigo-600 border border-indigo-100 px-6 py-4 rounded-[26px] shadow-sm hover:scale-[1.03] transition-all flex items-center gap-2 font-black text-xs uppercase tracking-widest">
              <Beaker size={18} /> Laboratório
           </button>
           <button onClick={getAiInsights} className="bg-gradient-to-r from-pink-500 to-indigo-600 text-white px-7 py-4 rounded-[26px] shadow-xl shadow-pink-100 hover:scale-[1.03] transition-all flex items-center gap-2 font-black text-xs uppercase tracking-widest">
              <Sparkles size={18} /> Consultoria
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Vendas Hoje', val: todayRevenue, color: 'text-emerald-500', icon: DollarSign },
          { label: 'Margem Média', val: `${avgMargin.toFixed(1)}%`, color: 'text-indigo-500', icon: Percent },
          { label: 'Faturamento Mês', val: monthRevenue, color: 'text-gray-800', icon: TrendingUp, dark: true },
          { label: 'Clientes VIP', val: (state.customers || []).length, color: 'text-amber-500', icon: Star, suffix: ' Clientes' }
        ].map((card, i) => (
          <div key={i} className={`${card.dark ? 'bg-gray-900 text-white shadow-xl' : 'bg-white border border-gray-100 shadow-sm'} p-7 rounded-[32px] transition-transform hover:scale-[1.02]`}>
            <p className={`text-[10px] ${card.dark ? 'text-gray-400' : card.color} font-black uppercase tracking-widest mb-1 flex items-center gap-1`}>
              <card.icon size={10}/> {card.label}
            </p>
            <div className={`text-2xl font-black ${card.dark ? 'text-white' : 'text-gray-800'}`}>
              {typeof card.val === 'number' && !card.suffix ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.val) : `${card.val}${card.suffix || ''}`}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 md:p-10 rounded-[45px] border border-gray-100 shadow-sm">
          <h2 className="text-lg font-black text-gray-800 flex items-center gap-2 mb-8"><TrendingUp className="text-emerald-500" size={20} /> Evolução de Vendas</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F9FAFB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#D1D5DB'}} dy={10} />
                <Tooltip cursor={{fill: '#FFF9FB', radius: 12}} contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800}} />
                <Bar dataKey="total" radius={[10, 10, 10, 10]} barSize={45}>
                  {last7Days.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.date === today ? '#EC4899' : '#FBCFE8'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-[45px] border border-gray-100 shadow-sm">
          <h2 className="text-lg font-black text-gray-800 mb-8 flex items-center gap-2"><Star className="text-amber-400" size={20} /> Atalhos Rápidos</h2>
          <div className="space-y-4">
             {[
               { tab: 'sales', label: 'Vender Doce PDV', icon: ShoppingBasket, color: 'text-pink-500' },
               { tab: 'agenda', label: 'Ver Agenda Entrega', icon: Clock, color: 'text-indigo-500' },
               { tab: 'products', label: 'Nova Ficha Técnica', icon: ChefHat, color: 'text-amber-500' }
             ].map((item, i) => (
              <button key={i} onClick={() => onNavigate(item.tab)} className="w-full flex items-center justify-between p-6 bg-gray-50/50 rounded-[30px] border border-transparent hover:border-pink-200 transition-all active:scale-95 group">
                <div className="flex items-center gap-4">
                   <div className={`w-11 h-11 bg-white rounded-2xl flex items-center justify-center ${item.color} shadow-sm transition-all`}>
                      <item.icon size={20} />
                   </div>
                   <span className="font-black text-gray-700 text-xs">{item.label}</span>
                </div>
                <ArrowRight size={16} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
              </button>
             ))}
          </div>
        </div>
      </div>

      {showBrainstormModal && (
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[50px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[85vh]">
              <div className="p-10 bg-indigo-600 text-white relative shrink-0">
                 <button onClick={() => setShowBrainstormModal(false)} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors"><X size={26}/></button>
                 <div className="flex items-center gap-5">
                    <div className="p-4 bg-white/10 rounded-[28px] border border-white/10"><Beaker size={36} className="text-indigo-200" /></div>
                    <div>
                       <h2 className="text-2xl font-black tracking-tight leading-none mb-2">Laboratório</h2>
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Criador de Receitas</p>
                    </div>
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto p-10 bg-gray-50/50">
                 {isBrainstorming ? (
                   <div className="py-20 flex flex-col items-center justify-center text-center gap-4">
                      <Loader2 size={48} className="text-indigo-500 animate-spin" />
                      <p className="font-black text-gray-800">Cozinhando ideias...</p>
                   </div>
                 ) : (
                   <div className="prose prose-pink max-w-none">
                      <div className="bg-white p-8 rounded-[40px] border border-indigo-50 shadow-sm leading-relaxed text-gray-700 font-bold whitespace-pre-line">
                         {brainstormResult}
                      </div>
                      <div className="mt-8 p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-center gap-4">
                         <MessageCircle className="text-amber-500 shrink-0" size={24} />
                         <p className="text-[11px] font-black text-amber-700 uppercase tracking-widest">DICA: Peça feedback aos seus clientes!</p>
                      </div>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {showAiModal && (
        <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[50px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[85vh]">
              <div className="p-10 bg-gray-900 text-white relative shrink-0">
                 <button onClick={() => setShowAiModal(false)} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors"><X size={26}/></button>
                 <div className="flex items-center gap-5">
                    <div className="p-4 bg-white/10 rounded-[28px] border border-white/10"><Sparkles size={36} className="text-pink-400" /></div>
                    <h2 className="text-2xl font-black tracking-tight leading-none">Consultoria VIP</h2>
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-4">
                 {isAiLoading ? (
                   <div className="py-10 flex flex-col items-center justify-center gap-4">
                      <Loader2 size={32} className="text-pink-500 animate-spin" />
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Analisando números...</p>
                   </div>
                 ) : 
                   aiInsights.map((tip, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex gap-4 animate-in slide-in-from-bottom-4" style={{animationDelay: `${i*100}ms`}}>
                       <div className="w-10 h-10 bg-pink-50 text-pink-500 rounded-2xl flex items-center justify-center shrink-0"><Lightbulb size={20}/></div>
                       <p className="text-gray-700 font-bold text-sm pt-1">{tip}</p>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
