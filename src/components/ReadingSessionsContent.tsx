import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useReadingSessions, formatDurationFull, formatTotalReadingTime, type ReadingSession } from "@/hooks/useReadingSessions";
import { useBooks } from "@/contexts/BooksContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Trash2, BookOpen, ChevronDown, List, Library, Play } from "lucide-react";
import { toast } from "sonner";
import { ReadingSessionTimer } from "@/components/ReadingSessionTimer";
import type { Book } from "@/data/mockBooks";

function formatDateFR(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getSessionPagesRead(session: ReadingSession, allBookSessions: ReadingSession[]) {
  // Only compare within same reread_number
  const sameReread = allBookSessions.filter(s => (s.reread_number ?? 0) === (session.reread_number ?? 0));
  const sorted = [...sameReread].sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());
  const idx = sorted.findIndex(s => s.id === session.id);
  const prevPage = idx > 0 ? (sorted[idx - 1].last_page_reached ?? 0) : 0;
  return (session.last_page_reached ?? 0) - prevPage;
}

export function ReadingSessionsContent() {
  const { data: sessions = [], isLoading } = useReadingSessions();
  const { books, updateBook } = useBooks();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [view, setView] = useState<"list" | "book">("list");
  const [deleteTarget, setDeleteTarget] = useState<ReadingSession | null>(null);
  const [timerBook, setTimerBook] = useState<Book | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["reading-sessions", user?.id] });
    qc.invalidateQueries({ queryKey: ["last-reading-session", user?.id] });
  };

  const handleDeleteSession = async () => {
    if (!deleteTarget || !user) return;
    const session = deleteTarget;
    const bookId = session.book_id;
    setDeleteTarget(null);

    const { error } = await supabase.from("reading_sessions").delete().eq("id", session.id);
    if (error) { toast.error("Erreur lors de la suppression"); return; }

    // Recalculate book pages
    const remainingSessions = sessions.filter(s => s.id !== session.id && s.book_id === bookId);
    const bookSessionsSorted = remainingSessions
      .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());
    const book = books.find(b => b.id === bookId);
    if (book) {
      const newPagesRead = bookSessionsSorted.length > 0 ? (bookSessionsSorted[0].last_page_reached ?? 0) : 0;
      const updates: Partial<Book> = { pagesRead: newPagesRead };
      // If 100% was triggered by this session, revert
      if (book.status === "Lecture terminée" && session.last_page_reached && book.pages && session.last_page_reached >= book.pages) {
        updates.status = "Lecture en cours";
        updates.endDate = undefined;
      }
      updateBook({ ...book, ...updates } as Book);
    }

    invalidate();
    toast.success("Session supprimée");
  };

  // Group sessions by book
  const bookGroups = useMemo(() => {
    const map = new Map<string, { book: Book; sessions: ReadingSession[] }>();
    for (const s of sessions) {
      const book = books.find(b => b.id === s.book_id);
      if (!book) continue;
      if (!map.has(s.book_id)) map.set(s.book_id, { book, sessions: [] });
      map.get(s.book_id)!.sessions.push(s);
    }
    // Sort by most recent session
    return [...map.values()].sort((a, b) => {
      const aDate = new Date(a.sessions[0].session_date).getTime();
      const bDate = new Date(b.sessions[0].session_date).getTime();
      return bDate - aDate;
    });
  }, [sessions, books]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex justify-center py-3">
          <Skeleton className="h-9 w-56 rounded-lg" />
        </div>
        <div className="px-6 py-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const viewToggle = (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted p-1 mr-4">
      <button
        onClick={() => setView("list")}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${view === "list" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
      >
        <List className="h-3.5 w-3.5" />
        <span>Par session</span>
      </button>
      <button
        onClick={() => setView("book")}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${view === "book" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
      >
        <Library className="h-3.5 w-3.5" />
        <span>Par livre</span>
      </button>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex justify-center py-3">
        {viewToggle}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <BookOpen className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">Aucune session de lecture enregistrée</p>
            <p className="text-xs text-muted-foreground">Commencez une session depuis la fiche de lecture d'un livre en cours</p>
          </div>
        ) : view === "list" ? (
          <SessionListView
            sessions={sessions}
            books={books}
            onDelete={setDeleteTarget}
          />
        ) : (
          <BookGroupView
            groups={bookGroups}
            sessions={sessions}
            onDelete={setDeleteTarget}
            onStartSession={setTimerBook}
          />
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette session de lecture ?</AlertDialogTitle>
            <AlertDialogDescription>La progression du livre sera recalculée en conséquence.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSession}>Oui</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Timer modal */}
      {timerBook && (
        <ReadingSessionTimer
          book={timerBook}
          open={!!timerBook}
          onClose={() => setTimerBook(null)}
        />
      )}
    </div>
  );
}

