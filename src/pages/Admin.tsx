import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CheckCircle2, XCircle, Eye, ArrowLeft, Archive, Users, TrendingUp, TrendingDown, MoreHorizontal, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ShareRow {
  id: string;
  name: string | null;
  created_at: string;
  language: string;
  client_response: string | null;
  client_response_at: string | null;
  scenario_data: any;
  business_case_data: any;
  created_by: string | null;
  is_test: boolean;
  rejection_reason: string | null;
  status: string | null;
}

interface AeProfile {
  id: string;
  display_name: string | null;
  email: string;
}

type PeriodFilter = "current_month" | "12_months";

const ADMIN_PASSWORD = "ubirever26";

const COLORS = {
  accepted: "#1D9E75",
  pending: "#EF9F27",
  rejected: "#E24B4A",
  countered: "#7F77DD",
  takeRate: "#534AB7",
  bar: "#B5D4F4",
};

function getGtv(share: ShareRow): number {
  const bd = share.business_case_data;
  if (!bd) return 0;
  const annualReturns = (bd.resiAnnuali || 0) > 0 ? bd.resiAnnuali : (bd.resiMensili || 0) * 12;
  return annualReturns * (bd.carrelloMedio || 0);
}

function getAcv(share: ShareRow): number {
  const sd = share.scenario_data;
  const bd = share.business_case_data;
  if (!sd || !bd) return 0;
  const annualReturns = (bd.resiAnnuali || 0) > 0 ? bd.resiAnnuali : (bd.resiMensili || 0) * 12;
  const resiMensili = annualReturns / 12;
  const monthlySaaS = sd.saasFee || 0;
  const monthlyTransaction = (sd.transactionFeeFixed || 0) * resiMensili;
  const rdvAnnuali = annualReturns * ((sd.rdvConversionRate ?? 35) / 100);
  const rdvMensili = rdvAnnuali / 12;
  const monthlyRdv = (rdvMensili * (bd.carrelloMedio || 0) * (sd.rdvPercentage || 0)) / 100;
  const upsellingResi = annualReturns * ((sd.upsellingConversionRate ?? 3.78) / 100);
  const upsellingAOV = (bd.carrelloMedio || 0) * 1.2;
  const monthlyUpselling = ((upsellingResi * upsellingAOV) * (sd.upsellingPercentage || 0)) / 100 / 12;
  return (monthlySaaS + monthlyTransaction + monthlyRdv + monthlyUpselling) * 12;
}

function getTakeRate(share: ShareRow): number {
  const gtv = getGtv(share);
  if (gtv <= 0) return 0;
  return (getAcv(share) / gtv) * 100;
}

