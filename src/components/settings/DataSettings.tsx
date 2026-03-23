import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBooks } from "@/contexts/BooksContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Upload, Trash2, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DataSettings() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const [books, sessions, collections, objectives] = await Promise.all([
        supabase.from("books").select("*").eq("user_id", user.id),
        supabase.from("reading_sessions").select("*").eq("user_id", user.id),
        supabase.from("collections").select("*").eq("user_id", user.id),
        supabase.from("personal_objectives").select("*").eq("user_id", user.id),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        books: books.data ?? [],
        reading_sessions: sessions.data ?? [],
        collections: collections.data ?? [],
        personal_objectives: objectives.data ?? [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mes-donnees-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export réussi", description: "Vos données ont été téléchargées." });
    } catch {
      toast({ title: "Erreur", description: "Impossible d'exporter les données.", variant: "destructive" });
    }
    setExporting(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      await signOut();
      toast({ title: "Compte supprimé" });
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer le compte.", variant: "destructive" });
    }
    setDeleting(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Exporter mes données</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Téléchargez une copie de toutes vos données (livres, sessions, collections, objectifs) au format JSON.
          </p>
          <Button variant="outline" onClick={handleExport} disabled={exporting} className="gap-2">
            <Download className="h-4 w-4" />
            {exporting ? "Export en cours..." : "Exporter mes données"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-destructive uppercase tracking-wider mb-4">Zone de danger</h3>
          <p className="text-sm text-muted-foreground mb-4">
            La suppression de votre compte est irréversible. Toutes vos données seront définitivement effacées.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Supprimer mon compte
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer définitivement votre compte ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Toutes vos données seront supprimées. Tapez <strong>SUPPRIMER</strong> pour confirmer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-2">
                <Label>Confirmation</Label>
                <Input
                  placeholder="SUPPRIMER"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  disabled={deleteConfirmText !== "SUPPRIMER" || deleting}
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? "Suppression..." : "Confirmer la suppression"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
