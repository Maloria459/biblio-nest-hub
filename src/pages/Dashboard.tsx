import { useMemo, useState, useEffect } from "react";
import { useBooks } from "@/contexts/BooksContext";
import { useAvatar } from "@/contexts/AvatarContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { BookDetailModal } from "@/components/BookDetailModal";
import { User, BookOpen, Star, Heart, CheckCircle2 } from "lucide-react";
import type { Book } from "@/data/mockBooks";
import eclatEncreImg from "@/assets/eclat-encre.png";
import { LastSessionCard } from "@/components/dashboard/LastSessionCard";
import { UpcomingReleasesCard } from "@/components/dashboard/UpcomingReleasesCard";
import { LiteraryEventsCard } from "@/components/dashboard/LiteraryEventsCard";
import { BookClubEventsCard } from "@/components/dashboard/BookClubEventsCard";

/* ─── helpers ─── */
function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* ─── Dashboard ─── */
const Dashboard = () => {
  const { books, genres, formats, statuses, updateBook, deleteBook } = useBooks();
  const { avatarUrl } = useAvatar();
  const { user } = useAuth();

  const [pseudo, setPseudo] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Fetch pseudo from profiles
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("pseudo")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.pseudo) setPseudo(data.pseudo);
      });
  }, [user?.id]);


  /* ── derived book data ── */
  const currentlyReading = useMemo(() => {
    const candidates = books.filter(
      (b) => b.status === "Lecture en cours" || b.status === "En cours"
    );
    if (!candidates.length) return null;
    return candidates[candidates.length - 1]; // most recently added/updated
  }, [books]);

  const lastRead = useMemo(() => {
    const finished = books.filter(
      (b) =>
        (b.status === "Lecture terminée" || b.status === "Lu") && b.endDate
    );
    if (!finished.length) return null;
    return finished.sort((a, b) =>
      (b.endDate ?? "").localeCompare(a.endDate ?? "")
    )[0];
  }, [books]);

  const lastCoupDeCoeur = useMemo(() => {
    const coups = books.filter((b) => b.coupDeCoeur);
    if (!coups.length) return null;
    return coups[coups.length - 1];
  }, [books]);

  const monthlyRecommendation = useMemo(() => {
    const cm = currentMonth();
    return (
      books.find(
        (b) => b.recommandationDuMois && b.recommandationMonth === cm
      ) ?? null
    );
  }, [books]);

  const handleDelete = (id: string) => {
    deleteBook(id);
    setSelectedBook(null);
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* ── Profile Banner ── */}
        <div className="flex items-center gap-5 rounded-lg border border-border bg-card p-5">
          {/* Avatar */}
          <Avatar className="h-16 w-16 shrink-0">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={pseudo} />
            ) : null}
            <AvatarFallback className="bg-muted text-muted-foreground">
              <User className="h-7 w-7" />
            </AvatarFallback>
          </Avatar>

          {/* User info */}
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <span className="font-display text-lg font-bold text-foreground truncate">
              {pseudo || "—"}
            </span>
            <span className="text-sm text-muted-foreground">
              Novice des Pages
            </span>
            <div className="flex items-center gap-3 mt-1">
              <Progress value={0} className="h-2 flex-1 max-w-xs" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                0 / 500 points avant le prochain rang
              </span>
            </div>
          </div>

          {/* Virtual currency */}
          <div className="flex items-center gap-2 shrink-0">
            <img src={eclatEncreImg} alt="Éclat d'Encre" className="h-10 w-10 object-contain" />
            <span className="text-sm font-medium text-foreground whitespace-nowrap">
              0 Éclat d'Encre
            </span>
          </div>
        </div>

        {/* ── Four highlight cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <HighlightCard
            icon={<BookOpen className="h-4 w-4" />}
            label="En cours de lecture"
            book={currentlyReading}
            onClick={setSelectedBook}
            renderExtra={(book) => {
              const pct =
                book.pages && book.pagesRead
                  ? Math.round((book.pagesRead / book.pages) * 100)
                  : 0;
              return (
                <div className="mt-1.5 space-y-1">
                  <Progress value={pct} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">
                    {book.pagesRead ?? 0} / {book.pages ?? "?"} pages ({pct}%)
                  </p>
                </div>
              );
            }}
          />
          <HighlightCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Dernier livre lu"
            book={lastRead}
            onClick={setSelectedBook}
            renderExtra={(book) => <RatingDisplay rating={book.rating} />}
          />
          <HighlightCard
            icon={<Heart className="h-4 w-4" />}
            label="Dernier Coup de Cœur"
            book={lastCoupDeCoeur}
            onClick={setSelectedBook}
            badge={<Heart className="h-4 w-4 fill-foreground text-foreground" />}
            renderExtra={(book) => <RatingDisplay rating={book.rating} />}
          />
          <HighlightCard
            icon={<Star className="h-4 w-4" />}
            label="Recommandation du mois"
            book={monthlyRecommendation}
            onClick={setSelectedBook}
            renderExtra={(book) => <RatingDisplay rating={book.rating} />}
          />
        </div>

        {/* ── Last reading session ── */}
        <LastSessionCard />

        {/* ── Three info cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <UpcomingReleasesCard />
          <LiteraryEventsCard />
          <BookClubEventsCard />
        </div>
      </div>

      {/* Book detail modal */}
      <BookDetailModal
        book={selectedBook}
        open={!!selectedBook}
        onOpenChange={(o) => !o && setSelectedBook(null)}
        onSave={updateBook}
        onDelete={handleDelete}
        allBooks={books}
        genres={genres}
        formats={formats}
        statuses={statuses}
      />
    </div>
  );
};

/* ─── Highlight Card ─── */
interface HighlightCardProps {
  icon: React.ReactNode;
  label: string;
  book: Book | null;
  onClick: (b: Book) => void;
  badge?: React.ReactNode;
  renderExtra?: (book: Book) => React.ReactNode;
}

function HighlightCard({ icon, label, book, onClick, badge, renderExtra }: HighlightCardProps) {
  return (
    <Card
      className={`relative flex flex-col rounded-lg border border-border bg-card p-4 min-h-[180px] transition-all ${
        book
          ? "cursor-pointer hover:shadow-md hover:scale-[1.01]"
          : ""
      }`}
      onClick={() => book && onClick(book)}
    >
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
        {icon}
        <span>{label}</span>
      </div>

      {/* Badge (top-right) */}
      {badge && book && (
        <div className="absolute top-4 right-4">{badge}</div>
      )}

      {book ? (
        <div className="flex gap-3 flex-1">
          {/* Cover */}
          <div className="w-16 h-[88px] shrink-0 rounded overflow-hidden bg-secondary flex items-center justify-center">
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col min-w-0 flex-1">
            <p className="font-medium text-sm text-foreground line-clamp-2 leading-tight">
              {book.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {book.author}
            </p>
            {renderExtra?.(book)}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 flex-1">
          <div className="w-16 h-[88px] shrink-0 rounded bg-secondary flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">
            Aucun livre pour le moment
          </p>
        </div>
      )}
    </Card>
  );
}

/* ─── Rating display ─── */
function RatingDisplay({ rating }: { rating?: number }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-1 mt-1.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < rating
              ? "fill-foreground text-foreground"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

export default Dashboard;
