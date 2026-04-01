import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBooks } from "@/contexts/BooksContext";
import { useInvalidateSessions, formatDurationHMS, useReadingSessions } from "@/hooks/useReadingSessions";
import { toast } from "sonner";
import type { Book } from "@/data/mockBooks";
import { Square, CheckCircle } from "lucide-react";

interface ReadingSessionTimerProps {
  book: Book;
  open: boolean;
  onClose: () => void;
  onSessionSaved?: (updates: Partial<Book>) => void;
}

export function ReadingSessionTimer({ book, open, onClose, onSessionSaved }: ReadingSessionTimerProps) {
  const { user } = useAuth();
  const { updateBook } = useBooks();
  const invalidate = useInvalidateSessions();
  const { data: allSessions } = useReadingSessions();

  const [seconds, setSeconds] = useState(0);
  const [phase, setPhase] = useState<"timer" | "record">("timer");
  const [paused, setPaused] = useState(false);
  const [abandonConfirm, setAbandonConfirm] = useState(false);
  const [pageInput, setPageInput] = useState("");
  const [pageError, setPageError] = useState("");
  const [saving, setSaving] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Previous page from sessions
  const bookSessions = allSessions?.filter(s => s.book_id === book.id) ?? [];
  const previousPage = bookSessions.length > 0
    ? Math.max(...bookSessions.map(s => s.last_page_reached ?? 0))
    : (book.pagesRead ?? 0);

  const totalPages = book.pages ?? 0;

  // Start/pause timer
  useEffect(() => {
    if (open && phase === "timer" && !paused) {
      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
      }
    } else {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    }
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [open, phase, paused]);

  // Reset seconds only when opening fresh
  useEffect(() => {
    if (open && phase === "timer") {
      setSeconds(0);
      setPaused(false);
    }
  }, [open]);

  const handlePauseToggle = useCallback(() => {
    setPaused(p => !p);
  }, []);

  const handleStop = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setPaused(false);
    setPhase("record");
  }, []);

  const handleAbandonAttempt = () => setAbandonConfirm(true);
  const handleAbandon = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setAbandonConfirm(false);
    setPhase("timer");
    setSeconds(0);
    setPageInput("");
    setPageError("");
    onClose();
  };
  const handleContinue = () => setAbandonConfirm(false);

  const validatePage = (val: string) => {
    const num = parseInt(val);
    if (isNaN(num) || num < 1) { setPageError(""); return false; }
    if (num < previousPage) {
      setPageError(`Le numéro de page doit être supérieur ou égal à votre dernière page lue (${previousPage})`);
      return false;
    }
    if (totalPages > 0 && num > totalPages) {
      setPageError(`Le numéro de page ne peut pas dépasser le nombre total de pages (${totalPages})`);
      return false;
    }
    setPageError("");
    return true;
  };

  const handlePageChange = (val: string) => {
    setPageInput(val);
    if (val) validatePage(val);
    else setPageError("");
  };

  const pageNum = parseInt(pageInput);
  const isPageValid = !isNaN(pageNum) && pageNum >= 1 && pageNum >= previousPage && (totalPages === 0 || pageNum <= totalPages);

  const handleSave = async () => {
    if (!user || !isPageValid) return;
    setSaving(true);

    const durationMinutes = seconds / 60; // store as fractional minutes for precision
    const today = new Date().toISOString();

    const { error } = await supabase.from("reading_sessions").insert({
      book_id: book.id,
      user_id: user.id,
      session_date: today,
      duration_minutes: Math.round(durationMinutes),
      last_page_reached: pageNum,
      reread_number: book.rereadCount ?? 0,
    });

    if (error) {
      toast.error("Erreur lors de l'enregistrement de la session");
      setSaving(false);
      return;
    }

    // Update book pages read
    const updates: Partial<Book> = { pagesRead: pageNum };
    if (totalPages > 0 && pageNum >= totalPages) {
      updates.status = "Lecture terminée";
      updates.endDate = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
    }
    updateBook({ ...book, ...updates } as Book);

    // Notify parent (e.g. BookDetailModal) so it can patch its local state
    onSessionSaved?.(updates);

    invalidate();
    toast.success("Session enregistrée ✓");
    setSaving(false);
    setPhase("timer");
    setSeconds(0);
    setPageInput("");
    setPageError("");
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div className="absolute inset-0 z-[60] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60" onClick={phase === "timer" ? handleAbandonAttempt : undefined} />
        <div className="relative z-10 w-full max-w-md mx-4 bg-card border border-border rounded-xl shadow-2xl p-6">
          {phase === "timer" ? (
            <div className="flex flex-col items-center gap-6">
              {/* Book context */}
              <div className="flex items-center gap-3 w-full">
                <div className="w-10 h-[60px] rounded overflow-hidden bg-muted shrink-0" style={{ aspectRatio: "2/3" }}>
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover object-center" />
                  ) : (
                    <div className="w-full h-full bg-secondary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{book.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                </div>
              </div>

              {/* Timer */}
              <div className="text-5xl font-bold tracking-wider font-mono text-foreground">
                {formatDurationHMS(seconds)}
              </div>

              {/* Stop button */}
              <Button className="w-full" onClick={handleStop}>
                <Square className="h-4 w-4 mr-2" />
                Terminer ma session de lecture
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-1">
                <CheckCircle className="h-8 w-8 text-foreground" />
                <h3 className="text-lg font-semibold">Session terminée !</h3>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">Temps de lecture</p>
                <p className="text-2xl font-bold font-mono">{formatDurationHMS(seconds)}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Page à laquelle vous vous êtes arrêté(e)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={pageInput}
                    onChange={e => handlePageChange(e.target.value)}
                    placeholder="Numéro de page"
                    min={1}
                    max={totalPages || undefined}
                    className="flex-1"
                  />
                  {totalPages > 0 && (
                    <span className="text-sm text-muted-foreground whitespace-nowrap">/ {totalPages} pages</span>
                  )}
                </div>
                {pageError && <p className="text-xs text-destructive">{pageError}</p>}
              </div>

              <Button
                className="w-full"
                disabled={!isPageValid || saving}
                onClick={handleSave}
              >
                {saving ? "Enregistrement..." : "Enregistrer ma session de lecture"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Abandon confirmation */}
      <AlertDialog open={abandonConfirm} onOpenChange={setAbandonConfirm}>
        <AlertDialogContent className="z-[70]">
          <AlertDialogHeader>
            <AlertDialogTitle>Abandonner cette session de lecture ?</AlertDialogTitle>
            <AlertDialogDescription>Les données de cette session ne seront pas sauvegardées.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleContinue}>Non, continuer</AlertDialogCancel>
            <AlertDialogAction onClick={handleAbandon}>Oui, abandonner</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
