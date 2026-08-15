import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, RefreshCw, Lock, Users, TrendingUp, LogOut, Trash2, RotateCcw, Search, CheckCircle2 } from 'lucide-react';
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
  research_phase?: string | null;
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
  device_type: string | null;
  privacy_consent?: boolean;
  privacy_consent_at?: string | null;
  marketing_consent?: boolean;
  marketing_consent_at?: string | null;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);
  const [isResettingData, setIsResettingData] = useState(false);

  const checkAdminRole = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setIsAdmin(false);
        setIsCheckingAuth(false);
        return;
      }

      const { error } = await supabase.functions.invoke('get-quiz-responses');
      
      if (error) {
        setIsAdmin(false);
      } else {
        setIsAdmin(true);
        fetchResponses();
      }
    } catch (err) {
      console.error('[Admin] Error checking admin role:', err);
      setIsAdmin(false);
    } finally {
      setIsCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole();
          }, 0);
        } else {
          setIsAdmin(false);
          setIsCheckingAuth(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkAdminRole();
      } else {
        setIsCheckingAuth(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkAdminRole]);

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
          toast.success('Conta criada com sucesso! Aguarde a atribuição de permissões de administrador.');
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
    setIsAdmin(false);
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
      const { error } = await supabase.functions.invoke('delete-quiz-response', {
        body: { id }
      });

      if (error) {
        throw new Error(error.message);
      }

      setResponses(prev => prev.filter(r => r.id !== id));
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      toast.success(`Resposta de ${email} excluída com sucesso`);
    } catch (err) {
      console.error('[Admin] Error deleting response:', err);
      toast.error('Erro ao excluir resposta');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdate = async (id: string, data: { name: string; email: string; phone: string }) => {
    try {
      const { error } = await supabase.functions.invoke('update-quiz-response', {
        body: { id, ...data }
      });

      if (error) {
        throw new Error(error.message);
      }

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
        body: { tables: ['quiz_responses'] }
      });

      if (error) {
        throw new Error(error.message);
      }

      setResponses([]);
      setSelectedIds(new Set());
      toast.success(data?.message || 'Todas as respostas foram resetadas');
    } catch (err) {
      console.error('[Admin] Error resetting data:', err);
      toast.error('Erro ao resetar dados');
    } finally {
      setIsResettingData(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredResponses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredResponses.map(r => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const exportToCSV = () => {
    const headers = [
      'Data',
      'Nome',
      'Email',
      'WhatsApp',
      'Fase da Pesquisa',
      'Perfil Dominante',
      'Score Dominante',
      'Intensidade',
      'Perfeccionista',
      'Multitarefa',
      'Procrastinador',
      'Analista',
      'Dependente',
      'Sobrecarregado',
      'Dispositivo',
      'Consentimento LGPD',
      'Consentimento Marketing'
    ];

    const rows = responses.map(r => [
      new Date(r.created_at).toLocaleDateString('pt-BR'),
      r.name || '',
      r.email,
      r.phone || '',
      r.research_phase || '',
      r.dominant_profile,
      r.dominant_score,
      r.dominant_intensity || '',
      r.score_perfeccionista,
      r.score_multitarefa,
      r.score_procrastinador,
      r.score_analista,
      r.score_dependente,
      r.score_sobrecarregado,
      r.device_type || '',
      r.privacy_consent ? 'Sim' : 'Não',
      r.marketing_consent ? 'Sim' : 'Não'
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `quiz-respostas-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getProfileColor = (profile: string) => {
    switch (profile) {
      case 'O Perfeccionista Paralisado':
        return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      case 'O Multitarefa Disperso':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'O Procrastinador Ansioso':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'O Analista Exaustivo':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      case 'O Dependente de Validação':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case 'O Sobrecarregado Solitário':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const stats = useMemo(() => {
    const total = responses.length;
    if (total === 0) return [];

    const counts: Record<string, number> = {};
    responses.forEach(r => {
      counts[r.dominant_profile] = (counts[r.dominant_profile] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([profile, count]) => ({
        profile,
        count,
        percentage: ((count / total) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);
  }, [responses]);

  const marketingConsentCount = useMemo(() => {
    return responses.filter(r => r.marketing_consent).length;
  }, [responses]);

  const filteredResponses = useMemo(() => {
    if (!searchTerm.trim()) return responses;
    const term = searchTerm.toLowerCase();
    return responses.filter(r => 
      (r.name && r.name.toLowerCase().includes(term)) ||
      r.email.toLowerCase().includes(term) ||
      (r.phone && r.phone.includes(term)) ||
      r.dominant_profile.toLowerCase().includes(term)
    );
  }, [responses, searchTerm]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <RefreshCw className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-slate-100">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center border border-violet-500/20 mb-2">
              <Lock className="w-6 h-6 text-violet-400" />
            </div>
            <CardTitle className="text-xl text-white font-bold">Painel do Quiz</CardTitle>
            <p className="text-xs text-slate-400">
              {isSignUp ? 'Crie uma conta para solicitar acesso' : 'Entre com suas credenciais de administrador'}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {error && (
                <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : isSignUp ? (
                  'Criar Conta'
                ) : (
                  'Entrar'
                )}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                  }}
                  className="text-xs text-violet-400 hover:underline"
                >
                  {isSignUp ? 'Já tem uma conta? Faça login' : 'Primeiro acesso? Crie uma conta'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Painel de Respostas do Quiz</h1>
              <p className="text-xs text-slate-400">Sistema A.C.A.D.E.M.I.A • Gestão de Leads e Diagnósticos</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={fetchResponses} disabled={isLoading} className="border-slate-800 bg-slate-900 text-slate-200">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV} disabled={responses.length === 0} className="border-slate-800 bg-slate-900 text-slate-200">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isResettingData}>
                  <RotateCcw className={`h-4 w-4 mr-2 ${isResettingData ? 'animate-spin' : ''}`} />
                  Zerar Respostas
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                <AlertDialogHeader>
                  <AlertDialogTitle>Zerar todas as respostas?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    Esta ação excluirá permanentemente todas as respostas salvas do quiz. Esta operação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-slate-800 text-slate-200 border-slate-700">Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleResetAllData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sim, zerar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-white">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-slate-900 border-slate-800 text-slate-100">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total de Leads / Respostas</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-white">{responses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900 border-slate-800 text-slate-100">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Perfil Mais Comum</p>
                  <p className="text-base sm:text-lg font-bold text-white truncate">
                    {stats[0]?.profile || '-'}
                  </p>
                  {stats[0] && (
                    <p className="text-xs text-emerald-400 font-medium">
                      {stats[0].count} leads ({stats[0].percentage}%)
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 text-slate-100">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Opt-in de Comunicações</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-white">
                    {responses.length > 0 ? `${((marketingConsentCount / responses.length) * 100).toFixed(0)}%` : '0%'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {marketingConsentCount} de {responses.length} aceitaram
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Responses Table Card */}
        <Card className="bg-slate-900 border-slate-800 text-slate-100">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
            <CardTitle className="text-lg text-white font-bold">Leads Registrados ({filteredResponses.length})</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Buscar por nome, email ou perfil..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-slate-950 border-slate-800 text-white text-xs h-9"
                />
              </div>
              {selectedIds.size > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      disabled={isDeletingBatch}
                      className="h-9"
                    >
                      {isDeletingBatch ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Excluir {selectedIds.size}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir {selectedIds.size} resposta(s)?</AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-400">
                        Tem certeza que deseja excluir as respostas selecionadas? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-slate-800 text-slate-200 border-slate-700">Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleBatchDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-violet-400" />
              </div>
            ) : filteredResponses.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                Nenhuma resposta encontrada
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="w-[40px]">
                        <Checkbox
                          checked={filteredResponses.length > 0 && selectedIds.size === filteredResponses.length}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Selecionar todos"
                        />
                      </TableHead>
                      <TableHead className="text-slate-400">Data</TableHead>
                      <TableHead className="text-slate-400">Nome</TableHead>
                      <TableHead className="text-slate-400">Email</TableHead>
                      <TableHead className="text-slate-400">WhatsApp</TableHead>
                      <TableHead className="text-slate-400">Perfil Dominante</TableHead>
                      <TableHead className="text-slate-400">Pontuação</TableHead>
                      <TableHead className="text-slate-400">Dispositivo</TableHead>
                      <TableHead className="text-slate-400 text-right w-[80px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResponses.map((response) => (
                      <TableRow key={response.id} className="border-slate-800 hover:bg-slate-800/40">
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(response.id)}
                            onCheckedChange={() => toggleSelect(response.id)}
                            aria-label={`Selecionar ${response.email}`}
                          />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-slate-400">
                          {new Date(response.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-medium text-white text-sm">{response.name || '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-slate-300 text-sm">
                          {response.email}
                        </TableCell>
                        <TableCell className="text-slate-300 text-sm whitespace-nowrap">{response.phone || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getProfileColor(response.dominant_profile)}>
                            {response.dominant_profile}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className="font-bold text-white">{response.dominant_score}</span>
                          <span className="text-slate-500 text-xs ml-1">
                            ({response.dominant_intensity || '-'})
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-slate-400">
                            {response.device_type || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <EditResponseDialog
                              response={response}
                              onSave={handleUpdate}
                            />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8 text-slate-400 hover:text-destructive"
                                  disabled={deletingId === response.id}
                                >
                                  {deletingId === response.id ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir resposta?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-slate-400">
                                    Tem certeza que deseja excluir a resposta de <strong>{response.name || response.email}</strong>? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-slate-800 text-slate-200 border-slate-700">Cancelar</AlertDialogCancel>
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
