import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { type Book, type Citation } from "@/data/mockBooks";
import { DEFAULT_GENRES, DEFAULT_FORMATS, DEFAULT_STATUSES } from "@/data/librarySettings";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

// Convert DB row to Book
function rowToBook(row: any): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    coverUrl: row.cover_url ?? undefined,
    rating: row.rating ?? undefined,
    coupDeCoeur: row.coup_de_coeur ?? undefined,
    status: row.status,
    genre: row.genre ?? undefined,
    format: row.format ?? undefined,
    publisher: row.publisher ?? undefined,
    series: row.series ?? undefined,
    pages: row.pages ?? undefined,
    pagesRead: row.pages_read ?? undefined,
    chapters: row.chapters ?? undefined,
    publicationDate: row.publication_date ?? undefined,
    price: row.price != null ? Number(row.price) : undefined,
    spicyLevel: row.spicy_level ?? undefined,
    matureContent: row.mature_content ?? undefined,
    recommandationDuMois: row.recommandation_du_mois ?? undefined,
    recommandationMonth: row.recommandation_month ?? undefined,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    avis: row.avis ?? undefined,
    citations: row.citations as Citation[] ?? undefined,
    passagesPreferes: row.passages_preferes ?? undefined,
    personnagesPreferes: row.personnages_preferes ?? undefined,
    chapterNotes: row.chapter_notes as Record<number, string> ?? undefined,
    chapterNotesEnabled: row.chapter_notes_enabled ?? undefined,
  };
}

// Convert Book to DB insert/update payload
function bookToRow(book: Book, userId: string) {
  return {
    id: book.id,
    user_id: userId,
    title: book.title,
    author: book.author,
    cover_url: book.coverUrl ?? null,
    rating: book.rating ?? null,
    coup_de_coeur: book.coupDeCoeur ?? false,
    status: book.status,
    genre: book.genre ?? null,
    format: book.format ?? null,
    publisher: book.publisher ?? null,
    series: book.series ?? null,
    pages: book.pages ?? null,
    pages_read: book.pagesRead ?? null,
    chapters: book.chapters ?? null,
    publication_date: book.publicationDate ?? null,
    price: book.price ?? null,
    spicy_level: book.spicyLevel ?? null,
    mature_content: book.matureContent ?? false,
    recommandation_du_mois: book.recommandationDuMois ?? false,
    recommandation_month: book.recommandationMonth ?? null,
    start_date: book.startDate ?? null,
    end_date: book.endDate ?? null,
    avis: book.avis ?? null,
    citations: (book.citations ?? []) as any,
    passages_preferes: book.passagesPreferes ?? null,
    personnages_preferes: book.personnagesPreferes ?? null,
    chapter_notes: (book.chapterNotes ?? {}) as any,
    chapter_notes_enabled: book.chapterNotesEnabled ?? false,
  };
}

export function BooksProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [genres, setGenres] = useState<string[]>(DEFAULT_GENRES);
  const [formats, setFormats] = useState<string[]>(DEFAULT_FORMATS);
  const [statuses, setStatuses] = useState<string[]>(DEFAULT_STATUSES);

  // Load books from DB on mount / user change
  useEffect(() => {
    if (!user) { setBooks([]); return; }
    const load = async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("user_id", user.id);
      if (!error && data) setBooks(data.map(rowToBook));
    };
    load();
  }, [user?.id]);

  const addBook = useCallback((book: Book) => {
    if (!user) return;
    setBooks((prev) => [...prev, book]);
    supabase.from("books").insert(bookToRow(book, user.id)).then();
  }, [user]);

  const updateBook = useCallback((updated: Book) => {
    if (!user) return;
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id === updated.id) return updated;
        if (
          updated.recommandationDuMois &&
          updated.recommandationMonth &&
          b.recommandationDuMois &&
          b.recommandationMonth === updated.recommandationMonth
        ) {
          const cleared = { ...b, recommandationDuMois: false, recommandationMonth: undefined };
          supabase.from("books").update({ recommandation_du_mois: false, recommandation_month: null }).eq("id", b.id).then();
          return cleared;
        }
        return b;
      })
    );
    supabase.from("books").update(bookToRow(updated, user.id)).eq("id", updated.id).then();
  }, [user]);

  const deleteBook = useCallback((id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    supabase.from("books").delete().eq("id", id).then();
  }, []);

  const markPAL = useCallback((id: string) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "Dans ma PAL" } : b))
    );
    supabase.from("books").update({ status: "Dans ma PAL" }).eq("id", id).then();
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
