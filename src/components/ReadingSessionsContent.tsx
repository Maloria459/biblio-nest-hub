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
import { Trash2, BookOpen, ChevronDown, List, Library, Play, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { ReadingSessionTimer } from "@/components/ReadingSessionTimer";
import { SessionsCalendarView } from "@/components/SessionsCalendarView";
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

  const [view, setView] = useState<"list" | "book" | "calendar">("list");
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
        onClick={() => setView("calendar")}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${view === "calendar" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
      >
        <CalendarDays className="h-3.5 w-3.5" />
        <span>Calendrier</span>
      </button>
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

      <div className={`flex-1 px-6 py-4 min-h-0 ${view === "calendar" ? "overflow-hidden" : "overflow-y-auto"}`}>
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
        ) : view === "book" ? (
          <BookGroupView
            groups={bookGroups}
            sessions={sessions}
            onDelete={setDeleteTarget}
            onStartSession={setTimerBook}
          />
        ) : (
          <SessionsCalendarView sessions={sessions} books={books} />
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
const MONTH_NAMES_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function SessionRow({ session, book, allBookSessions, onDelete }: {
  session: ReadingSession;
  book: Book;
  allBookSessions: ReadingSession[];
  onDelete: (s: ReadingSession) => void;
  idx: number;
}) {
  const pagesRead = getSessionPagesRead(session, allBookSessions);
  const totalPages = book.pages ?? 0;
  const sessionDate = new Date(session.session_date);
  const weekday = sessionDate.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "");
  const dayNum = sessionDate.toLocaleDateString("fr-FR", { day: "2-digit" });
  const timeLabel = sessionDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="group flex items-stretch gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:border-foreground/20 hover:shadow-sm">
      {/* Date column */}
      <div className="flex flex-col items-center justify-center w-14 shrink-0 rounded-md bg-muted/60 px-2 py-1">
        <span className="text-[10px] uppercase font-medium text-muted-foreground tracking-wide leading-tight">
          {weekday}
        </span>
        <span className="text-lg font-bold text-foreground leading-none">{dayNum}</span>
        <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">{timeLabel}</span>
      </div>

      {/* Cover */}
      <div className="w-10 shrink-0 rounded overflow-hidden bg-secondary self-center" style={{ aspectRatio: "2/3" }}>
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover object-center" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><BookOpen className="h-3 w-3 text-muted-foreground" /></div>
        )}
      </div>

      {/* Title + Author + reread */}
      <div className="min-w-0 flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-sm font-semibold truncate">{book.title}</p>
          {(session.reread_number ?? 0) > 0 && (
            <span className="text-[10px] font-medium bg-accent text-accent-foreground rounded-full px-2 py-0.5 whitespace-nowrap shrink-0">
              Relecture {session.reread_number}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{book.author}</p>
      </div>

      {/* Metrics */}
      <div className="flex items-center gap-2 shrink-0 self-center">
        <div className="flex flex-col items-end px-2.5 py-1 rounded-md bg-muted/50 min-w-[80px]">
          <span className="text-[9px] uppercase tracking-wide text-muted-foreground font-medium leading-none">Durée</span>
          <span className="text-xs font-semibold text-foreground mt-1">{formatDurationFull(session.duration_minutes)}</span>
        </div>

        {session.last_page_reached != null && totalPages > 0 && (
          <div className="flex flex-col items-end px-2.5 py-1 rounded-md bg-muted/50 min-w-[80px]">
            <span className="text-[9px] uppercase tracking-wide text-muted-foreground font-medium leading-none">Page</span>
            <span className="text-xs font-semibold text-foreground mt-1">
              {session.last_page_reached}<span className="text-muted-foreground font-normal"> / {totalPages}</span>
            </span>
          </div>
        )}

        {pagesRead > 0 && (
          <div className="flex flex-col items-end px-2.5 py-1 rounded-md bg-foreground/5 min-w-[70px]">
            <span className="text-[9px] uppercase tracking-wide text-muted-foreground font-medium leading-none">Lues</span>
            <span className="text-xs font-semibold text-foreground mt-1">+{pagesRead} p.</span>
          </div>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(session)}
        className="text-muted-foreground hover:text-destructive shrink-0 self-center p-1.5 rounded-md hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Supprimer la session"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function SessionListView({ sessions, books, onDelete }: {
  sessions: ReadingSession[];
  books: Book[];
  onDelete: (s: ReadingSession) => void;
}) {
  // Group sessions by year, then by month — most recent first
  const grouped = useMemo(() => {
    const sorted = [...sessions].sort(
      (a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime(),
    );
    const byYear = new Map<number, Map<number, ReadingSession[]>>();
    for (const s of sorted) {
      const d = new Date(s.session_date);
      const y = d.getFullYear();
      const m = d.getMonth();
      if (!byYear.has(y)) byYear.set(y, new Map());
      const byMonth = byYear.get(y)!;
      if (!byMonth.has(m)) byMonth.set(m, []);
      byMonth.get(m)!.push(s);
    }
    const years = [...byYear.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([year, byMonth]) => ({
        year,
        months: [...byMonth.entries()]
          .sort((a, b) => b[0] - a[0])
          .map(([month, items]) => ({ month, sessions: items })),
      }));
    return years;
  }, [sessions]);

  // Default: only the most recent year + most recent month open
  const [openYears, setOpenYears] = useState<Record<number, boolean>>(() => {
    if (grouped.length === 0) return {};
    return { [grouped[0].year]: true };
  });
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>(() => {
    if (grouped.length === 0 || grouped[0].months.length === 0) return {};
    const k = `${grouped[0].year}-${grouped[0].months[0].month}`;
    return { [k]: true };
  });

  const toggleYear = (y: number) => setOpenYears((p) => ({ ...p, [y]: !p[y] }));
  const toggleMonth = (k: string) => setOpenMonths((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div className="space-y-3">
      {grouped.map(({ year, months }) => {
        const yearOpen = openYears[year] ?? false;
        const yearTotal = months.reduce((sum, m) => sum + m.sessions.length, 0);
        return (
          <div key={year} className="rounded-lg border border-border bg-card overflow-hidden">
            <button
              onClick={() => toggleYear(year)}
              className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-semibold hover:bg-muted/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ChevronDown className={`h-4 w-4 transition-transform ${yearOpen ? "" : "-rotate-90"}`} />
                {year}
              </span>
              <span className="text-xs text-muted-foreground font-normal">
                {yearTotal} session{yearTotal > 1 ? "s" : ""}
              </span>
            </button>
            {yearOpen && (
              <div className="border-t border-border divide-y divide-border">
                {months.map(({ month, sessions: monthSessions }) => {
                  const k = `${year}-${month}`;
                  const monthOpen = openMonths[k] ?? false;
                  return (
                    <div key={k}>
                      <button
                        onClick={() => toggleMonth(k)}
                        className="flex items-center justify-between w-full px-4 py-2 text-xs font-medium hover:bg-muted/30 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${monthOpen ? "" : "-rotate-90"}`} />
                          {MONTH_NAMES_FR[month]}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-normal">
                          {monthSessions.length} session{monthSessions.length > 1 ? "s" : ""}
                        </span>
                      </button>
                      {monthOpen && (
                        <div className="px-3 pb-3 pt-1 space-y-2">
                          {monthSessions.map((session, idx) => {
                            const book = books.find((b) => b.id === session.book_id);
                            if (!book) return null;
                            const bookSessions = sessions.filter((s) => s.book_id === session.book_id);
                            return (
                              <SessionRow
                                key={session.id}
                                session={session}
                                book={book}
                                allBookSessions={bookSessions}
                                onDelete={onDelete}
                                idx={idx}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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

            {/* Session accordion — grouped by reread */}
            <div className="border-t border-border">
              {(() => {
                const rereadNumbers = [...new Set(bookSessions.map(s => s.reread_number ?? 0))].sort((a, b) => b - a);
                return rereadNumbers.map(rereadNum => {
                  const rereadSessions = bookSessions.filter(s => (s.reread_number ?? 0) === rereadNum);
                  const sortedAscReread = [...rereadSessions].sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());
                  const label = rereadNum === 0 ? "Première lecture" : `Relecture ${rereadNum}`;
                  return (
                    <Collapsible key={rereadNum}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 text-xs font-medium hover:bg-muted/50 transition-colors">
                        <span>{label} ({rereadSessions.length} session{rereadSessions.length > 1 ? "s" : ""})</span>
                        <ChevronDown className="h-3.5 w-3.5" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 pb-3 space-y-1">
                          {rereadSessions.map(session => {
                            const pagesRead = getSessionPagesRead(session, sortedAscReread);
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
                  );
                });
              })()}
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
