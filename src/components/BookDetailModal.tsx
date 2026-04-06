import { useState, useRef, useEffect, useCallback } from "react";
import { EditBookModal } from "@/components/EditBookModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useInvalidateSessions } from "@/hooks/useReadingSessions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Star, Heart, Flame, Trash2, X, Play, RotateCcw, Pencil, StickyNote, Save } from "lucide-react";
import type { Book, Citation, ChapterNoteEntry, PassageEntry, PersonnageEntry } from "@/data/mockBooks";
import { ReadingSessionTimer } from "@/components/ReadingSessionTimer";
import { useReadingSessions, formatTotalReadingTime } from "@/hooks/useReadingSessions";
import { toast } from "sonner";

/** Textarea that auto-grows to fit its content */
function AutoTextarea({ value, onChange, ...props }: React.ComponentProps<typeof Textarea>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }
  }, [value]);
  return <Textarea ref={ref} value={value} onChange={onChange} {...props} />;
}

type NoteType = "synopsis" | "avis" | "chapter_note" | "citation" | "passage" | "personnage";

interface EditingNote {
  type: "chapter_note" | "citation" | "passage" | "personnage";
  id: string;
  text: string;
  chapter?: number;
  page?: number;
}

function chapterLabel(ch: number | undefined): string | null {
  if (ch === undefined || ch === null) return null;
  if (ch === -1) return "Prologue";
  if (ch === -2) return "Épilogue";
  return `Chapitre ${ch}`;
}

interface NoteFormProps {
  type: NoteType;
  chapters?: number;
  hasPrologue?: boolean;
  hasEpilogue?: boolean;
  initialText?: string;
  initialChapter?: number;
  initialPage?: number;
  onSave: (data: { text: string; chapter?: number; page?: number }) => void;
  onCancel: () => void;
}

