import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Checkbox } from '@/components/ui/checkbox';
import { PRIVACY_POLICY_URL, formatPhone } from '@/lib/phoneUtils';

export { PRIVACY_POLICY_URL, formatPhone, normalizePhone, normalizeEmail } from '@/lib/phoneUtils';

const unlockSchema = z.object({
  name: z
    .string()
    .transform(val => val.trim().replace(/\s+/g, ' '))
    .refine(val => val.length >= 2, {
      message: 'Nome deve ter pelo menos 2 caracteres'
    }),
  email: z
    .string()
    .transform(val => val.trim().toLowerCase())
    .refine(val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: 'Por favor, insira um e-mail válido'
    }),
  phone: z
    .string()
    .refine(val => {
      const digits = val.replace(/\D/g, '');
      return digits.length === 10 || digits.length === 11;
    }, {
      message: 'Por favor, insira um WhatsApp válido com DDD (10 ou 11 dígitos)'
    }),
  privacyConsent: z
    .boolean()
    .refine(val => val === true, {
      message: 'Você precisa concordar com a Política de Privacidade para liberar seu diagnóstico.'
    }),
  marketingConsent: z.boolean().default(false)
});

export type UnlockFormData = z.infer<typeof unlockSchema>;

export interface UnlockSubmitParams {
  name: string;
  email: string;
  phone: string;
  privacyConsent: boolean;
  marketingConsent: boolean;
}

interface QuizEmailProps {
  initialName?: string;
  initialEmail?: string;
  initialPhone?: string;
  onSubmit: (data: UnlockSubmitParams) => Promise<{ success: boolean; error?: string }>;
  isEmbedded?: boolean;
}

