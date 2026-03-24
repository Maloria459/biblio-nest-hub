import { useState } from "react";
import { EditBookModal } from "@/components/EditBookModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Star, Heart, Flame, Plus, Trash2, ChevronDown, X, Play, RotateCcw } from "lucide-react";
import type { Book, Citation } from "@/data/mockBooks";
import { ReadingSessionTimer } from "@/components/ReadingSessionTimer";
import { useReadingSessions, formatTotalReadingTime } from "@/hooks/useReadingSessions";
import { toast } from "sonner";

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
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [recommConfirm, setRecommConfirm] = useState(false);
  const [recommOtherBook, setRecommOtherBook] = useState<Book | null>(null);
  const [citationPopup, setCitationPopup] = useState(false);
  const [newCitationText, setNewCitationText] = useState("");
  const [newCitationPage, setNewCitationPage] = useState("");
  const [chapterNotesEnabled, setChapterNotesEnabled] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const [dirty, setDirty] = useState(false);

  const { data: allSessions = [] } = useReadingSessions();

  const handleOpenChange = (o: boolean) => {
    if (o && book) {
      const src = allBooks.find(b => b.id === book.id) ?? book;
      setEditBook({ ...src, citations: src.citations ? [...src.citations] : [], chapterNotes: src.chapterNotes ? { ...src.chapterNotes } : {} });
      setChapterNotesEnabled(src.chapterNotesEnabled || false);
      setDirty(false);
    } else if (!o) {
      setEditBook(null);
      setDirty(false);
    }
    onOpenChange(o);
  };

  if (!open || !book) return null;

  // Always derive the canonical book from allBooks to avoid stale snapshots
  const canonicalBook = allBooks.find(b => b.id === book.id) ?? book;

  // Initialize editBook on first render or when canonical book changes
  if (!editBook || editBook.id !== canonicalBook.id) {
    const initialized = { ...canonicalBook, citations: canonicalBook.citations ? [...canonicalBook.citations] : [], chapterNotes: canonicalBook.chapterNotes ? { ...canonicalBook.chapterNotes } : {} };
    setEditBook(initialized);
    setChapterNotesEnabled(canonicalBook.chapterNotesEnabled || false);
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

  const handleAddCitation = () => {
    if (!newCitationText.trim()) return;
    const citation: Citation = { id: Date.now().toString(), text: newCitationText.trim(), page: newCitationPage ? parseInt(newCitationPage) : undefined };
    set({ citations: [...(eb.citations || []), citation] });
    setNewCitationText(""); setNewCitationPage(""); setCitationPopup(false);
  };

  const handleDeleteCitation = (id: string) => set({ citations: (eb.citations || []).filter(c => c.id !== id) });

  const handleSave = () => { onSave({ ...eb, chapterNotesEnabled }); setEditBook(null); setDirty(false); onOpenChange(false); };
  const handleDelete = () => { onDelete(eb.id); setDeleteConfirm(false); setEditBook(null); setDirty(false); onOpenChange(false); };
  const setChapterNote = (n: number, text: string) => set({ chapterNotes: { ...(eb.chapterNotes || {}), [n]: text } });
  const allSeries = [...new Set(allBooks.map(b => b.series).filter(Boolean) as string[])].sort();

  // Only auto-save on close when user made manual edits (dirty). Otherwise just close.
  const handleClose = () => {
    if (dirty) {
      onSave({ ...eb, chapterNotesEnabled });
    }
    setEditBook(null);
    setDirty(false);
    onOpenChange(false);
  };

  // Callback from ReadingSessionTimer: patch local editBook with session updates
  const handleSessionSaved = (updates: Partial<Book>) => {
    setEditBook(prev => prev ? { ...prev, ...updates } : prev);
    // Don't set dirty — these updates already went to BooksContext/DB via timer
  };

  return (
    <>
      <div className="fixed top-0 right-0 bottom-0 left-[var(--sidebar-width)] z-50 flex items-center justify-center py-[3%]">
        {/* Backdrop */}
        <div className="fixed top-0 right-0 bottom-0 left-[var(--sidebar-width)] bg-black/30" onClick={handleClose} />
        {/* Modal */}
        <div className="relative z-10 flex flex-col bg-card border border-border rounded-xl shadow-xl overflow-hidden" style={{ width: "70%", maxHeight: "94%" }}>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6">
            {/* TWO-COLUMN LAYOUT for entire modal content */}
            <div className="flex gap-6">
              {/* LEFT COLUMN — cover + metadata */}
              <div className="flex flex-col gap-4 w-[200px] flex-shrink-0">
                {/* Cover image — stretches to match book info height */}
                <div className="rounded-lg border-2 border-foreground overflow-hidden bg-muted" style={{ aspectRatio: "2/3" }}>
                  {eb.coverUrl ? (
                    <img src={eb.coverUrl} alt={eb.title} className="w-full h-full object-cover object-center" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">Pas de couverture</span>
                    </div>
                  )}
                </div>

                {/* Spicy level only (18+ icon moved to title line) */}
                <div className="flex gap-0.5 w-full">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button key={level} type="button" onClick={() => set({ spicyLevel: eb.spicyLevel === level ? 0 : level })} className="p-0.5">
                      <Flame className={`h-5 w-5 transition-colors ${level <= (eb.spicyLevel || 0) ? "fill-foreground text-foreground" : "text-muted-foreground/30"}`} />
                    </button>
                  ))}
                </div>

                {/* Rating */}
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

                {/* Coup de coeur */}
                <div className="flex items-center gap-2 w-full">
                  <button type="button" onClick={() => set({ coupDeCoeur: !eb.coupDeCoeur })} className="p-0.5">
                    <Heart className={`h-5 w-5 transition-colors ${eb.coupDeCoeur ? "fill-red-500 text-red-500" : "text-muted-foreground/30"}`} />
                  </button>
                  <span className="text-sm">Coup de cœur</span>
                </div>

                {/* Recommandation du mois */}
                <div className="flex items-center gap-2 w-full">
                  <Checkbox checked={eb.recommandationDuMois && eb.recommandationMonth === currentMonth} onCheckedChange={(v) => handleRecommToggle(v === true)} id="recomm" />
                  <Label htmlFor="recomm" className="text-sm">Recommandation du mois</Label>
                </div>

                {/* Dates */}
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

                {/* Total reading time & days — only for current read (filtered by reread_number) */}
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
                            <Input
                              type="number"
                              min={0}
                              value={eb.rereadCount ?? 0}
                              onChange={e => {
                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                set({ rereadCount: val });
                              }}
                              className="w-16 h-8 text-center text-sm"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => set({ rereadCount: 0 })}
                              title="Supprimer les relectures"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Chapter notes toggle — only if chapters were entered */}
                {(eb.chapters && eb.chapters > 0) && (
                  <Button variant={chapterNotesEnabled ? "default" : "outline"} className="w-full text-xs" onClick={() => setChapterNotesEnabled(!chapterNotesEnabled)}>
                    {chapterNotesEnabled ? "Désactiver" : "Activer"} les notes de chapitres
                  </Button>
                )}
              </div>

              {/* RIGHT COLUMN — book info + avis + citations + passages */}
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex items-baseline">
                  <p className="text-xl font-bold italic" style={{ fontFamily: "var(--font-display)" }}>{eb.title}</p>
                  <span className="text-xl text-muted-foreground font-normal not-italic">,&nbsp;{eb.author}</span>
                  {eb.matureContent && <span className="ml-auto self-center leading-none" style={{ fontSize: "1.25rem", lineHeight: "1.75rem" }} title="Destiné à un public averti">🔞</span>}
                </div>

                {eb.series && (
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Série</p>
                    <p className="text-sm font-medium">{eb.series}</p>
                  </div>
                )}

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

                {/* Loan/borrow info in reading sheet */}
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


                {/* Synopsis */}
                <div className="space-y-1 mt-3">
                  <Label className="text-xs font-semibold uppercase tracking-wide">Synopsis</Label>
                  <Textarea value={(eb as any).synopsis || ""} onChange={e => set({ synopsis: e.target.value } as any)} placeholder="Résumé du livre..." className="min-h-[80px] resize-y" />
                </div>

                {/* Avis */}
                <div className="space-y-1 mt-3">
                  <Label className="text-xs font-semibold uppercase tracking-wide">Avis</Label>
                  <Textarea value={eb.avis || ""} onChange={e => set({ avis: e.target.value })} placeholder="Votre avis sur ce livre..." className="min-h-[100px] resize-y" />
                </div>

                {/* Chapter notes */}
                {chapterNotesEnabled && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide">Notes de chapitres</Label>
                    {(!eb.chapters || eb.chapters === 0) ? (
                      <p className="text-sm text-muted-foreground italic">Aucun chapitre renseigné. Modifiez le nombre de chapitres pour activer cette fonctionnalité.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: eb.chapters }, (_, i) => i + 1).map(chapterNum => (
                          <Collapsible key={chapterNum}>
                            <CollapsibleTrigger className="flex items-center gap-1.5 w-full text-left px-2 py-1.5 rounded-md border border-border hover:bg-accent text-xs font-medium">
                              <ChevronDown className="h-3 w-3 shrink-0" />
                              <span className="flex-1">Ch. {chapterNum}</span>
                              {((eb.chapterNotes || {})[chapterNum] || "").trim().length > 0 && (
                                <span className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                                  <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                </span>
                              )}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pt-1 col-span-1">
                              <Textarea value={(eb.chapterNotes || {})[chapterNum] || ""} onChange={e => setChapterNote(chapterNum, e.target.value)} placeholder={`Notes ch. ${chapterNum}...`} className="min-h-[60px] resize-y text-xs" />
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Citations */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wide">Citations</Label>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCitationPopup(true)}><Plus className="h-4 w-4" /></Button>
                  </div>
                  {(eb.citations || []).map(cit => (
                    <div key={cit.id} className="border rounded-lg p-3 bg-muted/50 relative">
                      <p className="text-sm italic">&ldquo;{cit.text}&rdquo;</p>
                      {cit.page && <p className="text-xs text-muted-foreground mt-1">Page {cit.page}</p>}
                      <button className="absolute top-2 right-2 text-muted-foreground hover:text-foreground" onClick={() => handleDeleteCitation(cit.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Citation add popup */}
                {citationPopup && (
                  <div className="border rounded-lg p-4 bg-card shadow-lg space-y-3">
                    <h3 className="text-sm font-semibold">Ajouter une citation</h3>
                    <Textarea value={newCitationText} onChange={e => setNewCitationText(e.target.value)} placeholder="Citation..." />
                    <Input value={newCitationPage} onChange={e => setNewCitationPage(e.target.value)} placeholder="Numéro de page" />
                    <div className="flex gap-2">
                      <Button onClick={handleAddCitation}>Ajouter</Button>
                      <Button variant="outline" onClick={() => setCitationPopup(false)}>Annuler</Button>
                    </div>
                  </div>
                )}

                {/* Passages + Personnages */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold uppercase tracking-wide">Passages préférés</Label>
                    <Textarea value={eb.passagesPreferes || ""} onChange={e => set({ passagesPreferes: e.target.value })} placeholder="Vos passages préférés..." className="min-h-[80px] resize-y" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold uppercase tracking-wide">Personnages préférés</Label>
                    <Textarea value={eb.personnagesPreferes || ""} onChange={e => set({ personnagesPreferes: e.target.value })} placeholder="Vos personnages préférés..." className="min-h-[80px] resize-y" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom buttons — left action, edit center, delete right */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="w-10">
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
              </div>
              <Button onClick={() => setEditModalOpen(true)}>Modifier le livre</Button>
              <div className="w-10">
                <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(true)} title="Supprimer le livre" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
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
          onSave({ ...eb, ...updatedBook, chapterNotesEnabled });
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
