import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { type Book, type Citation } from "@/data/mockBooks";
import { DEFAULT_GENRES, DEFAULT_FORMATS, DEFAULT_STATUSES } from "@/data/librarySettings";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const PAGE_SIZE = 1000;

async function fetchAllRows(table: "books", userId: string) {
  const rows: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("user_id", userId)
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (data) rows.push(...data);
    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}

interface BooksContextType {
  books: Book[];
  booksLoading: boolean;
  genres: string[];
  formats: string[];
  statuses: string[];
  setGenres: (g: string[]) => void;
  setFormats: (f: string[]) => void;
  setStatuses: (s: string[]) => void;
  saveSettings: (genres: string[], formats: string[], statuses: string[]) => void;
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
    secondaryStatus: row.secondary_status ?? undefined,
    loanDate: row.loan_date ?? undefined,
    borrowerName: row.borrower_name ?? undefined,
    borrowDate: row.borrow_date ?? undefined,
    returnDate: row.return_date ?? undefined,
    lenderName: row.lender_name ?? undefined,
    rereadCount: row.reread_count ?? 0,
    synopsis: row.synopsis ?? undefined,
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
    secondary_status: book.secondaryStatus ?? null,
    loan_date: book.loanDate ?? null,
    borrower_name: book.borrowerName ?? null,
    borrow_date: book.borrowDate ?? null,
    return_date: book.returnDate ?? null,
    lender_name: book.lenderName ?? null,
    reread_count: book.rereadCount ?? 0,
    synopsis: book.synopsis ?? null,
  };
}

export function BooksProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const [books, setBooks] = useState<Book[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [genres, setGenres] = useState<string[]>(DEFAULT_GENRES);
  const [formats, setFormats] = useState<string[]>(DEFAULT_FORMATS);
  const [statuses, setStatuses] = useState<string[]>(DEFAULT_STATUSES);

  // Load books + library settings from DB on mount / user change
  useEffect(() => {
    if (!user) { setBooks([]); setGenres(DEFAULT_GENRES); setFormats(DEFAULT_FORMATS); setStatuses(DEFAULT_STATUSES); setBooksLoading(false); return; }
    setBooksLoading(true);
    const load = async () => {
      try {
        // Load all books with pagination
        const rows = await fetchAllRows("books", user.id);
        setBooks(rows.map(rowToBook));

        // Load library settings
        const { data: settingsData } = await supabase
          .from("library_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (settingsData) {
          if (settingsData.genres?.length) setGenres(settingsData.genres as string[]);
          if (settingsData.formats?.length) setFormats(settingsData.formats as string[]);
          if (settingsData.statuses?.length) setStatuses(settingsData.statuses as string[]);
        }
      } finally {
        setBooksLoading(false);
      }
    };
    load();
  }, [user?.id]);

  // Persist library settings to DB whenever they change
  const saveSettings = useCallback((g: string[], f: string[], s: string[]) => {
    setGenres(g);
    setFormats(f);
    setStatuses(s);
    if (!user) return;
    supabase
      .from("library_settings")
      .upsert({ user_id: user.id, genres: g, formats: f, statuses: s }, { onConflict: "user_id" })
      .then(({ error }) => {
        if (error) {
          console.error("saveSettings error:", error);
          toast.error("Erreur lors de la sauvegarde des paramètres");
        }
      });
  }, [user]);

  const addBook = useCallback((book: Book) => {
    if (!user) return;
    setBooks((prev) => [...prev, book]);
    supabase.from("books").insert(bookToRow(book, user.id)).then(({ error }) => {
      if (error) {
        console.error("addBook error:", error);
        toast.error("Erreur lors de l'enregistrement du livre");
        setBooks((prev) => prev.filter((b) => b.id !== book.id));
      }
    });
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
    supabase.from("books").update(bookToRow(updated, user.id)).eq("id", updated.id).then(({ error }) => {
      if (error) {
        console.error("updateBook error:", error);
        toast.error("Erreur lors de la mise à jour du livre");
      }
    });
  }, [user]);

  const deleteBook = useCallback((id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    supabase.from("books").delete().eq("id", id).then(({ error }) => {
      if (error) {
        console.error("deleteBook error:", error);
        toast.error("Erreur lors de la suppression du livre");
      }
    });
  }, []);

  const markPAL = useCallback((id: string) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "Dans ma PAL" } : b))
    );
    supabase.from("books").update({ status: "Dans ma PAL" }).eq("id", id).then(({ error }) => {
      if (error) {
        console.error("markPAL error:", error);
        toast.error("Erreur lors de la mise à jour du statut");
      }
    });
  }, []);

  return (
    <BooksContext.Provider
      value={{
        books,
        booksLoading,
        genres,
        formats,
        statuses,
        setGenres,
        setFormats,
        setStatuses,
        saveSettings,
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
