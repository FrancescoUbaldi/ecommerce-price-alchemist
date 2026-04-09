import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CheckCircle2, XCircle, Eye, ArrowLeft, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

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
  status: string | null;
}

interface AeProfile {
  id: string;
  display_name: string | null;
  email: string;
}

type PeriodFilter = "current_month" | "12_months";

const ADMIN_PASSWORD = "ubirever26";

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

const getStatusBadge = (response: string | null) => {
  if (!response) return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
  if (response === "accepted") return <Badge className="gap-1 bg-green-500 hover:bg-green-600 text-primary-foreground"><CheckCircle2 className="h-3 w-3" />Accepted</Badge>;
  if (response === "countered") return <Badge className="gap-1 bg-purple-500 hover:bg-purple-600 text-primary-foreground">Countered</Badge>;
  return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

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
    if (passwordInput === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  useEffect(() => {
    if (!authenticated) return;
    const fetchData = async () => {
      const [sharesRes, profilesRes] = await Promise.all([
        supabase.from("client_shares").select("*").order("created_at", { ascending: false }),
        supabase.from("ae_profiles").select("*"),
      ]);
      if (sharesRes.data) setShares(sharesRes.data as ShareRow[]);
      if (profilesRes.data) setProfiles(profilesRes.data as AeProfile[]);
      setLoading(false);
    };
    fetchData();
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

  // Global KPIs (all time, non-test)
  const globalStats = useMemo(() => {
    const totalGtv = nonTest.reduce((sum, s) => sum + getGtv(s), 0);
    const acceptedAcv = nonTest.filter(s => s.client_response === "accepted").reduce((sum, s) => sum + getAcv(s), 0);
    const rates = nonTest.map(getTakeRate).filter(r => r > 0);
    const avgTakeRate = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
    return { total: nonTest.length, totalGtv, acceptedAcv, avgTakeRate };
  }, [nonTest]);

  // AE rankings (period-filtered)
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

  // Selected AE proposals
  const selectedAeProposals = useMemo(() => {
    if (!selectedAeId) return [];
    const cutoff = getFilterDate(periodFilter);
    return shares.filter(s => s.created_by === selectedAeId && new Date(s.created_at) >= cutoff);
  }, [selectedAeId, shares, periodFilter]);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-center">Admin Panel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Password"
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            {passwordError && <p className="text-sm text-destructive">Password errata</p>}
            <Button className="w-full" onClick={handleLogin}>Accedi</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <TableCell className="text-right" style={{ color: "#534AB7" }}>{getTakeRate(share).toFixed(2)}%</TableCell>
            <TableCell>{share.scenario_data?.offerExpirationDate || "—"}</TableCell>
            <TableCell className="flex items-center gap-1">
              {isOrphan && <Badge variant="outline" className="text-muted-foreground border-muted-foreground/40">Orphan</Badge>}
              {share.is_test && <Badge variant="outline" className="text-muted-foreground border-muted-foreground/40">Test</Badge>}
              {getStatusBadge(share.client_response)}
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

        {/* Global KPI Row */}
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : (
          <>
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
                <Button
                  key={f}
                  variant={periodFilter === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setPeriodFilter(f); setSelectedAeId(null); }}
                >
                  {f === "current_month" ? "Current month" : "12 months"}
                </Button>
              ))}
            </div>

            {/* AE Rankings or AE Detail */}
            {selectedAeId ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{getAeName(selectedAeId)} — Proposals</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">Admin view — test proposals are visible but excluded from stats</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSelectedAeId(null)} className="gap-2">
                      <ArrowLeft className="h-4 w-4" /> Back to rankings
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedAeProposals.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No proposals in this period</p>
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
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedAeProposals.map(share => (
                          <TableRow key={share.id} className={share.is_test ? "opacity-40" : ""}>
                            <TableCell className="font-medium">{share.name || "—"}</TableCell>
                            <TableCell className="text-right">{formatEur(getGtv(share))}</TableCell>
                            <TableCell className="text-right">{formatEur(getAcv(share))}</TableCell>
                            <TableCell className="text-right" style={{ color: "#534AB7" }}>{getTakeRate(share).toFixed(2)}%</TableCell>
                            <TableCell>{share.scenario_data?.offerExpirationDate || "—"}</TableCell>
                            <TableCell className="flex items-center gap-1">
                              {share.is_test && <Badge variant="outline" className="text-muted-foreground border-muted-foreground/40">Test</Badge>}
                              {getStatusBadge(share.client_response)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Ranking by GTV */}
                <Card>
                  <CardHeader><CardTitle className="text-lg">Ranking by GTV</CardTitle></CardHeader>
                  <CardContent>
                    {rankByGtv.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No data</p>
                    ) : (
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

                {/* Ranking by ACV */}
                <Card>
                  <CardHeader><CardTitle className="text-lg">Ranking by ACV</CardTitle></CardHeader>
                  <CardContent>
                    {rankByAcv.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No data</p>
                    ) : (
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
            )}

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
                    {activeShares.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No active proposals</p>
                    ) : renderAllProposalsTable(activeShares)}
                  </TabsContent>
                  <TabsContent value="archiviate">
                    {archivedShares.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No archived proposals</p>
                    ) : renderAllProposalsTable(archivedShares)}
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
