import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useBooks } from "@/contexts/BooksContext";
import { CalendarDays, BookOpen } from "lucide-react";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function UpcomingReleasesCard() {
  const { books } = useBooks();

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return books
      .filter((b) => b.status === "Wishlist" && b.publicationDate && b.publicationDate > today)
      .sort((a, b) => (a.publicationDate ?? "").localeCompare(b.publicationDate ?? ""));
  }, [books]);

  return (
    <Card className="rounded-lg border border-border bg-card p-4 flex flex-col min-h-[200px] max-h-[300px]">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
        <CalendarDays className="h-4 w-4" />
        <span>Prochaine(s) sortie(s) littéraire(s)</span>
      </div>

      {upcoming.length > 0 ? (
        <ScrollArea className="flex-1">
          <div className="space-y-0">
            {upcoming.map((book, i) => (
              <div key={book.id}>
                {i > 0 && <Separator className="my-2" />}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-14 shrink-0 rounded overflow-hidden bg-secondary flex items-center justify-center">
                    {book.coverUrl ? (
                      <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
                    ) : (
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="font-medium text-sm text-foreground line-clamp-2 leading-tight flex-1 min-w-0">
                    {book.title}
                  </p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                    {formatDate(book.publicationDate!)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex items-center justify-center flex-1">
          <p className="text-sm text-muted-foreground">Aucune sortie littéraire à venir</p>
        </div>
      )}
    </Card>
  );
}
