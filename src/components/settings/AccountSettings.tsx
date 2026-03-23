import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, LogOut } from "lucide-react";

export function AccountSettings() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const [pseudo, setPseudo] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email ?? "");
    supabase
      .from("profiles")
      .select("pseudo, first_name, last_name, date_of_birth")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setPseudo(data.pseudo ?? "");
          setFirstName(data.first_name ?? "");
          setLastName(data.last_name ?? "");
          setDateOfBirth(data.date_of_birth ?? "");
        }
      });
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        pseudo: pseudo.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        date_of_birth: dateOfBirth || null,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profil mis à jour" });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Erreur", description: "Le mot de passe doit contenir au moins 8 caractères.", variant: "destructive" });
      return;
    }
    setChangingPw(true);
    // Verify old password by re-signing in
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: email,
      password: oldPassword,
    });
    if (signInErr) {
      setChangingPw(false);
      toast({ title: "Erreur", description: "L'ancien mot de passe est incorrect.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPw(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Mot de passe modifié" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Informations personnelles</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Prénom</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Pseudo</Label>
            <Input value={pseudo} onChange={(e) => setPseudo(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Date de naissance</Label>
            <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={email} readOnly className="opacity-60 cursor-not-allowed" />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving} className="w-full sm:w-auto">
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Changer le mot de passe</h3>
          <div className="space-y-1.5">
            <Label>Ancien mot de passe</Label>
            <div className="relative">
              <Input type={showOld ? "text" : "password"} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowOld(!showOld)}>
                {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Nouveau mot de passe</Label>
            <div className="relative">
              <Input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowNew(!showNew)}>
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Confirmer le mot de passe</Label>
            <div className="relative">
              <Input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button onClick={handleChangePassword} disabled={changingPw || !oldPassword || !newPassword} className="w-full sm:w-auto">
            {changingPw ? "Modification..." : "Modifier le mot de passe"}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <Button variant="outline" onClick={signOut} className="gap-2">
        <LogOut className="h-4 w-4" />
        Se déconnecter
      </Button>
    </div>
  );
}
