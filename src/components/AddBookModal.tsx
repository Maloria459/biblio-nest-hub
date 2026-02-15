import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flame } from "lucide-react";
import type { Book } from "@/data/mockBooks";

interface AddBookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  genres: string[];
  formats: string[];
  statuses: string[];
  onAdd: (book: Book) => void;
}

export function AddBookModal({ open, onOpenChange, genres, formats, statuses, onAdd }: AddBookModalProps) {
  const [coverUrl, setCoverUrl] = useState("");
  const [coverFile, setCoverFile] = useState<string>("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [series, setSeries] = useState("");
  const [publisher, setPublisher] = useState("");
  const [pubDate, setPubDate] = useState("");
  const [price, setPrice] = useState("");
  const [genre, setGenre] = useState("");
  const [format, setFormat] = useState("");
  const [status, setStatus] = useState("");
  const [pages, setPages] = useState("");
  const [chapters, setChapters] = useState("");
  const [spicy, setSpicy] = useState(0);
  const [mature, setMature] = useState(false);

  const reset = () => {
    setCoverUrl(""); setCoverFile(""); setTitle(""); setAuthor(""); setSeries("");
    setPublisher(""); setPubDate(""); setPrice(""); setGenre(""); setFormat("");
    setStatus(""); setPages(""); setChapters(""); setSpicy(0); setMature(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCoverFile(url);
    }
  };

  const resolvedCover = coverFile || coverUrl || undefined;

  const handleSubmit = () => {
    if (!title.trim()) return;
    const book: Book = {
      id: Date.now().toString(),
      title: title.trim(),
      author: author.trim(),
      coverUrl: resolvedCover,
      status: status || "Acheté",
      genre: genre || undefined,
      format: format || undefined,
      publisher: publisher || undefined,
      series: series || undefined,
      pages: pages ? parseInt(pages) : undefined,
      chapters: chapters ? parseInt(chapters) : undefined,
      publicationDate: pubDate || undefined,
      price: price ? parseFloat(price) : undefined,
      spicyLevel: spicy || undefined,
      matureContent: mature || undefined,
    };
    onAdd(book);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un livre</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Cover */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-[140px] h-[190px] rounded-lg border-2 border-dashed border-muted-foreground/30 overflow-hidden flex items-center justify-center bg-muted">
              {resolvedCover ? (
                <img src={resolvedCover} alt="Couverture" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-muted-foreground">Couverture</span>
              )}
            </div>
            <input type="file" accept="image/*" onChange={handleFileChange} className="text-xs w-full max-w-[260px]" />
            <Input placeholder="Ou coller une URL d'image" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} className="max-w-[260px]" />
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

          {/* Series */}
          <div className="space-y-1">
            <Label className="text-xs">Série</Label>
            <Input value={series} onChange={(e) => setSeries(e.target.value)} />
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

          {/* Genre, Format, Status */}
          <div className="grid grid-cols-3 gap-3">
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
            <div className="space-y-1">
              <Label className="text-xs">Statut</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Pages + Chapters */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nombre de pages</Label>
              <Input type="number" value={pages} onChange={(e) => setPages(e.target.value)} className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nombre de chapitres</Label>
              <Input type="number" value={chapters} onChange={(e) => setChapters(e.target.value)} className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            </div>
          </div>

          {/* Spicy + Mature */}
          <div className="flex items-center gap-6">
            <div className="space-y-1">
              <Label className="text-xs">Niveau épicé</Label>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSpicy(spicy === level ? 0 : level)}
                    className="p-0.5"
                  >
                    <Flame className={`h-5 w-5 transition-colors ${level <= spicy ? "fill-foreground text-foreground" : "text-muted-foreground/30"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-4">
              <Checkbox checked={mature} onCheckedChange={(v) => setMature(v === true)} id="mature" />
              <Label htmlFor="mature" className="text-xs">Public averti</Label>
            </div>
          </div>

          {/* Submit */}
          <Button className="w-full mt-2" onClick={handleSubmit}>Ajouter le livre</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
