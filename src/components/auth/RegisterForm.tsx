import { useState, useMemo, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

const passwordCriteria = [
  { label: "Au moins 1 minuscule", test: (p: string) => /[a-z]/.test(p) },
  { label: "Au moins 1 majuscule", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Au moins 1 chiffre", test: (p: string) => /\d/.test(p) },
  { label: "Au moins 1 caractère spécial", test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
  { label: "Minimum 8 caractères", test: (p: string) => p.length >= 8 },
];

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const pseudoTimer = useRef<ReturnType<typeof setTimeout>>();
  const emailTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleOAuthSignIn = async (provider: "google" | "apple") => {
    setSocialLoading(provider);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast({ variant: "destructive", title: "Erreur", description: `La connexion avec ${provider === "google" ? "Google" : "Apple"} a échoué.` });
    }
    if (result.redirected) return;
    setSocialLoading(null);
  };

  const allCriteriaMet = useMemo(
    () => passwordCriteria.every((c) => c.test(password)),
    [password]
  );

  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Real-time pseudo uniqueness check (debounced)
  useEffect(() => {
    if (!pseudo.trim()) {
      setFieldErrors((p) => ({ ...p, pseudo: "" }));
      return;
    }
    clearTimeout(pseudoTimer.current);
    pseudoTimer.current = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .ilike("pseudo", pseudo.trim())
        .maybeSingle();
      if (data) {
        setFieldErrors((p) => ({ ...p, pseudo: "Ce pseudonyme est déjà utilisé" }));
      } else {
        setFieldErrors((p) => ({ ...p, pseudo: "" }));
      }
    }, 500);
    return () => clearTimeout(pseudoTimer.current);
  }, [pseudo]);

  // Real-time email uniqueness check (debounced)
  useEffect(() => {
    if (!email.trim() || !email.includes("@")) {
      setFieldErrors((p) => ({ ...p, email: "" }));
      return;
    }
    clearTimeout(emailTimer.current);
    emailTimer.current = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .ilike("email", email.trim())
        .maybeSingle();
      if (data) {
        setFieldErrors((p) => ({ ...p, email: "Cette adresse e-mail est déjà utilisée" }));
      } else {
        setFieldErrors((p) => ({ ...p, email: "" }));
      }
    }, 500);
    return () => clearTimeout(emailTimer.current);
  }, [email]);

  const allFieldsFilled =
    firstName.trim() &&
    lastName.trim() &&
    pseudo.trim() &&
    dateOfBirth &&
    email.trim() &&
    password &&
    confirmPassword;

  const hasFieldErrors = !!(fieldErrors.pseudo || fieldErrors.email);

  const canSubmit = allFieldsFilled && allCriteriaMet && passwordsMatch && !hasFieldErrors;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!canSubmit) return;

    setLoading(true);

    // Check pseudo uniqueness (case-insensitive)
    const { data: existingPseudo } = await supabase
      .from("profiles")
      .select("id")
      .ilike("pseudo", pseudo.trim())
      .maybeSingle();

    if (existingPseudo) {
      setFieldErrors((prev) => ({ ...prev, pseudo: "Ce pseudonyme est déjà utilisé" }));
      setLoading(false);
      return;
    }

    // Check email uniqueness (case-insensitive)
    const { data: existingEmail } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", email.trim())
      .maybeSingle();

    if (existingEmail) {
      setFieldErrors((prev) => ({ ...prev, email: "Cette adresse e-mail est déjà utilisée" }));
      setLoading(false);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          pseudo: pseudo.trim(),
          date_of_birth: dateOfBirth,
        },
      },
    });

    if (signUpError) {
      if (signUpError.message.includes("already registered")) {
        setFieldErrors((prev) => ({ ...prev, email: "Cette adresse e-mail est déjà utilisée." }));
      } else {
        setError(signUpError.message);
      }
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Prénom"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="border-border"
          />
        </div>
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Nom"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="border-border"
          />
        </div>
      </div>

      <div>
        <Input
          type="text"
          placeholder="Pseudonyme"
          value={pseudo}
          onChange={(e) => { setPseudo(e.target.value); setFieldErrors((p) => ({ ...p, pseudo: "" })); }}
          className="border-border"
        />
        {fieldErrors.pseudo && (
          <p className="mt-1 text-sm text-destructive">{fieldErrors.pseudo}</p>
        )}
      </div>

      <div>
        <Input
          type="date"
          placeholder="Date de naissance"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          className="border-border"
        />
      </div>

      <div>
        <Input
          type="email"
          placeholder="Adresse e-mail"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: "" })); }}
          className="border-border"
        />
        {fieldErrors.email && (
          <p className="mt-1 text-sm text-destructive">{fieldErrors.email}</p>
        )}
      </div>

      <div>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Créer un mot de passe"
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
        <ul className="mt-2 space-y-1">
          {passwordCriteria.map((c, i) => {
            const met = c.test(password);
            return (
              <li key={i} className={`flex items-center gap-2 text-xs ${met ? "text-green-600" : "text-muted-foreground"}`}>
                {met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                {c.label}
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <div className="relative">
          <Input
            type={showConfirm ? "text" : "password"}
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border-border pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {confirmPassword && !passwordsMatch && (
          <p className="mt-1 text-sm text-destructive">Les mots de passe ne correspondent pas.</p>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button
        type="submit"
        disabled={!canSubmit || loading}
        className="w-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40"
      >
        {loading ? "Création…" : "Je deviens lecteur"}
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

      <div className="text-center">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
        >
          Déjà lecteur ? Continuer ma quête littéraire
        </button>
      </div>
    </form>
  );
}
