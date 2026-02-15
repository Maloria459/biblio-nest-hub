import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { WishlistContent } from "@/components/WishlistContent";
import { mockBooks, type Book } from "@/data/mockBooks";
import { DEFAULT_GENRES, DEFAULT_FORMATS, DEFAULT_STATUSES } from "@/data/librarySettings";

const Wishlist = () => {
  const [books, setBooks] = useState<Book[]>(mockBooks);
  const [genres] = useState<string[]>(DEFAULT_GENRES);
  const [formats] = useState<string[]>(DEFAULT_FORMATS);
  const [statuses] = useState<string[]>(DEFAULT_STATUSES);

  const handleUpdateBook = (updated: Book) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === updated.id ? updated : b))
    );
  };

  const handleDeleteBook = (id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="flex flex-col flex-1">
      <TopBar />
      <WishlistContent
        books={books}
        onUpdateBook={handleUpdateBook}
        onDeleteBook={handleDeleteBook}
        genres={genres}
        formats={formats}
        statuses={statuses}
      />
    </div>
  );
};

export default Wishlist;
