import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBooks } from "@/contexts/BooksContext";
import { toast } from "sonner";
import { CreateCollectionModal } from "@/components/CreateCollectionModal";
import type { Book } from "@/data/mockBooks";

interface Collection {
  id: string;
  name: string;
  books: Book[];
}

// Stable color from string hash
function spineColor(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  const hue = ((h % 360) + 360) % 360;
  return `hsl(${hue}, 45%, 42%)`;
}

function spineHeight(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 3) - h);
  return 120 + (((h % 50) + 50) % 50); // 120-170px
}

export function CollectionsContent() {
  const { user } = useAuth();
  const { books } = useBooks();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadCollections = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: cols, error } = await supabase
      .from("collections")
      .select("id, name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error || !cols) {
      console.error(error);
      setLoading(false);
      return;
    }

    if (cols.length === 0) {
      setCollections([]);
      setLoading(false);
      return;
    }

    const { data: links } = await supabase
      .from("collection_books")
      .select("collection_id, book_id")
      .in("collection_id", cols.map((c) => c.id));

    const bookMap = new Map(books.map((b) => [b.id, b]));

    const result: Collection[] = cols.map((c) => ({
      id: c.id,
      name: c.name,
      books: (links ?? [])
        .filter((l) => l.collection_id === c.id)
        .map((l) => bookMap.get(l.book_id))
        .filter(Boolean) as Book[],
    }));

    setCollections(result);
    setLoading(false);
  }, [user, books]);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  const handleCreate = async (name: string, bookIds: string[]) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("collections")
      .insert({ name, user_id: user.id })
      .select("id")
      .single();

    if (error || !data) {
      toast.error("Erreur lors de la création de la collection");
      return;
    }

    if (bookIds.length > 0) {
      const { error: linkErr } = await supabase
        .from("collection_books")
        .insert(bookIds.map((bid) => ({ collection_id: data.id, book_id: bid })));
      if (linkErr) console.error(linkErr);
    }

    toast.success("Collection créée !");
    loadCollections();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("collection_books").delete().eq("collection_id", id);
    await supabase.from("collections").delete().eq("id", id);
    setCollections((prev) => prev.filter((c) => c.id !== id));
    toast.success("Collection supprimée");
  };

  return (
    <div className="flex-1 p-4 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Mes collections</h2>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Créer une nouvelle collection
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <p className="text-sm text-muted-foreground text-center py-8">Chargement…</p>
      )}

      {/* Empty state */}
      {!loading && collections.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <BookOpen className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Vous n'avez pas encore de collection.<br />
            Créez-en une pour organiser vos livres !
          </p>
        </div>
      )}

      {/* Collections as shelves - inline, wrapping */}
      <div className="flex flex-wrap gap-6 items-start">
      {collections.map((col) => (
        <div key={col.id} className="space-y-2 inline-block">
          {/* Collection header */}
          <div className="flex items-center gap-1">
            <h3 className="font-semibold text-foreground text-sm">{col.name}</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(col.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          {/* Shelf */}
          <div className="relative">
            {/* Books area */}
            <div
              className="flex items-end gap-1 px-3 pt-3 pb-0"
              style={{
                background: "linear-gradient(180deg, hsl(var(--muted)/0.3) 0%, hsl(var(--muted)/0.15) 100%)",
                borderRadius: "8px 8px 0 0",
              }}
            >
              {col.books.length === 0 && (
                <p className="text-xs text-muted-foreground italic pb-4">
                  Aucun livre dans cette collection
                </p>
              )}
              {col.books.map((book) => {
                const color = spineColor(book.title + book.author);
                const height = spineHeight(book.title);
                return (
                  <div
                    key={book.id}
                    className="flex-shrink-0 flex items-center justify-center rounded-t-sm shadow-md cursor-default select-none transition-transform hover:-translate-y-1"
                    style={{
                      width: 36,
                      height,
                      backgroundColor: color,
                      borderLeft: "1px solid rgba(255,255,255,0.15)",
                      borderRight: "1px solid rgba(0,0,0,0.2)",
                    }}
                    title={`${book.title} — ${book.author}`}
                  >
                    <span
                      className="text-white font-medium text-[10px] leading-tight px-0.5 overflow-hidden"
                      style={{
                        writingMode: "vertical-rl",
                        textOrientation: "mixed",
                        transform: "rotate(180deg)",
                        maxHeight: height - 16,
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {book.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Shelf plank */}
            <div
              className="h-4 rounded-b-md"
              style={{
                background: "linear-gradient(180deg, hsl(30 40% 35%) 0%, hsl(30 35% 28%) 100%)",
                boxShadow: "0 4px 8px -2px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            />
          </div>
        </div>
      ))}
      </div>

      <CreateCollectionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={handleCreate}
      />
    </div>
  );
}
