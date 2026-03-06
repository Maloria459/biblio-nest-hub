import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Pencil, Trash2, X, Check, Search, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBooks } from "@/contexts/BooksContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Book } from "@/data/mockBooks";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Collection {
  id: string;
  name: string;
  bookIds: string[];
}

// Deterministic hash from string to number [0,1)
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return (((h >>> 0) % 10000) / 10000);
}

function spineWidth(bookId: string): number {
  return 28 + Math.floor(hashStr("w-" + bookId) * 28); // 28–55
}

function spineHeight(bookId: string): number {
  return 85 + Math.floor(hashStr("h-" + bookId) * 16); // 85–100%
}

// ─── Bookshelf Card ───

function BookshelfCard({
  collection,
  books,
  onEdit,
  onDelete,
}: {
  collection: Collection;
  books: Book[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const collectionBooks = useMemo(
    () => collection.bookIds.map((id) => books.find((b) => b.id === id)).filter(Boolean) as Book[],
    [collection.bookIds, books]
  );
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex flex-col items-center group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative w-full">
        {/* action buttons */}
        <div
          className={`absolute top-2 right-2 z-10 flex gap-1 transition-opacity ${hovered ? "opacity-100" : "opacity-0"}`}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="h-7 w-7 rounded-full border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors"
            title="Modifier"
          >
            <Pencil className="h-3.5 w-3.5 text-foreground" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="h-7 w-7 rounded-full border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors"
            title="Supprimer"
          >
            <Trash2 className="h-3.5 w-3.5 text-foreground" />
          </button>
        </div>

        {/* shelf */}
        <div
          className="rounded-lg border border-border bg-muted/40 p-[0.4em] flex items-end gap-[4px] overflow-hidden transition-shadow"
          style={{ height: 220, minWidth: 180, maxWidth: 400 }}
        >
          {collectionBooks.map((book) => {
            const w = spineWidth(book.id);
            const hPct = spineHeight(book.id);
            return (
              <div
                key={book.id}
                className="relative flex-shrink-0 rounded-sm border border-foreground/80 bg-background cursor-pointer transition-all duration-500 ease-in-out hover:flex-[2]"
                style={{
                  width: w,
                  height: `${hPct}%`,
                  minWidth: 24,
                  flex: "0 1 auto",
                }}
                title={`${book.title} — ${book.author}`}
              >
                <span
                  className="absolute left-1/2 bottom-2 origin-center text-foreground font-medium uppercase tracking-wider select-none whitespace-nowrap overflow-hidden"
                  style={{
                    transform: "translateX(-50%) rotate(-90deg)",
                    fontSize: Math.min(11, w * 0.28),
                    width: `calc(${hPct}% - 12px)`,
                    minWidth: 0,
                    textOverflow: "ellipsis",
                    transformOrigin: "center center",
                    writingMode: "vertical-rl",
                    textOrientation: "mixed",
                    letterSpacing: "0.1em",
                    lineHeight: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    height: "auto",
                    maxHeight: "90%",
                  }}
                >
                  {book.title}
                </span>
              </div>
            );
          })}
          {collectionBooks.length === 0 && (
            <div className="flex items-center justify-center w-full h-full text-muted-foreground text-xs">
              Vide
            </div>
          )}
        </div>
      </div>
      <p className="mt-2 text-sm font-semibold text-foreground text-center truncate max-w-full">
        {collection.name}
      </p>
    </div>
  );
}

// ─── Create / Edit Modal ───

function CollectionModal({
  open,
  onOpenChange,
  books,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  books: Book[];
  initial?: Collection | null;
  onSave: (name: string, bookIds: string[]) => void;
}) {
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setSelectedIds(initial?.bookIds ?? []);
      setSearch("");
    }
  }, [open, initial]);

  const sortedBooks = useMemo(
    () => [...books].sort((a, b) => a.title.localeCompare(b.title)),
    [books]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return sortedBooks;
    const q = search.toLowerCase();
    return sortedBooks.filter((b) => b.title.toLowerCase().includes(q));
  }, [sortedBooks, search]);

  const canSave = name.trim().length > 0 && selectedIds.length > 0;

  const addBook = (id: string) => setSelectedIds((p) => [...p, id]);
  const removeBook = (id: string) => setSelectedIds((p) => p.filter((x) => x !== id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{initial ? "Modifier la collection" : "Créer une collection"}</DialogTitle>
          <DialogDescription className="sr-only">
            {initial ? "Modifiez le nom et les livres de cette collection" : "Donnez un nom et sélectionnez des livres pour cette collection"}
          </DialogDescription>
        </DialogHeader>

        {/* Name */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Nom de la collection</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 50))}
            placeholder="Ex: Mes classiques préférés"
          />
          <p className="text-xs text-muted-foreground text-right">{name.length}/50</p>
        </div>

        {/* Selected chips */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">
            Livres sélectionnés ({selectedIds.length})
          </label>
          {selectedIds.length === 0 ? (
            <div className="border border-dashed border-border rounded-md p-4 text-center text-sm text-muted-foreground">
              Aucun livre sélectionné
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 border border-border rounded-md p-2 max-h-28 overflow-y-auto">
              {selectedIds.map((id) => {
                const book = books.find((b) => b.id === id);
                if (!book) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-foreground"
                  >
                    {book.coverUrl && (
                      <img src={book.coverUrl} alt="" className="h-5 w-3.5 rounded-sm object-cover" />
                    )}
                    <span className="max-w-[120px] truncate">{book.title}</span>
                    <button onClick={() => removeBook(id)} className="ml-0.5 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un livre par titre..."
            className="pl-8 pr-8"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Book list */}
        <ScrollArea className="flex-1 min-h-0 max-h-[300px] border border-border rounded-md">
          <div className="divide-y divide-border">
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">Aucun livre trouvé</p>
            )}
            {filtered.map((book) => {
              const selected = selectedIds.includes(book.id);
              return (
                <div
                  key={book.id}
                  className={`flex items-center gap-3 px-3 py-2 ${selected ? "opacity-50" : ""}`}
                >
                  <div className="w-10 h-[60px] rounded-sm border border-border overflow-hidden flex-shrink-0 bg-muted">
                    {book.coverUrl ? (
                      <img src={book.coverUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{book.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                  </div>
                  <button
                    disabled={selected}
                    onClick={() => addBook(book.id)}
                    className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform ${
                      selected
                        ? "bg-muted text-muted-foreground cursor-default"
                        : "bg-foreground text-background hover:scale-110"
                    }`}
                  >
                    {selected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex flex-col gap-2 pt-2">
          <Button
            disabled={!canSave}
            onClick={() => { onSave(name.trim(), selectedIds); onOpenChange(false); }}
            className="w-full"
          >
            {initial ? "Enregistrer les modifications" : "Enregistrer cette collection"}
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Content ───

export function CollectionsContent() {
  const { books } = useBooks();
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null);

  // Load collections from DB
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: cols, error } = await supabase
        .from("collections")
        .select("id, name")
        .eq("user_id", user.id);
      if (error) { console.error(error); return; }
      if (!cols?.length) { setCollections([]); return; }

      const { data: links } = await supabase
        .from("collection_books")
        .select("collection_id, book_id")
        .in("collection_id", cols.map((c: any) => c.id));

      const map = new Map<string, string[]>();
      (links ?? []).forEach((l: any) => {
        const arr = map.get(l.collection_id) ?? [];
        arr.push(l.book_id);
        map.set(l.collection_id, arr);
      });

      setCollections(
        cols.map((c: any) => ({ id: c.id, name: c.name, bookIds: map.get(c.id) ?? [] }))
      );
    };
    load();
  }, [user?.id]);

  const handleSave = useCallback(
    async (name: string, bookIds: string[]) => {
      if (!user) return;

      if (editingCollection) {
        // Update
        const { error } = await supabase
          .from("collections")
          .update({ name })
          .eq("id", editingCollection.id);
        if (error) { toast.error("Erreur lors de la mise à jour"); return; }

        // Replace books: delete all, re-insert
        await supabase.from("collection_books").delete().eq("collection_id", editingCollection.id);
        if (bookIds.length) {
          await supabase.from("collection_books").insert(
            bookIds.map((bid) => ({ collection_id: editingCollection.id, book_id: bid }))
          );
        }
        setCollections((prev) =>
          prev.map((c) => (c.id === editingCollection.id ? { ...c, name, bookIds } : c))
        );
        setEditingCollection(null);
        toast.success("Collection modifiée");
      } else {
        // Create
        const { data, error } = await supabase
          .from("collections")
          .insert({ user_id: user.id, name })
          .select("id")
          .single();
        if (error || !data) { toast.error("Erreur lors de la création"); return; }
        const newId = data.id;
        if (bookIds.length) {
          await supabase.from("collection_books").insert(
            bookIds.map((bid) => ({ collection_id: newId, book_id: bid }))
          );
        }
        setCollections((prev) => [...prev, { id: newId, name, bookIds }]);
        toast.success("Collection créée");
      }
    },
    [user, editingCollection]
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("collections").delete().eq("id", deleteTarget.id);
    if (error) { toast.error("Erreur lors de la suppression"); return; }
    setCollections((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success("Collection supprimée");
  }, [deleteTarget]);

  // Filter out books that no longer exist
  const validCollections = useMemo(() => {
    const bookIdSet = new Set(books.map((b) => b.id));
    return collections.map((c) => ({
      ...c,
      bookIds: c.bookIds.filter((id) => bookIdSet.has(id)),
    }));
  }, [collections, books]);

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Mes collections</h2>
        <Button
          onClick={() => { setEditingCollection(null); setModalOpen(true); }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Créer une collection
        </Button>
      </div>

      {/* Grid or empty state */}
      {validCollections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <span className="text-4xl">📚</span>
          <p className="text-base font-semibold text-foreground">Aucune collection pour le moment</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Créez votre première collection pour organiser vos livres par thème, genre ou envie.
          </p>
          <Button
            onClick={() => { setEditingCollection(null); setModalOpen(true); }}
            className="mt-2 gap-2"
          >
            <Plus className="h-4 w-4" /> Créer une collection
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {validCollections.map((col) => (
            <BookshelfCard
              key={col.id}
              collection={col}
              books={books}
              onEdit={() => { setEditingCollection(col); setModalOpen(true); }}
              onDelete={() => setDeleteTarget(col)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      <CollectionModal
        open={modalOpen}
        onOpenChange={(v) => { setModalOpen(v); if (!v) setEditingCollection(null); }}
        books={books}
        initial={editingCollection}
        onSave={handleSave}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette collection ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les livres ne seront pas supprimés de votre bibliothèque.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
