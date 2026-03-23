import { useState, useMemo } from "react";
import { usePersonalObjectives, OBJECTIVE_TYPES, type PersonalObjective, type ObjectiveWithProgress } from "@/hooks/usePersonalObjectives";
import { CreateObjectiveModal } from "@/components/CreateObjectiveModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pin, PinOff, Trash2, Target, Pencil } from "lucide-react";

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

function isCompleted(obj: ObjectiveWithProgress): boolean {
  const typeMeta = OBJECTIVE_TYPES.find((t) => t.value === obj.objective_type);
  return typeMeta?.inverted
    ? obj.currentValue <= obj.target_value
    : obj.currentValue >= obj.target_value;
}

export function PersonalObjectivesContent() {
  const { objectives, isLoading, createObjective, updateObjective, deleteObjective, togglePin, isCreating, isUpdating } = usePersonalObjectives();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingObj, setEditingObj] = useState<PersonalObjective | null>(null);

  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");

  const openCreate = () => { setEditingObj(null); setModalOpen(true); };
  const openEdit = (obj: PersonalObjective) => { setEditingObj(obj); setModalOpen(true); };
  const closeModal = () => { setEditingObj(null); setModalOpen(false); };

  const filtered = useMemo(() => {
    return objectives.filter((obj) => {
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
  }, [objectives, filterCategory, filterStatus, filterPeriod]);

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Chargement…</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-4 overflow-y-auto max-h-[calc(100vh-120px)]">
      {/* Top bar: filters + create button */}
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
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="outline" className="text-xs">{typeMeta?.category ?? ""}</Badge>
                      {completed && <Badge variant="default" className="text-xs">Terminé</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(obj)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePin(obj)}>
                      {obj.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteObjective(obj.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Progress value={pct} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">
                    {obj.currentValue} / {obj.target_value}
                    {isInverted ? " €" : ""}
                  </p>
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
    </div>
  );
}