function formatEur(n: number): string {
  return n.toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

function getFilterDate(filter: PeriodFilter): Date {
  const now = new Date();
  if (filter === "current_month") return new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date(now.getTime() - 365 * 86400000);
}

function getPrevPeriodRange(filter: PeriodFilter): [Date, Date] {
  const now = new Date();
  if (filter === "current_month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return [start, end];
  }
  return [new Date(now.getTime() - 730 * 86400000), new Date(now.getTime() - 365 * 86400000)];
}

function getWeekLabel(date: Date): string {
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

const getStatusBadge = (response: string | null) => {
  if (!response) return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
  if (response === "accepted") return <Badge className="gap-1 bg-green-500 hover:bg-green-600 text-primary-foreground"><CheckCircle2 className="h-3 w-3" />Accepted</Badge>;
  if (response === "countered") return <Badge className="gap-1 bg-purple-500 hover:bg-purple-600 text-primary-foreground">Countered</Badge>;
  return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const Admin = () => {
  const [shares, setShares] = useState<ShareRow[]>([]);
  const [profiles, setProfiles] = useState<AeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("current_month");
  const [selectedAeId, setSelectedAeId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = () => {
    if (passwordInput === ADMIN_PASSWORD) { setAuthenticated(true); setPasswordError(false); }
    else setPasswordError(true);
  };

  const refreshData = async () => {
    const [sharesRes, profilesRes] = await Promise.all([
      supabase.from("client_shares").select("*").order("created_at", { ascending: false }),
      supabase.from("ae_profiles").select("*"),
    ]);
    if (sharesRes.data) setShares(sharesRes.data as ShareRow[]);
    if (profilesRes.data) setProfiles(profilesRes.data as AeProfile[]);
    setLoading(false);
  };

  const toggleTestMark = async (shareId: string, currentIsTest: boolean) => {
    await supabase.from("client_shares").update({ is_test: !currentIsTest }).eq("id", shareId);
    await refreshData();
  };

  useEffect(() => {
    if (!authenticated) return;
    refreshData();
  }, [authenticated]);

  const profileMap = useMemo(() => {
    const m: Record<string, AeProfile> = {};
    profiles.forEach(p => { m[p.id] = p; });
    return m;
  }, [profiles]);

  const getAeName = (createdBy: string | null) => {
    if (!createdBy) return "—";
    return profileMap[createdBy]?.display_name || profileMap[createdBy]?.email || "—";
  };

  // Non-test, non-orphan shares for stats
  const nonTest = useMemo(() => shares.filter(s => !s.is_test && s.created_by != null), [shares]);

  // Period-filtered non-test shares
  const periodFiltered = useMemo(() => {
    const cutoff = getFilterDate(periodFilter);
    return nonTest.filter(s => new Date(s.created_at) >= cutoff);
  }, [nonTest, periodFilter]);

  // Global KPIs
  const globalStats = useMemo(() => {
    const totalGtv = nonTest.reduce((sum, s) => sum + getGtv(s), 0);
    const acceptedAcv = nonTest.filter(s => s.client_response === "accepted").reduce((sum, s) => sum + getAcv(s), 0);
    const rates = nonTest.map(getTakeRate).filter(r => r > 0);
    const avgTakeRate = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
    return { total: nonTest.length, totalGtv, acceptedAcv, avgTakeRate };
  }, [nonTest]);

  // AE rankings
  const aeRankings = useMemo(() => {
    const map: Record<string, { aeId: string; gtvSent: number; gtvAccepted: number; acvSent: number; acvAccepted: number }> = {};
    periodFiltered.forEach(s => {
      const aeId = s.created_by || "unknown";
      if (!map[aeId]) map[aeId] = { aeId, gtvSent: 0, gtvAccepted: 0, acvSent: 0, acvAccepted: 0 };
      const gtv = getGtv(s);
      const acv = getAcv(s);
      map[aeId].gtvSent += gtv;
      map[aeId].acvSent += acv;
      if (s.client_response === "accepted") {
        map[aeId].gtvAccepted += gtv;
        map[aeId].acvAccepted += acv;
      }
    });
    return Object.values(map);
  }, [periodFiltered]);

  const rankByGtv = useMemo(() => [...aeRankings].sort((a, b) => (b.gtvAccepted - a.gtvAccepted) || (b.gtvSent - a.gtvSent)), [aeRankings]);
  const rankByAcv = useMemo(() => [...aeRankings].sort((a, b) => (b.acvAccepted - a.acvAccepted) || (b.acvSent - a.acvSent)), [aeRankings]);

  const rankColor = (i: number) => {
    if (i === 0) return "text-yellow-500 font-bold";
    if (i === 1) return "text-gray-400 font-bold";
    if (i === 2) return "text-amber-700 font-bold";
    return "text-muted-foreground";
  };

  // Archive logic
  const getTodayStart = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; };
  const isArchived = (share: ShareRow) => {
    const todayStart = getTodayStart();
    return new Date(share.created_at) < todayStart && !share.client_response;
  };
  const activeShares = shares.filter(s => !isArchived(s));
  const archivedShares = shares.filter(s => isArchived(s));

  // ========== AE VIEW (STATE 2) ==========
  const aeAllProposals = useMemo(() => {
    if (!selectedAeId) return [];
    return shares.filter(s => s.created_by === selectedAeId);
  }, [selectedAeId, shares]);

  const aeStatsFiltered = useMemo(() => {
    if (!selectedAeId) return [];
    return nonTest.filter(s => s.created_by === selectedAeId);
  }, [selectedAeId, nonTest]);

  const aePrevFiltered = useMemo(() => {
    if (!selectedAeId) return [];
    const [start, end] = getPrevPeriodRange(periodFilter);
    return nonTest.filter(s => {
      const d = new Date(s.created_at);
      return s.created_by === selectedAeId && d >= start && d <= end;
    });
  }, [selectedAeId, nonTest, periodFilter]);

  const aeKpis = useMemo(() => {
    const sent = aeStatsFiltered;
    const accepted = sent.filter(s => s.client_response === "accepted");
    const gtvSent = sent.reduce((sum, s) => sum + getGtv(s), 0);
    const gtvAccepted = accepted.reduce((sum, s) => sum + getGtv(s), 0);
    const acvSent = sent.reduce((sum, s) => sum + getAcv(s), 0);
    const acvAccepted = accepted.reduce((sum, s) => sum + getAcv(s), 0);
    const rates = sent.map(getTakeRate).filter(r => r > 0);
    const avgTakeRate = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
    const prevRates = aePrevFiltered.map(getTakeRate).filter(r => r > 0);
    const prevAvg = prevRates.length > 0 ? prevRates.reduce((a, b) => a + b, 0) / prevRates.length : 0;
    const takeRateDelta = avgTakeRate - prevAvg;
    return { count: sent.length, gtvSent, gtvAccepted, acvSent, acvAccepted, avgTakeRate, takeRateDelta, hasPrev: aePrevFiltered.length > 0 };
  }, [aeStatsFiltered, aePrevFiltered]);

  const aeStatusCounts = useMemo(() => {
    const acc = { accepted: 0, pending: 0, rejected: 0, countered: 0 };
    aeStatsFiltered.forEach(s => {
      if (s.client_response === "accepted") acc.accepted++;
      else if (s.client_response === "rejected") acc.rejected++;
      else if (s.client_response === "countered") acc.countered++;
      else acc.pending++;
    });
    return acc;
  }, [aeStatsFiltered]);

  const aeDonutData = useMemo(() => [
    { name: "Accepted", value: aeStatusCounts.accepted, color: COLORS.accepted },
    { name: "Pending", value: aeStatusCounts.pending, color: COLORS.pending },
    { name: "Rejected", value: aeStatusCounts.rejected, color: COLORS.rejected },
    { name: "Countered", value: aeStatusCounts.countered, color: COLORS.countered },
  ].filter(d => d.value > 0), [aeStatusCounts]);

  const aeTotalDonut = aeStatusCounts.accepted + aeStatusCounts.pending + aeStatusCounts.rejected + aeStatusCounts.countered;
  const aeAcceptedPct = aeTotalDonut > 0 ? Math.round((aeStatusCounts.accepted / aeTotalDonut) * 100) : 0;

  const aeWeeklyData = useMemo(() => {
    const cutoff = getFilterDate(periodFilter);
    const now = new Date();
    const weeks: { label: string; count: number }[] = [];
    let weekStart = new Date(cutoff);
    const dayOfWeek = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - ((dayOfWeek + 6) % 7));
    while (weekStart < now) {
      const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
      const count = aeStatsFiltered.filter(s => {
        const d = new Date(s.created_at);
        return d >= weekStart && d < weekEnd;
      }).length;
      weeks.push({ label: getWeekLabel(weekStart), count });
      weekStart = weekEnd;
    }
    return weeks;
  }, [aeStatsFiltered, periodFilter]);

  // ========== LOGIN SCREEN ==========
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader><CardTitle className="text-center">Admin Panel</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input type="password" placeholder="Password" value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
            {passwordError && <p className="text-sm text-destructive">Password errata</p>}
            <Button className="w-full" onClick={handleLogin}>Accedi</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========== RENDER GLOBAL PROPOSALS TABLE ==========
  const renderAllProposalsTable = (rows: ShareRow[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>AE</TableHead>
          <TableHead className="text-right">GTV</TableHead>
          <TableHead className="text-right">ACV</TableHead>
          <TableHead className="text-right">Take rate</TableHead>
          <TableHead>Expiry</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((share) => {
          const isOrphan = share.created_by == null;
          return (
            <TableRow key={share.id} className={share.is_test || isOrphan ? "opacity-40" : ""}>
              <TableCell className="font-medium">{share.name || "—"}</TableCell>
              <TableCell>{getAeName(share.created_by)}</TableCell>
              <TableCell className="text-right">{formatEur(getGtv(share))}</TableCell>
              <TableCell className="text-right">{formatEur(getAcv(share))}</TableCell>
              <TableCell className="text-right" style={{ color: COLORS.takeRate }}>{getTakeRate(share).toFixed(2)}%</TableCell>
               <TableCell>{share.scenario_data?.offerExpirationDate ? formatDate(share.scenario_data.offerExpirationDate) : "—"}</TableCell>
              <TableCell>
                <div>
                  <div className="flex items-center gap-1">
                    {isOrphan && <Badge variant="outline" className="text-muted-foreground border-muted-foreground/40">Orphan</Badge>}
                    {share.is_test && <Badge variant="outline" className="text-muted-foreground border-muted-foreground/40">Test</Badge>}
                    {getStatusBadge(share.client_response)}
                  </div>
                  {share.client_response === "rejected" && share.rejection_reason && (
                    <p className="text-xs text-muted-foreground mt-1">"{share.rejection_reason}"</p>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => window.open(`/view/${share.id}`, "_blank")} className="gap-1">
                  <Eye className="h-4 w-4" /> View
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  // ========== STATE 2: AE VIEW ==========
  if (selectedAeId) {
    return (
      <div className="min-h-screen bg-muted/30 p-6 md:p-10">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{getAeName(selectedAeId)}</h1>
              <Badge variant="secondary">Admin view</Badge>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSelectedAeId(null)} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to rankings
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">Test proposals are visible but excluded from stats</p>

          {/* 4 KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Proposals sent</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{aeKpis.count}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">GTV sent</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatEur(aeKpis.gtvSent)}</p>
                <p className="text-xs text-muted-foreground">Accepted: {formatEur(aeKpis.gtvAccepted)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">ACV sent</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatEur(aeKpis.acvSent)}</p>
                <p className="text-xs text-muted-foreground">Accepted: {formatEur(aeKpis.acvAccepted)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg take rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold" style={{ color: COLORS.takeRate }}>{aeKpis.avgTakeRate.toFixed(1)}%</p>
                {aeKpis.hasPrev && (
                  <div className="flex items-center gap-1 text-xs mt-1">
                    {aeKpis.takeRateDelta >= 0 ? (
                      <><TrendingUp className="h-3 w-3" style={{ color: COLORS.accepted }} /><span style={{ color: COLORS.accepted }}>+{aeKpis.takeRateDelta.toFixed(1)}%</span></>
                    ) : (
                      <><TrendingDown className="h-3 w-3" style={{ color: COLORS.rejected }} /><span style={{ color: COLORS.rejected }}>{aeKpis.takeRateDelta.toFixed(1)}%</span></>
                    )}
                    <span className="text-muted-foreground">vs prev period</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Donut */}
            <Card>
              <CardHeader><CardTitle className="text-base">Conversion rate</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 mb-4">
                  {([
                    { key: "accepted" as const, label: "Accepted", color: COLORS.accepted },
                    { key: "pending" as const, label: "Pending", color: COLORS.pending },
                    { key: "rejected" as const, label: "Rejected", color: COLORS.rejected },
                    { key: "countered" as const, label: "Countered", color: COLORS.countered },
                  ]).map(item => (
                    <div key={item.key} className="flex items-center gap-1.5 text-sm">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium">{aeTotalDonut > 0 ? Math.round((aeStatusCounts[item.key] / aeTotalDonut) * 100) : 0}%</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center">
                  <div className="relative" style={{ width: 220, height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={aeDonutData} dataKey="value" innerRadius={70} outerRadius={100} paddingAngle={2} strokeWidth={0}>
                          {aeDonutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-bold" style={{ fontSize: 28, color: COLORS.accepted }}>{aeAcceptedPct}%</span>
                      <span className="text-xs text-muted-foreground">accepted</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bar chart */}
            <Card>
              <CardHeader><CardTitle className="text-base">Weekly activity</CardTitle></CardHeader>
              <CardContent>
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={aeWeeklyData}>
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: number) => [value, "Proposals"]} />
                      <Bar dataKey="count" fill={COLORS.bar} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AE Proposals table */}
          <Card>
            <CardContent className="pt-6">
              {aeAllProposals.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No proposals</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                     <TableHead>Client</TableHead>
                      <TableHead className="text-right">GTV</TableHead>
                      <TableHead className="text-right">ACV</TableHead>
                      <TableHead className="text-right">Take rate</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aeAllProposals.map(share => (
                      <TableRow key={share.id} className={share.is_test ? "opacity-40" : ""}>
                        <TableCell className="font-medium">{share.name || "—"}</TableCell>
                        <TableCell className="text-right">{formatEur(getGtv(share))}</TableCell>
                        <TableCell className="text-right">{formatEur(getAcv(share))}</TableCell>
                        <TableCell className="text-right" style={{ color: COLORS.takeRate }}>{getTakeRate(share).toFixed(2)}%</TableCell>
                        <TableCell>{share.scenario_data?.offerExpirationDate ? formatDate(share.scenario_data.offerExpirationDate) : "—"}</TableCell>
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-1">
                              {share.is_test && <Badge variant="outline" className="text-muted-foreground border-muted-foreground/40">Test</Badge>}
                              {getStatusBadge(share.client_response)}
                            </div>
                            {share.client_response === "rejected" && share.rejection_reason && (
                              <p className="text-xs text-muted-foreground mt-1">"{share.rejection_reason}"</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => window.open(`/view/${share.id}`, "_blank")} className="gap-2">
                                <Eye className="h-4 w-4" /> View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleTestMark(share.id, share.is_test)} className="gap-2">
                                <FlaskConical className="h-4 w-4" /> {share.is_test ? "Remove test mark" : "Mark as test"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ========== STATE 1: MAIN VIEW ==========
  return (
    <div className="min-h-screen bg-muted/30 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
            <p className="text-muted-foreground text-sm">Overview of all AE proposals and performance</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to simulator
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : (
          <>
            {/* Global KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold">{globalStats.total}</p>
                  <p className="text-sm text-muted-foreground">Total proposals sent</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold">{formatEur(globalStats.totalGtv)}</p>
                  <p className="text-sm text-muted-foreground">Total GTV sent</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold">{formatEur(globalStats.acceptedAcv)}</p>
                  <p className="text-sm text-muted-foreground">Total ACV accepted</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold">{globalStats.avgTakeRate.toFixed(2)}%</p>
                  <p className="text-sm text-muted-foreground">Avg take rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Period Filter */}
            <div className="flex gap-2">
              {(["current_month", "12_months"] as PeriodFilter[]).map(f => (
                <Button key={f} variant={periodFilter === f ? "default" : "outline"} size="sm"
                  onClick={() => setPeriodFilter(f)}>
                  {f === "current_month" ? "Current month" : "12 months"}
                </Button>
              ))}
            </div>

            {/* Rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Ranking by GTV</CardTitle></CardHeader>
                <CardContent>
                  {rankByGtv.length === 0 ? <p className="text-muted-foreground text-center py-4">No data</p> : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>AE</TableHead>
                          <TableHead className="text-right">GTV sent</TableHead>
                          <TableHead className="text-right">GTV accepted</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rankByGtv.map((ae, i) => (
                          <TableRow key={ae.aeId}>
                            <TableCell className={rankColor(i)}>{i + 1}</TableCell>
                            <TableCell className="font-medium">{getAeName(ae.aeId)}</TableCell>
                            <TableCell className="text-right">{formatEur(ae.gtvSent)}</TableCell>
                            <TableCell className="text-right">{formatEur(ae.gtvAccepted)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => setSelectedAeId(ae.aeId)} className="gap-1">
                                <Eye className="h-4 w-4" /> View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">Ranking by ACV</CardTitle></CardHeader>
                <CardContent>
                  {rankByAcv.length === 0 ? <p className="text-muted-foreground text-center py-4">No data</p> : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>AE</TableHead>
                          <TableHead className="text-right">ACV sent</TableHead>
                          <TableHead className="text-right">ACV accepted</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rankByAcv.map((ae, i) => (
                          <TableRow key={ae.aeId}>
                            <TableCell className={rankColor(i)}>{i + 1}</TableCell>
                            <TableCell className="font-medium">{getAeName(ae.aeId)}</TableCell>
                            <TableCell className="text-right">{formatEur(ae.acvSent)}</TableCell>
                            <TableCell className="text-right">{formatEur(ae.acvAccepted)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => setSelectedAeId(ae.aeId)} className="gap-1">
                                <Eye className="h-4 w-4" /> View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* AE Team Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5" /> AE Team</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profiles.map(ae => {
                    const aeProposals = nonTest.filter(s => s.created_by === ae.id);
                    const proposalCount = aeProposals.length;
                    const gtvAccepted = aeProposals.filter(s => s.client_response === "accepted").reduce((sum, s) => sum + getGtv(s), 0);
                    const acvAccepted = aeProposals.filter(s => s.client_response === "accepted").reduce((sum, s) => sum + getAcv(s), 0);
                    const rates = aeProposals.map(getTakeRate).filter(r => r > 0);
                    const avgRate = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
                    const lastActivity = aeProposals.length > 0 ? aeProposals.reduce((max, s) => s.created_at > max ? s.created_at : max, aeProposals[0].created_at) : null;
                    return (
                      <Card key={ae.id} className="border">
                        <CardContent className="pt-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{ae.display_name || ae.email}</p>
                              <p className="text-xs text-muted-foreground">{ae.email}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedAeId(ae.id)} className="gap-1">
                              <Eye className="h-4 w-4" /> View
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-muted-foreground">Proposals:</span> <span className="font-medium">{proposalCount}</span></div>
                            <div><span className="text-muted-foreground">GTV acc:</span> <span className="font-medium">{formatEur(gtvAccepted)}</span></div>
                            <div><span className="text-muted-foreground">ACV acc:</span> <span className="font-medium">{formatEur(acvAccepted)}</span></div>
                            <div><span className="text-muted-foreground">Avg rate:</span> <span className="font-medium">{avgRate.toFixed(2)}%</span></div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Last activity: {lastActivity ? formatDate(lastActivity) : "—"}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* All Proposals Table */}
            <Card>
              <CardContent className="pt-6">
                <Tabs defaultValue="proposte">
                  <TabsList>
                    <TabsTrigger value="proposte">Proposals ({activeShares.length})</TabsTrigger>
                    <TabsTrigger value="archiviate" className="gap-1">
                      <Archive className="h-3.5 w-3.5" /> Archived ({archivedShares.length})
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="proposte">
                    {activeShares.length === 0 ? <p className="text-muted-foreground text-center py-8">No active proposals</p> : renderAllProposalsTable(activeShares)}
                  </TabsContent>
                  <TabsContent value="archiviate">
                    {archivedShares.length === 0 ? <p className="text-muted-foreground text-center py-8">No archived proposals</p> : renderAllProposalsTable(archivedShares)}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;
