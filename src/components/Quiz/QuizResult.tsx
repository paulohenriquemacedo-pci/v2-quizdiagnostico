import { useEffect } from 'react';
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

export function QuizResult({ result, email, name, onReset }: QuizResultProps) {
  const { dominant, secondary } = result;
  const content = profileResults[dominant.code];

  // Track result view on mount
  useEffect(() => {
    if (content) {
      trackResultView(dominant.name, dominant.code);
    }
  }, [dominant.name, dominant.code, content]);

  if (!content) {
    return (
      <div className="min-h-screen bg-quiz-gradient flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-quiz p-6 text-center">
          <p className="text-foreground">Erro ao carregar conteúdo do perfil</p>
          <button
            onClick={onReset}
            className="mt-4 px-6 py-2 bg-quiz-primary text-white rounded-lg"
          >
            Refazer Quiz
          </button>
        </div>
      </div>
    );
  }

  const getIntensityBadgeColor = (intensity: string) => {
    switch (intensity) {
      case 'Muito Forte':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Forte':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Moderado':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Leve':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-quiz-gradient py-8 px-4">
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-card rounded-2xl shadow-quiz p-6 md:p-10">
          
          {/* 1. CABEÇALHO - Perfil Dominante */}
          <div
            className="rounded-2xl p-6 md:p-8 mb-6 text-center"
            style={{ 
              backgroundColor: `${content.color}15`,
              borderLeft: `4px solid ${content.color}`
            }}
          >
            <div className="text-6xl md:text-7xl mb-4">{content.icon}</div>
            <h1 
              className="text-2xl md:text-3xl font-bold uppercase tracking-wide mb-4"
              style={{ color: content.color }}
            >
              {content.name}
            </h1>
            <div className="flex items-center justify-center gap-4">
              <span className="text-lg font-bold text-foreground">
                Pontuação: {dominant.score}/20
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold border ${getIntensityBadgeColor(dominant.intensity)}`}
              >
                Intensidade: {dominant.intensity}
              </span>
            </div>
          </div>

          {/* 2. BLOCO DE GOVERNANÇA */}
          <div className="mb-8 p-4 bg-muted/30 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground text-center italic">
              {GOVERNANCE_TEXT}
            </p>
          </div>

          {/* 3. SEÇÃO: O QUE ESSE PADRÃO INDICA */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="text-xl">🎯</span> O QUE ESSE PADRÃO INDICA
            </h2>
            <div className="space-y-4">
              {content.whatItMeans.map((paragraph, idx) => (
                <p key={idx} className="text-foreground/80 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>

          {/* 4. BOX: PONTO CENTRAL */}
          <section 
            className="mb-8 p-5 rounded-xl"
            style={{ 
              backgroundColor: `${content.color}10`,
              borderLeft: `3px solid ${content.color}`
            }}
          >
            <h2 className="text-lg font-bold text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="text-xl">⚠️</span> PONTO CENTRAL
            </h2>
            <p className="text-foreground/90 leading-relaxed mb-3">
              {content.coreObstacle}
            </p>
            <p 
              className="text-sm font-semibold"
              style={{ color: content.color }}
            >
              {content.coreObstacleMetric}
            </p>
          </section>

          {/* 5. SEÇÃO: 5 EXPERIMENTOS PARA TESTAR */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="text-xl">⚡</span> 5 EXPERIMENTOS PARA TESTAR
            </h2>
            <div className="space-y-4">
              {content.immediatePractices.map((practice, idx) => (
                <div 
                  key={idx}
                  className="p-4 bg-muted/50 rounded-xl border-l-3"
                  style={{ borderLeftColor: content.color, borderLeftWidth: '3px' }}
                >
                  <h3 
                    className="font-bold mb-2"
                    style={{ color: content.color }}
                  >
                    {practice.title}
                  </h3>
                  <p className="text-foreground/80 text-sm leading-relaxed mb-2">
                    {practice.description}
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    ✓ Critério de sucesso: {practice.successCriteria}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 6. SEÇÃO: PERFIS SECUNDÁRIOS IDENTIFICADOS */}
          {secondary.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Perfis Secundários Identificados:
              </h2>
              <div className="space-y-2">
                {secondary.map((profile) => (
                  <div
                    key={profile.code}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    style={{ borderLeft: `3px solid ${profile.color}` }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{profile.icon}</span>
                      <span 
                        className="font-semibold text-sm"
                        style={{ color: profile.color }}
                      >
                        {profile.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {profile.score}/20 — {profile.intensity}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 7. BLOCO DE TRANSIÇÃO PARA OFERTA */}
          <section className="mb-8 p-5 bg-muted/20 rounded-xl border border-border">
            <p className="text-foreground/90 leading-relaxed mb-3">
              {TRANSITION_BASE}
            </p>
            <p className="text-foreground/80 text-sm leading-relaxed mb-3">
              {TRANSITION_COMPLEMENT}
            </p>
            <p 
              className="text-sm font-medium"
              style={{ color: content.color }}
            >
              {content.transitionText}
            </p>
          </section>

          {/* 8. BOX DA OFERTA (COMERCIAL) — PRESERVAÇÃO ESTRITA */}
          <section className="mt-10 pt-8 border-t border-border">
            <div 
              className="rounded-2xl p-6"
              style={{ 
                backgroundColor: `${content.color}08`,
                border: `2px solid ${content.color}30`
              }}
            >
              {/* Headline Dinâmica */}
              <h3 className="text-xl font-bold text-foreground mb-4 leading-snug">
                {content.ctaHeadline}
              </h3>

              {/* Benefícios Personalizados (Bullets Dinâmicas) */}
              <div className="mb-6 space-y-3 p-4 bg-muted/40 rounded-xl border border-border/50">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
                  Como o diagnóstico vai atuar no seu padrão:
                </h4>
                {content.ctaBullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-foreground/90 leading-relaxed">
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>

              {/* Produto Principal */}
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <span>📦</span> O Diagnóstico Completo Inclui:
              </h4>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-quiz-primary font-bold shrink-0">1.</span>
                  <div>
                    <span className="font-semibold text-foreground">Conteúdo Completo do Perfil Predominante e Secundários</span>
                    <span className="text-muted-foreground"> — O mapeamento detalhado dos seus padrões comportamentais identificados no quiz, com o protocolo prático de ação personalizado.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-quiz-primary font-bold shrink-0">2.</span>
                  <div>
                    <span className="font-semibold text-foreground">Acesso aos 6 Perfis do Sistema A.C.A.D.E.M.I.A</span>
                    <span className="text-muted-foreground"> — O conteúdo completo de todos os perfis para você entender seus padrões e saber como utilizar o nosso sistema para melhorar a sua produção acadêmica.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-quiz-primary font-bold shrink-0">3.</span>
                  <div>
                    <span className="font-semibold text-foreground">Recursos de Acompanhamento e Suporte Prático</span>
                    <span className="text-muted-foreground"> — Dashboard Semanal de acompanhamento de escrita, templates de energia cognitiva e guias práticos do sistema inclusos como bônus.</span>
                  </div>
                </div>
              </div>

              {/* Bônus */}
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <span>🎁</span> + 4 Bônus Inclusos:
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                <div className="flex items-center gap-2 text-xs bg-muted/50 rounded-lg p-2">
                  <span>📊</span>
                  <span className="text-foreground/80">Dashboard Semanal <span className="text-muted-foreground line-through">R$37</span></span>
                </div>
                <div className="flex items-center gap-2 text-xs bg-muted/50 rounded-lg p-2">
                  <span>⚡</span>
                  <span className="text-foreground/80">Template Energia Cognitiva <span className="text-muted-foreground line-through">R$37</span></span>
                </div>
                <div className="flex items-center gap-2 text-xs bg-muted/50 rounded-lg p-2">
                  <span>📖</span>
                  <span className="text-foreground/80">Guia Visual do Sistema <span className="text-muted-foreground line-through">R$37</span></span>
                </div>
                <div className="flex items-center gap-2 text-xs bg-muted/50 rounded-lg p-2">
                  <span>🗺️</span>
                  <span className="text-foreground/80">Infográfico Poster A3/A4 <span className="text-muted-foreground line-through">R$27</span></span>
                </div>
              </div>

              {/* Preço */}
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground mb-1">
                  Valor total: <span className="line-through">R$165</span>
                </p>
                <p className="text-3xl font-bold text-foreground">
                  Por apenas <span style={{ color: content.color }}>R$ 27</span>
                </p>
              </div>

              {/* 9. CTA + Garantia */}
              <a
                href="https://lpquiz.sistemaacademia.com.br/"
                onClick={() => {
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
                }}
                className="w-full py-4 bg-quiz-orange hover:bg-quiz-orange/90 text-white font-bold text-lg rounded-xl transition-all hover:scale-[1.02] shadow-lg mb-3 block text-center"
              >
                QUERO O DIAGNÓSTICO COMPLETO
              </a>
              
              <p className="text-xs text-muted-foreground text-center">
                ✅ Garantia de 7 dias (política de reembolso) — Se não fizer sentido para você, devolvemos o valor integral
              </p>
            </div>
          </section>

          {/* SECONDARY CTA: Refazer Quiz */}
          <button
            onClick={onReset}
            className="w-full mt-6 py-3 border-2 border-border text-muted-foreground hover:text-foreground hover:bg-muted font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <span>🔄</span> Refazer Quiz
          </button>
        </div>
      </div>
    </div>
  );
}