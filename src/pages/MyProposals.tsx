import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, Eye, TrendingUp, TrendingDown, MoreHorizontal, FlaskConical, FlaskConicalOff, CalendarDays, HelpCircle } from "lucide-react";
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import LanguageSelector from "@/components/LanguageSelector";
import { getTranslation, formatCurrency } from "@/utils/translations";

interface ShareRow {
  id: string;
  name: string | null;
  created_at: string;
  language: string;
  client_response: string | null;
  client_response_at: string | null;
  scenario_data: any;
  business_case_data: any;
  is_test: boolean;
  rejection_reason: string | null;
}

type PeriodFilter = "current_month" | "90_days" | "6_months" | "12_months";

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
  const acv = getAcv(share);
  return (acv / gtv) * 100;
}

function getFilterDate(filter: PeriodFilter): Date {
  const now = new Date();
  switch (filter) {
    case "current_month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "90_days":
      return new Date(now.getTime() - 90 * 86400000);
    case "6_months":
      return new Date(now.getTime() - 180 * 86400000);
    case "12_months":
      return new Date(now.getTime() - 365 * 86400000);
  }
}

function getPrevPeriodRange(filter: PeriodFilter): [Date, Date] {
  const now = new Date();
  switch (filter) {
    case "current_month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return [start, end];
    }
    case "90_days":
      return [new Date(now.getTime() - 180 * 86400000), new Date(now.getTime() - 90 * 86400000)];
    case "6_months":
      return [new Date(now.getTime() - 360 * 86400000), new Date(now.getTime() - 180 * 86400000)];
    case "12_months":
      return [new Date(now.getTime() - 730 * 86400000), new Date(now.getTime() - 365 * 86400000)];
  }
}

function getWeekLabel(date: Date): string {
  const d = new Date(date);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  return `${day}/${month}`;
}