/* ─── List View ─── */
function SessionListView({ sessions, books, onDelete }: {
  sessions: ReadingSession[];
  books: Book[];
  onDelete: (s: ReadingSession) => void;
}) {
  return (
    <div className="space-y-2">
      {sessions.map((session, idx) => {
        const book = books.find(b => b.id === session.book_id);
        if (!book) return null;
        const bookSessions = sessions.filter(s => s.book_id === session.book_id);
        const pagesRead = getSessionPagesRead(session, bookSessions);
        const totalPages = book.pages ?? 0;

        return (
          <div
            key={session.id}
            className={`flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50 ${idx % 2 === 1 ? "bg-muted/20" : "bg-card"}`}
          >
            {/* Cover */}
            <div className="w-9 shrink-0 rounded overflow-hidden bg-secondary" style={{ aspectRatio: "2/3" }}>
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover object-center" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><BookOpen className="h-3 w-3 text-muted-foreground" /></div>
              )}
            </div>

            {/* Title + Author */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{book.title}</p>
              <p className="text-xs text-muted-foreground truncate">{book.author}</p>
            </div>

            {/* Duration */}
            <span className="text-xs font-medium whitespace-nowrap shrink-0">
              {formatDurationFull(session.duration_minutes)}
            </span>

            {/* Page */}
            {session.last_page_reached != null && totalPages > 0 && (
              <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                Page {session.last_page_reached} / {totalPages}
              </span>
            )}

            {/* Pages read badge */}
            {pagesRead > 0 && (
              <span className="text-xs font-medium bg-muted rounded-full px-2 py-0.5 whitespace-nowrap shrink-0">
                +{pagesRead} pages
              </span>
            )}

            {/* Date */}
            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
              {formatDateFR(session.session_date)}
            </span>

            {/* Delete */}
            <button onClick={() => onDelete(session)} className="text-muted-foreground hover:text-foreground shrink-0 p-1">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Book Group View ─── */
function BookGroupView({ groups, sessions, onDelete, onStartSession }: {
  groups: { book: Book; sessions: ReadingSession[] }[];
  sessions: ReadingSession[];
  onDelete: (s: ReadingSession) => void;
  onStartSession: (b: Book) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {groups.map(({ book, sessions: bookSessions }) => {
        const totalPages = book.pages ?? 0;
        const latestPage = Math.max(...bookSessions.map(s => s.last_page_reached ?? 0));
        // Use book.pagesRead as canonical progress; fall back to latest session page
        const canonicalProgress = book.pagesRead != null && book.pagesRead > 0 ? book.pagesRead : latestPage;
        const progressPct = totalPages > 0 ? Math.round((canonicalProgress / totalPages) * 100) : 0;
        const totalMinutes = bookSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
        const uniqueDays = new Set(bookSessions.map(s => new Date(s.session_date).toDateString())).size;
        const avgMinutes = totalMinutes / bookSessions.length;
        const sortedAsc = [...bookSessions].sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());
        const totalPagesRead = latestPage;
        const avgPages = Math.round(totalPagesRead / bookSessions.length);

        return (
          <Card key={book.id} className="border border-border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-start gap-3 p-4 border-b border-border">
              <div className="w-12 shrink-0 rounded overflow-hidden bg-secondary" style={{ aspectRatio: "2/3" }}>
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover object-center" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><BookOpen className="h-4 w-4 text-muted-foreground" /></div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{book.title}</p>
                <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                <span className="inline-block mt-1 text-[10px] font-medium bg-muted rounded-full px-2 py-0.5">
                  {book.status}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="p-4 space-y-2 text-xs">
              {totalPages > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">📖 Progression</span>
                    <span className="font-medium">Page {canonicalProgress} / {totalPages} · {progressPct}%</span>
                  </div>
                  <Progress value={progressPct} className="h-2" />
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">⏱ Temps total</span>
                <span className="font-medium">{formatTotalReadingTime(totalMinutes)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">📅 Sessions</span>
                <span className="font-medium">{bookSessions.length} session{bookSessions.length > 1 ? "s" : ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">📅 Jours de lecture</span>
                <span className="font-medium">{uniqueDays} jour{uniqueDays > 1 ? "s" : ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">📈 Moy. / session</span>
                <span className="font-medium">{formatTotalReadingTime(avgMinutes)}</span>
              </div>
              {totalPages > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">📄 Moy. pages / session</span>
                  <span className="font-medium">~{avgPages} pages</span>
                </div>
              )}
            </div>

            {/* Session accordion */}
            <div className="border-t border-border">
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 text-xs font-medium hover:bg-muted/50 transition-colors">
                  <span>Voir les sessions</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-3 space-y-1">
                    {bookSessions.map(session => {
                      const pagesRead = getSessionPagesRead(session, sortedAsc);
                      return (
                        <div key={session.id} className="flex items-center gap-2 text-xs py-1 border-b border-border last:border-0">
                          <span className="text-muted-foreground">{formatDateFR(session.session_date)}</span>
                          <span className="font-medium">{formatDurationFull(session.duration_minutes)}</span>
                          {session.last_page_reached != null && <span className="text-muted-foreground">p.{session.last_page_reached}</span>}
                          {pagesRead > 0 && <span className="bg-muted rounded-full px-1.5 py-0.5 text-[10px]">+{pagesRead}</span>}
                          <button onClick={() => onDelete(session)} className="ml-auto text-muted-foreground hover:text-foreground p-0.5">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Start session button */}
            {book.status === "Lecture en cours" && (
              <div className="border-t border-border p-3">
                <Button size="sm" className="w-full text-xs" onClick={() => onStartSession(book)}>
                  <Play className="h-3 w-3 mr-1" />
                  Commencer une session
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
