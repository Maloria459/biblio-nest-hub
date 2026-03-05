import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Lock } from "lucide-react";
import { MANDATORY_STATUSES } from "@/data/librarySettings";

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  genres: string[];
  formats: string[];
  statuses: string[];
  onSave: (genres: string[], formats: string[], statuses: string[]) => void;
}

type SettingsTab = "genres" | "formats" | "statuts";

export function SettingsPanel({ open, onOpenChange, genres, formats, statuses, onSave }: SettingsPanelProps) {
  const [tab, setTab] = useState<SettingsTab>("genres");
  const [localGenres, setLocalGenres] = useState<string[]>(genres);
  const [localFormats, setLocalFormats] = useState<string[]>(formats);
  const [localStatuses, setLocalStatuses] = useState<string[]>(statuses);
  const [newItem, setNewItem] = useState("");

  const handleOpenChange = (o: boolean) => {
    if (o) {
      setLocalGenres(genres);
      setLocalFormats(formats);
      setLocalStatuses(statuses);
      setNewItem("");
      isInitialMount.current = true;
    }
    onOpenChange(o);
  };

  const currentList = tab === "genres" ? localGenres : tab === "formats" ? localFormats : localStatuses;
  const setCurrentList = tab === "genres" ? setLocalGenres : tab === "formats" ? setLocalFormats : setLocalStatuses;

  // Auto-save on changes
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!open) return;
    onSave(localGenres, localFormats, localStatuses);
  }, [localGenres, localFormats, localStatuses]);

  const handleAdd = () => {
    const trimmed = newItem.trim();
    if (trimmed && !currentList.includes(trimmed)) {
      setCurrentList([...currentList, trimmed]);
      setNewItem("");
    }
  };

  const handleRemove = (item: string) => {
    if (tab === "statuts" && MANDATORY_STATUSES.includes(item)) return;
    setCurrentList(currentList.filter((i) => i !== item));
  };

  const tabs: { key: SettingsTab; label: string }[] = [
    { key: "genres", label: "Genres" },
    { key: "formats", label: "Formats" },
    { key: "statuts", label: "Statuts" },
  ];

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-[380px] sm:max-w-[380px] flex flex-col p-0">
        {/* Fixed title bar */}
        <div className="flex items-center h-14 px-6 border-b border-border shrink-0">
          <h2 className="text-base font-semibold" style={{ fontFamily: "var(--font-display)" }}>Paramètres de la bibliothèque</h2>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1 mt-4 mx-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setNewItem(""); }}
              className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${
                tab === t.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4 flex-1 py-4 px-6 overflow-y-auto">
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {currentList.map((item) => {
              const isMandatory = tab === "statuts" && MANDATORY_STATUSES.includes(item);
              return (
                <Badge key={item} variant={isMandatory ? "secondary" : "outline"} className="gap-1">
                  {item}
                  {isMandatory ? (
                    <Lock className="h-3 w-3 opacity-50" />
                  ) : (
                    <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemove(item)} />
                  )}
                </Badge>
              );
            })}
          </div>

          {/* Add */}
          <div className="flex gap-2">
            <Input
              placeholder={`Ajouter un ${tab === "genres" ? "genre" : tab === "formats" ? "format" : "statut"}...`}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button variant="outline" onClick={handleAdd}>Ajouter</Button>
          </div>
        </div>

      </SheetContent>
    </Sheet>
  );
}
