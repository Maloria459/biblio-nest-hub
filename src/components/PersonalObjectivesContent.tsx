import { useState, useMemo, useEffect, useRef } from "react";
import { usePersonalObjectives, OBJECTIVE_TYPES, type PersonalObjective, type ObjectiveWithProgress } from "@/hooks/usePersonalObjectives";
import { CreateObjectiveModal } from "@/components/CreateObjectiveModal";
import { ObjectiveCard, isObjectiveCompleted } from "@/components/ObjectiveCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Target, Search, ArrowUpDown, History } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

const CATEGORY_OPTIONS = [
  { value: "all", label: "Toutes les catégories" },
  { value: "Lecture", label: "Lecture" },
  { value: "Livres terminés", label: "Livres terminés" },
  { value: "Sessions", label: "Sessions" },
  { value: "Diversité", label: "Diversité" },
  { value: "Régularité", label: "Régularité" },
  { value: "Bibliothèque", label: "Bibliothèque" },
  { value: "Records", label: "Records" },
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

function isExpired(obj: ObjectiveWithProgress): boolean {
  if (obj.period_type === "custom" && obj.end_date) {
    return new Date(obj.end_date) < new Date();
  }
  return false;
}

function isHistorical(obj: ObjectiveWithProgress): boolean {
  return isObjectiveCompleted(obj) || isExpired(obj);
}

export function PersonalObjectivesContent() {
  const { objectives, isLoading, createObjective, updateObjective, deleteObjective, duplicateObjective, togglePin, isCreating, isUpdating } = usePersonalObjectives();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingObj, setEditingObj] = useState<PersonalObjective | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("active");

  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [searchQuery, setSearchQuery] = useState("");

  const openCreate = () => { setEditingObj(null); setModalOpen(true); };
  const openEdit = (obj: PersonalObjective) => { setEditingObj(obj); setModalOpen(true); };
  const closeModal = () => { setEditingObj(null); setModalOpen(false); };

  // Track milestones and completion celebrations
  const celebratedRef = useRef<Set<string>>(new Set());
  const milestonesRef = useRef<Map<string, number>>(new Map());

  const MILESTONES = [25, 50, 75];
  const MILESTONE_MESSAGES: Record<number, string> = {
    25: "🚀 25% atteint ! Bon début, continuez !",
    50: "🔥 Mi-parcours ! Vous êtes à 50% !",
    75: "💪 75% ! Plus que quelques efforts !",
  };

  useEffect(() => {
    objectives.forEach((obj) => {
      const pct = obj.target_value > 0 ? Math.min(100, (obj.currentValue / obj.target_value) * 100) : 0;
      const prevMilestone = milestonesRef.current.get(obj.id) ?? 0;

      for (const m of MILESTONES) {
        if (pct >= m && prevMilestone < m) {
          toast.success(MILESTONE_MESSAGES[m], {
            description: obj.label,
            duration: 4000,
          });
        }
      }
      milestonesRef.current.set(obj.id, Math.max(prevMilestone, ...MILESTONES.filter((m) => pct >= m), 0));

      if (isObjectiveCompleted(obj) && !celebratedRef.current.has(obj.id)) {
        celebratedRef.current.add(obj.id);
        if (celebratedRef.current.size > 1 || milestonesRef.current.size > 1) {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#22c55e", "#f59e0b", "#3b82f6", "#a855f7", "#ec4899"],
          });
        }
      }
    });

    objectives.forEach((obj) => {
      if (isObjectiveCompleted(obj)) celebratedRef.current.add(obj.id);
    });
  }, [objectives]);

  // Split into active and history
  const activeObjectives = useMemo(() => objectives.filter((o) => !isHistorical(o)), [objectives]);
  const historyObjectives = useMemo(() => objectives.filter((o) => isHistorical(o)), [objectives]);

  const applyFiltersAndSort = (list: ObjectiveWithProgress[]) => {
    const query = searchQuery.trim().toLowerCase();
    const result = list.filter((obj) => {
      if (query && !obj.label.toLowerCase().includes(query)) return false;
      if (filterCategory !== "all") {
        const typeMeta = OBJECTIVE_TYPES.find((t) => t.value === obj.objective_type);
        if (typeMeta?.category !== filterCategory) return false;
      }
      if (filterStatus !== "all") {
        const done = isObjectiveCompleted(obj);
        if (filterStatus === "completed" && !done) return false;
        if (filterStatus === "in_progress" && done) return false;
      }
      if (filterPeriod !== "all" && obj.period_type !== filterPeriod) return false;
      return true;
    });

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
  };

  const filteredActive = useMemo(() => applyFiltersAndSort(activeObjectives), [activeObjectives, filterCategory, filterStatus, filterPeriod, sortBy, searchQuery]);
  const filteredHistory = useMemo(() => applyFiltersAndSort(historyObjectives), [historyObjectives, filterCategory, filterStatus, filterPeriod, sortBy, searchQuery]);

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Chargement…</div>;
  }

  const renderGrid = (list: ObjectiveWithProgress[], readOnly: boolean) => {
    if (list.length === 0) {
      return (
        <p className="text-sm text-muted-foreground text-center py-10">
          {readOnly ? "Aucun objectif dans l'historique." : "Aucun objectif ne correspond aux filtres sélectionnés."}
        </p>
      );
    }
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((obj) => (
          <ObjectiveCard
            key={obj.id}
            obj={obj}
            onEdit={openEdit}
            onDuplicate={duplicateObjective}
            onTogglePin={togglePin}
            onDelete={(id) => setDeletingId(id)}
            readOnly={readOnly}
          />
        ))}
      </div>
    );
  };

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

      {/* Filters + tabs + create */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
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

          <TabsList>
            <TabsTrigger value="active" className="gap-1.5">
              <Target className="h-3.5 w-3.5" />
              Actifs
              {activeObjectives.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{activeObjectives.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <History className="h-3.5 w-3.5" />
              Historique
              {historyObjectives.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{historyObjectives.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1" />

          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> Créer un objectif
          </Button>
        </div>

        <TabsContent value="active" className="mt-4">
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
          ) : (
            renderGrid(filteredActive, false)
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {historyObjectives.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 gap-3">
              <History className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                Aucun objectif complété ou expiré pour le moment. Vos objectifs terminés apparaîtront ici.
              </p>
            </Card>
          ) : (
            renderGrid(filteredHistory, true)
          )}
        </TabsContent>
      </Tabs>

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
