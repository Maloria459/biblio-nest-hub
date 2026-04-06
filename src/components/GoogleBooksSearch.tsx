import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface GoogleBookResult {
  title: string;
  author: string;
  publisher?: string;
  publishedDate?: string;
  pageCount?: number;
  coverUrl?: string;
  isbn?: string;
  genre?: string;
  series?: string;
  synopsis?: string;
  chapters?: number;
  hasPrologue?: boolean;
  hasEpilogue?: boolean;
  source?: "community" | "google";
}

interface Props {
  onSelect: (book: GoogleBookResult) => void;
}

export function GoogleBooksSearch({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GoogleBookResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.trim().length < 3) {
      setResults([]);
      setSearched(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      search(query.trim());
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const search = async (q: string) => {
    setLoading(true);
    setSearched(true);
    
    const isIsbn = /^[\d-]{10,17}$/.test(q.replace(/-/g, ""));
    const allResults: GoogleBookResult[] = [];

    // 1. Try community search (other users' books) for ISBN
    if (isIsbn) {
      try {
        const { data, error } = await supabase.functions.invoke("search-isbn", {
          body: { isbn: q },
        });
        if (!error && data?.book) {
          const b = data.book;
          allResults.push({
            title: b.title || "",
            author: b.author || "",
            publisher: b.publisher || undefined,
            publishedDate: b.publication_date || undefined,
            pageCount: b.pages || undefined,
            coverUrl: b.cover_url || undefined,
            isbn: b.isbn || undefined,
            genre: b.genre || undefined,
            series: b.series || undefined,
            synopsis: b.synopsis || undefined,
            chapters: b.chapters || undefined,
            hasPrologue: b.has_prologue || false,
            hasEpilogue: b.has_epilogue || false,
            source: "community",
          });
        }
      } catch {
        // Silently fail community search
      }
    }

    // 2. Google Books search (with retry)
    const fetchGoogle = async (attempt = 0): Promise<GoogleBookResult[]> => {
      try {
        const searchQuery = isIsbn ? `isbn:${q.replace(/-/g, "")}` : q;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=8&langRestrict=fr`,
          { signal: controller.signal }
        );
        clearTimeout(timeout);
        if (!res.ok) {
          if (attempt < 2) return fetchGoogle(attempt + 1);
          return [];
        }
        const data = await res.json();
        return (data.items || []).map((item: any) => {
          const vol = item.volumeInfo || {};
          const identifiers = vol.industryIdentifiers || [];
          const isbn13 = identifiers.find((id: any) => id.type === "ISBN_13");
          const isbn10 = identifiers.find((id: any) => id.type === "ISBN_10");
          const isbn = isbn13?.identifier || isbn10?.identifier || undefined;
          const genre = vol.categories?.[0] || undefined;
          const series = vol.subtitle || undefined;
          return {
            title: vol.title || "",
            author: (vol.authors || []).join(", "),
            publisher: vol.publisher,
            publishedDate: vol.publishedDate,
            pageCount: vol.pageCount,
            coverUrl: vol.imageLinks?.thumbnail?.replace("http://", "https://"),
            isbn,
            genre,
            series,
            synopsis: vol.description || undefined,
            source: "google" as const,
          };
        });
      } catch {
        if (attempt < 2) return fetchGoogle(attempt + 1);
        return [];
      }
    };
    const googleItems = await fetchGoogle();
    allResults.push(...googleItems);

    setResults(allResults);
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          placeholder="Rechercher un livre (titre, auteur, ISBN)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pr-10"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {results.length > 0 && (
        <ScrollArea className="max-h-[200px] border border-border rounded-lg">
          <div className="divide-y divide-border">
            {results.map((book, i) => (
              <button
                key={i}
                onClick={() => { onSelect(book); setResults([]); setQuery(""); setSearched(false); }}
                className="flex items-center gap-3 w-full p-2 text-left hover:bg-accent/50 transition-colors"
              >
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt="" className="w-8 h-12 object-cover rounded shrink-0" />
                ) : (
                  <div className="w-8 h-12 bg-muted rounded shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium truncate">{book.title}</p>
                    {book.source === "community" && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full shrink-0">Communauté</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {book.author}{book.publisher ? ` · ${book.publisher}` : ""}
                    {book.isbn ? ` · ISBN: ${book.isbn}` : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      )}

      {searched && !loading && results.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">Aucun résultat trouvé</p>
      )}
    </div>
  );
}
