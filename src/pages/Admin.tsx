import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, RefreshCw, Lock, Users, TrendingUp, LogOut, Trash2, MousePointerClick, PlayCircle, XCircle, Target, RotateCcw } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'react-router-dom';
import { User, Session } from '@supabase/supabase-js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { EditResponseDialog } from '@/components/Admin/EditResponseDialog';
interface QuizResponse {
  id: string;
  created_at: string;
  name: string | null;
  email: string;
  phone: string | null;
  answers: number[];
  score_perfeccionista: number;
  score_multitarefa: number;
  score_procrastinador: number;
  score_analista: number;
  score_dependente: number;
  score_sobrecarregado: number;
  dominant_profile: string;
  dominant_code: string | null;
  dominant_score: number;
  dominant_intensity: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  device_type: string | null;
}

interface FunnelMetrics {
  totalStarts: number;
  totalCompletions: number;
  totalCtaClicks: number;
  dropoffs: number;
  completionRate: number;
  dropoffRate: number;
  ctaClickRate: number;
  recentClicks: Array<{
    id: string;
    clicked_at: string;
    email: string | null;
    dominant_profile: string | null;
  }>;
}

export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [funnelMetrics, setFunnelMetrics] = useState<FunnelMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);
  const [isResettingData, setIsResettingData] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer admin check with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsCheckingAuth(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setIsCheckingAuth(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    try {
      // Use Edge Function to verify admin status (avoids RLS issues)
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setIsAdmin(false);
        setIsCheckingAuth(false);
        return;
      }

      // Try to fetch responses - if successful, user is admin
      const { error } = await supabase.functions.invoke('get-quiz-responses');
      
      if (error) {
        setIsAdmin(false);
      } else {
        setIsAdmin(true);
        fetchResponses();
        fetchFunnelMetrics();
      }
    } catch (err) {
      console.error('[Admin] Error checking admin role:', err);
      setIsAdmin(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      if (isSignUp) {
        const redirectUrl = `${window.location.origin}/admin`;
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl
          }
        });

        if (error) {
          if (error.message.includes('User already registered')) {
            setError('Este email já está cadastrado. Faça login.');
          } else {
            setError(error.message);
          }
          return;
        }

        if (data.user) {
          setEmail('');
          setPassword('');
          setError(null);
          // Show success message - user needs admin role to be assigned
          alert('Conta criada com sucesso! Aguarde a atribuição de permissões de administrador.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Email ou senha incorretos');
          } else {
            setError(error.message);
          }
          return;
        }

        if (data.user) {
          setEmail('');
          setPassword('');
        }
      }
    } catch (err) {
      console.error('[Admin] Auth error:', err);
      setError('Erro ao processar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setResponses([]);
    setFunnelMetrics(null);
    setIsAdmin(false);
  };

  const fetchFunnelMetrics = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-funnel-metrics');
      
      if (error) {
        console.error('[Admin] Error fetching funnel metrics:', error);
        return;
      }
      
      setFunnelMetrics(data?.data || null);
      console.log('[Admin] Fetched funnel metrics:', data?.data);
    } catch (err) {
      console.error('[Admin] Error fetching funnel metrics:', err);
    }
  };

  const fetchResponses = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('get-quiz-responses');

      if (error) {
        throw new Error(error.message);
      }

      setResponses(data?.data || []);
      console.log('[Admin] Fetched responses:', data?.data?.length || 0);
    } catch (err) {
      console.error('[Admin] Error fetching responses:', err);
      setError('Erro ao carregar dados. Verifique se você tem permissões de administrador.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    setDeletingId(id);
    
    try {
      const { data, error } = await supabase.functions.invoke('delete-quiz-response', {
        body: { id }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Remove from local state
      setResponses(prev => prev.filter(r => r.id !== id));
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      toast.success(`Resposta de ${email} excluída com sucesso`);
      console.log('[Admin] Deleted response:', id);
    } catch (err) {
      console.error('[Admin] Error deleting response:', err);
      toast.error('Erro ao excluir resposta');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdate = async (id: string, data: { name: string; email: string; phone: string }) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('update-quiz-response', {
        body: { id, ...data }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Update local state
      setResponses(prev => prev.map(r => 
        r.id === id ? { ...r, name: data.name, email: data.email, phone: data.phone } : r
      ));
      toast.success('Resposta atualizada com sucesso');
      return true;
    } catch (err) {
      console.error('[Admin] Error updating response:', err);
      toast.error('Erro ao atualizar resposta');
      return false;
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    
    setIsDeletingBatch(true);
    const idsToDelete = Array.from(selectedIds);
    let deletedCount = 0;
    let errorCount = 0;

    for (const id of idsToDelete) {
      try {
        const { error } = await supabase.functions.invoke('delete-quiz-response', {
          body: { id }
        });

        if (error) {
          errorCount++;
          console.error('[Admin] Error deleting:', id, error);
        } else {
          deletedCount++;
        }
      } catch (err) {
        errorCount++;
        console.error('[Admin] Error deleting:', id, err);
      }
    }

    // Update local state
    setResponses(prev => prev.filter(r => !selectedIds.has(r.id)));
    setSelectedIds(new Set());
    
    if (errorCount === 0) {
      toast.success(`${deletedCount} resposta(s) excluída(s) com sucesso`);
    } else {
      toast.warning(`${deletedCount} excluída(s), ${errorCount} erro(s)`);
    }
    
    setIsDeletingBatch(false);
  };

  const handleResetAllData = async () => {
    setIsResettingData(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('reset-quiz-data', {
        body: { tables: ['quiz_starts', 'quiz_responses', 'cta_clicks'] }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Clear local state
      setResponses([]);
      setFunnelMetrics({
        totalStarts: 0,
        totalCompletions: 0,
        totalCtaClicks: 0,
        dropoffs: 0,
        completionRate: 0,
        dropoffRate: 0,
        ctaClickRate: 0,
        recentClicks: [],
      });
      setSelectedIds(new Set());
      
      toast.success(data?.message || 'Todos os dados foram resetados');
      console.log('[Admin] Reset complete:', data);
    } catch (err) {
      console.error('[Admin] Error resetting data:', err);
      toast.error('Erro ao resetar dados');
    } finally {
      setIsResettingData(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === responses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(responses.map(r => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const exportToCSV = () => {
    if (responses.length === 0) return;

    const headers = [
      'Data', 'Nome', 'Email', 'WhatsApp', 
      'Perfil Dominante', 'Código', 'Score', 'Intensidade',
      'Perfeccionista', 'Multitarefa', 'Procrastinador', 
      'Analista', 'Dependente', 'Sobrecarregado',
      'UTM Source', 'UTM Medium', 'UTM Campaign', 'Device'
    ];

    const rows = responses.map(r => [
      new Date(r.created_at).toLocaleString('pt-BR'),
      r.name || '',
      r.email,
      r.phone || '',
      r.dominant_profile,
      r.dominant_code || '',
      r.dominant_score,
      r.dominant_intensity || '',
      r.score_perfeccionista,
      r.score_multitarefa,
      r.score_procrastinador,
      r.score_analista,
      r.score_dependente,
      r.score_sobrecarregado,
      r.utm_source || '',
      r.utm_medium || '',
      r.utm_campaign || '',
      r.device_type || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `quiz_responses_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getProfileColor = (profile: string) => {
    const colors: Record<string, string> = {
      'Perfeccionista Paralisado': 'bg-purple-100 text-purple-800',
      'Multitarefa Caótico': 'bg-orange-100 text-orange-800',
      'Procrastinador Criativo': 'bg-cyan-100 text-cyan-800',
      'Analista Perpétuo': 'bg-blue-100 text-blue-800',
      'Dependente de Motivação': 'bg-pink-100 text-pink-800',
      'Sobrecarregado Sistêmico': 'bg-red-100 text-red-800',
    };
    return colors[profile] || 'bg-gray-100 text-gray-800';
  };

  const getProfileStats = () => {
    const stats: Record<string, number> = {};
    responses.forEach(r => {
      stats[r.dominant_profile] = (stats[r.dominant_profile] || 0) + 1;
    });
    return Object.entries(stats)
      .sort(([, a], [, b]) => b - a)
      .map(([profile, count]) => ({ profile, count, percentage: ((count / responses.length) * 100).toFixed(1) }));
  };

  // Loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not logged in - show login/signup form
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <CardTitle>Área Administrativa</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {isSignUp ? 'Crie sua conta' : 'Faça login com sua conta de administrador'}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Senha (mínimo 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {isSignUp ? 'Cadastrando...' : 'Entrando...'}
                  </>
                ) : (
                  isSignUp ? 'Criar Conta' : 'Entrar'
                )}
              </Button>
            </form>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="block w-full mt-4 text-center text-sm text-primary hover:underline"
            >
              {isSignUp ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se'}
            </button>
            <Link to="/" className="block mt-2 text-center text-sm text-muted-foreground hover:underline">
              ← Voltar ao Quiz
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Logged in but not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="w-12 h-12 mx-auto text-destructive mb-2" />
            <CardTitle>Acesso Negado</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Você não tem permissões de administrador.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-center text-muted-foreground">
              Logado como: {user.email}
            </p>
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
            <Link to="/" className="block text-center text-sm text-muted-foreground hover:underline">
              ← Voltar ao Quiz
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = getProfileStats();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Painel Administrativo</h1>
              <p className="text-muted-foreground">Respostas do Quiz de Produtividade</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground hidden md:inline">
              {user.email}
            </span>
            <Button variant="outline" onClick={() => { fetchResponses(); fetchFunnelMetrics(); }} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button onClick={exportToCSV} disabled={responses.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isResettingData}>
                  <RotateCcw className={`h-4 w-4 mr-2 ${isResettingData ? 'animate-spin' : ''}`} />
                  Zerar Dados
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Zerar todos os dados do quiz?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação irá excluir permanentemente:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Todos os registros de quiz iniciados</li>
                      <li>Todas as respostas do quiz</li>
                      <li>Todos os cliques no CTA</li>
                    </ul>
                    <p className="mt-3 font-medium text-destructive">
                      Esta ação não pode ser desfeita!
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleResetAllData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sim, zerar tudo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Funnel Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-blue-500/10">
                  <PlayCircle className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quiz Iniciados</p>
                  <p className="text-2xl font-bold">{funnelMetrics?.totalStarts || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-green-500/10">
                  <Target className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quiz Finalizados</p>
                  <p className="text-2xl font-bold">{funnelMetrics?.totalCompletions || responses.length}</p>
                  <p className="text-xs text-green-600 font-medium">
                    {funnelMetrics?.completionRate || 0}% taxa
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-red-500/10">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Abandonos</p>
                  <p className="text-2xl font-bold">{funnelMetrics?.dropoffs || 0}</p>
                  <p className="text-xs text-red-600 font-medium">
                    {funnelMetrics?.dropoffRate || 0}% taxa
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-orange-500/10">
                  <MousePointerClick className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cliques no CTA</p>
                  <p className="text-2xl font-bold">{funnelMetrics?.totalCtaClicks || 0}</p>
                  <p className="text-xs text-orange-600 font-medium">
                    {funnelMetrics?.ctaClickRate || 0}% conversão
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Respostas</p>
                  <p className="text-3xl font-bold">{responses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/10">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Perfil Mais Comum</p>
                  <p className="text-lg font-bold truncate">
                    {stats[0]?.profile || '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-2">
              <p className="text-sm text-muted-foreground mb-3">Distribuição por Perfil</p>
              {stats.slice(0, 3).map(({ profile, percentage }) => (
                <div key={profile} className="flex justify-between text-sm">
                  <span className="truncate">{profile}</span>
                  <span className="font-medium">{percentage}%</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Error message */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Responses Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Respostas Recentes</CardTitle>
            {selectedIds.size > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    disabled={isDeletingBatch}
                  >
                    {isDeletingBatch ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Excluir {selectedIds.size} selecionado(s)
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir {selectedIds.size} resposta(s)?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir <strong>{selectedIds.size} resposta(s)</strong> selecionada(s)? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleBatchDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Excluir todos
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : responses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma resposta encontrada
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={responses.length > 0 && selectedIds.size === responses.length}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Selecionar todos"
                        />
                      </TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>Perfil Dominante</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>UTM</TableHead>
                      <TableHead className="w-[50px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.map((response) => (
                      <TableRow key={response.id} data-state={selectedIds.has(response.id) ? 'selected' : undefined}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(response.id)}
                            onCheckedChange={() => toggleSelect(response.id)}
                            aria-label={`Selecionar ${response.email}`}
                          />
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {new Date(response.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>{response.name || '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {response.email}
                        </TableCell>
                        <TableCell>{response.phone || '-'}</TableCell>
                        <TableCell>
                          <Badge className={getProfileColor(response.dominant_profile)}>
                            {response.dominant_profile}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{response.dominant_score}</span>
                          <span className="text-muted-foreground text-xs ml-1">
                            ({response.dominant_intensity})
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {response.device_type || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {response.utm_source || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <EditResponseDialog
                              response={response}
                              onSave={handleUpdate}
                            />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  disabled={deletingId === response.id}
                                >
                                  {deletingId === response.id ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir resposta?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir a resposta de <strong>{response.name || response.email}</strong>? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(response.id, response.email)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
