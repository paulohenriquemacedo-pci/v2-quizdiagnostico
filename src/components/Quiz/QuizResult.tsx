import { useEffect, useState } from 'react';
import { QuizResult as QuizResultType } from '@/types/quiz.types';
import { profileResults, GOVERNANCE_TEXT, TRANSITION_BASE, TRANSITION_COMPLEMENT } from '@/data/profileResults';
import { trackCTAClick, trackResultView } from '@/lib/analytics';

interface QuizResultProps {
  result: QuizResultType;
  email: string;
  name: string;
  onReset: () => void;
}

// Get UTM params from URL
function getUTMParams() {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get('utm_source'),
    utmMedium: params.get('utm_medium'),
    utmCampaign: params.get('utm_campaign'),
  };
}

// Detect device type
function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown';
  return /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
}

const testimonials = [
  {
    name: "Julianna Brandão",
    before: "Eu não conseguia manter uma rotina de escrita.",
    after: "Consegui organizar minha rotina acadêmica e concluí meu TCC antes do prazo.",
    screenshot: "/julianna-whatsapp-BORR6RGZ.jpeg",
    avatar: "/julianabrandao.png",
  },
  {
    name: "Ana Paula",
    before: "Cada sessão de trabalho era sofrimento.",
    after: "Finalmente produzo mais sem sofrimento!",
    screenshot: "/ana-paula-whatsapp-EDTaF2po.png",
    avatar: "/anapaula.png",
  },
  {
    name: "Ricardo Sousa",
    before: "Não sabia se o método funcionava na prática.",
    after: "Tive a sorte de participar do grupo de teste e apliquei na dissertação. Agora vou aplicar durante o doutoramento.",
    screenshot: "/ricardo-whatsapp-CH_LnwAg.png",
    avatar: "/ricardosousa.png",
  },
  {
    name: "Jana Mara",
    before: "Sentia que nunca ia terminar.",
    after: "O sistema me deu clareza para finalizar minha dissertação com confiança.",
    screenshot: "/jana-whatsapp-CosRvZ9s.png",
    avatar: null,
  },
];

const urgencyCards = [
  {
    icon: "💰",
    title: "Preço de Lançamento (R$27)",
    description: "O valor oficial do pacote completo (Diagnóstico + 4 Bônus) é R$165. Você economiza R$138 comprando nesta janela de oportunidade.",
  },
  {
    icon: "🎁",
    title: "Bônus Completos",
    description: "Os bônus operacionais em PDF e alta definição serão removidos depois do lançamento. Só quem adquire agora garante o pacote completo.",
  },
  {
    icon: "📅",
    title: "Cada Dia Conta",
    description: "É um dia a menos para implementar o sistema. Se você tem prazos rígidos de qualificação ou defesa, não pode perder tempo hesitando.",
  },
];

