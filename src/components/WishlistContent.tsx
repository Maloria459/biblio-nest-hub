import { useState, useEffect, useCallback } from "react";
import { TOPBAR_RIGHT_ID } from "@/components/TopBar";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FlipBookCard } from "@/components/FlipBookCard";
import { BookDetailModal } from "@/components/BookDetailModal";
import type { Book } from "@/data/mockBooks";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

interface WishlistContentProps {
  books: Book[];
  onUpdateBook: (updated: Book) => void;
  onDeleteBook: (id: string) => void;
  genres: string[];
  formats: string[];
  statuses: string[];
}

export function WishlistContent({
  books,
  onUpdateBook,
  onDeleteBook,
  genres,
  formats,
  statuses,
}: WishlistContentProps) {
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [orderedIds, setOrderedIds] = useState<string[]>([]);

  // Get wishlist books
  const wishlistBooks = books.filter((b) => b.status === "Wishlist");

  // Initialize order from wishlist books
  useEffect(() => {
    setOrderedIds((prev) => {
      const wishlistIdSet = new Set(wishlistBooks.map((b) => b.id));
      // Keep existing ordered ids that are still in wishlist
      const kept = prev.filter((id) => wishlistIdSet.has(id));
      // Add new wishlist books at the end
      const keptSet = new Set(kept);
      const newIds = wishlistBooks
        .filter((b) => !keptSet.has(b.id))
        .map((b) => b.id);
      return [...kept, ...newIds];
    });
  }, [wishlistBooks.length, wishlistBooks.map((b) => b.id).join(",")]);

  // Ordered + filtered books
  const orderedBooks = orderedIds
    .map((id) => wishlistBooks.find((b) => b.id === id))
    .filter((b): b is Book => !!b)
    .filter(
      (b) =>
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase()) ||
        (b.series && b.series.toLowerCase().includes(search.toLowerCase()))
    );

  const totalPrice = wishlistBooks.reduce((sum, b) => sum + (b.price ?? 0), 0);
  const bookCount = wishlistBooks.length;

  // Update top bar counters
  useEffect(() => {
    const el = document.getElementById(TOPBAR_RIGHT_ID);
    if (el) {
      el.innerHTML = "";
      el.className = "ml-auto flex items-center gap-2";

      const countBox = document.createElement("span");
      countBox.className =
        "inline-flex items-center rounded-md border border-border px-3 py-1 text-sm text-muted-foreground whitespace-nowrap";
      countBox.textContent = `${bookCount} ${bookCount <= 1 ? "livre" : "livres"}`;

      const priceBox = document.createElement("span");
      priceBox.className =
        "inline-flex items-center rounded-md border border-border px-3 py-1 text-sm text-muted-foreground whitespace-nowrap";
      priceBox.textContent = `${totalPrice.toFixed(2)} €`;

      el.appendChild(countBox);
      el.appendChild(priceBox);
    }
    return () => {
      const el = document.getElementById(TOPBAR_RIGHT_ID);
      if (el) {
        el.innerHTML = "";
        el.textContent = "";
        el.className = "ml-auto";
      }
    };
  }, [bookCount, totalPrice]);

  const handleMarkAchete = useCallback(
    (id: string) => {
      const book = books.find((b) => b.id === id);
      if (book) {
        onUpdateBook({ ...book, status: "Acheté" });
      }
    },
    [books, onUpdateBook]
  );

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newIds = Array.from(orderedIds);
    const [moved] = newIds.splice(result.source.index, 1);
    newIds.splice(result.destination.index, 0, moved);
    setOrderedIds(newIds);
  };

  const handleSaveBook = (updated: Book) => {
    onUpdateBook(updated);
    setSelectedBook(updated);
  };

  const handleDeleteBook = (id: string) => {
    onDeleteBook(id);
    setSelectedBook(null);
  };

  if (wishlistBooks.length === 0) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center text-muted-foreground text-sm">
        Aucun livre dans votre wishlist
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 p-4 gap-4 overflow-y-auto">
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par titre, auteur ou série"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Card grid with drag-and-drop */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="wishlist" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="grid gap-y-5"
              style={{
                gridTemplateColumns: "repeat(4, 180px)",
                justifyContent: "space-between",
              }}
            >
              {orderedBooks.map((book, index) => (
                <Draggable key={book.id} draggableId={book.id} index={index}>
                  {(dragProvided, snapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      className="flex flex-col items-center gap-2"
                      style={{
                        ...dragProvided.draggableProps.style,
                        opacity: snapshot.isDragging ? 0.7 : 1,
                      }}
                    >
                      <WishlistCard
                        book={book}
                        onClick={() => setSelectedBook(book)}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAchete(book.id);
                        }}
                        className="rounded-md border border-foreground px-4 py-1 text-xs font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
                      >
                        Acheté
                      </button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Reading sheet modal */}
      <BookDetailModal
        book={selectedBook}
        open={!!selectedBook}
        onOpenChange={(o) => !o && setSelectedBook(null)}
        onSave={handleSaveBook}
        onDelete={handleDeleteBook}
        allBooks={books}
        genres={genres}
        formats={formats}
        statuses={statuses}
      />
    </div>
  );
}

/* Wishlist-specific card with custom back face */
function WishlistCard({ book, onClick }: { book: Book; onClick: () => void }) {
  return (
    <div
      className="group cursor-pointer"
      style={{ perspective: "1000px", width: 180, height: 244 }}
      onClick={onClick}
    >
      <div
        className="relative w-full h-full"
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.5s ease-in-out",
        }}
      >
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
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
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
          <span className="text-sm font-bold text-center leading-tight">
            {book.title}
          </span>
          <span className="text-xs mt-1 opacity-80 text-center">
            {book.author}
          </span>
          {book.publicationDate && (
            <span className="text-xs mt-1 opacity-60 text-center">
              {book.publicationDate}
            </span>
          )}
          {book.price != null && (
            <span className="text-xs mt-2 font-medium">
              {book.price.toFixed(2)} €
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
