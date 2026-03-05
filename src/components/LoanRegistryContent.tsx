import { useState } from "react";
import { useBooks } from "@/contexts/BooksContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import type { Book } from "@/data/mockBooks";

function formatDateDisplay(dateStr?: string): string {
  if (!dateStr) return "—";
  // If already DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  // If YYYY-MM-DD (from date input)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }
  return dateStr;
}

function getReturnDateStatus(dateStr?: string): "overdue" | "soon" | "normal" {
  if (!dateStr) return "normal";
  let dateObj: Date | null = null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    dateObj = new Date(dateStr);
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split("/");
    dateObj = new Date(`${y}-${m}-${d}`);
  }
  if (!dateObj || isNaN(dateObj.getTime())) return "normal";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dateObj.setHours(0, 0, 0, 0);
  const diff = dateObj.getTime() - today.getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  if (days < 0) return "overdue";
  if (days <= 7) return "soon";
  return "normal";
}

export function LoanRegistryContent() {
  const { books, updateBook } = useBooks();
  const [confirmBook, setConfirmBook] = useState<Book | null>(null);

  const lentBooks = books.filter((b) => b.secondaryStatus === "Prêté");
  const borrowedBooks = books
    .filter((b) => b.secondaryStatus === "Emprunté")
    .sort((a, b) => {
      if (!a.returnDate && !b.returnDate) return 0;
      if (!a.returnDate) return 1;
      if (!b.returnDate) return -1;
      const normalize = (d: string) => {
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
          const [dd, mm, yy] = d.split("/");
          return `${yy}-${mm}-${dd}`;
        }
        return d;
      };
      return normalize(a.returnDate).localeCompare(normalize(b.returnDate));
    });


  const handleReturn = () => {
    if (!confirmBook) return;
    updateBook({
      ...confirmBook,
      secondaryStatus: undefined,
      loanDate: undefined,
      borrowerName: undefined,
      borrowDate: undefined,
      returnDate: undefined,
      lenderName: undefined,
    });
    setConfirmBook(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 h-full">
      {/* LEFT — Livres prêtés */}
      <div className="flex-1 border border-border rounded-xl bg-card flex flex-col min-h-[300px]">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold">📤 Livres prêtés</h3>
          <span className="inline-flex items-center rounded-md border border-border px-2.5 py-0.5 text-xs text-muted-foreground whitespace-nowrap">
            {lentBooks.length} prêté{lentBooks.length > 1 ? "s" : ""}
          </span>
        </div>
        {lentBooks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <p className="text-sm font-medium text-muted-foreground">Aucun livre prêté</p>
            <p className="text-xs text-muted-foreground mt-1">Les livres avec le statut 'Prêté' apparaîtront ici</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-3 py-2 text-left w-12"></th>
                  <th className="px-3 py-2 text-left">Titre</th>
                  <th className="px-3 py-2 text-left">Date de prêt</th>
                  <th className="px-3 py-2 text-left">Prêté à</th>
                  <th className="px-3 py-2 text-center w-16">Rendu</th>
                </tr>
              </thead>
              <tbody>
                {lentBooks.map((book) => (
                  <tr key={book.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2">
                      <div className="w-8 h-11 rounded overflow-hidden bg-muted flex-shrink-0">
                        {book.coverUrl ? (
                          <img src={book.coverUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-muted" />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 font-medium truncate max-w-[200px]">{book.title}</td>
                    <td className="px-3 py-2 text-muted-foreground">{formatDateDisplay(book.loanDate)}</td>
                    <td className="px-3 py-2 text-muted-foreground truncate max-w-[150px]">{book.borrowerName || "—"}</td>
                    <td className="px-3 py-2 text-center">
                      <Checkbox onCheckedChange={() => setConfirmBook(book)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RIGHT — Livres empruntés */}
      <div className="flex-1 border border-border rounded-xl bg-card flex flex-col min-h-[300px]">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold">📥 Livres empruntés</h3>
          <span className="inline-flex items-center rounded-md border border-border px-2.5 py-0.5 text-xs text-muted-foreground whitespace-nowrap">
            {borrowedBooks.length} emprunté{borrowedBooks.length > 1 ? "s" : ""}
          </span>
        </div>
        {borrowedBooks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <p className="text-sm font-medium text-muted-foreground">Aucun livre emprunté</p>
            <p className="text-xs text-muted-foreground mt-1">Les livres avec le statut 'Emprunté' apparaîtront ici</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-3 py-2 text-left w-12"></th>
                  <th className="px-3 py-2 text-left">Titre</th>
                  <th className="px-3 py-2 text-left">Date d'emprunt</th>
                  <th className="px-3 py-2 text-left">Date de restitution</th>
                  <th className="px-3 py-2 text-left">Emprunté à</th>
                  <th className="px-3 py-2 text-center w-16">Rendu</th>
                </tr>
              </thead>
              <tbody>
                {borrowedBooks.map((book) => {
                  const returnStatus = getReturnDateStatus(book.returnDate);
                  return (
                    <tr key={book.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2">
                        <div className="w-8 h-11 rounded overflow-hidden bg-muted flex-shrink-0">
                          {book.coverUrl ? (
                            <img src={book.coverUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-muted" />
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 font-medium truncate max-w-[180px]">{book.title}</td>
                      <td className="px-3 py-2 text-muted-foreground">{formatDateDisplay(book.borrowDate)}</td>
                      <td className="px-3 py-2">
                        <span className={
                          returnStatus === "overdue"
                            ? "text-red-500 font-medium"
                            : returnStatus === "soon"
                            ? "text-amber-600 font-medium"
                            : "text-muted-foreground"
                        }>
                          {returnStatus === "overdue" && "⚠️ "}
                          {formatDateDisplay(book.returnDate)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground truncate max-w-[150px]">{book.lenderName || "—"}</td>
                      <td className="px-3 py-2 text-center">
                        <Checkbox onCheckedChange={() => setConfirmBook(book)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation dialog */}
      <AlertDialog open={!!confirmBook} onOpenChange={(o) => { if (!o) setConfirmBook(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer que ce livre a été rendu ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le statut de prêt/emprunt sera retiré et les informations associées seront effacées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non</AlertDialogCancel>
            <AlertDialogAction onClick={handleReturn}>Oui</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
