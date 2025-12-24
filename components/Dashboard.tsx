
import React, { useMemo, useState } from 'react';
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
  BrainCircuit,
  AlertTriangle,
  ArrowUpRight,
  Loader2,
  Lightbulb,
  CheckCircle2,
  Clock,
  Percent,
  PackageOpen
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { GoogleGenAI, Type } from "@google/genai";

interface DashboardProps {
  state: AppState;
  onNavigate: (tab: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, onNavigate }) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [lastAnalysis, setLastAnalysis] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todaySales = state.sales.filter(s => s.date.startsWith(today));
  const todayRevenue = todaySales.reduce((acc, s) => acc + s.total, 0);
  
  const todayProductions = (state.productions || []).filter(p => p.date.startsWith(today));
  const todayProductionCost = todayProductions.reduce((acc, p) => acc + p.totalCost, 0);
  
  const monthSales = state.sales.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === new Date().getMonth();
  });
  const monthRevenue = monthSales.reduce((acc, s) => acc + s.total, 0);
  const monthCogs = (state.productions || []).filter(p => {
    const d = new Date(p.date);
    return d.getMonth() === new Date().getMonth();
  }).reduce((acc, p) => acc + p.totalCost, 0);
  
  const monthFixed = state.expenses.filter(e => e.isFixed && new Date(e.date).getMonth() === new Date().getMonth()).reduce((acc, e) => acc + e.value, 0);
  
  const productsWithCost = state.products.filter(p => p.cost > 0);
  const avgMargin = productsWithCost.length > 0
    ? (productsWithCost.reduce((acc, p) => acc + ((p.price - p.cost) / p.price), 0) / productsWithCost.length) * 100
    : 0;

  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const daySales = state.sales.filter(s => s.date.startsWith(dateStr));
    return { name: d.toLocaleDateString('pt-BR', { weekday: 'short' }), total: daySales.reduce((acc, s) => acc + s.total, 0), date: dateStr };
  });

  const criticalStock = useMemo(() => {
    return state.stock.filter(item => item.quantity <= item.minQuantity).slice(0, 2);
  }, [state.stock]);

  const getAiInsights = async () => {
    if (aiInsights.length > 0 && !showAiModal) {
      setShowAiModal(true);
      return;
    }

    setIsAiLoading(true);
    setShowAiModal(true);
    setAiInsights([]);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `Analise os dados reais da minha confeitaria e me dê 3 dicas práticas para aumentar meu lucro este mês:
      - Faturamento Mensal: R$ ${monthRevenue.toFixed(2)}
      - Gastos com Insumos: R$ ${monthCogs.toFixed(2)}
      - Gastos Fixos: R$ ${monthFixed.toFixed(2)}
      - Margem Média: ${avgMargin.toFixed(1)}%
      - Total de Produtos: ${state.products.length}
      - Itens Críticos no Estoque: ${criticalStock.map(i => i.name).join(', ') || 'Nenhum'}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: "Você é um consultor sênior de negócios focado em pequenas confeitarias artesanais. Suas dicas devem ser curtas, diretas ao ponto, sem introduções e focadas em ações práticas para aumentar o lucro ou reduzir desperdício. Responda obrigatoriamente em formato JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Lista com exatamente 3 dicas estratégicas curtas.",
              }
            },
            required: ["tips"]
          }
        },
      });
      
      const data = JSON.parse(response.text || '{"tips":[]}');
      const tips = Array.isArray(data.tips) ? data.tips : [];
      
      setAiInsights(tips.length > 0 ? tips : ["Analise seus custos fixos e tente negociar com fornecedores.", "Crie promoções para os produtos com maior margem.", "Foque em vender para clientes que já compraram de você."]);
      setLastAnalysis(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error("Erro na IA:", err);
      setAiInsights(["Ocorreu um pequeno erro ao processar os dados. Tente novamente em alguns segundos!", "Verifique se seus produtos possuem preço e custo cadastrados corretamente.", "A IA está descansando um pouco, mas logo volta com novas estratégias!"]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight leading-tight">Cozinha de {state.user?.email.split('@')[0]} 👋</h1>
          <p className="text-gray-500 font-medium italic">Seu painel de controle e inteligência.</p>
        </div>
        <button 
          onClick={getAiInsights}
          className="flex items-center gap-3 bg-gradient-to-r from-pink-500 to-indigo-600 text-white px-7 py-4 rounded-[26px] shadow-xl shadow-pink-100 hover:scale-[1.03] active:scale-95 transition-all group"
        >
          <Sparkles size={20} className="animate-pulse text-yellow-300" />
          <span className="font-black text-xs uppercase tracking-widest">Cozinha Inteligente</span>
        </button>
      </header>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Vendas Hoje', val: todayRevenue, color: 'text-emerald-500', icon: DollarSign },
          { label: 'Produção Hoje', val: todayProductionCost, color: 'text-pink-500', icon: ChefHat },
          { label: 'Margem Média', val: `${avgMargin.toFixed(1)}%`, color: 'text-indigo-500', icon: Percent },
          { label: 'Faturamento Mês', val: monthRevenue, color: 'text-gray-800', icon: TrendingUp, dark: true }
        ].map((card, i) => (
          <div key={i} className={`${card.dark ? 'bg-gray-900 text-white shadow-xl' : 'bg-white border border-gray-100 shadow-sm'} p-7 rounded-[32px] transition-transform hover:scale-[1.02]`}>
            <p className={`text-[10px] ${card.dark ? 'text-gray-400' : card.color} font-black uppercase tracking-widest mb-1 flex items-center gap-1`}>
              <card.icon size={10}/> {card.label}
            </p>
            <div className={`text-2xl font-black ${card.dark ? 'text-white' : 'text-gray-800'}`}>
              {typeof card.val === 'number' ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.val) : card.val}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 md:p-10 rounded-[45px] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
             <h2 className="text-lg font-black text-gray-800 flex items-center gap-2"><TrendingUp className="text-emerald-500" size={20} /> Desempenho Semanal</h2>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F9FAFB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#D1D5DB'}} dy={10} />
                <Tooltip 
                  cursor={{fill: '#FFF9FB', radius: 12}} 
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800, padding: '15px'}} 
                  formatter={(value: number) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 'Vendas']} 
                />
                <Bar dataKey="total" radius={[10, 10, 10, 10]} barSize={45}>
                  {last7Days.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.date === today ? '#EC4899' : '#FBCFE8'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-[45px] border border-gray-100 shadow-sm">
          <h2 className="text-lg font-black text-gray-800 mb-8 flex items-center gap-2"><Star className="text-amber-400" size={20} fill="currentColor" /> Atalhos</h2>
          <div className="space-y-4">
             {[
               { tab: 'sales', label: 'Registrar Venda', icon: ShoppingBasket, color: 'text-pink-500', bg: 'hover:border-pink-200' },
               { tab: 'agenda', label: 'Ver Agenda', icon: Clock, color: 'text-indigo-500', bg: 'hover:border-indigo-200' },
               { tab: 'stock', label: 'Gerenciar Estoque', icon: PackageOpen, color: 'text-amber-500', bg: 'hover:border-amber-200' }
             ].map((item, i) => (
              <button 
                key={i}
                onClick={() => onNavigate(item.tab)}
                className={`w-full flex items-center justify-between p-6 bg-gray-50/50 rounded-[30px] border border-transparent ${item.bg} transition-all group active:scale-95`}
              >
                <div className="flex items-center gap-4">
                   <div className={`w-11 h-11 bg-white rounded-2xl flex items-center justify-center ${item.color} shadow-sm group-hover:bg-gray-800 group-hover:text-white transition-all`}>
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

      {showAiModal && (
        <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[50px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[85vh]">
              <div className="p-10 bg-gradient-to-br from-gray-900 to-indigo-900 text-white relative shrink-0">
                 <button onClick={() => setShowAiModal(false)} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors"><X size={26}/></button>
                 <div className="flex items-center gap-5">
                    <div className="p-4 bg-white/10 rounded-[28px] backdrop-blur-md border border-white/10">
                       <BrainCircuit size={36} className="text-pink-400" />
                    </div>
                    <div>
                       <h2 className="text-2xl font-black tracking-tight leading-none mb-2">Cozinha Inteligente</h2>
                       <div className="flex items-center gap-2 opacity-60">
                          <span className="text-[10px] font-black uppercase tracking-widest">IA Confeiteira</span>
                          {lastAnalysis && <span className="text-[9px] font-black px-2 py-0.5 bg-white/10 rounded-full italic">Hoje às {lastAnalysis}</span>}
                       </div>
                    </div>
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar bg-gray-50/40">
                 {isAiLoading ? (
                   <div className="py-24 flex flex-col items-center justify-center gap-6">
                      <div className="relative">
                         <Loader2 size={64} className="text-pink-500 animate-spin" strokeWidth={3} />
                         <Sparkles size={24} className="text-yellow-400 absolute -top-3 -right-3 animate-bounce" />
                      </div>
                      <div className="text-center">
                        <p className="text-gray-800 font-black text-xl italic tracking-tight">Analisando o forno...</p>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-2">Criando estratégias para o seu lucro</p>
                      </div>
                   </div>
                 ) : (
                   <div className="space-y-5">
                      {aiInsights.map((tip, idx) => (
                        <div 
                          key={idx} 
                          className="bg-white p-7 rounded-[35px] border border-gray-100 shadow-sm flex gap-5 animate-in slide-in-from-bottom-6 duration-500" 
                          style={{ animationDelay: `${idx * 150}ms` }}
                        >
                           <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-500 flex items-center justify-center shrink-0 shadow-sm shadow-pink-50">
                              <Lightbulb size={24} />
                           </div>
                           <p className="text-gray-700 font-bold leading-relaxed text-sm pt-1">
                              {tip}
                           </p>
                        </div>
                      ))}
                      
                      {aiInsights.length === 0 && !isAiLoading && (
                         <div className="py-16 text-center">
                            <AlertTriangle size={48} className="mx-auto text-amber-300 mb-4" />
                            <p className="text-gray-400 font-black italic">Não conseguimos gerar dicas no momento. Tente novamente!</p>
                         </div>
                      )}
                   </div>
                 )}
              </div>

              <div className="p-10 border-t border-gray-100 bg-white shrink-0">
                 <button 
                  onClick={() => setShowAiModal(false)}
                  className="w-full py-5 bg-gray-900 text-white rounded-[32px] font-black text-sm uppercase tracking-widest shadow-xl hover:bg-black hover:scale-[1.02] transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  Confirmado, vamos vender! <CheckCircle2 size={20} className="text-emerald-400" />
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
