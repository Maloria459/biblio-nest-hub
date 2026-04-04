import { Heart, Star } from "lucide-react";
import type { Book } from "@/data/mockBooks";
import type { ReactNode } from "react";

interface FlipBookCardProps {
  book: Book;
  onMarkPAL?: (id: string) => void;
  onClick?: () => void;
  renderBack?: (book: Book) => ReactNode;
  /** Show "Lire" button instead of "À lire" — used on PAL page */
  showLireButton?: boolean;
  onLire?: (book: Book) => void;
}

export function FlipBookCard({ book, onMarkPAL, onClick, renderBack, showLireButton, onLire }: FlipBookCardProps) {
  const handlePAL = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkPAL?.(book.id);
  };

  const handleLire = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLire?.(book);
  };

  const remainingPages = (book.pages || 0) - (book.pagesRead || 0);
  const pagesToShow = remainingPages > 0 ? remainingPages : book.pages || 0;

  return (
    <div
      className="group cursor-pointer transition-transform duration-300 ease-out hover:scale-105"
      style={{ perspective: "1000px", width: 180, aspectRatio: "2/3" }}
      onClick={onClick}
    >
      <div
        className="relative w-full h-full duration-500 ease-in-out"
        style={{ transformStyle: "preserve-3d", transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }}
      >
        {/* Hover flip via group */}
        <style>{`
          .group:hover > div { transform: rotateY(180deg); }
        `}</style>

        {/* Front — Cover */}
        <div
          className="absolute inset-0 rounded-md overflow-hidden bg-muted shadow-lg ring-1 ring-black/10 dark:ring-white/10"
          style={{ backfaceVisibility: "hidden" }}
        >
          {book.coverUrl ? (
            <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
              Sans couverture
            </div>
          )}

          {/* Effet d'ombre pour simuler la tranche du livre (Spine effect) */}
          <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/40 via-black/10 to-transparent mix-blend-overlay pointer-events-none" />
          {/* Reflet de lumière subtil sur la couverture */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        {/* Back — Details */}
        <div
          className="absolute inset-0 rounded-md overflow-hidden flex flex-col items-center justify-center p-5 bg-gradient-to-br from-zinc-900 to-zinc-950 text-zinc-50 shadow-xl ring-1 ring-zinc-800"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {renderBack ? (
            renderBack(book)
          ) : showLireButton ? (
            /* PAL-specific back */
            <>
              {book.coupDeCoeur && (
                <Heart className="absolute top-3 right-3 h-4 w-4 text-rose-500 fill-rose-500 drop-shadow-md" />
              )}
              <h3 className="text-sm font-bold text-center leading-snug line-clamp-3 mb-1">{book.title}</h3>
              <p className="text-xs text-zinc-400 text-center mb-4 italic">{book.author}</p>

              {pagesToShow > 0 && (
                <div className="mb-4 px-2 py-1 rounded-full bg-zinc-800/50 text-[10px] uppercase tracking-wider text-zinc-300 font-medium">
                  {pagesToShow} pages
                </div>
              )}

              <button
                onClick={handleLire}
                className="absolute bottom-4 w-[85%] rounded-full bg-zinc-100 text-zinc-900 px-4 py-2 text-xs font-semibold shadow-md transition-all hover:bg-white hover:scale-105 active:scale-95"
              >
                Commencer
              </button>
            </>
          ) : (
            /* Default library back */
            <>
              {book.coupDeCoeur && (
                <Heart className="absolute top-3 right-3 h-4 w-4 text-rose-500 fill-rose-500 drop-shadow-md" />
              )}

              <h3 className="text-sm font-bold text-center leading-snug line-clamp-3 mb-1">{book.title}</h3>
              <p className="text-xs text-zinc-400 text-center italic">{book.author}</p>

              {book.rating != null && book.rating > 0 && (
                <div className="flex gap-1 mt-3">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = book.rating! >= star;
                    const half = !filled && book.rating! >= star - 0.5;
                    return (
                      <span key={star} className="relative w-3.5 h-3.5">
                        <Star
                          className={`h-3.5 w-3.5 ${filled ? "fill-amber-400 text-amber-400" : half ? "text-amber-400" : "text-zinc-700"}`}
                        />
                        {half && (
                          <Star
                            className="h-3.5 w-3.5 fill-amber-400 text-amber-400 absolute inset-0"
                            style={{ clipPath: "inset(0 50% 0 0)" }}
                          />
                        )}
                      </span>
                    );
                  })}
                </div>
              )}

              {book.status === "Acheté" && (
                <button
                  onClick={handlePAL}
                  className="absolute bottom-4 w-[85%] rounded-full border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-xs font-medium text-zinc-200 transition-all hover:bg-zinc-700 hover:text-white active:scale-95"
                >
                  Ajouter à la PAL
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