const MyProposals = () => {
  const [shares, setShares] = useState<ShareRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [language, setLanguage] = useState(() => localStorage.getItem('preferredLanguage') || 'it');
  const [period, setPeriod] = useState<PeriodFilter>("current_month");
  const [faqOpen, setFaqOpen] = useState(false);
  const [activityChartMode, setActivityChartMode] = useState<"3weeks" | "6months">("3weeks");
  const navigate = useNavigate();

  useEffect(() => { localStorage.setItem('preferredLanguage', language); }, [language]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) navigate("/login", { replace: true });
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/login", { replace: true }); return; }
      setUserEmail(session.user.email || "");
      setUserId(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;
    const fetchShares = async () => {
      const { data, error } = await supabase
        .from("client_shares")
        .select("id, name, created_at, language, client_response, client_response_at, scenario_data, business_case_data, is_test, rejection_reason")
        .eq("created_by", userId)
        .order("created_at", { ascending: false });
      if (!error && data) setShares(data as ShareRow[]);
      setLoading(false);
    };
    fetchShares();
  }, [userId]);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/login", { replace: true }); };

  // Filtered shares
  const handleToggleTest = async (id: string, currentIsTest: boolean) => {
    const newVal = !currentIsTest;
    await supabase.from("client_shares").update({ is_test: newVal } as any).eq("id", id);
    setShares(prev => prev.map(s => s.id === id ? { ...s, is_test: newVal } : s));
  };

  const [extendingExpiryId, setExtendingExpiryId] = useState<string | null>(null);
  const [extendDateStr, setExtendDateStr] = useState("");

  const openExtendExpiry = (share: ShareRow) => {
    const scenario = share.scenario_data as any;
    const current = scenario?.offerExpirationDate || scenario?.offerValidUntil;
    if (current) {
      setExtendDateStr(new Date(current).toISOString().split("T")[0]);
    } else {
      setExtendDateStr("");
    }
    setExtendingExpiryId(share.id);
  };

  const handleExtendExpiry = async () => {
    if (!extendingExpiryId || !extendDateStr) return;
    const share = shares.find(s => s.id === extendingExpiryId);
    if (!share) return;
    const isoDate = `${extendDateStr}T00:00:00.000Z`;
    const newScenario = { ...(share.scenario_data as any), offerExpirationDate: isoDate, offerValidUntil: isoDate };
    await supabase.from("client_shares").update({ scenario_data: newScenario } as any).eq("id", extendingExpiryId);
    setShares(prev => prev.map(s => s.id === extendingExpiryId ? { ...s, scenario_data: newScenario } : s));
    setExtendingExpiryId(null);
  };

  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  // All shares in period (for table display)
  const filtered = useMemo(() => {
    const cutoff = getFilterDate(period);
    return shares.filter(s => new Date(s.created_at) >= cutoff);
  }, [shares, period]);

  // Non-test shares for stats
  const statsFiltered = useMemo(() => filtered.filter(s => !s.is_test), [filtered]);

  const prevFiltered = useMemo(() => {
    const [start, end] = getPrevPeriodRange(period);
    return shares.filter(s => {
      const d = new Date(s.created_at);
      return d >= start && d <= end && !s.is_test;
    });
  }, [shares, period]);

  // KPI calculations
  const totalGtv = useMemo(() => statsFiltered.reduce((sum, s) => sum + getGtv(s), 0), [statsFiltered]);
  const totalAcv = useMemo(() => statsFiltered.reduce((sum, s) => sum + getAcv(s), 0), [statsFiltered]);
  const acceptedShares = useMemo(() => statsFiltered.filter(s => s.client_response === "accepted"), [statsFiltered]);
  const acceptedGtv = useMemo(() => acceptedShares.reduce((sum, s) => sum + getGtv(s), 0), [acceptedShares]);
  const acceptedAcv = useMemo(() => acceptedShares.reduce((sum, s) => sum + getAcv(s), 0), [acceptedShares]);
  const conversionPct = statsFiltered.length > 0 ? Math.round((acceptedShares.length / statsFiltered.length) * 100) : 0;

  const avgTakeRate = useMemo(() => {
    if (statsFiltered.length === 0) return 0;
    const sum = statsFiltered.reduce((acc, s) => acc + getTakeRate(s), 0);
    return sum / statsFiltered.length;
  }, [statsFiltered]);

  const prevAvgTakeRate = useMemo(() => {
    if (prevFiltered.length === 0) return 0;
    const sum = prevFiltered.reduce((acc, s) => acc + getTakeRate(s), 0);
    return sum / prevFiltered.length;
  }, [prevFiltered]);

  const takeRateDelta = avgTakeRate - prevAvgTakeRate;

  // Chart data
  const statusCounts = useMemo(() => {
    const acc = { accepted: 0, pending: 0, rejected: 0, countered: 0 };
    statsFiltered.forEach(s => {
      if (s.client_response === "accepted") acc.accepted++;
      else if (s.client_response === "rejected") acc.rejected++;
      else if (s.client_response === "countered") acc.countered++;
      else acc.pending++;
    });
    return acc;
  }, [statsFiltered]);

  const donutData = useMemo(() => [
    { name: "accepted", value: statusCounts.accepted, color: COLORS.accepted },
    { name: "pending", value: statusCounts.pending, color: COLORS.pending },
    { name: "rejected", value: statusCounts.rejected, color: COLORS.rejected },
    { name: "countered", value: statusCounts.countered, color: COLORS.countered },
  ].filter(d => d.value > 0), [statusCounts]);

  const weeklyData = useMemo(() => {
    const cutoff = getFilterDate(period);
    const now = new Date();
    const weeks: { label: string; count: number }[] = [];
    let weekStart = new Date(cutoff);
    const dayOfWeek = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - ((dayOfWeek + 6) % 7));
    while (weekStart < now) {
      const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
      const count = statsFiltered.filter(s => {
        const d = new Date(s.created_at);
        return d >= weekStart && d < weekEnd;
      }).length;
      weeks.push({ label: getWeekLabel(weekStart), count });
      weekStart = weekEnd;
    }
    return weeks;
  }, [statsFiltered, period]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getExpirationDate = (share: ShareRow) => {
    const scenario = share.scenario_data as any;
    if (scenario?.offerExpirationDate) {
      return formatDate(scenario.offerExpirationDate);
    }
    return "—";
  };

  const getStatusBadge = (response: string | null) => {
    if (response === "accepted") return <Badge className="bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white">{getTranslation(language, 'accepted')}</Badge>;
    if (response === "rejected") return <Badge className="bg-[#E24B4A] hover:bg-[#E24B4A]/90 text-white">{getTranslation(language, 'rejected')}</Badge>;
    if (response === "countered") return <Badge className="bg-[#7F77DD] hover:bg-[#7F77DD]/90 text-white">{getTranslation(language, 'countered')}</Badge>;
    return <Badge className="bg-[#EF9F27] hover:bg-[#EF9F27]/90 text-white">{getTranslation(language, 'pending')}</Badge>;
  };

  const periodChips: { key: PeriodFilter; labelKey: string }[] = [
    { key: "current_month", labelKey: "currentMonth" },
    { key: "90_days", labelKey: "days90" },
    { key: "6_months", labelKey: "months6" },
    { key: "12_months", labelKey: "months12" },
  ];

  const totalDonut = statusCounts.accepted + statusCounts.pending + statusCounts.rejected + statusCounts.countered;
  const acceptedPct = totalDonut > 0 ? Math.round((statusCounts.accepted / totalDonut) * 100) : 0;

  const statusPcts = (key: keyof typeof statusCounts) =>
    totalDonut > 0 ? Math.round((statusCounts[key] / totalDonut) * 100) : 0;

  if (loading) {
    return <div className="min-h-screen bg-muted/30 flex items-center justify-center"><p className="text-muted-foreground">{getTranslation(language, 'loading')}</p></div>;
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> {getTranslation(language, 'backToSimulator')}
          </Button>
          <div className="flex items-center gap-3">
            <LanguageSelector language={language} setLanguage={setLanguage} />
            <button
              onClick={() => setFaqOpen(true)}
              className="inline-flex items-center justify-center rounded-full border border-muted bg-secondary text-muted-foreground hover:bg-muted"
              style={{ width: 22, height: 22, fontSize: 12 }}
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
            <span className="text-sm text-muted-foreground">{userEmail}</span>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1">
              <LogOut className="h-4 w-4" /> {getTranslation(language, 'myProfileLogout')}
            </Button>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground">{getTranslation(language, 'myProfileTitle')}</h1>

        {/* FAQ Dialog */}
        <Dialog open={faqOpen} onOpenChange={setFaqOpen}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{getTranslation(language, 'faqTitle')}</DialogTitle>
            </DialogHeader>
            <Accordion type="single" collapsible className="w-full">
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <AccordionItem key={n} value={`q${n}`}>
                  <AccordionTrigger className="text-sm text-left">{getTranslation(language, `faqQ${n}` as any)}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{getTranslation(language, `faqA${n}` as any)}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </DialogContent>
        </Dialog>

        {/* Period filter */}
        <div className="flex gap-2">
          {periodChips.map(chip => (
            <button
              key={chip.key}
              onClick={() => setPeriod(chip.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                period === chip.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {getTranslation(language, chip.labelKey)}
            </button>
          ))}
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{getTranslation(language, 'proposalsSent')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{statsFiltered.length}</p>
              <p className="text-xs text-muted-foreground">{getTranslation(language, periodChips.find(c => c.key === period)?.labelKey || 'currentMonth')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">GTV</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totalGtv, language)}</p>
              <p className="text-xs text-muted-foreground">{getTranslation(language, 'accepted')}: {formatCurrency(acceptedGtv, language)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ACV</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold" style={{ color: '#534AB7' }}>{formatCurrency(totalAcv, language)}</p>
              <p className="text-xs text-muted-foreground">{getTranslation(language, 'accepted')}: {formatCurrency(acceptedAcv, language)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{getTranslation(language, 'avgTakeRate')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold" style={{ color: '#534AB7' }}>{avgTakeRate.toFixed(1)}%</p>
              {prevFiltered.length > 0 && (
                <div className="flex items-center gap-1 text-xs mt-1">
                  {takeRateDelta >= 0 ? (
                    <><TrendingUp className="h-3 w-3" style={{ color: '#1D9E75' }} /><span style={{ color: '#1D9E75' }}>+{takeRateDelta.toFixed(1)}%</span></>
                  ) : (
                    <><TrendingDown className="h-3 w-3" style={{ color: '#E24B4A' }} /><span style={{ color: '#E24B4A' }}>{takeRateDelta.toFixed(1)}%</span></>
                  )}
                  <span className="text-muted-foreground">{getTranslation(language, 'vsPrevMonth')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Conversion donut */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{getTranslation(language, 'conversionRate')}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Legend */}
              <div className="flex flex-wrap gap-4 mb-4">
                {([
                  { key: "accepted" as const, color: COLORS.accepted },
                  { key: "pending" as const, color: COLORS.pending },
                  { key: "rejected" as const, color: COLORS.rejected },
                  { key: "countered" as const, color: COLORS.countered },
                ]).map(item => (
                  <div key={item.key} className="flex items-center gap-1.5 text-sm">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{getTranslation(language, item.key)}</span>
                    <span className="font-medium">{statusPcts(item.key)}%</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-center">
                <div className="relative" style={{ width: 220, height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        dataKey="value"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {donutData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-bold" style={{ fontSize: 28, color: COLORS.accepted }}>{acceptedPct}%</span>
                    <span className="text-xs text-muted-foreground">{getTranslation(language, 'accepted').toLowerCase()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{getTranslation(language, 'weeklyActivity')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: number) => [value, getTranslation(language, 'proposals')]}
                    />
                    <Bar dataKey="count" fill={COLORS.bar} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Proposals Table */}
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground">{getTranslation(language, 'noProposals')}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{getTranslation(language, 'tableClient')}</TableHead>
                    <TableHead>{getTranslation(language, 'tableGtv')}</TableHead>
                    <TableHead>ACV</TableHead>
                    <TableHead>{getTranslation(language, 'tableTakeRate')}</TableHead>
                    <TableHead>{getTranslation(language, 'tableExpiration')}</TableHead>
                    <TableHead>{getTranslation(language, 'tableStatus')}</TableHead>
                    <TableHead>{getTranslation(language, 'tableActions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(share => (
                    <TableRow key={share.id} className={share.is_test ? "opacity-40" : ""}>
                      <TableCell className="font-medium">{share.name || "—"}</TableCell>
                      <TableCell>{formatCurrency(getGtv(share), language)}</TableCell>
                      <TableCell style={{ color: COLORS.takeRate }} className="font-medium">{formatCurrency(getAcv(share), language)}</TableCell>
                      <TableCell style={{ color: COLORS.takeRate }} className="font-medium">{getTakeRate(share).toFixed(1)}%</TableCell>
                      <TableCell>{getExpirationDate(share)}</TableCell>
                       <TableCell>
                        <div>
                          <div className="flex items-center gap-1.5">
                            {getStatusBadge(share.client_response)}
                            {share.is_test && <Badge variant="secondary" className="bg-gray-200 text-gray-600 hover:bg-gray-200">{getTranslation(language, 'testBadge')}</Badge>}
                          </div>
                          {share.client_response === "rejected" && share.rejection_reason && (
                            <p className="text-xs text-muted-foreground mt-1">"{share.rejection_reason}"</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => window.open(`/view/${share.id}`, "_blank")} className="gap-2 cursor-pointer">
                                <Eye className="h-4 w-4" /> {getTranslation(language, 'tableView')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleTest(share.id, share.is_test)} className="gap-2 cursor-pointer">
                                {share.is_test ? (
                                  <><FlaskConicalOff className="h-4 w-4" /> {getTranslation(language, 'removeTestMark')}</>
                                ) : (
                                  <><FlaskConical className="h-4 w-4" /> {getTranslation(language, 'markAsTest')}</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openExtendExpiry(share)} className="gap-2 cursor-pointer">
                                <CalendarDays className="h-4 w-4" /> Extend expiry
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!extendingExpiryId} onOpenChange={(open) => { if (!open) setExtendingExpiryId(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Extend expiry date</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <input
                type="date"
                value={extendDateStr}
                min={tomorrowStr}
                onChange={(e) => setExtendDateStr(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background text-foreground"
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setExtendingExpiryId(null)}>Cancel</Button>
              <Button onClick={handleExtendExpiry} disabled={!extendDateStr || extendDateStr < tomorrowStr}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MyProposals;
