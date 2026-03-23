import { useState } from "react";
import type { Book } from "@/data/mockBooks";
import { Search, SlidersHorizontal, Plus, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FlipBookCard } from "@/components/FlipBookCard";
import { BookDetailModal } from "@/components/BookDetailModal";
import { FiltersPanel, emptyFilters, type Filters } from "@/components/FiltersPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { AddBookModal } from "@/components/AddBookModal";
import { useBooks } from "@/contexts/BooksContext";

export function BibliothequeContent() {
  const {
    books, booksLoading, genres, formats, statuses,
    setGenres, setFormats, setStatuses, saveSettings,
    addBook, updateBook, deleteBook, markPAL,
  } = useBooks();

  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(emptyFilters);

  const handleDeleteBook = (id: string) => {
    deleteBook(id);
    setSelectedBook(null);
  };

  const visibleBooks = books
    .filter((b) => b.status !== "Wishlist")
    .filter(
      (b) =>
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase())
    )
    .filter((b) => {
      if (filters.authors.length && !filters.authors.includes(b.author)) return false;
      if (filters.genres.length && (!b.genre || !filters.genres.includes(b.genre))) return false;
      if (filters.publishers.length && (!b.publisher || !filters.publishers.includes(b.publisher))) return false;
      if (filters.series && b.series !== filters.series) return false;
      if (filters.formats.length && (!b.format || !filters.formats.includes(b.format))) return false;
      if (filters.status && b.status !== filters.status) return false;
      if (filters.minRating > 0 && (!b.rating || b.rating < filters.minRating)) return false;
      if (filters.coupDeCoeurOnly && !b.coupDeCoeur) return false;
      return true;
    });

  const libraryCount = books.filter(b => b.status !== "Wishlist").length;

  return (
    <div className="flex flex-col flex-1 p-4 gap-4 overflow-y-auto">

      {/* Action bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par titre ou auteur"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="inline-flex items-center justify-center rounded-md border border-border px-3 h-10 text-sm text-muted-foreground whitespace-nowrap select-none pointer-events-none">
          {libraryCount} {libraryCount <= 1 ? "livre" : "livres"}
        </div>
        <Button variant="outline" size="default" onClick={() => setFiltersOpen(true)}>
          <SlidersHorizontal className="h-4 w-4 mr-1.5" />
          Filtres
        </Button>
        <Button variant="outline" size="icon" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => setSettingsOpen(true)}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Book grid */}
      <div
        className="grid gap-y-5"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 180px))",
          justifyContent: "space-between",
        }}
      >
        {booksLoading ? (
          Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="rounded-lg" style={{ width: 180, height: 270 }} />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))
        ) : (
          visibleBooks.map((book) => (
            <FlipBookCard
              key={book.id}
              book={book}
              onMarkPAL={markPAL}
              onClick={() => setSelectedBook(book)}
            />
          ))
        )}
      </div>

      {/* Modals & Panels */}
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
      <FiltersPanel
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onApply={setFilters}
        books={books}
        settingsGenres={genres}
        settingsFormats={formats}
        settingsStatuses={statuses}
      />
      <SettingsPanel
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        genres={genres}
        formats={formats}
        statuses={statuses}
        onSave={(g, f, s) => { saveSettings(g, f, s); }}
      />
      <AddBookModal
        open={addOpen}
        onOpenChange={setAddOpen}
        genres={genres}
        formats={formats}
        statuses={statuses}
        onAdd={addBook}
      />
    </div>
  );
}
