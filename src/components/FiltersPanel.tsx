import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { Book } from "@/data/mockBooks";

export interface Filters {
  authors: string[];
  genres: string[];
  publishers: string[];
  series: string;
  formats: string[];
  status: string;
  readMonth: string;
  readYear: string;
  minRating: number;
  coupDeCoeurOnly: boolean;
}

export const emptyFilters: Filters = {
  authors: [],
  genres: [],
  publishers: [],
  series: "",
  formats: [],
  status: "",
  readMonth: "",
  readYear: "",
  minRating: 0,
  coupDeCoeurOnly: false,
};

interface FiltersPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: Filters;
  onApply: (filters: Filters) => void;
  books: Book[];
  settingsGenres: string[];
  settingsFormats: string[];
  settingsStatuses: string[];
}

export function FiltersPanel({
  open,
  onOpenChange,
  filters,
  onApply,
  books,
  settingsGenres,
  settingsFormats,
  settingsStatuses,
}: FiltersPanelProps) {
  const [local, setLocal] = useState<Filters>(filters);

  // Reset local when opening
  const handleOpenChange = (o: boolean) => {
    if (o) setLocal(filters);
    onOpenChange(o);
  };

  const allAuthors = useMemo(() => [...new Set(books.map((b) => b.author))].sort(), [books]);
  const allPublishers = useMemo(() => [...new Set(books.map((b) => b.publisher).filter(Boolean) as string[])].sort(), [books]);
  const allSeries = useMemo(() => [...new Set(books.map((b) => b.series).filter(Boolean) as string[])].sort(), [books]);

  const [authorQuery, setAuthorQuery] = useState("");
  const authorSuggestions = authorQuery.length >= 1
    ? allAuthors.filter((a) => a.toLowerCase().includes(authorQuery.toLowerCase()) && !local.authors.includes(a)).slice(0, 5)
    : [];

  const months = [
    { value: "01", label: "Janvier" }, { value: "02", label: "Février" }, { value: "03", label: "Mars" },
    { value: "04", label: "Avril" }, { value: "05", label: "Mai" }, { value: "06", label: "Juin" },
    { value: "07", label: "Juillet" }, { value: "08", label: "Août" }, { value: "09", label: "Septembre" },
    { value: "10", label: "Octobre" }, { value: "11", label: "Novembre" }, { value: "12", label: "Décembre" },
  ];

  const toggleInArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-[380px] sm:max-w-[380px] flex flex-col overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filtres</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-5 flex-1 py-4">
          {/* Author */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide">Par auteur</Label>
            <Input
              placeholder="Rechercher un auteur..."
              value={authorQuery}
              onChange={(e) => setAuthorQuery(e.target.value)}
            />
            {authorSuggestions.length > 0 && (
              <div className="border rounded-md bg-popover">
                {authorSuggestions.map((a) => (
                  <button
                    key={a}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent"
                    onClick={() => { setLocal({ ...local, authors: [...local.authors, a] }); setAuthorQuery(""); }}
                  >
                    {a}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1">
              {local.authors.map((a) => (
                <Badge key={a} variant="secondary" className="gap-1">
                  {a}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setLocal({ ...local, authors: local.authors.filter((x) => x !== a) })} />
                </Badge>
              ))}
            </div>
          </div>

          {/* Genre */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide">Par genre</Label>
            <div className="flex flex-wrap gap-1.5">
              {settingsGenres.map((g) => (
                <Badge
                  key={g}
                  variant={local.genres.includes(g) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setLocal({ ...local, genres: toggleInArray(local.genres, g) })}
                >
                  {g}
                </Badge>
              ))}
            </div>
          </div>

          {/* Publisher */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide">Par éditeur</Label>
            <div className="flex flex-wrap gap-1.5">
              {allPublishers.map((p) => (
                <Badge
                  key={p}
                  variant={local.publishers.includes(p) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setLocal({ ...local, publishers: toggleInArray(local.publishers, p) })}
                >
                  {p}
                </Badge>
              ))}
            </div>
          </div>

          {/* Series */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide">Par série</Label>
            <Select value={local.series || "__all__"} onValueChange={(v) => setLocal({ ...local, series: v === "__all__" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Toutes les séries" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Toutes</SelectItem>
                {allSeries.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide">Par format</Label>
            <div className="flex flex-wrap gap-1.5">
              {settingsFormats.map((f) => (
                <Badge
                  key={f}
                  variant={local.formats.includes(f) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setLocal({ ...local, formats: toggleInArray(local.formats, f) })}
                >
                  {f}
                </Badge>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide">Par statut</Label>
            <Select value={local.status || "__all__"} onValueChange={(v) => setLocal({ ...local, status: v === "__all__" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tous</SelectItem>
                {settingsStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Read period */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide">Livres lus par période</Label>
            <div className="flex gap-2">
              <Select value={local.readMonth || "__all__"} onValueChange={(v) => setLocal({ ...local, readMonth: v === "__all__" ? "" : v })}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Mois" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tous</SelectItem>
                  {months.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                placeholder="Année"
                className="w-24"
                type="number"
                value={local.readYear}
                onChange={(e) => setLocal({ ...local, readYear: e.target.value })}
              />
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide">Par note (≥ {local.minRating})</Label>
            <Slider
              min={0}
              max={5}
              step={0.5}
              value={[local.minRating]}
              onValueChange={([v]) => setLocal({ ...local, minRating: v })}
            />
          </div>

          {/* Coup de coeur */}
          <div className="flex items-center gap-3">
            <Switch
              checked={local.coupDeCoeurOnly}
              onCheckedChange={(v) => setLocal({ ...local, coupDeCoeurOnly: v })}
            />
            <Label>Coup de cœur uniquement</Label>
          </div>
        </div>

        <SheetFooter className="flex-row gap-2 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={() => setLocal(emptyFilters)}>
            Effacer les filtres
          </Button>
          <Button className="flex-1" onClick={() => { onApply(local); onOpenChange(false); }}>
            Appliquer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
