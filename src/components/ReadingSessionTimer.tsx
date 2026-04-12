import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBooks } from "@/contexts/BooksContext";
import { useInvalidateSessions, formatDurationHMS, useReadingSessions } from "@/hooks/useReadingSessions";
import { toast } from "sonner";
import type { Book, Citation, ChapterNoteEntry, PassageEntry, PersonnageEntry } from "@/data/mockBooks";
import { Square, CheckCircle, Pause, Play, StickyNote, Save, Clock, PenLine } from "lucide-react";

type NoteType = "synopsis" | "avis" | "chapter_note" | "citation" | "passage" | "personnage";

interface ReadingSessionTimerProps {
  book: Book;
  open: boolean;
  onClose: () => void;
  onSessionSaved?: (updates: Partial<Book>) => void;
  /** Called when a note is added during the session so the book detail modal updates live */
  onNoteAdded?: (updates: Partial<Book>) => void;
}

const NOTE_OPTIONS: { type: NoteType; label: string }[] = [
  { type: "synopsis", label: "Synopsis / Résumé" },
  { type: "avis", label: "Avis" },
  { type: "chapter_note", label: "Note de chapitre" },
  { type: "citation", label: "Citation" },
  { type: "passage", label: "Passage préféré" },
  { type: "personnage", label: "Personnage préféré" },
];

