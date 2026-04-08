import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getTranslation } from "@/utils/translations";

const detectBrowserLanguage = (): string => {
  const browserLang = navigator.language || (navigator as any).userLanguage || 'en';
  const langMap: Record<string, string> = {
    'it': 'it',
    'es': 'es',
    'fr': 'fr',
    'de': 'de',
    'nl': 'nl',
    'pl': 'pl',
    'en-GB': 'en-GB',
    'en-US': 'usa',
    'en': 'en',
  };
  // Try exact match first
  if (langMap[browserLang]) return langMap[browserLang];
  // Try base language
  const base = browserLang.split('-')[0];
  if (langMap[base]) return langMap[base];
  return 'en';
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [language] = useState(() => {
    return localStorage.getItem('preferredLanguage') || detectBrowserLanguage();
  });
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/my-proposals", { replace: true });
      }
      setCheckingSession(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/my-proposals", { replace: true });
      }
      setCheckingSession(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(getTranslation(language, 'loginError'));
      setLoading(false);
    } else {
      navigate("/my-proposals", { replace: true });
    }
  };

  if (checkingSession) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-sm border border-border shadow-sm">
        <CardHeader className="text-center pb-2">
          <img
            src="/lovable-uploads/db79a890-e60b-4445-9fcf-6decc8de498c.png"
            alt="REVER"
            className="h-8 mx-auto mb-2"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <h1 className="text-lg font-semibold text-foreground">{getTranslation(language, 'loginTitle')}</h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{getTranslation(language, 'loginEmail')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{getTranslation(language, 'loginPassword')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              style={{ backgroundColor: "#1790FF" }}
            >
              {loading ? getTranslation(language, 'loginLoading') : getTranslation(language, 'loginButton')}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-4">
            {getTranslation(language, 'loginNoAccount')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
