import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, CheckCircle2, XCircle, Eye, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const Admin = () => {
  const [shares, setShares] = useState<ShareRow[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
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
  }, []);

  const getStatusBadge = (response: string | null) => {
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
    total: shares.length,
    pending: shares.filter(s => !s.client_response).length,
    accepted: shares.filter(s => s.client_response === "accepted").length,
    rejected: shares.filter(s => s.client_response === "rejected").length,
  };

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
          <CardHeader>
            <CardTitle>Proposte</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Caricamento...</p>
            ) : shares.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nessuna proposta trovata</p>
            ) : (
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
                  {shares.map((share) => (
                    <TableRow key={share.id}>
                      <TableCell className="font-medium">{share.name || "—"}</TableCell>
                      <TableCell className="uppercase">{share.language}</TableCell>
                      <TableCell>{formatDate(share.created_at)}</TableCell>
                      <TableCell>{getStatusBadge(share.client_response)}</TableCell>
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