function TimerNoteForm({ type, book, onSave, onCancel }: {
  type: NoteType;
  book: Book;
  onSave: (type: NoteType, data: { text: string; chapter?: number; page?: number }) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");
  const [chapter, setChapter] = useState("");
  const [page, setPage] = useState("");

  const hasChapterAndPage = type === "chapter_note" || type === "citation" || type === "passage";
  const labels: Record<NoteType, string> = {
    synopsis: "Synopsis / Résumé",
    avis: "Avis",
    chapter_note: "Note de chapitre",
    citation: "Citation",
    passage: "Passage préféré",
    personnage: "Personnage préféré",
  };

  return (
    <div className="space-y-3 mt-3 border rounded-lg p-3 bg-muted/30">
      <h3 className="text-sm font-semibold">{labels[type]}</h3>
      <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="Saisissez votre texte..." className="min-h-[60px]" />
      {hasChapterAndPage && (
        <>
          {((book.chapters && book.chapters > 0) || book.hasPrologue || book.hasEpilogue) && (
            <Select value={chapter} onValueChange={setChapter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chapitre (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                {book.hasPrologue && <SelectItem value="prologue">Prologue</SelectItem>}
                {Array.from({ length: book.chapters || 0 }, (_, i) => i + 1).map(n => (
                  <SelectItem key={n} value={String(n)}>Chapitre {n}</SelectItem>
                ))}
                {book.hasEpilogue && <SelectItem value="epilogue">Épilogue</SelectItem>}
              </SelectContent>
            </Select>
          )}
          <Input value={page} onChange={e => setPage(e.target.value)} placeholder="Numéro de page (optionnel)" type="number" />
        </>
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={() => {
          if (!text.trim()) return;
          onSave(type, {
            text: text.trim(),
            chapter: chapter ? (chapter === "prologue" ? -1 : chapter === "epilogue" ? -2 : parseInt(chapter)) : undefined,
            page: page ? parseInt(page) : undefined,
          });
        }}>
          <Save className="h-4 w-4 mr-1" />
          Enregistrer
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>Annuler</Button>
      </div>
    </div>
  );
}

export function ReadingSessionTimer({ book, open, onClose, onSessionSaved, onNoteAdded }: ReadingSessionTimerProps) {
  const { user } = useAuth();
  const { updateBook } = useBooks();
  const invalidate = useInvalidateSessions();
  const { data: allSessions } = useReadingSessions();

  const [mode, setMode] = useState<"choose" | "chrono" | "manual">("choose");
  const [seconds, setSeconds] = useState(0);
  const [phase, setPhase] = useState<"timer" | "record">("timer");
  const [paused, setPaused] = useState(false);
  const [abandonConfirm, setAbandonConfirm] = useState(false);
  const [pageInput, setPageInput] = useState("");
  const [pageError, setPageError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notePopoverOpen, setNotePopoverOpen] = useState(false);
  const [activeNoteForm, setActiveNoteForm] = useState<NoteType | null>(null);

  // Manual mode state
  const [manualStartTime, setManualStartTime] = useState("");
  const [manualEndTime, setManualEndTime] = useState("");
  const [manualTimeError, setManualTimeError] = useState("");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Previous page from sessions
  const bookSessions = allSessions?.filter(s => s.book_id === book.id) ?? [];
  const previousPage = bookSessions.length > 0
    ? Math.max(...bookSessions.map(s => s.last_page_reached ?? 0))
    : (book.pagesRead ?? 0);

  const totalPages = book.pages ?? 0;

  // Start/pause timer
  useEffect(() => {
    if (open && mode === "chrono" && phase === "timer" && !paused) {
      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
      }
    } else {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    }
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [open, mode, phase, paused]);

  // Reset when opening fresh
  useEffect(() => {
    if (open) {
      setMode("choose");
      setSeconds(0);
      setPaused(false);
      setPhase("timer");
      setActiveNoteForm(null);
      setPageInput("");
      setPageError("");
      setManualStartTime("");
      setManualEndTime("");
      setManualTimeError("");
    }
  }, [open]);

  const handlePauseToggle = useCallback(() => {
    setPaused(p => !p);
  }, []);

  const handleStop = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setPaused(false);
    setPhase("record");
    setActiveNoteForm(null);
  }, []);

  const handleAbandonAttempt = () => setAbandonConfirm(true);
  const handleAbandon = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setAbandonConfirm(false);
    setPaused(false);
    setPhase("timer");
    setMode("choose");
    setSeconds(0);
    setPageInput("");
    setPageError("");
    setActiveNoteForm(null);
    setManualStartTime("");
    setManualEndTime("");
    setManualTimeError("");
    onClose();
  };
  const handleContinue = () => setAbandonConfirm(false);

  // Handle note save during session
  const handleNoteSave = (type: NoteType, data: { text: string; chapter?: number; page?: number }) => {
    const updates: Partial<Book> = {};
    switch (type) {
      case "synopsis":
        updates.synopsis = data.text;
        break;
      case "avis":
        updates.avis = data.text;
        break;
      case "chapter_note":
        updates.chapterNotes = [...(book.chapterNotes || []), { id: Date.now().toString(), text: data.text, chapter: data.chapter, page: data.page }];
        break;
      case "citation":
        updates.citations = [...(book.citations || []), { id: Date.now().toString(), text: data.text, chapter: data.chapter, page: data.page }];
        break;
      case "passage":
        updates.passagesPreferes = [...(book.passagesPreferes || []), { id: Date.now().toString(), text: data.text, chapter: data.chapter, page: data.page }];
        break;
      case "personnage":
        updates.personnagesPreferes = [...(book.personnagesPreferes || []), { id: Date.now().toString(), text: data.text }];
        break;
    }
    updateBook({ ...book, ...updates } as Book);
    onNoteAdded?.(updates);
    setActiveNoteForm(null);
    toast.success("Note enregistrée !");
  };

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

  // Compute manual duration in minutes
  const computeManualDuration = (): number | null => {
    if (!manualStartTime || !manualEndTime) return null;
    const [sh, sm] = manualStartTime.split(":").map(Number);
    const [eh, em] = manualEndTime.split(":").map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    if (endMin <= startMin) return null;
    return endMin - startMin;
  };

  const manualDuration = computeManualDuration();
  const isManualTimeValid = manualDuration !== null && manualDuration > 0;

  const validateManualTime = () => {
    if (!manualStartTime || !manualEndTime) {
      setManualTimeError("Veuillez saisir l'heure de début et de fin");
      return false;
    }
    if (computeManualDuration() === null || computeManualDuration()! <= 0) {
      setManualTimeError("L'heure de fin doit être postérieure à l'heure de début");
      return false;
    }
    setManualTimeError("");
    return true;
  };

  const handleSave = async () => {
    if (!user || !isPageValid) return;
    setSaving(true);

    const durationMinutes = mode === "manual" ? (manualDuration ?? 0) : seconds / 60;
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

    const updates: Partial<Book> = { pagesRead: pageNum };
    if (totalPages > 0 && pageNum >= totalPages) {
      updates.status = "Lecture terminée";
      updates.endDate = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
    }
    updateBook({ ...book, ...updates } as Book);
    onSessionSaved?.(updates);

    invalidate();
    toast.success("Session enregistrée ✓");
    setSaving(false);
    setPhase("timer");
    setMode("choose");
    setSeconds(0);
    setPageInput("");
    setPageError("");
    setManualStartTime("");
    setManualEndTime("");
    setManualTimeError("");
    setActiveNoteForm(null);
    onClose();
  };

  if (!open) return null;

  // Book header shared across views
  const bookHeader = (
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
  );

  // Page input shared between chrono record & manual
  const pageInputBlock = (
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
  );

  return (
    <>
      <div className="fixed top-0 right-0 bottom-0 left-[var(--sidebar-width)] z-[60] flex items-center justify-center py-[3%]">
        <div className="fixed top-0 right-0 bottom-0 left-[var(--sidebar-width)] bg-black/60" onClick={mode === "choose" ? handleAbandon : handleAbandonAttempt} />
        <div className="relative z-10 w-full max-w-md mx-4 bg-card border border-border rounded-xl shadow-2xl p-6 max-h-[94%] overflow-y-auto">

          {/* Mode selection */}
          {mode === "choose" && (
            <div className="flex flex-col items-center gap-6">
              {bookHeader}
              <h3 className="text-lg font-semibold">Comment enregistrer votre session ?</h3>
              <div className="flex gap-4 w-full">
                <button
                  className="flex-1 flex flex-col items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                  onClick={() => setMode("chrono")}
                >
                  <Clock className="h-8 w-8 text-primary" />
                  <span className="text-sm font-medium">Chronomètre</span>
                  <span className="text-xs text-muted-foreground text-center">Lancer un chrono en temps réel</span>
                </button>
                <button
                  className="flex-1 flex flex-col items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                  onClick={() => setMode("manual")}
                >
                  <PenLine className="h-8 w-8 text-primary" />
                  <span className="text-sm font-medium">Saisie manuelle</span>
                  <span className="text-xs text-muted-foreground text-center">Entrer les heures de début et fin</span>
                </button>
              </div>
            </div>
          )}

          {/* Chrono mode - timer phase */}
          {mode === "chrono" && phase === "timer" && (
            <div className="flex flex-col items-center gap-6">
              {bookHeader}
              <div className="text-5xl font-bold tracking-wider font-mono text-foreground">
                {formatDurationHMS(seconds)}
              </div>
              <div className="flex gap-3 w-full justify-center">
                <Button variant="outline" size="icon" onClick={handlePauseToggle} title={paused ? "Reprendre" : "Pause"}>
                  {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
                <Popover open={notePopoverOpen} onOpenChange={setNotePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" title="Créer une note">
                      <StickyNote className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2 z-[70]" align="center">
                    <div className="space-y-1">
                      {NOTE_OPTIONS.map(opt => (
                        <button
                          key={opt.type}
                          className="w-full text-left text-sm px-3 py-2 rounded-md hover:bg-accent transition-colors"
                          onClick={() => { setActiveNoteForm(opt.type); setNotePopoverOpen(false); }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <Button variant="outline" size="icon" onClick={handleStop} title="Terminer la session">
                  <Save className="h-4 w-4" />
                </Button>
              </div>
              {activeNoteForm && (
                <div className="w-full">
                  <TimerNoteForm
                    type={activeNoteForm}
                    book={book}
                    onSave={handleNoteSave}
                    onCancel={() => setActiveNoteForm(null)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Chrono mode - record phase */}
          {mode === "chrono" && phase === "record" && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-1">
                <CheckCircle className="h-8 w-8 text-foreground" />
                <h3 className="text-lg font-semibold">Session terminée !</h3>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Temps de lecture</p>
                <p className="text-2xl font-bold font-mono">{formatDurationHMS(seconds)}</p>
              </div>
              {pageInputBlock}
              <Button
                className="w-full"
                disabled={!isPageValid || saving}
                onClick={handleSave}
              >
                {saving ? "Enregistrement..." : "Enregistrer ma session de lecture"}
              </Button>
            </div>
          )}

          {/* Manual mode */}
          {mode === "manual" && (
            <div className="flex flex-col gap-5">
              {bookHeader}
              <h3 className="text-lg font-semibold text-center">Saisie manuelle</h3>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm">Heure de début</Label>
                  <Input
                    type="time"
                    value={manualStartTime}
                    onChange={e => { setManualStartTime(e.target.value); setManualTimeError(""); }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Heure de fin</Label>
                  <Input
                    type="time"
                    value={manualEndTime}
                    onChange={e => { setManualEndTime(e.target.value); setManualTimeError(""); }}
                  />
                </div>
                {manualTimeError && <p className="text-xs text-destructive">{manualTimeError}</p>}
                {isManualTimeValid && (
                  <p className="text-sm text-muted-foreground text-center">
                    Durée : <span className="font-medium text-foreground">{formatDurationHMS(manualDuration! * 60)}</span>
                  </p>
                )}
              </div>

              {pageInputBlock}

              <Button
                className="w-full"
                disabled={!isPageValid || !isManualTimeValid || saving}
                onClick={() => {
                  if (!validateManualTime()) return;
                  handleSave();
                }}
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
