import { useState, useEffect, useMemo } from "react";
import { TOPBAR_RIGHT_ID, TOPBAR_TITLE_ID } from "@/components/TopBar";
import { Search, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FlipBookCard } from "@/components/FlipBookCard";
import { BookDetailModal } from "@/components/BookDetailModal";
import type { Book } from "@/data/mockBooks";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface WishlistContentProps {
  books: Book[];
  onUpdateBook: (book: Book) => void;
  onDeleteBook: (id: string) => void;
  onReorderWishlist: (orderedIds: string[]) => void;
  genres: string[];
  formats: string[];
  statuses: string[];
}

function SortableBookCard({
  book,
  onClick,
  onAchete,
}: {
  book: Book;
  onClick: () => void;
  onAchete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: book.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col items-center gap-2">
      <div className="relative">
        <button
          {...attributes}
          {...listeners}
          className="absolute -left-5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <FlipBookCard book={book} onClick={onClick} />
      </div>
      <button
        onClick={onAchete}
        className="rounded-md border border-foreground px-4 py-1.5 text-xs font-medium transition-colors hover:bg-foreground hover:text-background"
      >
        Acheté
      </button>
    </div>
  );
}

export function WishlistContent({
  books,
  onUpdateBook,
  onDeleteBook,
  onReorderWishlist,
  genres,
  formats,
  statuses,
}: WishlistContentProps) {
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const wishlistBooks = useMemo(() => {
    const wBooks = books.filter((b) => b.status === "Wishlist");
    // Sort by wishlistOrder if present
    return wBooks.sort((a, b) => (a.wishlistOrder ?? Infinity) - (b.wishlistOrder ?? Infinity));
  }, [books]);

  const filteredBooks = useMemo(() => {
    if (!search.trim()) return wishlistBooks;
    const q = search.toLowerCase();
    return wishlistBooks.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.series && b.series.toLowerCase().includes(q))
    );
  }, [wishlistBooks, search]);

  const bookCount = wishlistBooks.length;
  const totalPrice = wishlistBooks.reduce((sum, b) => sum + (b.price ?? 0), 0);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = filteredBooks.findIndex((b) => b.id === active.id);
    const newIndex = filteredBooks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(filteredBooks, oldIndex, newIndex);
    onReorderWishlist(reordered.map((b) => b.id));
  };

  const handleAchete = (book: Book) => {
    onUpdateBook({ ...book, status: "Acheté" });
  };

  const handleSaveBook = (updated: Book) => {
    onUpdateBook(updated);
    if (updated.status !== "Wishlist") {
      setSelectedBook(null);
    }
  };

  // Inject counters into top bar
  useEffect(() => {
    const titleEl = document.getElementById(TOPBAR_TITLE_ID);
    if (titleEl) titleEl.textContent = "Ma Wishlist";

    const el = document.getElementById(TOPBAR_RIGHT_ID);
    if (el) {
      el.innerHTML = "";
      el.className = "flex items-center gap-2 ml-auto";

      const countBox = document.createElement("span");
      countBox.className = "inline-flex items-center rounded-md border border-border px-3 py-1 text-sm text-muted-foreground whitespace-nowrap";
      countBox.textContent = `${bookCount} ${bookCount <= 1 ? "livre" : "livres"}`;

      const priceBox = document.createElement("span");
      priceBox.className = "inline-flex items-center rounded-md border border-border px-3 py-1 text-sm text-muted-foreground whitespace-nowrap";
      priceBox.textContent = `${totalPrice.toFixed(2)} €`;

      el.appendChild(countBox);
      el.appendChild(priceBox);
    }
    return () => {
      const titleEl = document.getElementById(TOPBAR_TITLE_ID);
      if (titleEl) titleEl.textContent = "";
      const el = document.getElementById(TOPBAR_RIGHT_ID);
      if (el) {
        el.innerHTML = "";
        el.className = "ml-auto";
      }
    };
  }, [bookCount, totalPrice]);

  return (
    <div className="flex flex-col flex-1 p-4 gap-4 overflow-y-auto">
      {/* Search bar */}
      <div className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par titre, auteur ou série"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Book grid or empty state */}
      {filteredBooks.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Aucun livre dans votre wishlist</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredBooks.map((b) => b.id)} strategy={rectSortingStrategy}>
            <div
              className="grid gap-y-5"
              style={{
                gridTemplateColumns: "repeat(8, 180px)",
                justifyContent: "space-between",
              }}
            >
              {filteredBooks.map((book) => (
                <SortableBookCard
                  key={book.id}
                  book={book}
                  onClick={() => setSelectedBook(book)}
                  onAchete={() => handleAchete(book)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Book detail modal */}
      <BookDetailModal
        book={selectedBook}
        open={!!selectedBook}
        onOpenChange={(o) => !o && setSelectedBook(null)}
        onSave={handleSaveBook}
        onDelete={onDeleteBook}
        allBooks={books}
        genres={genres}
        formats={formats}
        statuses={statuses}
      />
    </div>
  );
}
