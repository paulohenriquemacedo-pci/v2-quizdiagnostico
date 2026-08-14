import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Megaphone, RefreshCw } from 'lucide-react';

interface CampaignInsight {
  campaignId: string;
  campaignName: string;
  spend: number;
  impressions: number;
  clicks: number;
  cpc: number;
  cpm: number;
  ctr: number;
  reach: number;
}

interface RevenueByCampaignRow {
  source: string;
  campaign: string;
  revenue: number;
  sales: number;
}

interface LeadsByCampaignRow {
  source: string;
  campaign: string;
  count: number;
}

interface CampaignsPanelProps {
  revenueByCampaign: RevenueByCampaignRow[];
  leadsByCampaign: LeadsByCampaignRow[];
}

interface MergedCampaignRow {
  campaignName: string;
  spend: number;
  leads: number;
  sales: number;
  revenue: number;
  cpl: number | null;
  cac: number | null;
  roas: number | null;
  matched: boolean;
}

function normalizeCampaignName(name: string): string {
  return name.trim().toLowerCase();
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function defaultSince(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().slice(0, 10);
}

function defaultUntil(): string {
  return new Date().toISOString().slice(0, 10);
}

const chartConfig: ChartConfig = {
  spend: { label: 'Investimento', color: '#f97316' },
  revenue: { label: 'Receita', color: '#10b981' },
} satisfies ChartConfig;

export function CampaignsPanel({ revenueByCampaign, leadsByCampaign }: CampaignsPanelProps) {
  const [since, setSince] = useState(defaultSince());
  const [until, setUntil] = useState(defaultUntil());
  const [campaigns, setCampaigns] = useState<CampaignInsight[] | null>(null);
  const [totalSpend, setTotalSpend] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('get-meta-ad-insights', {
        body: { since, until },
      });
      if (fnError) throw fnError;
      setCampaigns(data?.data?.campaigns || []);
      setTotalSpend(data?.data?.totalSpend || 0);
    } catch (err) {
      console.error('[CampaignsPanel] get-meta-ad-insights error:', err);
      setError('Não foi possível carregar os dados de investimento do Meta Ads.');
      setCampaigns(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Merge Meta spend with internal leads/revenue. Two join strategies, tried in order:
  //  1. Exact match on Meta's campaignId — reliable iff utm_campaign was set to Meta's
  //     dynamic {{campaign.id}} tag, which never changes even if the campaign is renamed.
  //  2. Fallback: normalized campaign-name match, for any utm_campaign captured before that
  //     convention was adopted (free-text names typed by hand).
  // Unmatched rows on either side stay visible in the table, never dropped silently.
  const revenueById = new Map<string, RevenueByCampaignRow>();
  const revenueByName = new Map<string, RevenueByCampaignRow>();
  for (const row of revenueByCampaign) {
    revenueById.set(row.campaign.trim(), row);
    revenueByName.set(normalizeCampaignName(row.campaign), row);
  }
  const leadsById = new Map<string, LeadsByCampaignRow>();
  const leadsByName = new Map<string, LeadsByCampaignRow>();
  for (const row of leadsByCampaign) {
    leadsById.set(row.campaign.trim(), row);
    leadsByName.set(normalizeCampaignName(row.campaign), row);
  }

  // Track which source rows (by object reference) got consumed by a Meta campaign match, so the
  // "unmatched internal" list below can skip them regardless of which map (id or name) found them.
  const matchedRevenueRows = new Set<RevenueByCampaignRow>();
  const matchedLeadsRows = new Set<LeadsByCampaignRow>();

  const merged: MergedCampaignRow[] = (campaigns || []).map((c) => {
    const idKey = (c.campaignId || '').trim();
    const nameKey = normalizeCampaignName(c.campaignName);
    const revenueRow = revenueById.get(idKey) || revenueByName.get(nameKey);
    const leadsRow = leadsById.get(idKey) || leadsByName.get(nameKey);
    if (revenueRow) matchedRevenueRows.add(revenueRow);
    if (leadsRow) matchedLeadsRows.add(leadsRow);

    const leads = leadsRow?.count || 0;
    const sales = revenueRow?.sales || 0;
    const revenue = revenueRow?.revenue || 0;

    return {
      campaignName: c.campaignName || '(sem nome)',
      spend: c.spend,
      leads,
      sales,
      revenue,
      cpl: leads > 0 ? c.spend / leads : null,
      cac: sales > 0 ? c.spend / sales : null,
      roas: c.spend > 0 ? revenue / c.spend : null,
      matched: Boolean(revenueRow || leadsRow),
    };
  });

  // Internal campaigns with no matching Meta campaign in this date range — still surfaced, not dropped.
  const unmatchedCampaignNames = new Set<string>();
  for (const row of revenueByCampaign) if (!matchedRevenueRows.has(row)) unmatchedCampaignNames.add(row.campaign);
  for (const row of leadsByCampaign) if (!matchedLeadsRows.has(row)) unmatchedCampaignNames.add(row.campaign);

  const unmatchedInternal = Array.from(unmatchedCampaignNames).map((campaign) => {
    const revenueRow = revenueById.get(campaign) || revenueByName.get(normalizeCampaignName(campaign));
    const leadsRow = leadsById.get(campaign) || leadsByName.get(normalizeCampaignName(campaign));
    return {
      campaignName: campaign,
      leads: leadsRow?.count || 0,
      sales: revenueRow?.sales || 0,
      revenue: revenueRow?.revenue || 0,
    };
  });

  const totalMatchedRevenue = merged.reduce((sum, r) => sum + (r.matched ? r.revenue : 0), 0);
  const totalMatchedLeads = merged.reduce((sum, r) => sum + (r.matched ? r.leads : 0), 0);
  const totalMatchedSales = merged.reduce((sum, r) => sum + (r.matched ? r.sales : 0), 0);
  const blendedCpl = totalMatchedLeads > 0 ? totalSpend / totalMatchedLeads : null;
  const blendedCac = totalMatchedSales > 0 ? totalSpend / totalMatchedSales : null;
  const blendedRoas = totalSpend > 0 ? totalMatchedRevenue / totalSpend : null;

  const chartData = merged
    .filter((r) => r.spend > 0 || r.revenue > 0)
    .map((r) => ({ campaign: r.campaignName, spend: Number(r.spend.toFixed(2)), revenue: Number(r.revenue.toFixed(2)) }));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Campanhas (Meta Ads)
          </CardTitle>
          <div className="flex items-center gap-2">
            <Input type="date" value={since} onChange={(e) => setSince(e.target.value)} className="w-40" />
            <span className="text-muted-foreground text-sm">até</span>
            <Input type="date" value={until} onChange={(e) => setUntil(e.target.value)} className="w-40" />
            <Button variant="outline" size="icon" onClick={fetchInsights} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            O valor de receita registrado (<code>purchases.amount</code>) ainda não foi validado contra um payload
            real da Hotmart — trate CAC e ROAS abaixo como estimativas até essa checagem ser feita.
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Investimento (Meta)</p>
              <p className="text-2xl font-bold">{formatBRL(totalSpend)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Receita (campanhas casadas)</p>
              <p className="text-2xl font-bold">{formatBRL(totalMatchedRevenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">CPL / CAC</p>
              <p className="text-lg font-bold">
                {blendedCpl !== null ? formatBRL(blendedCpl) : '—'} / {blendedCac !== null ? formatBRL(blendedCac) : '—'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">ROAS</p>
              <p className="text-2xl font-bold">{blendedRoas !== null ? `${blendedRoas.toFixed(2)}x` : '—'}</p>
            </CardContent>
          </Card>
        </div>

        {chartData.length > 0 && (
          <ChartContainer config={chartConfig} className="max-h-80 w-full">
            <BarChart data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="campaign" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => formatBRL(v)} width={90} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="spend" fill="var(--color-spend)" radius={4} />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead className="text-right">Investimento</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">CPL</TableHead>
                <TableHead className="text-right">CAC</TableHead>
                <TableHead className="text-right">ROAS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {merged.map((row) => (
                <TableRow key={row.campaignName}>
                  <TableCell>
                    {row.campaignName}
                    {!row.matched && (
                      <span className="ml-2 text-xs text-muted-foreground">(não correspondido)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{formatBRL(row.spend)}</TableCell>
                  <TableCell className="text-right">{row.leads}</TableCell>
                  <TableCell className="text-right">{row.sales}</TableCell>
                  <TableCell className="text-right">{formatBRL(row.revenue)}</TableCell>
                  <TableCell className="text-right">{row.cpl !== null ? formatBRL(row.cpl) : '—'}</TableCell>
                  <TableCell className="text-right">{row.cac !== null ? formatBRL(row.cac) : '—'}</TableCell>
                  <TableCell className="text-right">{row.roas !== null ? `${row.roas.toFixed(2)}x` : '—'}</TableCell>
                </TableRow>
              ))}
              {unmatchedInternal.map((row) => (
                <TableRow key={`internal-${row.campaignName}`} className="opacity-70">
                  <TableCell>
                    {row.campaignName}
                    <span className="ml-2 text-xs text-muted-foreground">(sem gasto no Meta neste período)</span>
                  </TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right">{row.leads}</TableCell>
                  <TableCell className="text-right">{row.sales}</TableCell>
                  <TableCell className="text-right">{formatBRL(row.revenue)}</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right">—</TableCell>
                </TableRow>
              ))}
              {merged.length === 0 && unmatchedInternal.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    {isLoading ? 'Carregando...' : 'Sem dados de campanha para o período selecionado.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
