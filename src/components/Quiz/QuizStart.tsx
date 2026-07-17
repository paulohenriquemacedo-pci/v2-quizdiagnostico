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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Glow Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-3xl z-10 animate-fade-in">
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-800/80 shadow-2xl p-8 md:p-12 text-center relative">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-6">
            ✨ Diagnóstico Científico Comportamental
          </div>

          {/* Header */}
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
            Descubra Seu Padrão de <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
              Travamento Acadêmico
            </span>
          </h1>
          <p className="text-slate-400 text-base md:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Identifique em apenas 3 minutos qual é o padrão comportamental específico que está bloqueando o progresso da sua pesquisa.
          </p>

          {/* Profile Icons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-10 text-left">
            {profileList.map((profile) => (
              <div
                key={profile.code}
                className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-slate-800/30 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 transition-all duration-300 group hover:-translate-y-0.5"
                title={profile.name}
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform">
                  {profile.icon}
                </div>
                <span className="text-xs text-slate-300 font-semibold leading-tight line-clamp-2 w-full px-1">
                  {profile.name}
                </span>
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mb-10 py-4 border-t border-b border-slate-800/60">
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold">100% Gratuito</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold">Resultado Imediato</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold">Validado Cientificamente</span>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleStart}
            className="w-full md:w-auto px-12 py-4.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-lg rounded-2xl transition-all hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(124,58,237,0.3)] duration-200"
          >
            INICIAR MEU DIAGNÓSTICO →
          </button>
        </div>
      </div>
    </div>
  );
}
