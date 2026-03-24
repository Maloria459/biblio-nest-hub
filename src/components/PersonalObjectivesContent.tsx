import { useState, useMemo, useEffect, useRef } from "react";
import { usePersonalObjectives, OBJECTIVE_TYPES, type PersonalObjective, type ObjectiveWithProgress } from "@/hooks/usePersonalObjectives";
import { CreateObjectiveModal } from "@/components/CreateObjectiveModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pin, PinOff, Trash2, Target, Pencil, Copy, RefreshCw, PartyPopper, Search, ArrowUpDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import confetti from "canvas-confetti";
import { toast } from "sonner";

function getProgressColor(pct: number, inverted?: boolean): string {
  if (inverted) {
    // For inverted (budget): green when low, red when high
    if (pct < 50) return "bg-green-500";
    if (pct < 85) return "bg-orange-500";
    return "bg-red-500";
  }
  if (pct >= 75) return "bg-green-500";
  if (pct >= 25) return "bg-orange-500";
  return "bg-red-500";
}

const CATEGORY_OPTIONS = [
  { value: "all", label: "Toutes les catégories" },
  { value: "Lecture", label: "Lecture" },
  { value: "Bibliothèque", label: "Bibliothèque" },
  { value: "Qualité", label: "Qualité / Engagement" },
  { value: "Sessions", label: "Sessions de lecture" },
  { value: "Communauté", label: "Communauté" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "Tous les statuts" },
  { value: "in_progress", label: "En cours" },
  { value: "completed", label: "Terminés" },
];

const PERIOD_OPTIONS = [
  { value: "all", label: "Toutes les périodes" },
  { value: "month", label: "Ce mois" },
  { value: "year", label: "Cette année" },
  { value: "custom", label: "Personnalisée" },
];

const SORT_OPTIONS = [
  { value: "date_desc", label: "Plus récents" },
  { value: "date_asc", label: "Plus anciens" },
  { value: "progress_desc", label: "Progression ↓" },
  { value: "progress_asc", label: "Progression ↑" },
  { value: "category", label: "Catégorie" },
];

function isCompleted(obj: ObjectiveWithProgress): boolean {
  const typeMeta = OBJECTIVE_TYPES.find((t) => t.value === obj.objective_type);
  return typeMeta?.inverted
    ? obj.currentValue <= obj.target_value
    : obj.currentValue >= obj.target_value;
}

