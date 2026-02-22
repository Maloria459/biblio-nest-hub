import { useState, useMemo, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  const pseudoTimer = useRef<ReturnType<typeof setTimeout>>();
  const emailTimer = useRef<ReturnType<typeof setTimeout>>();

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

      <div className="text-center">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
        >
          Déjà lecteur ? Continuer mon aventure littéraire
        </button>
      </div>
    </form>
  );
}
