import { supabase } from '@/integrations/supabase/client';
import { QuizResult } from '@/types/quiz.types';
import { getAttribution } from '@/lib/attribution';

export interface SubmitQuizParams {
  name: string;
  email: string;
  phone: string;
  answers: (number | null)[];
  result: QuizResult;
  researchPhase: string;
  privacyConsent: boolean;
  privacyConsentAt?: string;
  privacyPolicyVersion?: string;
  marketingConsent: boolean;
  marketingConsentAt?: string | null;
  marketingConsentTextVersion?: string;
}

function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown';
  return /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
}

export async function submitQuizToDatabase(params: SubmitQuizParams): Promise<{ success: boolean; error?: string }> {
  const {
    name,
    email,
    phone,
    answers,
    result,
    researchPhase,
    privacyConsent,
    privacyConsentAt,
    privacyPolicyVersion = 'v1.0',
    marketingConsent,
    marketingConsentAt,
    marketingConsentTextVersion = 'v1.0'
  } = params;

  if (!privacyConsent) {
    return { success: false, error: 'O consentimento de privacidade é obrigatório para gerar o diagnóstico.' };
  }

  const attribution = getAttribution();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim().replace(/\s+/g, ' ');
  const normalizedPhone = phone.replace(/\D/g, '');
  const nowIso = new Date().toISOString();

  try {
    console.log('[API] Submitting lead quiz to database...');

    const insertData = {
      email: normalizedEmail,
      name: normalizedName,
      phone: normalizedPhone,
      answers: answers.filter((a): a is number => a !== null),
      research_phase: researchPhase,
      score_perfeccionista: result.scores.A,
      score_multitarefa: result.scores.B,
      score_procrastinador: result.scores.C,
      score_analista: result.scores.D,
      score_dependente: result.scores.E,
      score_sobrecarregado: result.scores.F,
      dominant_profile: result.dominant.name,
      dominant_code: result.dominant.code,
      dominant_score: result.dominant.score,
      dominant_intensity: result.dominant.intensity,
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
      utm_content: attribution.utm_content,
      utm_term: attribution.utm_term,
      fbclid: attribution.fbclid,
      device_type: getDeviceType(),
      privacy_consent: true,
      privacy_consent_at: privacyConsentAt || nowIso,
      privacy_policy_version: privacyPolicyVersion,
      marketing_consent: marketingConsent,
      marketing_consent_at: marketingConsent ? (marketingConsentAt || nowIso) : null,
      marketing_consent_text_version: marketingConsentTextVersion
    };

    let { error } = await supabase
      .from('quiz_responses')
      .insert(insertData);

    // Se o banco remoto ainda não tiver as colunas de consentimento, tenta o envio legado para não bloquear o usuário
    if (error && (error.message.includes('column') || error.message.includes('schema cache'))) {
      console.warn('⚠️ Colunas de consentimento não encontradas no schema do Supabase. Tentando envio em modo de compatibilidade...');
      const legacyInsertData = {
        email: normalizedEmail,
        name: normalizedName,
        phone: normalizedPhone,
        answers: answers.filter((a): a is number => a !== null),
        research_phase: researchPhase,
        score_perfeccionista: result.scores.A,
        score_multitarefa: result.scores.B,
        score_procrastinador: result.scores.C,
        score_analista: result.scores.D,
        score_dependente: result.scores.E,
        score_sobrecarregado: result.scores.F,
        dominant_profile: result.dominant.name,
        dominant_code: result.dominant.code,
        dominant_score: result.dominant.score,
        dominant_intensity: result.dominant.intensity,
        utm_source: attribution.utm_source,
        utm_medium: attribution.utm_medium,
        utm_campaign: attribution.utm_campaign,
        utm_content: attribution.utm_content,
        utm_term: attribution.utm_term,
        fbclid: attribution.fbclid,
        device_type: getDeviceType()
      };

      const retryResult = await supabase
        .from('quiz_responses')
        .insert(legacyInsertData);

      error = retryResult.error;
    }

    if (error) {
      console.error('❌ Erro ao salvar no banco:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Dados salvos com sucesso no Supabase:', insertData);
    return { success: true };
  } catch (error) {
    console.error('❌ Erro inesperado ao salvar quiz:', error);
    return { success: false, error: 'Não foi possível liberar seu diagnóstico agora. Verifique sua conexão e tente novamente.' };
  }
}