export function PersonalObjectivesContent() {
  const { objectives, isLoading, createObjective, updateObjective, deleteObjective, duplicateObjective, togglePin, isCreating, isUpdating } = usePersonalObjectives();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingObj, setEditingObj] = useState<PersonalObjective | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [searchQuery, setSearchQuery] = useState("");

  const openCreate = () => { setEditingObj(null); setModalOpen(true); };
  const openEdit = (obj: PersonalObjective) => { setEditingObj(obj); setModalOpen(true); };
  const closeModal = () => { setEditingObj(null); setModalOpen(false); };

  // Track which objectives have already celebrated to avoid repeat confetti
  const celebratedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const newlyCompleted = objectives.filter(
      (obj) => isCompleted(obj) && !celebratedRef.current.has(obj.id)
    );
    if (newlyCompleted.length > 0) {
      newlyCompleted.forEach((obj) => celebratedRef.current.add(obj.id));
      // Only fire confetti if objectives loaded (not on initial mount with all already completed)
      if (celebratedRef.current.size > newlyCompleted.length) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#22c55e", "#f59e0b", "#3b82f6", "#a855f7", "#ec4899"],
        });
      }
    }
    // Sync ref with current completed set
    objectives.forEach((obj) => {
      if (isCompleted(obj)) celebratedRef.current.add(obj.id);
    });
  }, [objectives]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result = objectives.filter((obj) => {
      if (query && !obj.label.toLowerCase().includes(query)) return false;
      if (filterCategory !== "all") {
        const typeMeta = OBJECTIVE_TYPES.find((t) => t.value === obj.objective_type);
        if (typeMeta?.category !== filterCategory) return false;
      }
      if (filterStatus !== "all") {
        const done = isCompleted(obj);
        if (filterStatus === "completed" && !done) return false;
        if (filterStatus === "in_progress" && done) return false;
      }
      if (filterPeriod !== "all" && obj.period_type !== filterPeriod) return false;
      return true;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "date_asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "date_desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "progress_desc": {
          const pctA = a.target_value > 0 ? a.currentValue / a.target_value : 0;
          const pctB = b.target_value > 0 ? b.currentValue / b.target_value : 0;
          return pctB - pctA;
        }
        case "progress_asc": {
          const pctA2 = a.target_value > 0 ? a.currentValue / a.target_value : 0;
          const pctB2 = b.target_value > 0 ? b.currentValue / b.target_value : 0;
          return pctA2 - pctB2;
        }
        case "category": {
          const catA = OBJECTIVE_TYPES.find((t) => t.value === a.objective_type)?.category ?? "";
          const catB = OBJECTIVE_TYPES.find((t) => t.value === b.objective_type)?.category ?? "";
          return catA.localeCompare(catB);
        }
        default:
          return 0;
      }
    });

    return result;
  }, [objectives, filterCategory, filterStatus, filterPeriod, sortBy, searchQuery]);

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Chargement…</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-4 overflow-y-auto max-h-[calc(100vh-120px)]">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un objectif…"
          className="w-full h-9 pl-9 pr-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Filters + sort + create */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px] h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px] h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterPeriod} onValueChange={setFilterPeriod}>
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <ArrowUpDown className="h-3 w-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Créer un objectif
        </Button>
      </div>

      {objectives.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 gap-3">
          <Target className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Vous n'avez pas encore d'objectifs. Créez votre premier objectif pour suivre votre progression !
          </p>
          <Button variant="outline" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> Créer un objectif
          </Button>
        </Card>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">Aucun objectif ne correspond aux filtres sélectionnés.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((obj) => {
            const typeMeta = OBJECTIVE_TYPES.find((t) => t.value === obj.objective_type);
            const isInverted = typeMeta?.inverted;
            const pct = obj.target_value > 0 ? Math.min(100, (obj.currentValue / obj.target_value) * 100) : 0;
            const completed = isCompleted(obj);

            return (
              <Card key={obj.id} className="p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground leading-tight line-clamp-2">
                      {obj.label}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">{typeMeta?.category ?? ""}</Badge>
                      {completed && <Badge variant="default" className="text-xs">Terminé</Badge>}
                      {obj.recurring && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <RefreshCw className="h-2.5 w-2.5" />
                          Récurrent
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(obj)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Modifier</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateObjective(obj)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Dupliquer</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePin(obj)}>
                          {obj.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{obj.pinned ? "Désépingler" : "Épingler"}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeletingId(obj.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Supprimer</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <div className="space-y-1">
                  <Progress
                    value={pct}
                    className="h-2"
                    indicatorClassName={getProgressColor(pct, isInverted)}
                  />
                  <div className="flex items-center justify-between">
                    {completed && (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <PartyPopper className="h-3 w-3" /> Atteint !
                      </span>
                    )}
                    <p className="text-xs text-muted-foreground text-right ml-auto">
                      {obj.currentValue} / {obj.target_value}
                      {isInverted ? " €" : ""}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CreateObjectiveModal
        open={modalOpen}
        onClose={closeModal}
        onCreate={createObjective}
        onUpdate={updateObjective}
        isCreating={isCreating}
        isUpdating={isUpdating}
        editingObjective={editingObj}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(o) => { if (!o) setDeletingId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet objectif ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'objectif et sa progression seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deletingId) { deleteObjective(deletingId); setDeletingId(null); } }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
