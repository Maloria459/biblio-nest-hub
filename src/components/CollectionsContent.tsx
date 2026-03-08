import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Pencil, BookOpen } from "lucide-react";
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

// Extract dominant color from an image URL via a small canvas sample
function extractDominantColor(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve("hsl(0 0% 30%)"); return; }
      canvas.width = 16;
      canvas.height = 16;
      ctx.drawImage(img, 0, 0, 16, 16);
      const data = ctx.getImageData(0, 0, 16, 16).data;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
      }
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
      // Darken slightly for readability
      r = Math.round(r * 0.7);
      g = Math.round(g * 0.7);
      b = Math.round(b * 0.7);
      resolve(`rgb(${r},${g},${b})`);
    };
    img.onerror = () => resolve("hsl(0 0% 30%)");
    img.src = url;
  });
}

// Fallback color from string hash (monochrome)
function fallbackColor(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  const lightness = 25 + (((h % 20) + 20) % 20); // 25-45%
  return `hsl(0 0% ${lightness}%)`;
}

function spineHeight(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 3) - h);
  return 120 + (((h % 50) + 50) % 50);
}

// Component for a single book spine that extracts dominant cover color
function BookSpine({ book }: { book: Book }) {
  const [color, setColor] = useState<string>(fallbackColor(book.title + book.author));
  const height = spineHeight(book.title);

  useEffect(() => {
    if (book.coverUrl) {
      extractDominantColor(book.coverUrl).then(setColor);
    }
  }, [book.coverUrl, book.title, book.author]);

  return (
    <div
      className="flex-shrink-0 flex items-center justify-center rounded-t-sm shadow-md cursor-default select-none transition-transform hover:-translate-y-1"
      style={{
        width: 36,
        height,
        backgroundColor: color,
        borderLeft: "1px solid rgba(255,255,255,0.1)",
        borderRight: "1px solid rgba(0,0,0,0.15)",
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
}

export function CollectionsContent() {
  const { user } = useAuth();
  const { books } = useBooks();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
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

  const handleEdit = async (name: string, bookIds: string[]) => {
    if (!user || !editingCollection) return;

    // Update name
    await supabase.from("collections").update({ name }).eq("id", editingCollection.id);

    // Replace books: delete all then re-insert
    await supabase.from("collection_books").delete().eq("collection_id", editingCollection.id);
    if (bookIds.length > 0) {
      await supabase
        .from("collection_books")
        .insert(bookIds.map((bid) => ({ collection_id: editingCollection.id, book_id: bid })));
    }

    toast.success("Collection modifiée !");
    setEditingCollection(null);
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

      {/* Collections as shelves - inline, aligned by bottom (shelf plank) */}
      <div className="flex flex-wrap gap-6 items-end">
        {collections.map((col) => (
          <div key={col.id} className="group inline-flex flex-col items-center">
            {/* Shelf */}
            <div className="relative">
              <div className="flex items-end gap-1 px-2 pb-0">
                {col.books.length === 0 && (
                  <p className="text-xs text-muted-foreground italic pb-2 px-2">
                    Aucun livre
                  </p>
                )}
                {col.books.map((book) => (
                  <BookSpine key={book.id} book={book} />
                ))}
              </div>
              <div
                className="h-3 rounded-sm"
                style={{
                  background: "linear-gradient(180deg, hsl(0 0% 25%) 0%, hsl(0 0% 18%) 100%)",
                  boxShadow: "0 3px 6px -2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
                }}
              />
            </div>

            {/* Title + hover actions below shelf, centered */}
            <div className="flex items-center justify-center gap-1 mt-1.5">
              <h3 className="font-semibold text-foreground text-sm truncate">{col.name}</h3>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => setEditingCollection(col)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(col.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create modal */}
      <CreateCollectionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={handleCreate}
      />

      {/* Edit modal (reuses same component) */}
      {editingCollection && (
        <CreateCollectionModal
          open={true}
          onOpenChange={(o) => { if (!o) setEditingCollection(null); }}
          onCreated={handleEdit}
          initialName={editingCollection.name}
          initialBookIds={editingCollection.books.map((b) => b.id)}
          editMode
        />
      )}
    </div>
  );
}
