import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { OBJECTIVE_TYPES, type ObjectiveTypeOption, type PersonalObjective } from "@/hooks/usePersonalObjectives";
import { useBooks } from "@/contexts/BooksContext";

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

  const isEditMode = !!editingObjective;

  // Populate fields when editing
  useEffect(() => {
    if (editingObjective) {
      setSelectedType(editingObjective.objective_type);
      setTargetValue(String(editingObjective.target_value));
      setFilterValue(editingObjective.filter_value ?? "");
      setPeriodType(editingObjective.period_type);
      setStartDate(editingObjective.start_date ?? "");
      setEndDate(editingObjective.end_date ?? "");
      setRecurring(editingObjective.recurring ?? false);
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

  // Recurring only makes sense for month/year periods
  const canBeRecurring = periodType === "month" || periodType === "year";

  const reset = () => {
    setSelectedType("");
    setTargetValue("");
    setFilterValue("");
    setPeriodType("month");
    setStartDate("");
    setEndDate("");
    setRecurring(false);
  };

  const isDateValid = periodType !== "custom" || (startDate && endDate && endDate >= startDate);

  const handleSubmit = () => {
    if (!selectedType || !targetValue || !isDateValid) return;

    const effectiveRecurring = canBeRecurring ? recurring : false;

    if (isEditMode && onUpdate && editingObjective) {
      onUpdate({
        id: editingObjective.id,
        target_value: Number(targetValue),
        filter_value: typeMeta?.needsFilter ? filterValue || null : null,
        period_type: periodType,
        start_date: periodType === "custom" ? startDate || null : null,
        end_date: periodType === "custom" ? endDate || null : null,
        recurring: effectiveRecurring,
      });
    } else {
      onCreate({
        objective_type: selectedType,
        target_value: Number(targetValue),
        filter_value: typeMeta?.needsFilter ? filterValue || null : null,
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

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Modifier l'objectif" : "Créer un objectif"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Type — disabled in edit mode */}
          <div className="space-y-1.5">
            <Label>Type d'objectif</Label>
            <Select value={selectedType} onValueChange={setSelectedType} disabled={isEditMode}>
              <SelectTrigger><SelectValue placeholder="Choisir un type" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {Object.entries(grouped).map(([cat, types]) => (
                  <div key={cat}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{cat}</div>
                    {types.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target value */}
          <div className="space-y-1.5">
            <Label>{typeMeta?.inverted ? "Montant maximum (€)" : "Objectif (valeur cible)"}</Label>
            <Input
              type="number"
              min={1}
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder={typeMeta?.inverted ? "Ex : 100" : "Ex : 12"}
            />
          </div>

          {/* Conditional filter */}
          {typeMeta?.needsFilter && (
            <div className="space-y-1.5">
              <Label>
                {typeMeta.needsFilter === "author" && "Auteur"}
                {typeMeta.needsFilter === "genre" && "Genre"}
                {typeMeta.needsFilter === "format" && "Format"}
                {typeMeta.needsFilter === "publisher" && "Éditeur"}
                {typeMeta.needsFilter === "series" && "Série"}
              </Label>
              {filterOptions.length > 0 ? (
                <Select value={filterValue} onValueChange={setFilterValue}>
                  <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {filterOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={filterValue} onChange={(e) => setFilterValue(e.target.value)} placeholder="Saisir une valeur" />
              )}
            </div>
          )}

          {/* Period */}
          <div className="space-y-1.5">
            <Label>Période</Label>
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
                  <Label>Début</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Fin</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              {startDate && endDate && endDate < startDate && (
                <p className="text-xs text-destructive">La date de fin doit être postérieure à la date de début.</p>
              )}
            </div>
          )}

          {/* Recurring toggle */}
          {canBeRecurring && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Objectif récurrent</Label>
                <p className="text-xs text-muted-foreground">
                  Se réinitialise automatiquement chaque {periodType === "month" ? "mois" : "année"}
                </p>
              </div>
              <Switch checked={recurring} onCheckedChange={setRecurring} />
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!selectedType || !targetValue || !isDateValid || isCreating || isUpdating}
            className="w-full"
          >
            {isEditMode ? "Enregistrer les modifications" : "Créer l'objectif"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
