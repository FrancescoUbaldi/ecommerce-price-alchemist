import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  if (langMap[browserLang]) return langMap[browserLang];
  const base = browserLang.split('-')[0];
  if (langMap[base]) return langMap[base];
  return 'en';
};

const Login = () => {
  const [checkingSession, setCheckingSession] = useState(true);
  const [language] = useState(() => {
    const saved = localStorage.getItem('preferredLanguage');
    return saved || detectBrowserLanguage();
  });
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const email = session.user.email || '';
        const displayName = email.split('@')[0];
        await supabase.from('ae_profiles').upsert(
          { id: session.user.id, email, display_name: displayName },
          { onConflict: 'id', ignoreDuplicates: true }
        );
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

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/my-proposals'
      }
    });
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
          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full flex items-center justify-center gap-3 py-5 text-sm font-medium"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            {getTranslation(language, 'signInWithGoogle')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
