import { useState, useEffect, useCallback, useId } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BookDetailModal } from "@/components/BookDetailModal";
import { useBooks } from "@/contexts/BooksContext";
import type { Book } from "@/data/mockBooks";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

export function WishlistContent() {
  const { books, genres, formats, statuses, updateBook, deleteBook } = useBooks();
  const uniqueId = useId();

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

  // Scoped class prefix to avoid global style conflicts
  const cls = `wl-${uniqueId.replace(/:/g, "")}`;

  return (
    <div className="flex flex-col flex-1 p-4 gap-4 overflow-y-auto">
      <style>{`
        .${cls}-card {
          background-color: transparent;
          width: 180px;
          height: 244px;
          perspective: 1000px;
          font-family: sans-serif;
          cursor: pointer;
        }
        .${cls}-inner {
          position: relative;
          width: 100%;
          height: 100%;
          text-align: center;
          transition: transform 0.8s;
          transform-style: preserve-3d;
        }
        .${cls}-card:hover .${cls}-inner {
          transform: rotateY(180deg);
        }
        .${cls}-front, .${cls}-back {
          box-shadow: 0 8px 14px 0 rgba(0,0,0,0.2);
          position: absolute;
          display: flex;
          flex-direction: column;
          justify-content: center;
          width: 100%;
          height: 100%;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          border: 3px solid black;
          border-radius: 1rem;
        }
        .${cls}-front {
          background: white;
          color: black;
        }
        .${cls}-front img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: calc(1rem - 3px);
        }
        .${cls}-back {
          background: linear-gradient(120deg, black 100%, bisque 100%, rgb(255, 185, 160) 78%);
          color: white;
          transform: rotateY(180deg);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 10px;
          position: relative;
        }
        .${cls}-title {
          font-size: 1em;
          font-weight: 900;
          text-align: center;
          margin: 0 0 5px 0;
        }
        .${cls}-author {
          font-size: 0.8em;
          text-align: center;
          margin: 0;
        }
        .${cls}-date {
          position: absolute;
          bottom: 10px;
          font-size: 0.7em;
          text-align: center;
          width: 100%;
        }
      `}</style>

      {/* Search bar */}
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
        <span className="inline-flex items-center rounded-md border border-border px-3 py-1 text-sm text-muted-foreground whitespace-nowrap">
          {bookCount} {bookCount <= 1 ? "livre" : "livres"}
        </span>
        <span className="inline-flex items-center rounded-md border border-border px-3 py-1 text-sm text-muted-foreground whitespace-nowrap">
          {totalPrice.toFixed(2)} €
        </span>
      </div>

      {/* Card grid */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="wishlist" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="grid"
              style={{
                gridTemplateColumns: "repeat(8, 190px)",
                justifyContent: "start",
                gap: "40px 20px",
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
                      {/* Flip card */}
                      <div className={`${cls}-card`} onClick={() => setSelectedBook(book)}>
                        <div className={`${cls}-inner`}>
                          <div className={`${cls}-front`}>
                            {book.coverUrl ? (
                              <img src={book.coverUrl} alt={book.title} loading="lazy" />
                            ) : (
                              <div className="w-full h-full bg-muted" style={{ borderRadius: "calc(1rem - 3px)" }} />
                            )}
                          </div>
                          <div className={`${cls}-back`}>
                            <p className={`${cls}-title`}>{book.title}</p>
                            <p className={`${cls}-author`}>{book.author}</p>
                            {book.publicationDate && <p className={`${cls}-date`}>{book.publicationDate}</p>}
                          </div>
                        </div>
                      </div>

                      {/* Price + Acheté row */}
                      <div className="flex items-center justify-between mt-2" style={{ width: 190 }}>
                        <span style={{ fontSize: "0.75em" }} className="text-foreground">
                          {book.price != null ? `${book.price.toFixed(2)} €` : "— €"}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAchete(book.id);
                          }}
                          className="rounded-md border border-foreground px-3 py-0.5 font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
                          style={{ fontSize: "0.75em" }}
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