function NoteForm({ type, chapters, hasPrologue, hasEpilogue, initialText, initialChapter, initialPage, onSave, onCancel }: NoteFormProps) {
  const [text, setText] = useState(initialText || "");
  const [chapter, setChapter] = useState(initialChapter !== undefined ? (initialChapter === -1 ? "prologue" : initialChapter === -2 ? "epilogue" : String(initialChapter)) : "");
  const [page, setPage] = useState(initialPage !== undefined ? String(initialPage) : "");

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
    <div className="border rounded-lg p-4 bg-card shadow-lg space-y-3 mt-3">
      <h3 className="text-sm font-semibold">{labels[type]}</h3>
      <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="Saisissez votre texte..." className="min-h-[80px]" />
      {hasChapterAndPage && (
        <>
          {((chapters && chapters > 0) || hasPrologue || hasEpilogue) && (
            <Select value={chapter} onValueChange={setChapter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chapitre (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                {hasPrologue && <SelectItem value="prologue">Prologue</SelectItem>}
                {Array.from({ length: chapters || 0 }, (_, i) => i + 1).map(n => (
                  <SelectItem key={n} value={String(n)}>Chapitre {n}</SelectItem>
                ))}
                {hasEpilogue && <SelectItem value="epilogue">Épilogue</SelectItem>}
              </SelectContent>
            </Select>
          )}
          <Input value={page} onChange={e => setPage(e.target.value)} placeholder="Numéro de page (optionnel)" type="number" />
        </>
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={() => {
          if (!text.trim()) return;
          onSave({
            text: text.trim(),
            chapter: chapter ? (chapter === "prologue" ? -1 : chapter === "epilogue" ? -2 : parseInt(chapter)) as number : undefined,
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

interface BookDetailModalProps {
  book: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (book: Book) => void;
  onDelete: (id: string) => void;
  allBooks: Book[];
  genres: string[];
  formats: string[];
  statuses: string[];
}

export function BookDetailModal({ book, open, onOpenChange, onSave, onDelete, allBooks, genres, formats, statuses }: BookDetailModalProps) {
  const { user } = useAuth();
  const invalidateSessions = useInvalidateSessions();
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [recommConfirm, setRecommConfirm] = useState(false);
  const [recommOtherBook, setRecommOtherBook] = useState<Book | null>(null);
  const [timerOpen, setTimerOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeNoteForm, setActiveNoteForm] = useState<NoteType | null>(null);
  const [editingNote, setEditingNote] = useState<EditingNote | null>(null);
  const [notePopoverOpen, setNotePopoverOpen] = useState(false);
  const prevPagesReadRef = useRef<number>(0);

  const { data: allSessions = [] } = useReadingSessions();

  const handleOpenChange = (o: boolean) => {
    if (o && book) {
      const src = allBooks.find(b => b.id === book.id) ?? book;
      setEditBook({ ...src, citations: src.citations ? [...src.citations] : [], chapterNotes: src.chapterNotes ? [...src.chapterNotes] : [] });
      setDirty(false);
      setActiveNoteForm(null);
      prevPagesReadRef.current = src.pagesRead ?? 0;
    } else if (!o) {
      setEditBook(null);
      setDirty(false);
      setActiveNoteForm(null);
    }
    onOpenChange(o);
  };

  if (!open || !book) return null;

  const canonicalBook = allBooks.find(b => b.id === book.id) ?? book;

  if (!editBook || editBook.id !== canonicalBook.id) {
    const initialized = { ...canonicalBook, citations: canonicalBook.citations ? [...canonicalBook.citations] : [], chapterNotes: canonicalBook.chapterNotes ? [...canonicalBook.chapterNotes] : [] };
    setEditBook(initialized);
    setDirty(false);
    return null;
  }

  const eb = editBook;
  const set = (partial: Partial<Book>) => { setEditBook({ ...eb, ...partial }); setDirty(true); };

  const pagesRead = eb.pagesRead || 0;
  const totalPages = eb.pages || 0;
  const progressPct = totalPages > 0 ? Math.round((pagesRead / totalPages) * 100) : 0;
  const currentMonth = new Date().toISOString().slice(0, 7);

  const handleRecommToggle = (checked: boolean) => {
    if (!checked) { set({ recommandationDuMois: false, recommandationMonth: undefined }); return; }
    const existing = allBooks.find(b => b.id !== eb.id && b.recommandationDuMois && b.recommandationMonth === currentMonth);
    if (existing) { setRecommOtherBook(existing); setRecommConfirm(true); }
    else { set({ recommandationDuMois: true, recommandationMonth: currentMonth }); }
  };

  const handleSave = () => { onSave({ ...eb }); setEditBook(null); setDirty(false); onOpenChange(false); };
  const handleDelete = () => { onDelete(eb.id); setDeleteConfirm(false); setEditBook(null); setDirty(false); onOpenChange(false); };

  const handleClose = () => {
    if (dirty) {
      onSave({ ...eb });
      // If pages changed manually, record activity for streak (no fake session)
      const currentPages = eb.pagesRead ?? 0;
      if (currentPages !== prevPagesReadRef.current && user) {
        supabase.from("reading_activity").upsert(
          { user_id: user.id, activity_date: new Date().toISOString().slice(0, 10) },
          { onConflict: "user_id,activity_date" }
        ).then(() => {});
      }
    }
    setEditBook(null);
    setDirty(false);
    setActiveNoteForm(null);
    setEditingNote(null);
    onOpenChange(false);
  };

  const handleSessionSaved = (updates: Partial<Book>) => {
    setEditBook(prev => prev ? { ...prev, ...updates } : prev);
    // Also record activity for streak
    if (user) {
      supabase.from("reading_activity").upsert(
        { user_id: user.id, activity_date: new Date().toISOString().slice(0, 10) },
        { onConflict: "user_id,activity_date" }
      ).then(() => {});
    }
  };

  // Note save handlers
  const handleNoteSave = (type: NoteType, data: { text: string; chapter?: number; page?: number }) => {
    switch (type) {
      case "synopsis":
        set({ synopsis: data.text });
        break;
      case "avis":
        set({ avis: data.text });
        break;
      case "chapter_note":
        set({ chapterNotes: [...(eb.chapterNotes || []), { id: Date.now().toString(), text: data.text, chapter: data.chapter, page: data.page }] });
        break;
      case "citation":
        set({ citations: [...(eb.citations || []), { id: Date.now().toString(), text: data.text, chapter: data.chapter, page: data.page }] });
        break;
      case "passage":
        set({ passagesPreferes: [...(eb.passagesPreferes || []), { id: Date.now().toString(), text: data.text, chapter: data.chapter, page: data.page }] });
        break;
      case "personnage":
        set({ personnagesPreferes: [...(eb.personnagesPreferes || []), { id: Date.now().toString(), text: data.text }] });
        break;
    }
    setActiveNoteForm(null);
    toast.success("Note enregistrée !");
  };

  // Note edit handler
  const handleNoteEdit = (data: { text: string; chapter?: number; page?: number }) => {
    if (!editingNote) return;
    const { type, id } = editingNote;
    switch (type) {
      case "chapter_note":
        set({ chapterNotes: (eb.chapterNotes || []).map(n => n.id === id ? { ...n, text: data.text, chapter: data.chapter, page: data.page } : n) });
        break;
      case "citation":
        set({ citations: (eb.citations || []).map(c => c.id === id ? { ...c, text: data.text, chapter: data.chapter, page: data.page } : c) });
        break;
      case "passage":
        set({ passagesPreferes: (eb.passagesPreferes || []).map(p => p.id === id ? { ...p, text: data.text, chapter: data.chapter, page: data.page } : p) });
        break;
      case "personnage":
        set({ personnagesPreferes: (eb.personnagesPreferes || []).map(p => p.id === id ? { ...p, text: data.text } : p) });
        break;
    }
    setEditingNote(null);
    toast.success("Note modifiée !");
  };

  const deleteChapterNote = (id: string) => set({ chapterNotes: (eb.chapterNotes || []).filter(n => n.id !== id) });
  const deleteCitation = (id: string) => set({ citations: (eb.citations || []).filter(c => c.id !== id) });
  const deletePassage = (id: string) => set({ passagesPreferes: (eb.passagesPreferes || []).filter(p => p.id !== id) });
  const deletePersonnage = (id: string) => set({ personnagesPreferes: (eb.personnagesPreferes || []).filter(p => p.id !== id) });

  const noteOptions: { type: NoteType; label: string }[] = [
    { type: "synopsis", label: "Synopsis / Résumé" },
    { type: "avis", label: "Avis" },
    { type: "chapter_note", label: "Note de chapitre" },
    { type: "citation", label: "Citation" },
    { type: "passage", label: "Passage préféré" },
    { type: "personnage", label: "Personnage préféré" },
  ];

  return (
    <>
      <div className="fixed top-0 right-0 bottom-0 left-[var(--sidebar-width)] z-50 flex items-center justify-center py-[3%]">
        <div className="fixed top-0 right-0 bottom-0 left-[var(--sidebar-width)] bg-black/30" onClick={handleClose} />
        <div className="relative z-10 flex flex-col bg-card border border-border rounded-xl shadow-xl overflow-hidden" style={{ width: "70%", maxHeight: "94%" }}>
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6">
            <div className="flex gap-6">
              {/* LEFT COLUMN — cover + metadata */}
              <div className="flex flex-col gap-4 w-[200px] flex-shrink-0">
                <div className="rounded-lg border-2 border-foreground overflow-hidden bg-muted" style={{ aspectRatio: "2/3" }}>
                  {eb.coverUrl ? (
                    <img src={eb.coverUrl} alt={eb.title} className="w-full h-full object-cover object-center" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">Pas de couverture</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-0.5 w-full">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button key={level} type="button" onClick={() => set({ spicyLevel: eb.spicyLevel === level ? 0 : level })} className="p-0.5">
                      <Flame className={`h-5 w-5 transition-colors ${level <= (eb.spicyLevel || 0) ? "fill-foreground text-foreground" : "text-muted-foreground/30"}`} />
                    </button>
                  ))}
                </div>

                <div className="flex gap-0.5 w-full">
                  {[1, 2, 3, 4, 5].map(star => {
                    const filled = (eb.rating || 0) >= star;
                    const half = !filled && (eb.rating || 0) >= star - 0.5;
                    return (
                      <button key={star} type="button" className="relative p-0.5" onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const isLeft = (e.clientX - rect.left) < rect.width / 2;
                        set({ rating: isLeft ? star - 0.5 : star });
                      }}>
                        <Star className={`h-5 w-5 ${filled ? "fill-foreground text-foreground" : half ? "text-foreground" : "text-muted-foreground/30"}`} />
                        {half && <Star className="h-5 w-5 fill-foreground text-foreground absolute inset-0 m-0.5" style={{ clipPath: "inset(0 50% 0 0)" }} />}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 w-full">
                  <button type="button" onClick={() => set({ coupDeCoeur: !eb.coupDeCoeur })} className="p-0.5">
                    <Heart className={`h-5 w-5 transition-colors ${eb.coupDeCoeur ? "fill-red-500 text-red-500" : "text-muted-foreground/30"}`} />
                  </button>
                  <span className="text-sm">Coup de cœur</span>
                </div>

                <div className="flex items-center gap-2 w-full">
                  <Checkbox checked={eb.recommandationDuMois && eb.recommandationMonth === currentMonth} onCheckedChange={(v) => handleRecommToggle(v === true)} id="recomm" />
                  <Label htmlFor="recomm" className="text-sm">Recommandation du mois</Label>
                </div>

                <div className="space-y-2 w-full">
                  <div className="space-y-1">
                    <Label className="text-xs">Date de début de lecture</Label>
                    <Input value={eb.startDate || ""} onChange={e => set({ startDate: e.target.value })} placeholder="JJ/MM/AAAA" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Date de fin de lecture</Label>
                    <Input value={eb.endDate || ""} onChange={e => set({ endDate: e.target.value })} placeholder="JJ/MM/AAAA" />
                  </div>
                </div>

                {/* Total reading time & days */}
                {(() => {
                  const currentReread = eb.rereadCount ?? 0;
                  const bookSessions = allSessions.filter(s => s.book_id === eb.id && (s.reread_number ?? 0) === currentReread);
                  const showStats = eb.status === "Lecture terminée" && bookSessions.length > 0;
                  const totalMinutes = showStats ? bookSessions.reduce((sum, s) => sum + s.duration_minutes, 0) : 0;
                  const uniqueDays = showStats ? new Set(bookSessions.map(s => new Date(s.session_date).toDateString())).size : 0;
                  if (!showStats && currentReread === 0) return null;
                  return (
                    <div className="space-y-2 w-full">
                      {showStats && (
                        <>
                          <div className="space-y-1">
                            <Label className="text-xs">Temps total de lecture</Label>
                            <p className="text-sm font-medium">{formatTotalReadingTime(totalMinutes)}</p>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Nombre de jours de lecture</Label>
                            <p className="text-sm font-medium">{uniqueDays} jour{uniqueDays > 1 ? "s" : ""}</p>
                          </div>
                        </>
                      )}
                      {currentReread > 0 && (
                        <div className="space-y-1">
                          <Label className="text-xs">Nombre de relectures</Label>
                          <div className="flex items-center gap-2">
                            <Input type="number" min={0} value={eb.rereadCount ?? 0} onChange={e => set({ rereadCount: Math.max(0, parseInt(e.target.value) || 0) })} className="w-16 h-8 text-center text-sm" />
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => set({ rereadCount: 0 })} title="Supprimer les relectures">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* RIGHT COLUMN — book info + notes */}
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex items-baseline">
                  <p className="text-xl font-bold italic" style={{ fontFamily: "var(--font-display)" }}>{eb.title}</p>
                  <span className="text-xl text-muted-foreground font-normal not-italic">,&nbsp;{eb.author}</span>
                  {eb.matureContent && <span className="ml-auto self-center leading-none" style={{ fontSize: "1.25rem", lineHeight: "1.75rem" }} title="Destiné à un public averti">🔞</span>}
                </div>

                {/* Series + ISBN row */}
                {eb.series ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Série</p>
                      <p className="text-sm font-medium">{eb.series}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">ISBN</p>
                      <p className="text-sm font-medium">{eb.isbn || "—"}</p>
                    </div>
                  </div>
                ) : null}

                {!eb.series ? (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Éditeur</p>
                      <p className="text-sm font-medium">{eb.publisher || "—"}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Date de publication</p>
                      <p className="text-sm font-medium">{eb.publicationDate || "—"}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">ISBN</p>
                      <p className="text-sm font-medium">{eb.isbn || "—"}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Éditeur</p>
                      <p className="text-sm font-medium">{eb.publisher || "—"}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Date de publication</p>
                      <p className="text-sm font-medium">{eb.publicationDate || "—"}</p>
                    </div>
                  </div>
                )}



                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Genre</p>
                    <p className="text-sm font-medium">{eb.genre || "—"}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Format</p>
                    <p className="text-sm font-medium">{eb.format || "—"}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Statut</p>
                    <p className="text-sm font-medium">{eb.status || "—"}{eb.secondaryStatus ? ` · ${eb.secondaryStatus}` : ""}</p>
                  </div>
                </div>

                {/* Loan/borrow info */}
                {eb.secondaryStatus === "Prêté" && (
                  <div className="grid grid-cols-2 gap-3 animate-fade-in">
                    <div className="space-y-1">
                      <Label className="text-xs">Date de prêt</Label>
                      <p className="text-sm">{eb.loanDate || "—"}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Prêté à</Label>
                      <p className="text-sm">{eb.borrowerName || "—"}</p>
                    </div>
                  </div>
                )}
                {eb.secondaryStatus === "Emprunté" && (
                  <div className="grid grid-cols-3 gap-3 animate-fade-in">
                    <div className="space-y-1">
                      <Label className="text-xs">Date d'emprunt</Label>
                      <p className="text-sm">{eb.borrowDate || "—"}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Date de restitution</Label>
                      <p className="text-sm">
                        {(() => {
                          if (!eb.returnDate) return "—";
                          let dateObj: Date | null = null;
                          if (/^\d{4}-\d{2}-\d{2}$/.test(eb.returnDate)) dateObj = new Date(eb.returnDate);
                          else if (/^\d{2}\/\d{2}\/\d{4}$/.test(eb.returnDate)) {
                            const [d, m, y] = eb.returnDate.split("/");
                            dateObj = new Date(`${y}-${m}-${d}`);
                          }
                          const today = new Date(); today.setHours(0,0,0,0);
                          if (dateObj) dateObj.setHours(0,0,0,0);
                          const diff = dateObj ? (dateObj.getTime() - today.getTime()) / (1000*60*60*24) : null;
                          const isOverdue = diff !== null && diff < 0;
                          const isSoon = diff !== null && diff >= 0 && diff <= 7;
                          return (
                            <span className={isOverdue ? "text-red-500 font-medium" : isSoon ? "text-amber-600 font-medium" : ""}>
                              {isOverdue && "⚠️ "}{eb.returnDate}
                            </span>
                          );
                        })()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Emprunté à</Label>
                      <p className="text-sm">{eb.lenderName || "—"}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">Progression de lecture</Label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Input className="w-16 text-center" value={pagesRead} onChange={e => {
                        const newPagesRead = parseInt(e.target.value) || 0;
                        const updates: Partial<Book> = { pagesRead: newPagesRead };
                        if (totalPages > 0 && newPagesRead >= totalPages) {
                          updates.pagesRead = totalPages;
                          updates.status = "Lecture terminée";
                          const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
                          if (!eb.endDate) updates.endDate = today;
                        }
                        set(updates);
                      }} />
                      <span className="text-sm text-muted-foreground">/</span>
                      <span className="text-sm w-16 text-center">{totalPages}</span>
                    </div>
                    <Progress value={progressPct} className="flex-1 h-3" />
                    <span className="text-sm font-medium min-w-[3rem] text-right">{progressPct}%</span>
                  </div>
                </div>

                {/* NOTES DISPLAY — only show sections with content */}
                {eb.synopsis && (
                  <div className="space-y-1 mt-3 relative">
                    <Label className="text-xs font-semibold uppercase tracking-wide">Synopsis / Résumé</Label>
                    <AutoTextarea value={eb.synopsis} onChange={e => set({ synopsis: e.target.value })} className="min-h-[80px] resize-none overflow-hidden" />
                    <button className="absolute top-0 right-0 text-muted-foreground hover:text-foreground" onClick={() => set({ synopsis: undefined })} title="Supprimer">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {eb.avis && (
                  <div className="space-y-1 mt-3 relative">
                    <Label className="text-xs font-semibold uppercase tracking-wide">Avis</Label>
                    <AutoTextarea value={eb.avis} onChange={e => set({ avis: e.target.value })} className="min-h-[80px] resize-none overflow-hidden" />
                    <button className="absolute top-0 right-0 text-muted-foreground hover:text-foreground" onClick={() => set({ avis: undefined })} title="Supprimer">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {(eb.chapterNotes || []).length > 0 && (
                  <div className="space-y-2 mt-3">
                    <Label className="text-xs font-semibold uppercase tracking-wide">Notes de chapitre</Label>
                    {(eb.chapterNotes || []).map(note => (
                      <div key={note.id} className="border rounded-lg p-3 bg-muted/50 relative">
                        <p className="text-sm">{note.text}</p>
                        <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                          {chapterLabel(note.chapter) && <span>{chapterLabel(note.chapter)}</span>}
                          {note.page && <span>Page {note.page}</span>}
                        </div>
                        <button className="absolute top-2 right-2 text-muted-foreground hover:text-foreground" onClick={() => deleteChapterNote(note.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {(eb.citations || []).length > 0 && (
                  <div className="space-y-2 mt-3">
                    <Label className="text-xs font-semibold uppercase tracking-wide">Citations</Label>
                    {(eb.citations || []).map(cit => (
                      <div key={cit.id} className="border rounded-lg p-3 bg-muted/50 relative">
                        <p className="text-sm italic">&ldquo;{cit.text}&rdquo;</p>
                        <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                          {chapterLabel(cit.chapter) && <span>{chapterLabel(cit.chapter)}</span>}
                          {cit.page && <span>Page {cit.page}</span>}
                        </div>
                        <button className="absolute top-2 right-2 text-muted-foreground hover:text-foreground" onClick={() => deleteCitation(cit.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {(eb.passagesPreferes || []).length > 0 && (
                  <div className="space-y-2 mt-3">
                    <Label className="text-xs font-semibold uppercase tracking-wide">Passages préférés</Label>
                    {(eb.passagesPreferes || []).map(p => (
                      <div key={p.id} className="border rounded-lg p-3 bg-muted/50 relative">
                        <p className="text-sm">{p.text}</p>
                        <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                          {chapterLabel(p.chapter) && <span>{chapterLabel(p.chapter)}</span>}
                          {p.page && <span>Page {p.page}</span>}
                        </div>
                        <button className="absolute top-2 right-2 text-muted-foreground hover:text-foreground" onClick={() => deletePassage(p.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {(eb.personnagesPreferes || []).length > 0 && (
                  <div className="space-y-2 mt-3">
                    <Label className="text-xs font-semibold uppercase tracking-wide">Personnages préférés</Label>
                    {(eb.personnagesPreferes || []).map(p => (
                      <div key={p.id} className="border rounded-lg p-3 bg-muted/50 relative">
                        <p className="text-sm">{p.text}</p>
                        <button className="absolute top-2 right-2 text-muted-foreground hover:text-foreground" onClick={() => deletePersonnage(p.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Active note form */}
                {activeNoteForm && (
                  <NoteForm
                    type={activeNoteForm}
                    chapters={eb.chapters}
                    hasPrologue={eb.hasPrologue}
                    hasEpilogue={eb.hasEpilogue}
                    onSave={(data) => handleNoteSave(activeNoteForm, data)}
                    onCancel={() => setActiveNoteForm(null)}
                  />
                )}
              </div>
            </div>

            {/* Bottom buttons — centered */}
            <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t">
              {eb.status === "Lecture en cours" && (
                <Button variant="outline" size="icon" onClick={() => setTimerOpen(true)} title="Commencer une session de lecture">
                  <Play className="h-4 w-4" />
                </Button>
              )}
              {eb.status === "Lecture terminée" && (
                <Button variant="outline" size="icon" onClick={() => {
                  const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
                  const newRereadCount = (eb.rereadCount ?? 0) + 1;
                  const updates: Partial<Book> = {
                    status: "Lecture en cours",
                    startDate: today,
                    endDate: undefined,
                    pagesRead: 0,
                    rereadCount: newRereadCount,
                  };
                  const updatedBook = { ...eb, ...updates } as Book;
                  onSave(updatedBook);
                  setEditBook(updatedBook);
                  setDirty(false);
                  toast.success("Relecture commencée !");
                }} title="Relire ce livre">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" size="icon" onClick={() => setEditModalOpen(true)} title="Modifier le livre">
                <Pencil className="h-4 w-4" />
              </Button>
              <Popover open={notePopoverOpen} onOpenChange={setNotePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" title="Créer une note">
                    <StickyNote className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="center">
                  <div className="space-y-1">
                    {noteOptions.map(opt => (
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
              <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(true)} title="Supprimer le livre" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce livre ?</AlertDialogTitle>
            <AlertDialogDescription>Êtes-vous sûr de vouloir supprimer ce livre ? Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Recommandation confirmation */}
      <AlertDialog open={recommConfirm} onOpenChange={setRecommConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recommandation du mois</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{recommOtherBook?.title}&rdquo; est déjà sélectionné en tant que Recommandation du mois. Voulez-vous le remplacer par ce livre ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non</AlertDialogCancel>
            <AlertDialogAction onClick={() => { set({ recommandationDuMois: true, recommandationMonth: currentMonth }); setRecommConfirm(false); }}>Oui</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit book modal */}
      <EditBookModal
        book={eb}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        genres={genres}
        formats={formats}
        statuses={statuses}
        onSave={(updatedBook) => {
          onSave({ ...eb, ...updatedBook });
          setEditBook(null);
          onOpenChange(false);
        }}
      />

      {/* Reading session timer */}
      <ReadingSessionTimer
        book={eb}
        open={timerOpen}
        onClose={() => setTimerOpen(false)}
        onSessionSaved={handleSessionSaved}
      />
    </>
  );
}
