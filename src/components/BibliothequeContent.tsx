import { useState } from "react";
import { Search, SlidersHorizontal, Plus, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FlipBookCard } from "@/components/FlipBookCard";
import { BookDetailModal } from "@/components/BookDetailModal";
import { FiltersPanel, emptyFilters, type Filters } from "@/components/FiltersPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { AddBookModal } from "@/components/AddBookModal";
import { mockBooks, type Book } from "@/data/mockBooks";
import { DEFAULT_GENRES, DEFAULT_FORMATS, DEFAULT_STATUSES } from "@/data/librarySettings";

export function BibliothequeContent() {
  const [books, setBooks] = useState<Book[]>(mockBooks);
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(emptyFilters);

  const [genres, setGenres] = useState<string[]>(DEFAULT_GENRES);
  const [formats, setFormats] = useState<string[]>(DEFAULT_FORMATS);
  const [statuses, setStatuses] = useState<string[]>(DEFAULT_STATUSES);

  const handleMarkPAL = (id: string) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "Dans ma PAL" } : b))
    );
  };

  const handleAddBook = (book: Book) => {
    setBooks((prev) => [...prev, book]);
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

      {/* Book grid — 8 per row, edge-to-edge */}
      <div
        className="grid gap-y-5"
        style={{
          gridTemplateColumns: "repeat(8, 180px)",
          justifyContent: "space-between",
        }}
      >
        {visibleBooks.map((book) => (
          <FlipBookCard
            key={book.id}
            book={book}
            onMarkPAL={handleMarkPAL}
            onClick={() => setSelectedBook(book)}
          />
        ))}
      </div>

      {/* Modals & Panels */}
      <BookDetailModal book={selectedBook} open={!!selectedBook} onOpenChange={(o) => !o && setSelectedBook(null)} />
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
        onSave={(g, f, s) => { setGenres(g); setFormats(f); setStatuses(s); }}
      />
      <AddBookModal
        open={addOpen}
        onOpenChange={setAddOpen}
        genres={genres}
        formats={formats}
        statuses={statuses}
        onAdd={handleAddBook}
      />
    </div>
  );
}
