import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flame, X, Loader2 } from "lucide-react";
import type { Book } from "@/data/mockBooks";
import { SECONDARY_STATUSES } from "@/data/librarySettings";
import { uploadCover } from "@/lib/uploadCover";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { LoanConditionalFields } from "@/components/LoanConditionalFields";

interface EditBookModalProps {
  book: Book;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  genres: string[];
  formats: string[];
  statuses: string[];
  onSave: (book: Book) => void;
}

type CoverMode = "upload" | "url";

export function EditBookModal({ book, open, onOpenChange, genres, formats, statuses, onSave }: EditBookModalProps) {
  const { user } = useAuth();
  const [coverMode, setCoverMode] = useState<CoverMode>("url");
  const [coverUrl, setCoverUrl] = useState("");
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [coverFileObj, setCoverFileObj] = useState<File | null>(null);
  const [coverFileName, setCoverFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [series, setSeries] = useState("");
  const [isbn, setIsbn] = useState("");
  const [publisher, setPublisher] = useState("");
  const [pubDate, setPubDate] = useState("");
  const [price, setPrice] = useState("");
  const [genre, setGenre] = useState("");
  const [format, setFormat] = useState("");
  const [status, setStatus] = useState("");
  const [secondaryStatus, setSecondaryStatus] = useState("");
  const [pages, setPages] = useState("");
  const [chapters, setChapters] = useState("");
  const [spicy, setSpicy] = useState(0);
  const [mature, setMature] = useState(false);
  const [hasPrologue, setHasPrologue] = useState(false);
  const [hasEpilogue, setHasEpilogue] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loanDate, setLoanDate] = useState("");
  const [borrowerName, setBorrowerName] = useState("");
  const [borrowDate, setBorrowDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [lenderName, setLenderName] = useState("");

  useEffect(() => {
    if (open && book) {
      setTitle(book.title || "");
      setAuthor(book.author || "");
      setSeries(book.series || "");
      setIsbn(book.isbn || "");
      setPublisher(book.publisher || "");
      setPubDate(book.publicationDate || "");
      setPrice(book.price != null ? String(book.price) : "");
      setGenre(book.genre || "");
      setFormat(book.format || "");
      setStatus(book.status || "");
      setSecondaryStatus(book.secondaryStatus || "");
      setPages(book.pages != null ? String(book.pages) : "");
      setChapters(book.chapters != null ? String(book.chapters) : "");
      setSpicy(book.spicyLevel || 0);
      setMature(book.matureContent || false);
      setLoanDate(book.loanDate || "");
      setBorrowerName(book.borrowerName || "");
      setBorrowDate(book.borrowDate || "");
      setReturnDate(book.returnDate || "");
      setLenderName(book.lenderName || "");
      setCoverFileObj(null);
      setCoverFileName("");
      if (book.coverUrl) {
        setCoverMode("url");
        setCoverUrl(book.coverUrl);
        setCoverPreview("");
      } else {
        setCoverMode("upload");
        setCoverUrl("");
        setCoverPreview("");
      }
    }
  }, [open, book]);

  const handleSecondaryStatusChange = (val: string) => {
    setSecondaryStatus(val);
    if (val !== "Prêté") { setLoanDate(""); setBorrowerName(""); }
    if (val !== "Emprunté") { setBorrowDate(""); setReturnDate(""); setLenderName(""); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverPreview(URL.createObjectURL(file));
      setCoverFileObj(file);
      setCoverFileName(file.name);
    }
  };

  const handleSwitchMode = (mode: CoverMode) => {
    setCoverMode(mode);
    if (mode === "upload") {
      setCoverUrl("");
    } else {
      setCoverPreview("");
      setCoverFileObj(null);
      setCoverFileName("");
    }
  };

  const resolvedCover = coverMode === "upload" ? coverPreview : coverUrl || undefined;

  const handleSubmit = async () => {
    if (!title.trim() || !user) return;

    let finalCoverUrl: string | undefined = undefined;

    if (coverMode === "upload" && coverFileObj) {
      setUploading(true);
      try {
        finalCoverUrl = await uploadCover(coverFileObj, user.id);
      } catch (err: any) {
        toast.error(err.message || "Erreur lors de l'upload de la couverture");
        setUploading(false);
        return;
      }
      setUploading(false);
    } else if (coverMode === "url" && coverUrl) {
      finalCoverUrl = coverUrl;
    }

    const updatedBook: Book = {
      ...book,
      title: title.trim(),
      author: author.trim(),
      coverUrl: finalCoverUrl,
      status: status || book.status,
      secondaryStatus: (secondaryStatus && secondaryStatus !== "__none__") ? secondaryStatus : undefined,
      genre: genre || undefined,
      format: format || undefined,
      publisher: publisher || undefined,
      series: series || undefined,
      isbn: isbn || undefined,
      pages: pages ? parseInt(pages) : undefined,
      chapters: chapters ? parseInt(chapters) : undefined,
      publicationDate: pubDate || undefined,
      price: price ? parseFloat(price) : undefined,
      spicyLevel: spicy || undefined,
      matureContent: mature || undefined,
      loanDate: secondaryStatus === "Prêté" ? loanDate || undefined : undefined,
      borrowerName: secondaryStatus === "Prêté" ? borrowerName || undefined : undefined,
      borrowDate: secondaryStatus === "Emprunté" ? borrowDate || undefined : undefined,
      returnDate: secondaryStatus === "Emprunté" ? returnDate || undefined : undefined,
      lenderName: secondaryStatus === "Emprunté" ? lenderName || undefined : undefined,
    };
    onSave(updatedBook);
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative z-10 flex flex-col bg-card border border-border rounded-xl shadow-xl overflow-hidden" style={{ width: "50%", maxHeight: "90%" }}>
        <div className="flex items-center justify-between h-14 px-6 border-b border-border shrink-0">
          <h2 className="text-base font-semibold" style={{ fontFamily: "var(--font-display)" }}>Modifier le livre</h2>
          <button onClick={handleClose} className="p-1 rounded-md hover:bg-accent transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-4">
            {/* Cover */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
                <button
                  onClick={() => handleSwitchMode("upload")}
                  className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                    coverMode === "upload" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Télécharger l'image
                </button>
                <button
                  onClick={() => handleSwitchMode("url")}
                  className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                    coverMode === "url" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  URL de l'image
                </button>
              </div>

              <div className="w-[140px] h-[190px] rounded-lg border-2 border-dashed border-muted-foreground/30 overflow-hidden flex items-center justify-center bg-muted">
                {resolvedCover ? (
                  <img src={resolvedCover} alt="Couverture" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-muted-foreground">Couverture</span>
                )}
              </div>

              {coverMode === "upload" ? (
                <div className="flex items-center gap-2">
                  <input type="file" accept="image/*" ref={fileRef} onChange={handleFileChange} className="hidden" />
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>Choisir un fichier</Button>
                  <span className="text-xs text-muted-foreground">{coverFileName || "Aucun fichier sélectionné"}</span>
                </div>
              ) : (
                <Input placeholder="Coller l'URL de l'image..." value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} className="max-w-[300px]" />
              )}
            </div>

            {/* Title + Author */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Titre</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Auteur</Label>
                <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
              </div>
            </div>

            {/* Series + ISBN */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Série</Label>
                <Input value={series} onChange={(e) => setSeries(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">ISBN</Label>
                <Input value={isbn} onChange={(e) => setIsbn(e.target.value)} />
              </div>
            </div>

            {/* Publisher, Date, Price */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Éditeur</Label>
                <Input value={publisher} onChange={(e) => setPublisher(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Date de publication</Label>
                <Input placeholder="JJ/MM/AAAA ou AAAA" value={pubDate} onChange={(e) => setPubDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Prix (€)</Label>
                <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
            </div>

            {/* Genre, Format */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Genre</Label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{genres.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{formats.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Status + Secondary Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Statut</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{statuses.filter(s => !SECONDARY_STATUSES.includes(s)).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Prêt / Emprunt</Label>
                <Select value={secondaryStatus} onValueChange={handleSecondaryStatusChange}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Aucun</SelectItem>
                    {SECONDARY_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Conditional loan/borrow fields */}
            <LoanConditionalFields
              secondaryStatus={secondaryStatus}
              loanDate={loanDate} setLoanDate={setLoanDate}
              borrowerName={borrowerName} setBorrowerName={setBorrowerName}
              borrowDate={borrowDate} setBorrowDate={setBorrowDate}
              returnDate={returnDate} setReturnDate={setReturnDate}
              lenderName={lenderName} setLenderName={setLenderName}
            />

            {/* Pages + Chapters */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nombre de pages</Label>
                <Input type="number" value={pages} onChange={(e) => setPages(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nombre de chapitres</Label>
                <Input type="number" value={chapters} onChange={(e) => setChapters(e.target.value)} />
              </div>
            </div>

            {/* Spicy + Mature */}
            <div className="flex items-center gap-6">
              <div className="space-y-1">
                <Label className="text-xs">Niveau épicé</Label>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button key={level} type="button" onClick={() => setSpicy(spicy === level ? 0 : level)} className="p-0.5">
                      <Flame className={`h-5 w-5 transition-colors ${level <= spicy ? "fill-foreground text-foreground" : "text-muted-foreground/30"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-4 ml-auto">
                <Checkbox checked={mature} onCheckedChange={(v) => setMature(v === true)} id="edit-mature" />
                <Label htmlFor="edit-mature" className="text-xs">Destiné à un public averti</Label>
              </div>
            </div>

            {/* Submit */}
            <Button className="w-full mt-2" onClick={handleSubmit} disabled={uploading}>
              {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Upload en cours...</> : "Mettre à jour le livre"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
