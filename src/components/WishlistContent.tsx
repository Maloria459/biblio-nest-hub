import { useState, useEffect, useCallback } from "react";
import type { Book } from "@/data/mockBooks";
import { FlipBookCard } from "@/components/FlipBookCard";
import { BookDetailModal } from "@/components/BookDetailModal";
import { useBooks } from "@/contexts/BooksContext";
import type { Book } from "@/data/mockBooks";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

export function WishlistContent() {
  const { books, genres, formats, statuses, updateBook, deleteBook } = useBooks();

  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [orderedIds, setOrderedIds] = useState<string[]>([]);

  const wishlistBooks = books.filter((b) => b.status === "Wishlist");

  useEffect(() => {
    setOrderedIds((prev) => {
      const wishlistIdSet = new Set(wishlistBooks.map((b) => b.id));
      const kept = prev.filter((id) => wishlistIdSet.has(id));
      const keptSet = new Set(kept);
      const newIds = wishlistBooks.filter((b) => !keptSet.has(b.id)).map((b) => b.id);
      return [...kept, ...newIds];
    });
  }, [wishlistBooks.map((b) => b.id).join(",")]);

  const orderedBooks = orderedIds
    .map((id) => wishlistBooks.find((b) => b.id === id))
    .filter((b): b is Book => !!b)
    .filter(
      (b) =>
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase()) ||
        (b.series && b.series.toLowerCase().includes(search.toLowerCase())),
    );

  const totalPrice = wishlistBooks.reduce((sum, b) => sum + (b.price ?? 0), 0);
  const bookCount = wishlistBooks.length;


  const handleMarkAchete = useCallback(
    (id: string) => {
      const book = books.find((b) => b.id === id);
      if (book) {
        updateBook({ ...book, status: "Acheté" });
      }
    },
    [books, updateBook],
  );

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newIds = Array.from(orderedIds);
    const [moved] = newIds.splice(result.source.index, 1);
    newIds.splice(result.destination.index, 0, moved);
    setOrderedIds(newIds);
  };

  const handleDeleteBook = (id: string) => {
    deleteBook(id);
    setSelectedBook(null);
  };

  if (wishlistBooks.length === 0) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center text-muted-foreground text-sm">
        Aucun livre dans votre wishlist
      </div>
    );
  }

  const renderWishlistBack = (book: Book) => (
    <>
      <span className="text-sm font-bold text-center leading-tight">{book.title}</span>
      <span className="text-xs mt-1 opacity-80 text-center">{book.author}</span>
      {book.publicationDate && (
        <span className="absolute bottom-3 text-[0.7em] text-center w-full">{book.publicationDate}</span>
      )}
    </>
  );

  return (
    <div className="flex flex-col flex-1 p-4 gap-4 overflow-y-auto overflow-x-hidden">
      {/* Stats + Search bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par titre, auteur ou série"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="inline-flex items-center gap-4 rounded-md border border-border bg-card px-4 h-10 text-sm text-muted-foreground select-none">
          <span><strong className="text-foreground">{bookCount}</strong> {bookCount <= 1 ? "livre" : "livres"}</span>
          <span className="text-border">|</span>
          <span><strong className="text-foreground">{totalPrice.toFixed(2).replace(".", ",")} €</strong> prix total</span>
        </div>
      </div>

      {/* Card grid — same layout as BibliothequeContent */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="wishlist" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="grid gap-y-5"
              style={{
                gridTemplateColumns: "repeat(8, 180px)",
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
                      style={{
                        ...dragProvided.draggableProps.style,
                        opacity: snapshot.isDragging ? 0.7 : 1,
                      }}
                    >
                      <FlipBookCard
                        book={book}
                        onClick={() => setSelectedBook(book)}
                        renderBack={renderWishlistBack}
                      />

                      {/* Price + Acheté row */}
                      <div className="flex items-center justify-between mt-2" style={{ width: 180 }}>
                        <span className="text-xs text-foreground">
                          {book.price != null ? `${book.price.toFixed(2)} €` : "— €"}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAchete(book.id);
                          }}
                          className="rounded-md border border-foreground px-3 py-0.5 text-xs font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
                        >
                          Acheté
                        </button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <BookDetailModal
        book={selectedBook}
        open={!!selectedBook}
        onOpenChange={(o) => !o && setSelectedBook(null)}
        onSave={updateBook}
        onDelete={handleDeleteBook}
        allBooks={books}
        genres={genres}
        formats={formats}
        statuses={statuses}
      />
    </div>
  );
}
