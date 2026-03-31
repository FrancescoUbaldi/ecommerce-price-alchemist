import { useEffect, useState } from "react";
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
}

const ADMIN_PASSWORD = "ubirever26";

const Admin = () => {
  const [shares, setShares] = useState<ShareRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
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
    const fetchShares = async () => {
      const { data, error } = await supabase
        .from("client_shares")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setShares(data as ShareRow[]);
      }
      setLoading(false);
    };
    fetchShares();
  }, [authenticated]);

  const getTodayStart = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const isArchived = (share: ShareRow) => {
    const todayStart = getTodayStart();
    const createdAt = new Date(share.created_at);
    // Archived if: created before today AND (pending or no response)
    if (createdAt < todayStart && (!share.client_response || share.client_response === null)) {
      return true;
    }
    return false;
  };

  const activeShares = shares.filter(s => !isArchived(s));
  const archivedShares = shares.filter(s => isArchived(s));

  const getStatusBadge = (response: string | null, createdAt?: string) => {
    if (!response) return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />In attesa</Badge>;
    if (response === "accepted") return <Badge className="gap-1 bg-green-500 hover:bg-green-600"><CheckCircle2 className="h-3 w-3" />Accettata</Badge>;
    return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rifiutata</Badge>;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("it-IT", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  const stats = {
    total: activeShares.length,
    pending: activeShares.filter(s => !s.client_response).length,
    accepted: activeShares.filter(s => s.client_response === "accepted").length,
    rejected: activeShares.filter(s => s.client_response === "rejected").length,
  };

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
            {passwordError && <p className="text-sm text-red-500">Password errata</p>}
            <Button className="w-full" onClick={handleLogin}>Accedi</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderTable = (rows: ShareRow[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Lingua</TableHead>
          <TableHead>Inviata il</TableHead>
          <TableHead>Stato</TableHead>
          <TableHead>Risposta il</TableHead>
          <TableHead className="text-right">Azioni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((share) => (
          <TableRow key={share.id}>
            <TableCell className="font-medium">{share.name || "—"}</TableCell>
            <TableCell className="uppercase">{share.language}</TableCell>
            <TableCell>{formatDate(share.created_at)}</TableCell>
            <TableCell>{getStatusBadge(share.client_response, share.created_at)}</TableCell>
            <TableCell>{share.client_response_at ? formatDate(share.client_response_at) : "—"}</TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(`/view/${share.id}`, "_blank")}
                className="gap-1"
              >
                <Eye className="h-4 w-4" /> Vedi
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="min-h-screen bg-muted/30 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
            <p className="text-muted-foreground text-sm">Panoramica delle proposte inviate ai clienti</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Torna al simulatore
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Totale inviate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-amber-500">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">In attesa</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-green-500">{stats.accepted}</p>
              <p className="text-sm text-muted-foreground">Accettate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-red-500">{stats.rejected}</p>
              <p className="text-sm text-muted-foreground">Rifiutate</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Caricamento...</p>
            ) : (
              <Tabs defaultValue="proposte">
                <TabsList>
                  <TabsTrigger value="proposte">Proposte ({activeShares.length})</TabsTrigger>
                  <TabsTrigger value="archiviate" className="gap-1">
                    <Archive className="h-3.5 w-3.5" /> Archiviate ({archivedShares.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="proposte">
                  {activeShares.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Nessuna proposta attiva</p>
                  ) : renderTable(activeShares)}
                </TabsContent>
                <TabsContent value="archiviate">
                  {archivedShares.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Nessuna proposta archiviata</p>
                  ) : renderTable(archivedShares)}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
