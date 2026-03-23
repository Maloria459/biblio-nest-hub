import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface GoogleBookResult {
  title: string;
  author: string;
  publisher?: string;
  publishedDate?: string;
  pageCount?: number;
  coverUrl?: string;
  description?: string;
}

interface Props {
  onSelect: (book: GoogleBookResult) => void;
}

export function GoogleBooksSearch({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GoogleBookResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8&langRestrict=fr`
      );
      const data = await res.json();
      const items = (data.items || []).map((item: any) => {
        const info = item.volumeInfo;
        return {
          title: info.title || "",
          author: (info.authors || []).join(", "),
          publisher: info.publisher,
          publishedDate: info.publishedDate,
          pageCount: info.pageCount,
          coverUrl: info.imageLinks?.thumbnail?.replace("http://", "https://"),
          description: info.description,
        } as GoogleBookResult;
      });
      setResults(items);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Rechercher un livre (titre, auteur, ISBN)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          className="flex-1"
        />
        <Button variant="outline" size="icon" onClick={search} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
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
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{book.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{book.author}{book.publisher ? ` · ${book.publisher}` : ""}</p>
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
