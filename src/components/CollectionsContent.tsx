import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Pencil, BookOpen, EllipsisVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
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

// Extract two dominant colors from an image for a gradient
function extractGradientColors(url: string): Promise<[string, string]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(["hsl(0 0% 30%)", "hsl(0 0% 20%)"]); return; }
      canvas.width = 16;
      canvas.height = 16;
      ctx.drawImage(img, 0, 0, 16, 16);
      const data = ctx.getImageData(0, 0, 16, 16).data;
      // Top half for color 1, bottom half for color 2
      let r1 = 0, g1 = 0, b1 = 0, c1 = 0;
      let r2 = 0, g2 = 0, b2 = 0, c2 = 0;
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const i = (y * 16 + x) * 4;
          if (y < 8) { r1 += data[i]; g1 += data[i+1]; b1 += data[i+2]; c1++; }
          else { r2 += data[i]; g2 += data[i+1]; b2 += data[i+2]; c2++; }
        }
      }
      const darken = (v: number) => Math.round(v * 0.75);
      const col1 = `rgb(${darken(r1/c1)},${darken(g1/c1)},${darken(b1/c1)})`;
      const col2 = `rgb(${darken(r2/c2)},${darken(g2/c2)},${darken(b2/c2)})`;
      resolve([col1, col2]);
    };
    img.onerror = () => resolve(["hsl(0 0% 30%)", "hsl(0 0% 20%)"]);
    img.src = url;
  });
}

// Fallback gradient from string hash
function fallbackGradient(str: string): [string, string] {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  const l1 = 25 + (((h % 15) + 15) % 15);
  const l2 = l1 + 10;
  return [`hsl(0 0% ${l1}%)`, `hsl(0 0% ${l2}%)`];
}

function spineHeight(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 3) - h);
  return 120 + (((h % 50) + 50) % 50);
}

// Component for a single book spine that extracts dominant cover color
function BookSpine({ book }: { book: Book }) {
  const [gradient, setGradient] = useState<[string, string]>(fallbackGradient(book.title + book.author));
  const height = spineHeight(book.title);

  useEffect(() => {
    if (book.coverUrl) {
      extractGradientColors(book.coverUrl).then(setGradient);
    }
  }, [book.coverUrl, book.title, book.author]);

  return (
    <div
      className="flex-shrink-0 flex items-center justify-center rounded-t-sm shadow-md cursor-default select-none transition-transform hover:-translate-y-1"
      style={{
        width: 36,
        height,
        background: `linear-gradient(180deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`,
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
      .select("id, name, sort_order")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
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
    const nextOrder = collections.length;
    const { data, error } = await supabase
      .from("collections")
      .insert({ name, user_id: user.id, sort_order: nextOrder })
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

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || result.source.index === result.destination.index) return;
    const reordered = Array.from(collections);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setCollections(reordered);

    // Persist new order
    const updates = reordered.map((col, i) =>
      supabase.from("collections").update({ sort_order: i }).eq("id", col.id)
    );
    await Promise.all(updates);
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
      <div className="flex justify-end">
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
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="collections" direction="horizontal">
          {(provided) => (
            <div
              className="flex flex-wrap gap-6 items-end"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {collections.map((col, index) => (
                <Draggable key={col.id} draggableId={col.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`group inline-flex flex-col items-center ${snapshot.isDragging ? "opacity-80" : ""}`}
                    >
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

                      {/* Title centered + grip left + menu right */}
                      <div className="w-full flex items-center mt-1.5" {...provided.dragHandleProps} style={{ cursor: "grab" }}>
                        <div className="flex-1 flex justify-center min-w-0">
                          <h3 className="font-semibold text-foreground text-sm truncate text-center">{col.name}</h3>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground flex-shrink-0">
                              <EllipsisVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingCollection(col)}>
                              <Pencil className="h-3.5 w-3.5 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(col.id)}>
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

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
