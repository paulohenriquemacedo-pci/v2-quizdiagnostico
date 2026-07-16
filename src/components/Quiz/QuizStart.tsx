import { profiles } from '@/data/profiles';
import { trackQuizStart } from '@/lib/analytics';

interface QuizStartProps {
  onStart: () => void;
}

export function QuizStart({ onStart }: QuizStartProps) {
  const handleStart = () => {
    trackQuizStart();
    onStart();
  };
  const profileList = Object.values(profiles);

  return (
    <div className="min-h-screen bg-quiz-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-card rounded-2xl shadow-quiz p-8 md:p-12 text-center">
          {/* Header */}
          <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
            Descubra Seu Padrão de Travamento Acadêmico em 3 Minutos
          </h1>
          <p className="text-muted-foreground text-base md:text-lg mb-8">
            Identifique o padrão comportamental específico que está travando a sua pesquisa
          </p>

          {/* Profile Icons Grid */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-8">
            {profileList.map((profile) => (
              <div
                key={profile.code}
                className="flex flex-col items-center gap-1 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                title={profile.name}
              >
                <span className="text-3xl md:text-4xl">{profile.icon}</span>
                <span className="text-xs text-muted-foreground font-medium truncate w-full">
                  {profile.name.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-8 mb-8">
            <div className="flex items-center justify-center gap-2 text-quiz-success">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">100% Gratuito</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-quiz-success">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Resultado Imediato</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-quiz-success">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">200 Pesquisadores Validaram</span>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleStart}
            className="w-full md:w-auto px-12 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-xl transition-all hover:scale-105 hover:shadow-lg"
          >
            COMEÇAR AGORA →
          </button>
        </div>
      </div>
    </div>
  );
}