export function QuizEmail({
  initialName = '',
  initialEmail = '',
  initialPhone = '',
  onSubmit,
  isEmbedded = false
}: QuizEmailProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<UnlockFormData>({
    resolver: zodResolver(unlockSchema),
    defaultValues: {
      name: initialName,
      email: initialEmail,
      phone: initialPhone ? formatPhone(initialPhone) : '',
      privacyConsent: false,
      marketingConsent: false
    }
  });

  const phoneValue = watch('phone');
  const privacyConsentValue = watch('privacyConsent');
  const marketingConsentValue = watch('marketingConsent');

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setValue('phone', formatted, { shouldValidate: true });
  };

  const onFormSubmit = async (data: UnlockFormData) => {
    if (submitting) return;
    setSubmitting(true);
    setServerError(null);

    try {
      const result = await onSubmit({
        name: data.name,
        email: data.email,
        phone: data.phone,
        privacyConsent: data.privacyConsent,
        marketingConsent: data.marketingConsent
      });

      if (!result.success) {
        setServerError(result.error || 'Não foi possível liberar seu diagnóstico agora. Verifique sua conexão e tente novamente.');
      }
    } catch (err) {
      console.error('[QuizEmail] Submit error:', err);
      setServerError('Não foi possível liberar seu diagnóstico agora. Verifique sua conexão e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5 text-left" noValidate>
      {serverError && (
        <div role="alert" className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-medium">
          {serverError}
        </div>
      )}

      {/* Field: Name */}
      <div>
        <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
          Seu nome completo <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="name"
          disabled={submitting}
          placeholder="Digite seu nome"
          {...register('name')}
          className={`w-full px-4 py-3.5 rounded-2xl border-2 bg-slate-950 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
            errors.name ? 'border-red-500/50 bg-red-500/5' : 'border-slate-800 focus:border-violet-500'
          }`}
        />
        {errors.name && (
          <p className="mt-1.5 text-xs text-red-400 font-semibold" id="name-error">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Field: Email */}
      <div>
        <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
          Seu melhor e-mail <span className="text-red-400">*</span>
        </label>
        <input
          type="email"
          id="email"
          disabled={submitting}
          placeholder="seu@email.com"
          {...register('email')}
          className={`w-full px-4 py-3.5 rounded-2xl border-2 bg-slate-950 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
            errors.email ? 'border-red-500/50 bg-red-500/5' : 'border-slate-800 focus:border-violet-500'
          }`}
        />
        {errors.email && (
          <p className="mt-1.5 text-xs text-red-400 font-semibold" id="email-error">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Field: WhatsApp */}
      <div>
        <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
          WhatsApp (com DDD) <span className="text-red-400">*</span>
        </label>
        <input
          type="tel"
          id="phone"
          disabled={submitting}
          value={phoneValue || ''}
          onChange={handlePhoneInputChange}
          placeholder="(11) 99999-9999"
          maxLength={15}
          className={`w-full px-4 py-3.5 rounded-2xl border-2 bg-slate-950 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
            errors.phone ? 'border-red-500/50 bg-red-500/5' : 'border-slate-800 focus:border-violet-500'
          }`}
        />
        {errors.phone && (
          <p className="mt-1.5 text-xs text-red-400 font-semibold" id="phone-error">
            {errors.phone.message}
          </p>
        )}
      </div>

      {/* Consent 1: Mandatory Privacy */}
      <div className="pt-2 border-t border-slate-800/80">
        <div className="flex items-start gap-3">
          <Checkbox
            id="privacyConsent"
            disabled={submitting}
            checked={privacyConsentValue}
            onCheckedChange={(checked) => setValue('privacyConsent', checked === true, { shouldValidate: true })}
            className="mt-1 border-slate-600 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
          />
          <label htmlFor="privacyConsent" className="text-xs text-slate-300 leading-relaxed cursor-pointer select-none">
            Li e concordo com a{' '}
            <a
              href={PRIVACY_POLICY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 underline font-semibold"
              onClick={(e) => e.stopPropagation()}
            >
              Política de Privacidade
            </a>{' '}
            e autorizo o uso dos meus dados para gerar e disponibilizar meu diagnóstico. <span className="text-red-400 font-bold">*</span>
          </label>
        </div>
        {errors.privacyConsent && (
          <p className="mt-1.5 text-xs text-red-400 font-semibold pl-7" id="privacy-error">
            {errors.privacyConsent.message}
          </p>
        )}
      </div>

      {/* Consent 2: Optional Marketing */}
      <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
        <div className="flex items-start gap-3">
          <Checkbox
            id="marketingConsent"
            disabled={submitting}
            checked={marketingConsentValue}
            onCheckedChange={(checked) => setValue('marketingConsent', checked === true)}
            className="mt-1 border-slate-600 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <label htmlFor="marketingConsent" className="text-xs font-semibold text-slate-200 cursor-pointer select-none">
                Comunicações e Conteúdos do Sistema A.C.A.D.E.M.I.A
              </label>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 rounded-md border border-slate-700">
                Opcional
              </span>
            </div>
            <label htmlFor="marketingConsent" className="text-xs text-slate-400 leading-relaxed cursor-pointer block select-none">
              Aceito receber por e-mail e WhatsApp conteúdos, orientações e comunicações sobre produtividade acadêmica e o Sistema A.C.A.D.E.M.I.A. Sei que posso cancelar esse recebimento a qualquer momento.
            </label>
          </div>
        </div>
      </div>

      {/* Submit Button & Aux Text */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4.5 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-base md:text-lg rounded-2xl transition-all duration-200 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-[0_0_25px_rgba(124,58,237,0.3)] uppercase tracking-wider flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Liberando Diagnóstico...</span>
            </>
          ) : (
            <span>LIBERAR MEU DIAGNÓSTICO →</span>
          )}
        </button>
        <p className="text-center text-xs text-slate-400 mt-2 font-medium">
          Acesso gratuito e imediato.
        </p>
      </div>
    </form>
  );

  if (isEmbedded) {
    return formContent;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-lg z-10 animate-fade-in">
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl p-6 md:p-8 text-center relative">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-3xl mx-auto mb-4">
            🎯
          </div>

          <h2 className="text-xl md:text-2xl font-extrabold text-white mb-2 leading-tight">
            Seu diagnóstico detalhado e seu protocolo inicial estão prontos.
          </h2>
          <p className="text-slate-400 text-xs md:text-sm mb-6 max-w-sm mx-auto leading-relaxed">
            Preencha os dados abaixo para acessar gratuitamente seu diagnóstico detalhado e o protocolo inicial. Seus dados estão protegidos e você somente receberá outras comunicações se autorizar abaixo.
          </p>

          {formContent}
        </div>
      </div>
    </div>
  );
}
