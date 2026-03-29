import { useState, useEffect, useMemo } from "react";
import { X, BookOpen, BookCheck, Timer, Compass, Flame, Archive, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { OBJECTIVE_TYPES, type ObjectiveTypeOption, type PersonalObjective } from "@/hooks/usePersonalObjectives";
import { useBooks } from "@/contexts/BooksContext";

const CATEGORY_ICONS: Record<string, typeof BookOpen> = {
  Lecture: BookOpen,
  "Livres terminés": BookCheck,
  Sessions: Timer,
  Diversité: Compass,
  Régularité: Flame,
  Bibliothèque: Archive,
  Records: Trophy,
};

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
  const [timeUnit, setTimeUnit] = useState<"minutes" | "hours">("minutes");
  const [secondTarget, setSecondTarget] = useState("");

  const isEditMode = !!editingObjective;

  useEffect(() => {
    if (editingObjective) {
      setSelectedType(editingObjective.objective_type);
      // Parse filter_value JSON
      let fv = editingObjective.filter_value;
      try {
        const parsed = JSON.parse(fv ?? "");
        setFilterValue(parsed.filter ?? "");
        setTimeUnit(parsed.unit ?? "minutes");
        setSecondTarget(parsed.secondTarget ? String(parsed.secondTarget) : "");
      } catch {
        setFilterValue(fv ?? "");
        setTimeUnit("minutes");
        setSecondTarget("");
      }
      setTargetValue(String(editingObjective.target_value));
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
      case "series":
        return [...new Set(books.map((b) => b.series).filter(Boolean) as string[])].sort();
      default:
        return [];
    }
  }, [typeMeta, books, genres, formats]);

  // Period logic
  const showPeriod = !typeMeta?.periodLocked && !typeMeta?.noPeriod;
  const effectivePeriod = typeMeta?.periodLocked ?? (typeMeta?.noPeriod ? "none" : periodType);
  const canBeRecurring = effectivePeriod === "day" || effectivePeriod === "week" || effectivePeriod === "month" || effectivePeriod === "year";

  // Target logic
  const showTarget = !typeMeta?.binary;

  const reset = () => {
    setSelectedType("");
    setTargetValue("");
    setFilterValue("");
    setPeriodType("month");
    setStartDate("");
    setEndDate("");
    setRecurring(false);
    setTouched(false);
    setTimeUnit("minutes");
    setSecondTarget("");
  };

  /* ─── Validation ─── */
  const targetNum = Number(targetValue);
  const isTargetValid = typeMeta?.binary || (targetValue !== "" && targetNum > 0);
  const isFilterRequired = !!typeMeta?.needsFilter;
  const isFilterValid = !isFilterRequired || filterValue.trim().length > 0;
  const isDateValid = effectivePeriod !== "custom" || (startDate && endDate && endDate >= startDate);
  const isSecondTargetValid = !typeMeta?.needsSecondTarget || (secondTarget !== "" && Number(secondTarget) > 0);
  const isFormValid = !!selectedType && isTargetValid && isFilterValid && isDateValid && isSecondTargetValid;

  /* ─── Preview label ─── */
  const previewLabel = useMemo(() => {
    if (!typeMeta) return null;
    const val = typeMeta.binary ? "1" : (targetValue || "…");
    const pLabel = effectivePeriod === "day" ? " aujourd'hui"
      : effectivePeriod === "week" ? " cette semaine"
      : effectivePeriod === "month" ? " ce mois"
      : effectivePeriod === "year" ? " cette année"
      : effectivePeriod === "custom" && startDate && endDate
        ? ` du ${startDate} au ${endDate}`
        : "";
    let label = typeMeta.label.replace("X", val);
    if (typeMeta.needsSecondTarget) {
      label = label.replace("Y", secondTarget || "…");
    }
    // Filter-based labels for genre/author/format
    if (filterValue && typeMeta.needsFilter) {
      const numVal = Number(val) || 0;
      const plural = numVal > 1 ? "s" : "";
      if (typeMeta.needsFilter === "genre") {
        label = `Lire ${val} livre${plural} de ${filterValue}`;
      } else if (typeMeta.needsFilter === "author") {
        label = `Lire ${val} livre${plural} de ${filterValue}`;
      } else if (typeMeta.needsFilter === "format") {
        label = `Lire ${val} livre${plural} en format ${filterValue}`;
      } else if (typeMeta.needsFilter === "series") {
        label = `Finir ${filterValue || "…"}`;
      }
    }
    if (typeMeta.timeUnit) {
      label = label.replace("min/h", timeUnit === "hours" ? "h" : "min")
                   .replace("minutes/heures", timeUnit === "hours" ? "heures" : "minutes");
    }
    return label + pLabel;
  }, [typeMeta, targetValue, effectivePeriod, startDate, endDate, timeUnit, secondTarget, filterValue]);

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = () => {
    setTouched(true);
    if (!isFormValid) return;

    const effectiveRecurring = canBeRecurring ? recurring : false;
    const effectiveTarget = typeMeta?.binary ? 1 : targetNum;

    // Build filter_value
    let fv: string | null = null;
    if (isFilterRequired && filterValue) {
      if (typeMeta?.timeUnit || typeMeta?.needsSecondTarget) {
        fv = JSON.stringify({ filter: filterValue, unit: timeUnit, secondTarget: secondTarget ? Number(secondTarget) : undefined });
      } else {
        fv = JSON.stringify({ filter: filterValue });
      }
    } else if (typeMeta?.timeUnit || typeMeta?.needsSecondTarget) {
      fv = JSON.stringify({ unit: timeUnit, secondTarget: secondTarget ? Number(secondTarget) : undefined });
    }

    const finalPeriod = typeMeta?.periodLocked ?? (typeMeta?.noPeriod ? "month" : periodType);

    if (isEditMode && onUpdate && editingObjective) {
      onUpdate({
        id: editingObjective.id,
        target_value: effectiveTarget,
        filter_value: fv,
        period_type: finalPeriod,
        start_date: finalPeriod === "custom" ? startDate || null : null,
        end_date: finalPeriod === "custom" ? endDate || null : null,
        recurring: effectiveRecurring,
      });
    } else {
      onCreate({
        objective_type: selectedType,
        target_value: effectiveTarget,
        filter_value: fv,
        period_type: finalPeriod,
        start_date: finalPeriod === "custom" ? startDate || null : null,
        end_date: finalPeriod === "custom" ? endDate || null : null,
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
    : typeMeta?.needsFilter === "series" ? "Série"
    : "";

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative z-10 flex flex-col bg-card border border-border rounded-xl shadow-xl overflow-hidden" style={{ width: "90%", maxWidth: 480, maxHeight: "90%" }}>

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
            <Select value={selectedType} onValueChange={(v) => { setSelectedType(v); setFilterValue(""); setSecondTarget(""); }} disabled={isEditMode}>
              <SelectTrigger><SelectValue placeholder="Choisir un type" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {Object.entries(grouped).map(([cat, types]) => {
                  const CatIcon = CATEGORY_ICONS[cat];
                  return (
                    <div key={cat}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1.5 border-b border-border/50 mt-1">
                        {CatIcon && <CatIcon className="h-3.5 w-3.5" />}
                        {cat}
                      </div>
                      {types.map((t) => {
                        const displayLabel = t.label.replace(/X|Y/g, "…").replace("min/h", "min/h").replace("minutes/heures", "min/h");
                        return (
                          <SelectItem key={t.value} value={t.value} className="text-sm">
                            {displayLabel}
                          </SelectItem>
                        );
                      })}
                    </div>
                  );
                })}
              </SelectContent>
            </Select>
            {touched && !selectedType && (
              <p className="text-xs text-destructive">Veuillez choisir un type d'objectif.</p>
            )}
            {typeMeta?.description && (
              <p className="text-xs text-muted-foreground italic">{typeMeta.description}</p>
            )}
          </div>

          {/* Target value (hidden for binary) */}
          {showTarget && selectedType && (
            <div className="space-y-1.5">
              <Label>
                {typeMeta?.inverted ? "Montant maximum (€)" : typeMeta?.timeUnit ? `Durée (${timeUnit === "hours" ? "heures" : "minutes"})` : "Objectif (valeur cible)"}
                {" "}<span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder={typeMeta?.inverted ? "Ex : 100" : "Ex : 12"}
                  className="flex-1"
                />
                {typeMeta?.timeUnit && (
                  <Select value={timeUnit} onValueChange={(v) => setTimeUnit(v as "minutes" | "hours")}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Heures</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              {touched && !isTargetValid && (
                <p className="text-xs text-destructive">La valeur cible doit être un nombre supérieur à 0.</p>
              )}
            </div>
          )}

          {/* Second target for streak types */}
          {typeMeta?.needsSecondTarget && (
            <div className="space-y-1.5">
              <Label>Nombre de jours d'affilée <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                min={1}
                value={secondTarget}
                onChange={(e) => setSecondTarget(e.target.value)}
                placeholder="Ex : 7"
              />
              {touched && !isSecondTargetValid && (
                <p className="text-xs text-destructive">Ce champ est requis.</p>
              )}
            </div>
          )}

          {/* Filter */}
          {isFilterRequired && (
            <div className="space-y-1.5">
              <Label>{filterLabel} <span className="text-destructive">*</span></Label>
              {filterOptions.length > 0 ? (
                <Select value={filterValue} onValueChange={setFilterValue}>
                  <SelectTrigger><SelectValue placeholder={`Choisir un ${filterLabel.toLowerCase()}`} /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {filterOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-muted-foreground italic">Aucun {filterLabel.toLowerCase()} disponible dans votre bibliothèque.</p>
              )}
              {touched && !isFilterValid && (
                <p className="text-xs text-destructive">Ce champ est requis pour ce type d'objectif.</p>
              )}
            </div>
          )}

          {/* Period (hidden if locked or noPeriod) */}
          {showPeriod && selectedType && (
            <div className="space-y-1.5">
              <Label>Période <span className="text-destructive">*</span></Label>
              <Select value={periodType} onValueChange={(v) => { setPeriodType(v); if (v === "custom") setRecurring(false); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="year">Cette année</SelectItem>
                  <SelectItem value="custom">Personnalisée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Locked period info */}
          {typeMeta?.periodLocked && (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">
                Période fixée : <span className="font-medium text-foreground">
                  {typeMeta.periodLocked === "day" ? "Aujourd'hui"
                    : typeMeta.periodLocked === "week" ? "Cette semaine"
                    : typeMeta.periodLocked === "month" ? "Ce mois"
                    : "Cette année"}
                </span>
              </p>
            </div>
          )}

          {effectivePeriod === "custom" && (
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
          {canBeRecurring && selectedType && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Objectif récurrent</Label>
                <p className="text-xs text-muted-foreground">
                  Se réinitialise automatiquement chaque {effectivePeriod === "day" ? "jour" : effectivePeriod === "week" ? "semaine" : effectivePeriod === "month" ? "mois" : "année"}
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
