import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, XCircle, Eye, ArrowLeft, LogOut } from "lucide-react";

interface ShareRow {
  id: string;
  name: string | null;
  created_at: string;
  language: string;
  client_response: string | null;
  client_response_at: string | null;
  scenario_data: any;
}

const MyProposals = () => {
  const [shares, setShares] = useState<ShareRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login", { replace: true });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login", { replace: true });
        return;
      }
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
        .select("id, name, created_at, language, client_response, client_response_at, scenario_data")
        .eq("created_by", userId)
        .order("created_at", { ascending: false });

      if (!error && data) setShares(data);
      setLoading(false);
    };
    fetchShares();
  }, [userId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const getStatusBadge = (response: string | null) => {
    if (!response) return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />In attesa</Badge>;
    if (response === "accepted") return <Badge className="gap-1 bg-green-500 hover:bg-green-600"><CheckCircle2 className="h-3 w-3" />Accettata</Badge>;
    return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rifiutata</Badge>;
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("it-IT", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

  const getExpirationDate = (share: ShareRow) => {
    const scenario = share.scenario_data as any;
    if (scenario?.offerExpirationDate) {
      return new Date(scenario.offerExpirationDate).toLocaleDateString("it-IT", {
        day: "2-digit", month: "2-digit", year: "numeric",
      });
    }
    return "—";
  };

  const accepted = shares.filter(s => s.client_response === "accepted");
  const rejected = shares.filter(s => s.client_response === "rejected");
  const pending = shares.filter(s => !s.client_response);

  const pct = (n: number) => shares.length ? Math.round((n / shares.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Simulatore
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{userEmail}</span>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1">
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground">Le mie proposte</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Totale</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{shares.length}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Accettate</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-600">{accepted.length} <span className="text-sm font-normal text-muted-foreground">({pct(accepted.length)}%)</span></p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Rifiutate</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-red-500">{rejected.length} <span className="text-sm font-normal text-muted-foreground">({pct(rejected.length)}%)</span></p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">In attesa</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{pending.length}</p></CardContent></Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <p className="p-6 text-center text-muted-foreground">Caricamento...</p>
            ) : shares.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground">Nessuna proposta inviata.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Lingua</TableHead>
                    <TableHead>Data invio</TableHead>
                    <TableHead>Scadenza</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shares.map(share => (
                    <TableRow key={share.id}>
                      <TableCell className="font-medium">{share.name || "—"}</TableCell>
                      <TableCell>{share.language.toUpperCase()}</TableCell>
                      <TableCell>{formatDate(share.created_at)}</TableCell>
                      <TableCell>{getExpirationDate(share)}</TableCell>
                      <TableCell>{getStatusBadge(share.client_response)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => window.open(`/view/${share.id}`, "_blank")} className="gap-1">
                          <Eye className="h-4 w-4" /> Vedi
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
    </div>
  );
};

export default MyProposals;
