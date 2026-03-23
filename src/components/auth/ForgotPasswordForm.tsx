import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail } from "lucide-react";

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Veuillez saisir votre adresse e-mail.");
      return;
    }

    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Mail className="h-6 w-6 text-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground">E-mail envoyé</h3>
        <p className="text-sm text-muted-foreground">
          Si un compte existe avec l'adresse <strong className="text-foreground">{email}</strong>, vous recevrez un lien de réinitialisation.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
        >
          Retour à la connexion
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour
      </button>

      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">Mot de passe oublié</h3>
        <p className="text-sm text-muted-foreground">
          Saisissez votre adresse e-mail pour recevoir un lien de réinitialisation.
        </p>
      </div>

      <Input
        type="email"
        placeholder="Votre adresse e-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border-border"
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-foreground text-background hover:bg-foreground/90"
      >
        {loading ? "Envoi en cours…" : "Envoyer le lien"}
      </Button>
    </form>
  );
}
