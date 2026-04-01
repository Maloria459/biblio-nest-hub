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
  const [appleLoading, setAppleLoading] = useState(false);
  const { toast } = useToast();

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    setError("");
    const result = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast({ variant: "destructive", title: "Erreur", description: "La connexion avec Apple a échoué." });
    }
    if (result.redirected) {
      return;
    }
    setAppleLoading(false);
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
        disabled={appleLoading}
        onClick={handleAppleSignIn}
        className="w-full gap-2"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
        </svg>
        {appleLoading ? "Connexion…" : "Continuer avec Apple"}
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
