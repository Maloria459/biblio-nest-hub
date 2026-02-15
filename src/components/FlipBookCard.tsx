import { Heart, Star } from "lucide-react";
import type { Book } from "@/data/mockBooks";
import type { ReactNode } from "react";

interface FlipBookCardProps {
  book: Book;
  onMarkPAL?: (id: string) => void;
  onClick?: () => void;
  renderBack?: (book: Book) => ReactNode;
}

export function FlipBookCard({ book, onMarkPAL, onClick, renderBack }: FlipBookCardProps) {
  const handlePAL = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkPAL?.(book.id);
  };

  return (
    <div
      className="group cursor-pointer"
      style={{ perspective: "1000px", width: 180, height: 244 }}
      onClick={onClick}
    >
      <div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d", transition: "transform 0.5s ease-in-out" }}
      >
        {/* Hover flip via group */}
        <style>{`
          .group:hover > div { transform: rotateY(180deg); }
        `}</style>

        {/* Front */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden bg-card"
          style={{
            backfaceVisibility: "hidden",
            border: "3px solid hsl(var(--foreground))",
            boxShadow: "0 8px 14px 0 rgba(0,0,0,0.2)",
          }}
        >
          {book.coverUrl ? (
            <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden flex flex-col items-center justify-center p-4 bg-foreground text-background"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            border: "3px solid hsl(var(--foreground))",
            boxShadow: "0 8px 14px 0 rgba(0,0,0,0.2)",
          }}
        >
          {renderBack ? renderBack(book) : (
            <>
              {book.coupDeCoeur && <Heart className="absolute top-2.5 right-2.5 h-4 w-4 fill-current" />}

              <span className="text-sm font-bold text-center leading-tight">{book.title}</span>
              <span className="text-xs mt-1 opacity-80 text-center">{book.author}</span>

              {(book.rating != null && book.rating > 0) && (
                <div className="flex gap-0.5 mt-2">
                  {[1, 2, 3, 4, 5].map(star => {
                    const filled = book.rating! >= star;
                    const half = !filled && book.rating! >= star - 0.5;
                    return (
                      <span key={star} className="relative" style={{ width: 14, height: 14 }}>
                        <Star className={`h-3.5 w-3.5 ${filled ? "fill-current" : half ? "" : "opacity-30"}`} />
                        {half && <Star className="h-3.5 w-3.5 fill-current absolute inset-0" style={{ clipPath: "inset(0 50% 0 0)" }} />}
                      </span>
                    );
                  })}
                </div>
              )}

              {book.status === "Acheté" && (
                <button
                  onClick={handlePAL}
                  className="absolute bottom-3 rounded-md border border-background/40 px-3 py-1 text-xs font-medium transition-colors hover:bg-background/20"
                >
                  À lire
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
