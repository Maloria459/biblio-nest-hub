import { Heart, Star } from "lucide-react";
import type { Book } from "@/data/mockBooks";

interface FlipBookCardProps {
  book: Book;
  onMarkPAL?: (id: string) => void;
  onClick?: () => void;
}

export function FlipBookCard({ book, onMarkPAL, onClick }: FlipBookCardProps) {
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
        style={{ transformStyle: "preserve-3d", transition: "transform 0.9s ease-in-out" }}
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
          {book.coupDeCoeur && <Heart className="absolute top-2.5 right-2.5 h-4 w-4 fill-current" />}

          <span className="text-sm font-bold text-center leading-tight">{book.title}</span>
          <span className="text-xs mt-1 opacity-80 text-center">{book.author}</span>

          {book.rating && (
            <div className="flex gap-0.5 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-3.5 w-3.5 ${i < book.rating! ? "fill-current" : "opacity-30"}`} />
              ))}
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
        </div>
      </div>
    </div>
  );
}
