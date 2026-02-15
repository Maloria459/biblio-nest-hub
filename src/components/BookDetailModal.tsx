import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Book } from "@/data/mockBooks";

interface BookDetailModalProps {
  book: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookDetailModal({ book, open, onOpenChange }: BookDetailModalProps) {
  if (!book) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{book.title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-[180px] h-[244px] object-cover rounded-lg border-2 border-foreground"
            />
          ) : (
            <div className="w-[180px] h-[244px] bg-muted rounded-lg border-2 border-foreground" />
          )}
          <p className="text-sm text-muted-foreground">{book.author}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
