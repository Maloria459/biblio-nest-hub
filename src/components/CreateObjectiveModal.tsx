import { useState, useEffect, useMemo } from "react";
import { X, BookOpen, Library, Star, Timer, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { OBJECTIVE_TYPES, type ObjectiveTypeOption, type PersonalObjective } from "@/hooks/usePersonalObjectives";
import { useBooks } from "@/contexts/BooksContext";

/* ─── descriptions contextuelles par type ─── */

const OBJECTIVE_DESCRIPTIONS: Record<string, string> = {
  read_books: "Compte les livres marqués comme terminés sur la période.",
  read_pages: "Additionne les pages de tous les livres terminés.",
  read_minutes: "Additionne les minutes de vos sessions de lecture.",
  sessions_count: "Nombre total de sessions de lecture enregistrées.",
  read_author: "Livres terminés dont l'auteur correspond au filtre.",
  read_genre: "Livres terminés dont le genre correspond au filtre.",
  read_format: "Livres terminés dont le format correspond au filtre.",
  read_publisher: "Livres terminés dont l'éditeur correspond au filtre.",
  read_series: "Livres terminés appartenant à la série choisie.",
  read_big_book: "Atteint dès qu'un livre de plus de X pages est terminé.",
  buy_books: "Livres avec le statut « Acheté » sur la période.",
  add_wishlist: "Nombre de livres actuellement dans votre wishlist.",
  add_pal: "Nombre de livres actuellement dans votre PAL.",
  clear_pal: "Livres sortis de votre PAL (terminés) sur la période.",
  loan_books: "Livres actuellement marqués comme « Prêté ».",
  borrow_books: "Livres actuellement marqués comme « Emprunté ».",
  collections_count: "Collections créées sur la période.",
  add_to_collections: "Livres ajoutés à une collection sur la période.",
  write_reviews: "Livres terminés avec un avis rédigé.",
  add_citations: "Nombre total de citations enregistrées.",
  budget_max: "Total dépensé en livres sur la période (ne pas dépasser).",
  coups_de_coeur: "Livres terminés marqués comme coup de cœur.",
  rate_books: "Livres terminés auxquels vous avez attribué une note.",
  avg_rating_above: "Moyenne de vos notes sur tous les livres notés.",
  recommend_books: "Livres marqués comme recommandation du mois.",
  fav_characters: "Livres où vous avez renseigné des personnages préférés.",
  fav_passages: "Livres où vous avez renseigné des passages préférés.",
  reading_days: "Jours distincts où au moins une session a été enregistrée.",
  long_session: "Atteint dès qu'une session dépasse X minutes.",
  pages_in_session: "Atteint dès qu'une session atteint X pages lues.",
  attend_literary_events: "Évènements littéraires enregistrés sur la période.",
  attend_book_clubs: "Clubs de lecteurs auxquels vous avez participé.",
};

const CATEGORY_ICONS: Record<string, typeof BookOpen> = {
  Lecture: BookOpen,
  Bibliothèque: Library,
  Qualité: Star,
  Sessions: Timer,
  Communauté: Users,
};

/* ─── Props ─── */

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (obj: {
    objective_type: string;
    target_value: number;
    filter_value: string | null;
    period_type: string;
    start_date: string | null;
    end_date: string | null;
    pinned: boolean;
    recurring: boolean;
  }) => void;
  onUpdate?: (obj: { id: string; target_value?: number; filter_value?: string | null; period_type?: string; start_date?: string | null; end_date?: string | null; recurring?: boolean }) => void;
  isCreating: boolean;
  isUpdating?: boolean;
  editingObjective?: PersonalObjective | null;
}

