import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBooks } from "@/contexts/BooksContext";
import { Search } from "lucide-react";

interface CreateCollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (name: string, bookIds: string[]) => void;
}

export function CreateCollectionModal({ open, onOpenChange, onCreated }: CreateCollectionModalProps) {
  const { books } = useBooks();
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const libraryBooks = useMemo(
    () => books.filter((b) => b.status !== "Wishlist"),
    [books]
  );

  const filtered = useMemo(
    () =>
      libraryBooks.filter(
        (b) =>
          b.title.toLowerCase().includes(search.toLowerCase()) ||
          b.author.toLowerCase().includes(search.toLowerCase())
      ),
    [libraryBooks, search]
  );

  const toggle = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreated(name.trim(), Array.from(selectedIds));
    setName("");
    setSearch("");
    setSelectedIds(new Set());
    onOpenChange(false);
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) { setName(""); setSearch(""); setSelectedIds(new Set()); }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle collection</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="col-name">Nom de la collection</Label>
            <Input
              id="col-name"
              placeholder="Ex : Fantasy, Coups de cœur…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Sélectionner des livres</Label>
            <div className="relative mt-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un livre…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <ScrollArea className="h-56 mt-2 border rounded-md">
              <div className="p-2 space-y-1">
                {filtered.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun livre trouvé
                  </p>
                )}
                {filtered.map((book) => (
                  <label
                    key={book.id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedIds.has(book.id)}
                      onCheckedChange={() => toggle(book.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{book.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                    </div>
                  </label>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>
            Créer ({selectedIds.size} livre{selectedIds.size > 1 ? "s" : ""})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