export function QuizResult({ result, email, name, onReset }: QuizResultProps) {
  const { dominant, secondary } = result;
  const content = profileResults[dominant.code];
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Track result view on mount
  useEffect(() => {
    if (content) {
      trackResultView(dominant.name, dominant.code);
    }
  }, [dominant.name, dominant.code, content]);

  if (!content) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center max-w-md">
          <p className="text-white text-lg font-semibold mb-4">Erro ao carregar conteúdo do perfil</p>
          <button
            onClick={onReset}
            className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all"
          >
            Refazer Quiz
          </button>
        </div>
      </div>
    );
  }

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'Muito Forte':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'Forte':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'Moderado':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Leve':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const handleCTAClick = () => {
    const utm = getUTMParams();
    trackCTAClick({
      email,
      dominantProfile: dominant.name,
      dominantCode: dominant.code,
      utmSource: utm.utmSource,
      utmMedium: utm.utmMedium,
      utmCampaign: utm.utmCampaign,
      deviceType: getDeviceType(),
    });
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const checkoutUrl = "https://payfast.greenn.com.br/ascwjh4/offer/T0ft6Q?ch_id=135591&b_id_1=xagf247&b_offer_1=Lt0Nw8&b_id_2=zaw8gdy&b_offer_2=nLg6Ts";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased relative overflow-hidden pb-16">
      {/* Decorative Glow Blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-4xl mx-auto px-4 pt-12 relative z-10">
        
        {/* --- DOBRA 1: HERO / REVELAÇÃO DO RESULTADO --- */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-wider mb-6">
            🔬 Diagnóstico Digital Verificado | Registro #AC-{dominant.code}2026
          </div>
          
          {/* Avatar da Persona */}
          <div className="w-20 h-20 rounded-full bg-slate-900 border-2 flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg relative" style={{ borderColor: content.color }}>
            <div className="absolute inset-0 rounded-full blur-md opacity-40 animate-pulse" style={{ backgroundColor: content.color }} />
            <span className="relative z-10">{content.icon}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
            Seu padrão dominante de travamento acadêmico é: <br />
            <span style={{ color: content.color }} className="drop-shadow-[0_0_20px_rgba(139,92,246,0.15)]">
              {content.name}
            </span>
          </h1>
          
          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-6">
            Isso não é falta de esforço nem de inteligência. É um padrão comportamental que seu cérebro desenvolveu sob pressão — e agora ele tem nome.
          </p>
          
          <p className="text-xs md:text-sm text-slate-550 italic font-medium max-w-xl mx-auto border-t border-slate-900 pt-4 mb-8">
            "Pela primeira vez, o sistema olhou para você — não apenas para a sua pesquisa."
          </p>

          {/* DADOS E INTENSIDADE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">Sua Pontuação</span>
              <div className="text-4xl font-extrabold text-white flex items-baseline gap-1">
                {dominant.score} <span className="text-lg text-slate-500 font-medium">/ 12</span>
              </div>
              <span className="text-xs text-slate-500 mt-2">Fator de correspondência comportamental</span>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">Grau de Intensidade</span>
              <div className={`px-4 py-2 rounded-xl text-lg font-bold border ${getIntensityColor(dominant.intensity)}`}>
                {dominant.intensity}
              </div>
              <span className="text-xs text-slate-500 mt-2">Nível de incidência na sua rotina acadêmica</span>
            </div>
          </div>
        </div>

        {/* --- RITUAL DE GOVERNANÇA --- */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 mb-10 text-center text-xs md:text-sm text-slate-400 italic">
          {GOVERNANCE_TEXT}
        </div>

        {/* --- DOBRA 2: ENTREGA DA PROMESSA (As 5 Dicas Imediatas) --- */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-10 mb-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-xl">
              ⚡
            </div>
            <h2 className="text-base md:text-lg font-bold text-white leading-snug">
              Conforme prometido, veja as 5 implementações imediatas que você pode (e deve) aplicar na sua rotina:
            </h2>
          </div>

          <div className="space-y-4">
            {content.immediatePractices.map((practice, idx) => (
              <div 
                key={idx}
                className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-750 transition-all hover:translate-x-1 duration-250"
              >
                <h3 
                  className="font-bold text-base mb-2 flex items-center gap-2"
                  style={{ color: content.color }}
                >
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white" style={{ backgroundColor: content.color }}>
                    {idx + 1}
                  </span>
                  {practice.title}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-3 pl-8">
                  {practice.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-900 pt-2.5 pl-8">
                  <span className="font-semibold text-emerald-400">✓ Critério de sucesso:</span>
                  <span className="italic">{practice.successCriteria}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- DOBRA 3: CONEXÃO INSTITUCIONAL (Passo 1 de 8) --- */}
        <div className="bg-violet-950/20 border border-violet-500/20 rounded-3xl p-6 md:p-8 mb-8 flex flex-col sm:flex-row items-center gap-5 text-left">
          <div className="w-14 h-14 rounded-full bg-violet-500/10 border border-violet-500/35 flex items-center justify-center text-2xl shrink-0 text-violet-400">
            📊
          </div>
          <div>
            <h4 className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-1.5">Passo 1 de 8 Concluído com Sucesso</h4>
            <p className="text-sm md:text-base text-slate-300 leading-relaxed">
              Identificar o seu perfil de travamento é o **primeiro pilar (Avaliação)** do <strong>Sistema A.C.A.D.E.M.I.A.</strong>, e você acabou de concluir esse passo com sucesso. Você deu o primeiro passo para construir uma rotina de pesquisa sustentável. Agora, vamos entender como esse padrão atua e como neutralizá-lo.
            </p>
          </div>
        </div>

        {/* --- DOBRA 4: DIAGNÓSTICO PROFUNDO (O Significado) --- */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-10 mb-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-xl">
              🎯
            </div>
            <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-wider">
              Qual o significado do seu perfil identificado?
            </h2>
          </div>
          
          <div className="space-y-4 text-slate-300 leading-relaxed text-sm md:text-base">
            {content.whatItMeans.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>

          {/* BOX: GARGALO DE SOBRECARGA COGNITIVA */}
          <div 
            className="mt-8 p-6 rounded-2xl border-l-4"
            style={{ 
              backgroundColor: `${content.color}08`,
              borderColor: content.color,
              borderWidth: '0 0 0 4px'
            }}
          >
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-350 mb-2 flex items-center gap-2">
              ⚠️ Gargalo de Sobrecarga Cognitiva
            </h3>
            <p className="text-slate-200 text-sm md:text-base leading-relaxed mb-2 font-medium">
              {content.coreObstacle}
            </p>
            <p 
              className="text-xs font-bold"
              style={{ color: content.color }}
            >
              {content.coreObstacleMetric}
            </p>
          </div>
        </div>

        {/* --- DOBRA 5: PERFIS SECUNDÁRIOS --- */}
        {secondary.length > 0 && (
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 mb-8">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
              Padrões Secundários Identificados (Ações Reativas):
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {secondary.map((profile) => (
                <div
                  key={profile.code}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-950/40 border border-slate-800/80"
                  style={{ borderLeft: `3px solid ${profile.color}` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{profile.icon}</span>
                    <span className="font-bold text-xs sm:text-sm text-slate-200">
                      {profile.name}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold uppercase">
                    {profile.intensity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- DOBRA 6: CONTRASTE DE POSICIONAMENTO (Quadro Comparativo) --- */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-10 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-wider mb-2">
              Por que os métodos tradicionais de produtividade falham na pós-graduação?
            </h2>
            <p className="text-xs md:text-sm text-slate-450">
              Entenda a diferença estrutural entre o que o ecossistema te oferece e o que você realmente precisa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Coluna 1: A Universidade Cobra Produção */}
            <div className="bg-slate-950/50 border border-slate-900 rounded-2xl p-5 relative overflow-hidden flex flex-col">
              <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md self-start mb-4 uppercase">
                A Universidade
              </span>
              <h4 className="text-sm font-bold text-slate-100 mb-2">
                Cobra Produção
              </h4>
              <p className="text-xs text-slate-350 leading-relaxed mb-4">
                Foca unicamente na cobrança de métricas de entrega final — artigos, relatórios, prazos da CAPES/CNPq e qualificações —, tratando você como uma máquina de produzir.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed mt-auto pt-3 border-t border-slate-900">
                <strong>O Gargalo:</strong> Ela nunca te ensina o processo de como gerenciar a pressão ou de como escrever de forma eficiente.
              </p>
            </div>

            {/* Coluna 2: O Mercado Vende Ferramentas */}
            <div className="bg-slate-950/50 border border-slate-900 rounded-2xl p-5 relative overflow-hidden flex flex-col">
              <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md self-start mb-4 uppercase">
                O Mercado
              </span>
              <h4 className="text-sm font-bold text-slate-100 mb-2">
                Vende Ferramentas
              </h4>
              <p className="text-xs text-slate-350 leading-relaxed mb-4">
                Tenta resolver sua ansiedade vendendo hacks genéricos e softwares corporativos (como planilhas, Notion, Pomodoro de 25 min ou acordar às 5h da manhã).
              </p>
              <p className="text-xs text-slate-400 leading-relaxed mt-auto pt-3 border-t border-slate-900">
                <strong>O Gargalo:</strong> Essas ferramentas quebram na rotina acadêmica, pois foram desenhadas para tarefas de escritório simples, e não para a complexidade da ciência.
              </p>
            </div>

            {/* Coluna 3: O Sistema Academia Foca no Comportamento (Destaque) */}
            <div className="bg-violet-950/20 border-2 border-violet-500/30 rounded-2xl p-5 relative overflow-hidden flex flex-col shadow-[0_0_15px_rgba(139,92,246,0.1)]">
              <div className="absolute top-0 right-0 w-16 h-16 bg-violet-500/10 rounded-full blur-xl pointer-events-none" />
              <span className="text-xs font-bold text-violet-400 bg-violet-500/15 px-2 py-0.5 rounded-md self-start mb-4 uppercase flex items-center gap-1">
                ⭐ Nosso Método
              </span>
              <h4 className="text-sm font-bold text-white mb-2">
                Foca no Comportamento
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Entende que para destravar a escrita, você não precisa de mais cobrança ou de aplicativos novos.
              </p>
              <p className="text-xs text-slate-200 leading-relaxed mt-auto pt-3 border-t border-violet-500/20">
                <strong>A Solução:</strong> O foco está em identificar o seu padrão de travamento e treinar a sua regulação cognitiva, permitindo que você produza com consistência nas suas Horas de Ouro e proteja a sua saúde mental.
              </p>
            </div>

          </div>
        </div>

        {/* --- DOBRA 7: A TRANSIÇÃO METACOGNITIVA (A Ponte) --- */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 md:p-10 mb-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />
          
          <h3 className="text-xl md:text-2xl font-extrabold text-white mb-6 uppercase tracking-wider bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            O primeiro parágrafo da transformação
          </h3>

          <p className="text-slate-200 text-sm md:text-base leading-relaxed mb-4 max-w-2xl mx-auto">
            {TRANSITION_BASE}
          </p>
          <p className="text-slate-400 text-xs md:text-sm leading-relaxed mb-6 max-w-2xl mx-auto">
            {TRANSITION_COMPLEMENT}
          </p>
          <p 
            className="text-sm md:text-base font-bold"
            style={{ color: content.color }}
          >
            {content.transitionText}
          </p>
        </div>

        {/* --- OFERTA DO PROTOCOLO PAS (PÁGINA DE VENDAS ACOPLADA) --- */}
        <div 
          className="rounded-3xl p-6 md:p-10 mb-10 relative overflow-hidden"
          style={{ 
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            border: `2px solid ${content.color}40`,
            boxShadow: `0 20px 50px -10px rgba(124, 58, 237, 0.15)`
          }}
        >
          {/* Header Oferta */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
              ⚡ Oferta Especial do Diagnóstico
            </span>
            <h3 className="text-xl md:text-3xl font-extrabold text-white leading-tight max-w-xl mx-auto">
              {content.ctaHeadline}
            </h3>
          </div>

          {/* Bullets Personalizados */}
          <div className="mb-8 space-y-3.5 p-5 bg-slate-950/60 rounded-2xl border border-slate-800/80">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Como o método vai atuar no seu padrão de travamento:
            </h4>
            {content.ctaBullets.map((bullet, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm md:text-base text-slate-300 leading-relaxed">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{bullet}</span>
              </div>
            ))}
          </div>

          {/* Conteúdo do Entregável */}
          <div className="mb-8">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span>📦</span> O que você recebe no Diagnóstico Completo:
            </h4>
            
            <div className="space-y-4 text-sm md:text-base text-slate-350">
              <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-900/30 border border-slate-800/40">
                <span className="text-violet-400 font-extrabold shrink-0 mt-0.5">1.</span>
                <div>
                  <span className="font-bold text-white">Relatório Completo do Perfil Dominante e Secundários</span>
                  <span className="text-slate-400"> — Mapeamento de como você trava e o protocolo prático de ação personalizado de 90 dias.</span>
                </div>
              </div>
              <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-900/30 border border-slate-800/40">
                <span className="text-violet-400 font-extrabold shrink-0 mt-0.5">2.</span>
                <div>
                  <span className="font-bold text-white">Acesso aos 6 Perfis do Sistema A.C.A.D.E.M.I.A</span>
                  <span className="text-slate-400"> — Conhecimento detalhado de como identificar e neutralizar cada padrão de travamento no seu grupo de pesquisa.</span>
                </div>
              </div>
              <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-900/30 border border-slate-800/40">
                <span className="text-violet-400 font-extrabold shrink-0 mt-0.5">3.</span>
                <div>
                  <span className="font-bold text-white">Recursos e Protocolos de Acompanhamento Prático</span>
                  <span className="text-slate-400"> — As ferramentas operacionais prontas para instalar em sua rotina, inclusas gratuitamente como bônus.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reposicionamento dos 4 Bônus (Bíblia Estratégica) */}
          <div className="mb-8">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span>🎁</span> Quatro Bônus Inclusos no Pacote:
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-xl mb-1 block">📊</span>
                <h5 className="font-bold text-xs sm:text-sm text-white mb-1">
                  Mapa Semanal de Produtividade (PDF) <span className="text-slate-500 line-through text-xs font-normal">R$37</span>
                </h5>
                <p className="text-xs text-slate-400 leading-normal">
                  O painel prático em 14 páginas que torna o seu progresso científico visível.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-xl mb-1 block">⚡</span>
                <h5 className="font-bold text-xs sm:text-sm text-white mb-1">
                  Guia de Energia Cognitiva (PDF) <span className="text-slate-500 line-through text-xs font-normal">R$37</span>
                </h5>
                <p className="text-xs text-slate-400 leading-normal">
                  Método de 28 páginas para mapear seu ritmo cronobiológico e encontrar suas Horas de Ouro.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-xl mb-1 block">📖</span>
                <h5 className="font-bold text-xs sm:text-sm text-white mb-1">
                  Guia Visual do Sistema A.C.A.D.E.M.I.A. <span className="text-slate-500 line-through text-xs font-normal">R$37</span>
                </h5>
                <p className="text-xs text-slate-400 leading-normal">
                  Resumo visual de transição estratégica do modelo universitário tradicional para o sustentável.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-xl mb-1 block">🗺️</span>
                <h5 className="font-bold text-xs sm:text-sm text-white mb-1">
                  Painel do Mapa do Sistema (PNG) <span className="text-slate-500 line-through text-xs font-normal">R$27</span>
                </h5>
                <p className="text-xs text-slate-400 leading-normal">
                  Arte em alta resolução (A3/A4) para guiar seu dia de estudos na mesa de trabalho.
                </p>
              </div>
            </div>
          </div>

          {/* --- DEPOIMENTOS (SOCIAL PROOF - CARROSEL) --- */}
          <div className="mb-10 border-t border-slate-800/60 pt-8 text-center">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center justify-center gap-2">
              <span>💬</span> O que outros pesquisadores estão dizendo:
            </h4>
            
            {/* Carousel Container */}
            <div className="relative max-w-2xl mx-auto px-4 md:px-12">
              
              {/* Testimonial Card */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 md:p-8 hover:border-slate-700 transition-all flex flex-col justify-between min-h-[420px] text-left">
                <div>
                  {/* Header: Avatar + Nome */}
                  <div className="flex items-center gap-3 mb-4">
                    {testimonials[activeTestimonial].avatar ? (
                      <img 
                        src={testimonials[activeTestimonial].avatar} 
                        alt={testimonials[activeTestimonial].name} 
                        className="w-10 h-10 rounded-full object-cover border border-slate-700" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 font-bold text-sm">
                        {testimonials[activeTestimonial].name[0]}
                      </div>
                    )}
                    <span className="font-bold text-sm text-slate-200">{testimonials[activeTestimonial].name}</span>
                  </div>

                  <div className="mb-3">
                    <span className="text-red-400 font-bold uppercase tracking-wider text-[10px] bg-red-500/10 px-2 py-0.5 rounded-md">
                      Antes
                    </span>
                    <p className="text-slate-355 text-xs sm:text-sm mt-1 italic">"{testimonials[activeTestimonial].before}"</p>
                  </div>

                  <div className="mb-5">
                    <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      Depois
                    </span>
                    <p className="text-slate-200 text-xs sm:text-sm mt-1 font-medium italic">"{testimonials[activeTestimonial].after}"</p>
                  </div>
                </div>

                <div className="mt-4">
                  {/* Print Screenshot - Reduzido em 40% */}
                  <img
                    src={testimonials[activeTestimonial].screenshot}
                    alt={`Print do depoimento de ${testimonials[activeTestimonial].name}`}
                    loading="lazy"
                    className="max-w-[280px] w-full rounded-xl border border-slate-800 bg-slate-900 mx-auto"
                  />
                  <p className="text-[10px] text-slate-500 mt-2 text-center">
                    Captura de tela original — {testimonials[activeTestimonial].name}
                  </p>
                </div>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={() => setActiveTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
                className="absolute left-[-15px] md:left-[-25px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 border border-slate-850 hover:border-slate-700 flex items-center justify-center text-white hover:bg-slate-850 transition-colors z-20 shadow-lg text-lg font-bold"
                aria-label="Depoimento Anterior"
              >
                ‹
              </button>
              <button
                onClick={() => setActiveTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))}
                className="absolute right-[-15px] md:right-[-25px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 border border-slate-850 hover:border-slate-700 flex items-center justify-center text-white hover:bg-slate-850 transition-colors z-20 shadow-lg text-lg font-bold"
                aria-label="Próximo Depoimento"
              >
                ›
              </button>
            </div>

            {/* Dot Indicators */}
            <div className="flex justify-center gap-2 mt-4">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTestimonial(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                    activeTestimonial === idx 
                      ? 'bg-violet-500 scale-110 shadow-[0_0_8px_rgba(139,92,246,0.5)]' 
                      : 'bg-slate-700 hover:bg-slate-650'
                  }`}
                  aria-label={`Ir para depoimento ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* --- ANCORAGEM DE PREÇO & ROI --- */}
          <div className="mb-10 border-t border-slate-800/60 pt-8">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <span>⏰</span> Por que agir agora?
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {urgencyCards.map((card, idx) => (
                <div key={idx} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 text-center">
                  <div className="text-3xl mb-3">{card.icon}</div>
                  <h5 className="font-bold text-xs sm:text-sm text-white mb-2">{card.title}</h5>
                  <p className="text-xs text-slate-400 leading-normal">{card.description}</p>
                </div>
              ))}
            </div>

            {/* ROI Callout */}
            <div className="bg-slate-950/80 border border-slate-850 rounded-2xl p-6 text-center max-w-xl mx-auto mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 rounded-full blur-xl pointer-events-none" />
              <div className="text-2xl mb-2">💡</div>
              <h5 className="text-sm font-bold text-slate-200 uppercase tracking-widest mb-3">Quanto vale 1 mês de produtividade recuperada?</h5>
              <p className="text-base text-white font-semibold mb-4">Se o diagnóstico te ajudar a recuperar apenas 2 horas perdidas por dia:</p>
              
              <div className="text-left text-xs sm:text-sm text-slate-300 space-y-2 max-w-md mx-auto mb-6 bg-slate-900/30 p-4 rounded-xl border border-slate-800/50">
                <p>• 2 horas/dia × 30 dias = <strong>60 horas produtivas adicionais</strong></p>
                <p>• 60 horas = <strong>7,5 dias de trabalho focado</strong> (quase 1 semana útil inteira)</p>
                <p>• 7,5 dias = avanço de escrita que você levaria 2 meses empacado para fazer.</p>
              </div>

              <p className="text-violet-400 font-bold text-sm sm:text-base">
                R$ 27 para recuperar 60 horas = R$ 0,45 por hora de trabalho ganha. <br />
                <span className="text-slate-500 font-normal text-xs">Isso custa menos que um café na cantina.</span>
              </p>
            </div>

            {/* O Custo Real de Não Agir */}
            <div className="bg-slate-950/80 border border-red-500/20 rounded-2xl p-6 text-center max-w-xl mx-auto mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full blur-xl pointer-events-none" />
              <div className="text-2xl mb-2">💸</div>
              <h5 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-3">O Custo Real de Não Agir</h5>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed text-left">
                Continuar travado por mais 6 meses na escrita significa muito mais do que apenas frustração diária. Representa o risco de atrasar a sua qualificação ou defesa, podendo resultar na suspensão da sua bolsa de pesquisa (uma perda que pode passar de <strong>R$ 18.600,00</strong> considerando valores da CAPES/CNPq). Sem contar o desgaste mental invisível: noites em claro, estresse com orientadores e a sensação de estagnação. R$ 27 é um investimento de segurança irrisório para garantir que você conclua o seu título dentro do prazo.
              </p>
            </div>

            {/* Tabela de Comparação de Investimentos Acadêmicos */}
            <div className="bg-slate-950/80 border border-slate-850 rounded-2xl p-6 max-w-xl mx-auto mb-8">
              <h5 className="text-sm font-bold text-slate-200 uppercase tracking-widest text-center mb-4 flex items-center justify-center gap-2">
                <span>📊</span> Comparativo de Investimentos na Pesquisa
              </h5>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900/30 border border-slate-800/40 text-xs sm:text-sm">
                  <span className="text-slate-400">Inscrição em Congresso Científico</span>
                  <span className="text-slate-200 font-medium">~R$ 350,00</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900/30 border border-slate-800/40 text-xs sm:text-sm">
                  <span className="text-slate-400">Revisão e Tradução de Artigo por Profissional</span>
                  <span className="text-slate-200 font-medium">~R$ 750,00</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900/30 border border-slate-800/40 text-xs sm:text-sm">
                  <span className="text-slate-400">Taxa de Publicação em Revista Internacional</span>
                  <span className="text-slate-200 font-medium">~R$ 900,00</span>
                </div>
                <div className="flex justify-between items-start p-3.5 rounded-lg bg-violet-950/20 border-2 border-violet-500/30 text-xs sm:text-sm shadow-[0_0_10px_rgba(139,92,246,0.05)]">
                  <div className="flex flex-col">
                    <span className="text-white font-bold">Todos os perfis + Protocolo PAS + 4 Bônus de Implementação</span>
                    <span className="text-slate-450 text-[10px] sm:text-xs mt-1 leading-relaxed text-left">
                      A única ferramenta que garante que você de fato consiga escrever os textos que serão submetidos ou apresentados.
                    </span>
                  </div>
                  <span className="text-emerald-400 font-extrabold text-base shrink-0 ml-4">R$ 27,00</span>
                </div>
              </div>
            </div>

          </div>

          {/* Ancoragem de Preço e CTA */}
          <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-6 text-center max-w-md mx-auto mb-6">
            <p className="text-xs text-slate-500 mb-1">
              Valor Total do Diagnóstico + Bônus: <span className="line-through">R$ 165</span>
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-white mb-4">
              Por apenas <span className="text-emerald-400">R$ 27,00</span>
            </p>
            
            <a
              href={checkoutUrl}
              onClick={handleCTAClick}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold text-lg rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-[0_0_20px_rgba(249,115,22,0.2)] block text-center uppercase tracking-wider flex flex-col items-center justify-center gap-1"
            >
              <span>Quero meu Diagnóstico por R$27</span>
              <span className="text-xs md:text-sm font-semibold opacity-90 mt-1.5 normal-case">Acesso imediato • Garantia de 7 dias</span>
            </a>

            {/* Payment Flags */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 opacity-80">
              <div className="h-5 flex items-center bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[9px] font-bold text-teal-400 gap-1.5 select-none">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 .587l3.668 3.668-3.668 3.668-3.668-3.668zm0 15.658l3.668-3.668-3.668-3.668-3.668 3.668zm7.83-7.829l3.668 3.668-3.668 3.668-3.668-3.668zm-15.66 0l3.668 3.668-3.668 3.668-3.668-3.668z" />
                </svg>
                <span>PIX</span>
              </div>
              <div className="h-5 w-8 flex items-center justify-center bg-slate-900 rounded border border-slate-800 select-none">
                <span className="text-[9px] font-extrabold italic text-blue-400 tracking-tighter">VISA</span>
              </div>
              <div className="h-5 w-8 flex items-center justify-center bg-slate-900 rounded border border-slate-800 gap-0.5 select-none">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-90" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 opacity-90 -ml-1.5" />
              </div>
              <div className="h-5 w-8 flex items-center justify-center bg-slate-900 rounded border border-slate-800 select-none">
                <span className="text-[9px] font-black text-white bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 px-1 rounded">ELO</span>
              </div>
            </div>
          </div>

          {/* ISBN Registration Block */}
          <div className="text-center text-slate-500 text-[10px] sm:text-xs mb-8 max-w-lg mx-auto border-t border-slate-800/40 pt-5">
            <img 
              src="/ISBN_LIVRO_OK.jpg" 
              alt="Registro ISBN do livro Pesquisador Produtivo" 
              loading="lazy"
              className="max-w-[240px] w-full mx-auto mb-4 rounded-lg border border-slate-800 bg-slate-950/40 shadow-md p-1"
            />
            <p className="leading-relaxed">
              <strong className="text-slate-400 uppercase tracking-widest text-[9px] block mb-1">Metodologia Baseada em Obra Registrada</strong> 
              O sistema de cálculo que gerou seu laudo é a aplicação prática do livro <em>'Pesquisador Produtivo'</em> (Registrado e Catalogado na Câmara Brasileira do Livro). Fonte Primária: <strong>ISBN 978-65-989051-0-1</strong>. Você está adquirindo as ferramentas oficiais baseadas nesta metodologia.
            </p>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-slate-400 text-xs mb-8 border-b border-slate-800/40 pb-6">
            <div className="flex items-center gap-1.5">
              <span>🔒</span>
              <span>Pagamento 100% seguro</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>✓</span>
              <span>Acesso imediato</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>💳</span>
              <span>Parcelamento em até 12x</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>🛡️</span>
              <span>Garantia de 7 dias</span>
            </div>
          </div>

          {/* Garantia incondicional */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-5 bg-slate-950/40 border border-slate-800 rounded-2xl max-w-xl mx-auto mb-8">
            <div className="text-4xl">🛡️</div>
            <div className="text-left">
              <h5 className="text-sm font-bold text-white mb-1">Sem Risco: Garantia Incondicional de 7 dias</h5>
              <p className="text-xs text-slate-450 leading-relaxed">
                Temos convicção na metodologia. Se após ler seu diagnóstico e bônus você achar que o método não se adapta ao seu trabalho, devolvemos 100% do seu dinheiro sem burocracia.
              </p>
            </div>
          </div>

          {/* P.S. Blocks (Bíblia/Landing page) */}
          <div className="max-w-2xl mx-auto text-left text-slate-500 text-xs space-y-3 border-t border-slate-800/45 pt-6">
            <p>
              <strong className="text-slate-400">P.S.:</strong> Você pode continuar tentando usar métodos genéricos de produtividade pelos próximos 6 meses... ou pode descobrir em 3 minutos qual é o seu padrão comportamental específico e a rotina exata que funciona para você. A escolha é sua.
            </p>
            <p>
              <strong className="text-slate-400">P.P.S.:</strong> Lembre-se da nossa garantia de risco zero: são 7 dias completos para testar. Se achar que não serve, basta mandar um único e-mail e devolvemos 100% do valor.
            </p>
            <p>
              <strong className="text-slate-400">P.P.P.S.:</strong> Ficou com alguma dúvida técnica sobre o envio? Envie um e-mail para <a href="mailto:contato@sistemaacademia.com.br" className="text-violet-400 hover:underline">contato@sistemaacademia.com.br</a> e responderemos pessoalmente em até 24 horas.
            </p>
          </div>
        </div>

        {/* --- FAQ SECTION (PERGUNTAS FREQUENTES) --- */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-10 mb-8">
          <h4 className="text-lg font-bold text-white uppercase tracking-wider mb-6 text-center">
            Perguntas Frequentes
          </h4>

          <div className="space-y-3">
            {[
              {
                q: "Como o diagnóstico é entregue?",
                a: "Assim que a compra for aprovada, você receberá um e-mail com as instruções de acesso e os links de download em formato PDF do seu diagnóstico personalizado e de todos os 4 bônus inclusos."
              },
              {
                q: "Por que o diagnóstico custa apenas R$ 27?",
                a: "A pós-graduação no Brasil enfrenta uma crise severa de saúde mental e restrição de bolsas. Queremos que esta ferramenta seja acessível ao maior número possível de mestrandos e doutorandos para servir como apoio real de produtividade sustentável. Menos que 3 cafés para destravar sua redação."
              },
              {
                q: "Isso é diferente de mais uma ferramenta de produtividade?",
                a: "Sim — e é a diferença mais importante. Ferramentas pressupõem que você já sabe como você funciona. O diagnóstico vem antes: ele mapeia o seu padrão de trabalho específico para que qualquer ferramenta que você use depois funcione. Não é o Notion que vai te destravar. É entender por que você trava — e aí qualquer sistema que você escolher passa a fazer sentido."
              },
              {
                q: "Serve para qualquer área de pesquisa?",
                a: "Sim. A metodologia atua sobre o comportamento e autorregulação cognitiva de projetos de longo prazo, sendo aplicável tanto para as ciências humanas, exatas, biológicas ou aplicadas."
              }
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="border border-slate-800 rounded-2xl bg-slate-950/20 overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-5 py-4 text-left font-semibold text-sm md:text-base text-white hover:bg-slate-900/40 transition-colors flex justify-between items-center"
                >
                  <span>{item.q}</span>
                  <span className="text-violet-400 select-none">{openFaq === idx ? '−' : '+'}</span>
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-4 text-xs md:text-sm text-slate-450 leading-relaxed border-t border-slate-900/60 pt-3 bg-slate-950/40">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* --- FINAL BOTTOM CTA BLOCK --- */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 md:p-8 mb-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 max-w-xl mx-auto">
            <h4 className="text-base md:text-lg font-bold text-white mb-2 uppercase tracking-wider">
              Continue para destravar a sua pesquisa acadêmica
            </h4>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Adquira agora o seu Diagnóstico Completo com todos os 4 bônus de implementação inclusos.
            </p>
            <a
              href={checkoutUrl}
              onClick={handleCTAClick}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-col items-center justify-center gap-1 px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold text-sm sm:text-base md:text-lg rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-[0_0_20px_rgba(249,115,22,0.2)] block text-center uppercase tracking-wider w-full sm:w-auto"
            >
              <span>Quero meu Diagnóstico por R$27</span>
              <span className="text-xs md:text-sm font-semibold opacity-90 mt-1.5 normal-case">Acesso imediato • Garantia incondicional de 7 dias</span>
            </a>

            {/* Payment Flags */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 opacity-80">
              <div className="h-5 flex items-center bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[9px] font-bold text-teal-400 gap-1.5 select-none">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 .587l3.668 3.668-3.668 3.668-3.668-3.668zm0 15.658l3.668-3.668-3.668-3.668-3.668 3.668zm7.83-7.829l3.668 3.668-3.668 3.668-3.668-3.668zm-15.66 0l3.668 3.668-3.668 3.668-3.668-3.668z" />
                </svg>
                <span>PIX</span>
              </div>
              <div className="h-5 w-8 flex items-center justify-center bg-slate-900 rounded border border-slate-800 select-none">
                <span className="text-[9px] font-extrabold italic text-blue-400 tracking-tighter">VISA</span>
              </div>
              <div className="h-5 w-8 flex items-center justify-center bg-slate-900 rounded border border-slate-800 gap-0.5 select-none">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-90" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 opacity-90 -ml-1.5" />
              </div>
              <div className="h-5 w-8 flex items-center justify-center bg-slate-900 rounded border border-slate-800 select-none">
                <span className="text-[9px] font-black text-white bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 px-1 rounded">ELO</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- RODAPÉ / REFAZER QUIZ --- */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-900 pt-8 mt-12 text-xs text-slate-500">
          <p>© 2026 Sistema A.C.A.D.E.M.I.A. Todos os direitos reservados.</p>
          <button
            onClick={onReset}
            className="px-5 py-2.5 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition-all flex items-center gap-2 text-xs"
          >
            <span>🔄</span> Refazer Diagnóstico
          </button>
        </div>
      </div>
    </div>
  );
}