export function CreateObjectiveModal({ open, onClose, onCreate, onUpdate, isCreating, isUpdating, editingObjective }: Props) {
  const { books, genres, formats } = useBooks();
  const [selectedType, setSelectedType] = useState<string>("");
  const [targetValue, setTargetValue] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [periodType, setPeriodType] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [touched, setTouched] = useState(false);

  const isEditMode = !!editingObjective;

  useEffect(() => {
    if (editingObjective) {
      setSelectedType(editingObjective.objective_type);
      setTargetValue(String(editingObjective.target_value));
      setFilterValue(editingObjective.filter_value ?? "");
      setPeriodType(editingObjective.period_type);
      setStartDate(editingObjective.start_date ?? "");
      setEndDate(editingObjective.end_date ?? "");
      setRecurring(editingObjective.recurring ?? false);
      setTouched(false);
    }
  }, [editingObjective]);

  const typeMeta = OBJECTIVE_TYPES.find((t) => t.value === selectedType);

  const grouped = useMemo(() => {
    const map: Record<string, ObjectiveTypeOption[]> = {};
    OBJECTIVE_TYPES.forEach((t) => {
      (map[t.category] ??= []).push(t);
    });
    return map;
  }, []);

  const filterOptions = useMemo(() => {
    if (!typeMeta?.needsFilter) return [];
    switch (typeMeta.needsFilter) {
      case "author":
        return [...new Set(books.map((b) => b.author).filter(Boolean))].sort();
      case "genre":
        return [...new Set([...genres, ...books.map((b) => b.genre).filter(Boolean) as string[]])].sort();
      case "format":
        return [...new Set([...formats, ...books.map((b) => b.format).filter(Boolean) as string[]])].sort();
      case "publisher":
        return [...new Set(books.map((b) => b.publisher).filter(Boolean) as string[])].sort();
      case "series":
        return [...new Set(books.map((b) => b.series).filter(Boolean) as string[])].sort();
      default:
        return [];
    }
  }, [typeMeta, books, genres, formats]);

  const canBeRecurring = periodType === "month" || periodType === "year";

  const reset = () => {
    setSelectedType("");
    setTargetValue("");
    setFilterValue("");
    setPeriodType("month");
    setStartDate("");
    setEndDate("");
    setRecurring(false);
    setTouched(false);
  };

  /* ─── Validation ─── */
  const targetNum = Number(targetValue);
  const isTargetValid = targetValue !== "" && targetNum > 0;
  const isFilterRequired = !!typeMeta?.needsFilter;
  const isFilterValid = !isFilterRequired || filterValue.trim().length > 0;
  const isDateValid = periodType !== "custom" || (startDate && endDate && endDate >= startDate);
  const isFormValid = !!selectedType && isTargetValid && isFilterValid && isDateValid;

  /* ─── Preview label ─── */
  const previewLabel = useMemo(() => {
    if (!typeMeta || !targetValue) return null;
    const periodLabel = periodType === "month" ? " (ce mois)"
      : periodType === "year" ? " (cette année)"
      : periodType === "custom" && startDate && endDate
        ? ` (${startDate} → ${endDate})`
        : "";
    return typeMeta.label
      .replace("X", targetValue || "…")
      .replace("{filter}", filterValue || "…")
      + periodLabel;
  }, [typeMeta, targetValue, filterValue, periodType, startDate, endDate]);

  const isDirty = selectedType !== "" || targetValue !== "" || filterValue !== "";

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    setTouched(true);
    if (!isFormValid) return;

    const effectiveRecurring = canBeRecurring ? recurring : false;

    if (isEditMode && onUpdate && editingObjective) {
      onUpdate({
        id: editingObjective.id,
        target_value: targetNum,
        filter_value: isFilterRequired ? filterValue || null : null,
        period_type: periodType,
        start_date: periodType === "custom" ? startDate || null : null,
        end_date: periodType === "custom" ? endDate || null : null,
        recurring: effectiveRecurring,
      });
    } else {
      onCreate({
        objective_type: selectedType,
        target_value: targetNum,
        filter_value: isFilterRequired ? filterValue || null : null,
        period_type: periodType,
        start_date: periodType === "custom" ? startDate || null : null,
        end_date: periodType === "custom" ? endDate || null : null,
        pinned: false,
        recurring: effectiveRecurring,
      });
    }
    reset();
    onClose();
  };

  if (!open) return null;

  const filterLabel = typeMeta?.needsFilter === "author" ? "Auteur"
    : typeMeta?.needsFilter === "genre" ? "Genre"
    : typeMeta?.needsFilter === "format" ? "Format"
    : typeMeta?.needsFilter === "publisher" ? "Éditeur"
    : typeMeta?.needsFilter === "series" ? "Série"
    : "";

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative z-10 flex flex-col bg-card border border-border rounded-xl shadow-xl overflow-hidden" style={{ width: "90%", maxWidth: 450, maxHeight: "90%" }}>

        {/* Header */}
        <div className="flex items-center justify-between h-14 px-6 border-b border-border shrink-0">
          <h2 className="text-base font-semibold">{isEditMode ? "Modifier l'objectif" : "Créer un objectif"}</h2>
          <button onClick={handleClose} className="p-1 rounded-md hover:bg-accent transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Type */}
          <div className="space-y-1.5">
            <Label>Type d'objectif <span className="text-destructive">*</span></Label>
            <Select value={selectedType} onValueChange={(v) => { setSelectedType(v); setFilterValue(""); }} disabled={isEditMode}>
              <SelectTrigger><SelectValue placeholder="Choisir un type" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {Object.entries(grouped).map(([cat, types]) => {
                  const CatIcon = CATEGORY_ICONS[cat];
                  return (
                    <div key={cat}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        {CatIcon && <CatIcon className="h-3.5 w-3.5" />}
                        {cat}
                      </div>
                      {types.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label.replace("X", "…").replace("{filter}", "…")}</SelectItem>
                      ))}
                    </div>
                  );
                })}
              </SelectContent>
            </Select>
            {touched && !selectedType && (
              <p className="text-xs text-destructive">Veuillez choisir un type d'objectif.</p>
            )}
            {typeMeta && OBJECTIVE_DESCRIPTIONS[selectedType] && (
              <p className="text-xs text-muted-foreground italic">{OBJECTIVE_DESCRIPTIONS[selectedType]}</p>
            )}
          </div>

          {/* Target value */}
          <div className="space-y-1.5">
            <Label>{typeMeta?.inverted ? "Montant maximum (€)" : "Objectif (valeur cible)"} <span className="text-destructive">*</span></Label>
            <Input
              type="number"
              min={1}
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder={typeMeta?.inverted ? "Ex : 100" : "Ex : 12"}
            />
            {touched && !isTargetValid && (
              <p className="text-xs text-destructive">La valeur cible doit être un nombre supérieur à 0.</p>
            )}
          </div>

          {/* Filter */}
          {isFilterRequired && (
            <div className="space-y-1.5">
              <Label>{filterLabel} <span className="text-destructive">*</span></Label>
              {filterOptions.length > 0 ? (
                <>
                  <Select value={filterValue} onValueChange={setFilterValue}>
                    <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {filterOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    placeholder={`Ou saisir un ${filterLabel.toLowerCase()} libre`}
                    className="mt-1.5"
                  />
                </>
              ) : (
                <Input value={filterValue} onChange={(e) => setFilterValue(e.target.value)} placeholder={`Saisir un ${filterLabel.toLowerCase()}`} />
              )}
              {touched && !isFilterValid && (
                <p className="text-xs text-destructive">Ce champ est requis pour ce type d'objectif.</p>
              )}
            </div>
          )}

          {/* Period */}
          <div className="space-y-1.5">
            <Label>Période <span className="text-destructive">*</span></Label>
            <Select value={periodType} onValueChange={(v) => { setPeriodType(v); if (v === "custom") setRecurring(false); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
                <SelectItem value="custom">Personnalisée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {periodType === "custom" && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Début <span className="text-destructive">*</span></Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Fin <span className="text-destructive">*</span></Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              {touched && startDate && endDate && endDate < startDate && (
                <p className="text-xs text-destructive">La date de fin doit être postérieure à la date de début.</p>
              )}
              {touched && (!startDate || !endDate) && (
                <p className="text-xs text-destructive">Les deux dates sont requises pour une période personnalisée.</p>
              )}
            </div>
          )}

          {/* Recurring */}
          {canBeRecurring && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Objectif récurrent</Label>
                <p className="text-xs text-muted-foreground">
                  Se réinitialise automatiquement chaque {periodType === "month" ? "mois" : "année"}
                </p>
              </div>
              <Switch checked={recurring} onCheckedChange={setRecurring} />
            </div>
          )}

          {/* Preview */}
          {previewLabel && (
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Aperçu de l'objectif</p>
              <p className="text-sm font-semibold text-foreground">{previewLabel}</p>
            </div>
          )}
        </div>

        {/* Fixed footer */}
        <div className="shrink-0 border-t border-border px-6 py-4">
          <Button
            onClick={handleSubmit}
            disabled={isCreating || isUpdating}
            className="w-full"
          >
            {isEditMode ? "Enregistrer les modifications" : "Créer l'objectif"}
          </Button>
        </div>
      </div>
    </div>
  );
}
