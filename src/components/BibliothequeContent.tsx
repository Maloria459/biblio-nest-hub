import { useState } from "react";
import { Search, SlidersHorizontal, Plus, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FlipBookCard } from "@/components/FlipBookCard";
import { mockBooks, type Book } from "@/data/mockBooks";

export function BibliothequeContent() {
  const [books, setBooks] = useState<Book[]>(mockBooks);
  const [search, setSearch] = useState("");

  const visibleBooks = books
    .filter((b) => b.status !== "Wishlist")
    .filter(
      (b) =>
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase())
    );

  const handleMarkPAL = (id: string) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "Dans ma PAL" } : b))
    );
  };

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
        <Button variant="outline" size="default">
          <SlidersHorizontal className="h-4 w-4 mr-1.5" />
          Filtres
        </Button>
        <Button variant="outline" size="icon">
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Book grid */}
      <div className="flex flex-wrap gap-5">
        {visibleBooks.map((book) => (
          <FlipBookCard key={book.id} book={book} onMarkPAL={handleMarkPAL} />
        ))}
      </div>
    </div>
  );
}
