import { supabase } from '@/integrations/supabase/client';
import { QuizResult } from '@/types/quiz.types';

interface SubmitQuizParams {
  name: string;
  email: string;
  phone: string;
  answers: (number | null)[];
  result: QuizResult;
  researchPhase: string;
}

function getDeviceType(): string {
  return /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop';
}

function getUTMParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign')
  };
}

export async function submitQuizToDatabase(params: SubmitQuizParams): Promise<{ success: boolean; error?: string }> {
  const { name, email, phone, answers, result, researchPhase } = params;
  const utmParams = getUTMParams();

  try {
    console.log('[API] Submitting quiz to database...');

    const insertData = {
      email,
      name,
      phone,
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
      utm_source: utmParams.utm_source,
      utm_medium: utmParams.utm_medium,
      utm_campaign: utmParams.utm_campaign,
      device_type: getDeviceType()
    };

    const { error } = await supabase
      .from('quiz_responses')
      .insert(insertData);

    if (error) {
      console.error('❌ Erro ao salvar:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Dados salvos no banco:', insertData);

    return { success: true };
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return { success: false, error: 'Erro ao processar dados' };
  }
}
