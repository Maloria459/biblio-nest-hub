import { useState, useEffect } from "react";
import type { Book } from "@/data/mockBooks";
import { TOPBAR_RIGHT_ID } from "@/components/TopBar";
import { FlipBookCard } from "@/components/FlipBookCard";
import { BookDetailModal } from "@/components/BookDetailModal";
import { useBooks } from "@/contexts/BooksContext";

export function PileALireContent() {
  const { books, genres, formats, statuses, updateBook, deleteBook } = useBooks();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const palBooks = books.filter((b) => b.status === "Dans ma PAL");

  const totalPagesToRead = palBooks.reduce((sum, b) => {
    const remaining = (b.pages || 0) - (b.pagesRead || 0);
    return sum + (remaining > 0 ? remaining : (b.pages || 0));
  }, 0);

  const handleLire = (book: Book) => {
    const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const updated: Book = {
      ...book,
      status: "Lecture en cours",
      startDate: book.startDate || today,
    };
    updateBook(updated);
    setSelectedBook(updated);
  };

  const handleDeleteBook = (id: string) => {
    deleteBook(id);
    setSelectedBook(null);
  };

  // Inject top bar counters
  useEffect(() => {
    const el = document.getElementById(TOPBAR_RIGHT_ID);
    if (!el) return;

    const formattedPages = totalPagesToRead.toLocaleString("fr-FR");

    el.innerHTML = `
      <div style="display:flex;gap:8px;align-items:center;">
        <span class="inline-flex items-center rounded-md border border-border px-3 py-1 text-sm text-muted-foreground whitespace-nowrap">
          ${formattedPages} pages
        </span>
        <span class="inline-flex items-center rounded-md border border-border px-3 py-1 text-sm text-muted-foreground whitespace-nowrap">
          ${palBooks.length} ${palBooks.length <= 1 ? "livre" : "livres"}
        </span>
      </div>
    `;

    return () => {
      const el = document.getElementById(TOPBAR_RIGHT_ID);
      if (el) { el.textContent = ""; el.className = "ml-auto"; }
    };
  }, [totalPagesToRead, palBooks.length]);

  return (
    <div className="flex flex-col flex-1 p-4 gap-4 overflow-y-auto">
      {palBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center">
          <p className="text-lg font-medium text-foreground">Votre pile à lire est vide</p>
          <p className="text-sm text-muted-foreground">Ajoutez des livres avec le statut « Dans ma PAL » depuis votre bibliothèque</p>
        </div>
      ) : (
        <div
          className="grid gap-y-5"
          style={{
            gridTemplateColumns: "repeat(8, 180px)",
            justifyContent: "space-between",
          }}
        >
          {palBooks.map((book) => (
            <FlipBookCard
              key={book.id}
              book={book}
              showLireButton
              onLire={handleLire}
              onClick={() => setSelectedBook(book)}
            />
          ))}
        </div>
      )}

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
