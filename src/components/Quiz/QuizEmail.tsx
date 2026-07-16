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
      // Pass the validated data directly to onSubmit
      onSubmit(localName.trim(), localEmail.trim(), localPhone);
    }
  };

  return (
    <div className="min-h-screen bg-quiz-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-card rounded-2xl shadow-quiz p-8 md:p-10 text-center">
          {/* Celebration Icon */}
          <div className="text-6xl mb-4">🎯</div>
          
          {/* Header */}
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Você completou o diagnóstico!
          </h1>
          <p className="text-muted-foreground mb-8">
            Para receber seu resultado detalhado, preencha abaixo:
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            {/* Name Field */}
            <div className="text-left">
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                Seu nome
              </label>
              <input
                type="text"
                id="name"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                placeholder="Digite seu nome"
                className={`w-full px-4 py-3 rounded-xl border-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                  errors.name
                    ? 'border-destructive bg-destructive/10'
                    : 'border-border focus:border-primary'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="text-left">
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                Seu melhor email
              </label>
              <input
                type="email"
                id="email"
                value={localEmail}
                onChange={(e) => setLocalEmail(e.target.value)}
                placeholder="seu@email.com"
                className={`w-full px-4 py-3 rounded-xl border-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                  errors.email
                    ? 'border-destructive bg-destructive/10'
                    : 'border-border focus:border-primary'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {/* WhatsApp Field */}
            <div className="text-left">
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">
                WhatsApp (com DDD)
              </label>
              <input
                type="tel"
                id="phone"
                value={localPhone}
                onChange={handlePhoneChange}
                placeholder="(62) 99999-9999"
                maxLength={15}
                className={`w-full px-4 py-3 rounded-xl border-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                  errors.phone
                    ? 'border-destructive bg-destructive/10'
                    : 'border-border focus:border-primary'
                }`}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-destructive">{errors.phone}</p>
              )}
            </div>

            {/* Benefits */}
            <div className="py-4 space-y-3 text-left">
              <div className="flex items-center gap-3 text-quiz-success">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-foreground">Resultado completo com seu perfil dominante</span>
              </div>
              <div className="flex items-center gap-3 text-quiz-success">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-foreground">Análise detalhada dos padrões identificados</span>
              </div>
              <div className="flex items-center gap-3 text-quiz-success">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-foreground">Dicas personalizadas para seu perfil</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-xl transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processando...
                </>
              ) : (
                'RECEBER MEU RESULTADO →'
              )}
            </button>
          </form>

          {/* Privacy Link */}
          <p className="text-xs text-muted-foreground">
            Ao enviar, você concorda com nossa{' '}
            <a href="#" className="underline hover:text-foreground transition-colors">
              Política de Privacidade
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
