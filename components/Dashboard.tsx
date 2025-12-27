
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
  Key,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { GoogleGenAI, Type } from "@google/genai";

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}

interface BrainstormRecipe {
  name: string;
  description: string;
  ingredients: { item: string; qty: string }[];
  estimatedCost: number;
  suggestedPrice: number;
  reasoning: string;
}

interface DashboardProps {
  state: AppState;
  onNavigate: (tab: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, onNavigate }) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isBrainstorming, setIsBrainstorming] = useState(false);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [brainstormRecipe, setBrainstormRecipe] = useState<BrainstormRecipe | null>(null);
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analise: Faturamento R$ ${monthRevenue.toFixed(2)}, Margem ${avgMargin.toFixed(1)}%. Dê 3 dicas para aumentar o lucro.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: "Consultor de confeitarias. Responda JSON com campo 'tips' (array de strings).",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: { tips: { type: Type.ARRAY, items: { type: Type.STRING } } },
            required: ["tips"]
          }
        },
      });
      const data = JSON.parse(response.text || '{"tips":[]}');
      setAiInsights(data.tips);
    } catch (err: any) {
      if (err.message?.includes("entity was not found")) setNeedsKey(true);
      setAiInsights(["Revise seus custos fixos.", "Invista em fotos melhores.", "Crie combos lucrativos."]);
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
    setBrainstormRecipe(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stockSummary = state.stock
        .filter(s => s.quantity > 0)
        .map(s => `${s.name} (R$ ${s.unitPrice}/${s.unit})`)
        .join(', ');

      const prompt = `Ingredientes disponíveis: ${stockSummary || 'Chocolate, Leite Condensado'}. Invente um doce autoral lucrativo.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: "Você é um Chef confeiteiro criativo. Sugira um doce autoral com base nos insumos e preços fornecidos. Responda APENAS em JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              ingredients: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT, 
                  properties: { item: { type: Type.STRING }, qty: { type: Type.STRING } } 
                } 
              },
              estimatedCost: { type: Type.NUMBER },
              suggestedPrice: { type: Type.NUMBER },
              reasoning: { type: Type.STRING }
            },
            required: ["name", "description", "ingredients", "estimatedCost", "suggestedPrice", "reasoning"]
          }
        }
      });
      
      const recipe = JSON.parse(response.text || '{}');
      setBrainstormRecipe(recipe);
    } catch (err: any) {
      if (err.message?.includes("entity was not found")) setNeedsKey(true);
      setBrainstormRecipe({
        name: "Brigadeiro de Ouro",
        description: "Um clássico refinado com um toque especial.",
        ingredients: [{ item: "Leite Condensado", qty: "1 lata" }, { item: "Cacau", qty: "30g" }],
        estimatedCost: 5.50,
        suggestedPrice: 12.00,
        reasoning: "Baixo custo de produção e alta aceitação no mercado."
      });
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
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Ficha Técnica Sugerida</p>
                    </div>
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto p-10 bg-gray-50/50 space-y-6">
                 {isBrainstorming ? (
                   <div className="py-20 flex flex-col items-center justify-center text-center gap-4">
                      <Loader2 size={48} className="text-indigo-500 animate-spin" />
                      <p className="font-black text-gray-800">Cozinhando ideias...</p>
                   </div>
                 ) : brainstormRecipe && (
                   <div className="space-y-6 animate-in fade-in duration-500">
                      <div className="bg-white p-8 rounded-[40px] border border-indigo-50 shadow-sm">
                         <h3 className="text-2xl font-black text-gray-800 mb-2">{brainstormRecipe.name}</h3>
                         <p className="text-gray-500 font-medium italic text-sm mb-6">{brainstormRecipe.description}</p>
                         
                         <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="p-4 bg-emerald-50 rounded-3xl border border-emerald-100">
                               <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Custo Est.</p>
                               <p className="text-xl font-black text-emerald-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(brainstormRecipe.estimatedCost)}</p>
                            </div>
                            <div className="p-4 bg-pink-50 rounded-3xl border border-pink-100">
                               <p className="text-[8px] font-black text-pink-600 uppercase tracking-widest mb-1">Venda Sugerida</p>
                               <p className="text-xl font-black text-pink-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(brainstormRecipe.suggestedPrice)}</p>
                            </div>
                         </div>

                         <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><ChefHat size={12}/> Ingredientes</h4>
                            {brainstormRecipe.ingredients.map((ing, i) => (
                               <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50">
                                  <span className="text-xs font-bold text-gray-700">{ing.item}</span>
                                  <span className="text-xs font-black text-indigo-500">{ing.qty}</span>
                               </div>
                            ))}
                         </div>
                      </div>

                      <div className="bg-amber-50 p-6 rounded-[30px] border border-amber-100 flex items-start gap-4">
                         <Lightbulb className="text-amber-500 shrink-0 mt-1" size={24} />
                         <div>
                            <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">Por que vender isso?</p>
                            <p className="text-xs font-bold text-amber-700 leading-relaxed">{brainstormRecipe.reasoning}</p>
                         </div>
                      </div>
                   </div>
                 )}
              </div>
              {!isBrainstorming && (
                <div className="p-8 bg-white border-t border-gray-100 flex gap-4">
                   <button onClick={() => setShowBrainstormModal(false)} className="flex-1 py-4 text-gray-400 font-black text-xs uppercase tracking-widest">Fechar</button>
                   <button onClick={handleBrainstorm} className="flex-[2] py-5 bg-indigo-600 text-white rounded-[28px] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center gap-2">
                      <Sparkles size={18} /> Nova Ideia
                   </button>
                </div>
              )}
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
