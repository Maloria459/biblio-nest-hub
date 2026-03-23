import { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { BookOpen } from "lucide-react";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <BookOpen className="h-6 w-6 text-foreground" />
          <span className="font-display text-2xl font-bold tracking-tight text-foreground">
            Biblio Nest
          </span>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {mode === "login" ? (
            <LoginForm
              onSwitchToRegister={() => setMode("register")}
              onSwitchToForgot={() => setMode("forgot")}
            />
          ) : mode === "register" ? (
            <RegisterForm onSwitchToLogin={() => setMode("login")} />
          ) : (
            <ForgotPasswordForm onBack={() => setMode("login")} />
          )}
        </div>
      </div>
    </div>
  );
}
