import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { type Book } from "@/data/mockBooks";
import { DEFAULT_GENRES, DEFAULT_FORMATS, DEFAULT_STATUSES } from "@/data/librarySettings";

interface BooksContextType {
  books: Book[];
  genres: string[];
  formats: string[];
  statuses: string[];
  setGenres: (g: string[]) => void;
  setFormats: (f: string[]) => void;
  setStatuses: (s: string[]) => void;
  addBook: (book: Book) => void;
  updateBook: (updated: Book) => void;
  deleteBook: (id: string) => void;
  markPAL: (id: string) => void;
}

const BooksContext = createContext<BooksContextType | null>(null);

export function BooksProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [genres, setGenres] = useState<string[]>(DEFAULT_GENRES);
  const [formats, setFormats] = useState<string[]>(DEFAULT_FORMATS);
  const [statuses, setStatuses] = useState<string[]>(DEFAULT_STATUSES);

  const addBook = useCallback((book: Book) => {
    setBooks((prev) => [...prev, book]);
  }, []);

  const updateBook = useCallback((updated: Book) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id === updated.id) return updated;
        if (
          updated.recommandationDuMois &&
          updated.recommandationMonth &&
          b.recommandationDuMois &&
          b.recommandationMonth === updated.recommandationMonth
        ) {
          return { ...b, recommandationDuMois: false, recommandationMonth: undefined };
        }
        return b;
      })
    );
  }, []);

  const deleteBook = useCallback((id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const markPAL = useCallback((id: string) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "Dans ma PAL" } : b))
    );
  }, []);

  return (
    <BooksContext.Provider
      value={{
        books,
        genres,
        formats,
        statuses,
        setGenres,
        setFormats,
        setStatuses,
        addBook,
        updateBook,
        deleteBook,
        markPAL,
      }}
    >
      {children}
    </BooksContext.Provider>
  );
}

export function useBooks() {
  const ctx = useContext(BooksContext);
  if (!ctx) throw new Error("useBooks must be used within BooksProvider");
  return ctx;
}
