import { useState } from 'react';

interface QuizEmailProps {
  name: string;
  email: string;
  phone: string;
  onSubmit: (name: string, email: string, phone: string) => void;
}

// Format phone number as user types
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  
  if (digits.length <= 2) {
    return digits.length > 0 ? `(${digits}` : '';
  } else if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  } else {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }
}

// Validate phone format (XX) XXXXX-XXXX
function validatePhone(phone: string): boolean {
  const regex = /^\(\d{2}\)\s\d{5}-\d{4}$/;
  return regex.test(phone);
}

export function QuizEmail({ name, email, phone, onSubmit }: QuizEmailProps) {
  const [localName, setLocalName] = useState(name);
  const [localEmail, setLocalEmail] = useState(email);
  const [localPhone, setLocalPhone] = useState(phone);
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setLocalPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { name?: string; email?: string; phone?: string } = {};
    
    if (localName.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }
    
    if (!validateEmail(localEmail)) {
      newErrors.email = 'Por favor, insira um email válido';
    }
    
    if (!validatePhone(localPhone)) {
      newErrors.phone = 'Por favor, insira um WhatsApp válido com DDD';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      onSubmit(localName.trim(), localEmail.trim(), localPhone);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Glow Blobs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-lg z-10 animate-fade-in">
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl p-8 md:p-10 text-center relative">
          {/* Celebration Icon */}
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-4xl mx-auto mb-6">
            🎯
          </div>
          
          {/* Header */}
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2 leading-tight">
            Diagnóstico Finalizado!
          </h1>
          <p className="text-slate-400 text-sm md:text-base mb-8 max-w-sm mx-auto leading-relaxed">
            Estamos prontos para processar seus escores. Insira seus dados para gerar e liberar o seu relatório personalizado:
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            {/* Name Field */}
            <div className="text-left">
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Seu nome
              </label>
              <input
                type="text"
                id="name"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                placeholder="Digite seu nome"
                className={`w-full px-4 py-3.5 rounded-2xl border-2 bg-slate-950 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                  errors.name
                    ? 'border-red-500/50 bg-red-500/5'
                    : 'border-slate-800 focus:border-violet-500'
                }`}
              />
              {errors.name && (
                <p className="mt-1.5 text-xs text-red-400 font-semibold">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="text-left">
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Seu melhor email
              </label>
              <input
                type="email"
                id="email"
                value={localEmail}
                onChange={(e) => setLocalEmail(e.target.value)}
                placeholder="seu@email.com"
                className={`w-full px-4 py-3.5 rounded-2xl border-2 bg-slate-950 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                  errors.email
                    ? 'border-red-500/50 bg-red-500/5'
                    : 'border-slate-800 focus:border-violet-500'
                }`}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400 font-semibold">{errors.email}</p>
              )}
            </div>

            {/* WhatsApp Field */}
            <div className="text-left">
              <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                WhatsApp (com DDD)
              </label>
              <input
                type="tel"
                id="phone"
                value={localPhone}
                onChange={handlePhoneChange}
                placeholder="(62) 99999-9999"
                maxLength={15}
                className={`w-full px-4 py-3.5 rounded-2xl border-2 bg-slate-950 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                  errors.phone
                    ? 'border-red-500/50 bg-red-500/5'
                    : 'border-slate-800 focus:border-violet-500'
                }`}
              />
              {errors.phone && (
                <p className="mt-1.5 text-xs text-red-400 font-semibold">{errors.phone}</p>
              )}
            </div>

            {/* What is unlocked */}
            <div className="py-4 border-t border-b border-slate-800/60 my-6 text-left space-y-3.5">
              <div className="flex items-center gap-3 text-emerald-400">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-semibold text-slate-350">Seu Perfil Dominante e intensidade de travamento</span>
              </div>
              <div className="flex items-center gap-3 text-emerald-400">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-semibold text-slate-350">Mapeamento dos Perfis Secundários e reações ao estresse</span>
              </div>
              <div className="flex items-center gap-3 text-emerald-400">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-semibold text-slate-350">Estratégias e próximos passos recomendados para o seu perfil</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-lg rounded-2xl transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 duration-200"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Calculando Resultados...
                </>
              ) : (
                'GERAR MEU DIAGNÓSTICO E RELATÓRIO →'
              )}
            </button>
          </form>

          {/* Privacy Link */}
          <p className="text-xs text-slate-500 leading-normal">
            Seus dados estão protegidos. Ao enviar, você concorda com nossos termos de uso e{' '}
            <a href="#" className="underline hover:text-slate-400 transition-colors">
              Políticas de Privacidade
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}
