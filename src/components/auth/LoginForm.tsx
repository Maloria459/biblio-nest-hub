import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSwitchToForgot: () => void;
}

export function LoginForm({ onSwitchToRegister, onSwitchToForgot }: LoginFormProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleOAuthSignIn = async (provider: "google" | "apple") => {
    setSocialLoading(provider);
    setError("");
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast({ variant: "destructive", title: "Erreur", description: `La connexion avec ${provider === "google" ? "Google" : "Apple"} a échoué.` });
    }
    if (result.redirected) return;
    setSocialLoading(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);

    let email = identifier.trim();

    // If identifier doesn't look like an email, look up the pseudo
    if (!email.includes("@")) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email")
        .eq("pseudo", email)
        .maybeSingle();

      if (profileError || !profile) {
        setError("Identifiant ou mot de passe incorrect.");
        setLoading(false);
        return;
      }
      email = profile.email;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Identifiant ou mot de passe incorrect.");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <Input
          type="text"
          placeholder="E-mail ou pseudonyme"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="border-border"
        />
      </div>

      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border-border pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-foreground text-background hover:bg-foreground/90"
      >
        {loading ? "Connexion…" : "Continuer ma quête littéraire"}
      </Button>

      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <span className="relative bg-card px-2 text-xs text-muted-foreground">ou</span>
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={!!socialLoading}
        onClick={() => handleOAuthSignIn("google")}
        className="w-full gap-2"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {socialLoading === "google" ? "Connexion…" : "Continuer avec Google"}
      </Button>

      <Button
        type="button"
        variant="outline"
        disabled={!!socialLoading}
        onClick={() => handleOAuthSignIn("apple")}
        className="w-full gap-2"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
        </svg>
        {socialLoading === "apple" ? "Connexion…" : "Continuer avec Apple"}
      </Button>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onSwitchToForgot}
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
        >
          Mot de passe oublié ?
        </button>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
        >
          Nouveau lecteur ? Commencer ma quête littéraire
        </button>
      </div>
    </form>
  );
}
