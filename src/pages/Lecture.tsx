import { useState, useCallback } from "react";
import { TabbedPage } from "@/components/TabbedPage";
import { BookOpen, Layers, FolderOpen, Heart } from "lucide-react";
import type { TabItem } from "@/components/BottomTabBar";
import { BibliothequeContent } from "@/components/BibliothequeContent";
import { WishlistContent } from "@/components/WishlistContent";
import { mockBooks, type Book } from "@/data/mockBooks";
import { DEFAULT_GENRES, DEFAULT_FORMATS, DEFAULT_STATUSES } from "@/data/librarySettings";

const tabs: TabItem[] = [
  { label: "Ma bibliothèque", icon: BookOpen },
  { label: "Ma Wishlist", icon: Heart },
  { label: "Ma pile à lire", icon: Layers },
  { label: "Mes collections", icon: FolderOpen },
];

const Lecture = () => {
  const [books, setBooks] = useState<Book[]>(mockBooks);
  const [genres, setGenres] = useState<string[]>(DEFAULT_GENRES);
  const [formats, setFormats] = useState<string[]>(DEFAULT_FORMATS);
  const [statuses, setStatuses] = useState<string[]>(DEFAULT_STATUSES);

  const handleAddBook = useCallback((book: Book) => {
    // Assign wishlist order if status is Wishlist
    if (book.status === "Wishlist") {
      const maxOrder = books
        .filter((b) => b.status === "Wishlist")
        .reduce((max, b) => Math.max(max, b.wishlistOrder ?? 0), 0);
      book = { ...book, wishlistOrder: maxOrder + 1 };
    }
    setBooks((prev) => [...prev, book]);
  }, [books]);

  const handleSaveBook = useCallback((updated: Book) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id === updated.id) return updated;
        if (updated.recommandationDuMois && updated.recommandationMonth && b.recommandationDuMois && b.recommandationMonth === updated.recommandationMonth) {
          return { ...b, recommandationDuMois: false, recommandationMonth: undefined };
        }
        return b;
      })
    );
  }, []);

  const handleDeleteBook = useCallback((id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const handleReorderWishlist = useCallback((orderedIds: string[]) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.status !== "Wishlist") return b;
        const idx = orderedIds.indexOf(b.id);
        return idx !== -1 ? { ...b, wishlistOrder: idx } : b;
      })
    );
  }, []);

  const handleSettingsSave = useCallback((g: string[], f: string[], s: string[]) => {
    setGenres(g);
    setFormats(f);
    setStatuses(s);
  }, []);

  return (
    <TabbedPage
      tabs={tabs}
      defaultTab={tabs[0].label}
      tabContent={{
        "Ma bibliothèque": (
          <BibliothequeContent
            books={books}
            onAddBook={handleAddBook}
            onSaveBook={handleSaveBook}
            onDeleteBook={handleDeleteBook}
            genres={genres}
            formats={formats}
            statuses={statuses}
            onSettingsSave={handleSettingsSave}
          />
        ),
        "Ma Wishlist": (
          <WishlistContent
            books={books}
            onUpdateBook={handleSaveBook}
            onDeleteBook={handleDeleteBook}
            onReorderWishlist={handleReorderWishlist}
            genres={genres}
            formats={formats}
            statuses={statuses}
          />
        ),
      }}
    />
  );
};

export default Lecture;
