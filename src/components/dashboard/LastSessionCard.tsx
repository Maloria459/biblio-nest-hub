import { Card } from "@/components/ui/card";
import { useBooks } from "@/contexts/BooksContext";
import { useReadingSessions, formatDurationShort } from "@/hooks/useReadingSessions";
import { Clock, BookOpen, Bookmark } from "lucide-react";

export function LastSessionCard() {
  const { books } = useBooks();
  const { data: sessions = [] } = useReadingSessions();

  const session = sessions.length > 0 ? sessions[0] : null;
  const book = session ? books.find((b) => b.id === session.book_id) : null;

  return (
    <Card className="rounded-lg border border-border bg-card p-4 flex flex-col min-h-[180px]">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
        <Clock className="h-4 w-4" />
        <span>Dernière session de lecture</span>
      </div>

      {session && book ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-[88px] shrink-0 rounded overflow-hidden bg-secondary flex items-center justify-center">
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
            ) : (
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <p className="font-medium text-sm text-foreground line-clamp-2 leading-tight min-w-0 flex-1">
            {book.title}
          </p>
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Durée
            </span>
            <span className="text-sm font-medium text-foreground">
              {formatDurationShort(Math.round(session.duration_minutes))}
            </span>
          </div>
          {session.last_page_reached != null && (
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Bookmark className="h-3 w-3" /> Arrêt
              </span>
              <span className="text-sm font-medium text-foreground">
                Page {session.last_page_reached}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 min-h-[88px]">
          <div className="w-16 h-[88px] shrink-0 rounded bg-secondary flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">
            Aucune session de lecture enregistrée
          </p>
        </div>
      )}
    </Card>
  );
}
