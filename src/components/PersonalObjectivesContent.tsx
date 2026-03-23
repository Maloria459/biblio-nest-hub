import { useState } from "react";
import { usePersonalObjectives, OBJECTIVE_TYPES, type PersonalObjective } from "@/hooks/usePersonalObjectives";
import { CreateObjectiveModal } from "@/components/CreateObjectiveModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Pin, PinOff, Trash2, Target, Pencil } from "lucide-react";

const periodLabels: Record<string, string> = {
  month: "Ce mois",
  year: "Cette année",
  custom: "Personnalisée",
};

export function PersonalObjectivesContent() {
  const { objectives, isLoading, createObjective, updateObjective, deleteObjective, togglePin, isCreating, isUpdating } = usePersonalObjectives();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingObj, setEditingObj] = useState<PersonalObjective | null>(null);

  const openCreate = () => { setEditingObj(null); setModalOpen(true); };
  const openEdit = (obj: PersonalObjective) => { setEditingObj(obj); setModalOpen(true); };
  const closeModal = () => { setEditingObj(null); setModalOpen(false); };

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Chargement…</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-4 overflow-y-auto max-h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Mes objectifs personnels</h2>
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
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {objectives.map((obj) => {
            const typeMeta = OBJECTIVE_TYPES.find((t) => t.value === obj.objective_type);
            const isInverted = typeMeta?.inverted;
            const pct = obj.target_value > 0 ? Math.min(100, (obj.currentValue / obj.target_value) * 100) : 0;
            const completed = isInverted
              ? obj.currentValue <= obj.target_value
              : obj.currentValue >= obj.target_value;

            return (
              <Card key={obj.id} className="p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground leading-tight line-clamp-2">
                      {obj.label}
                      {obj.filter_value && (
                        <span className="text-muted-foreground"> — {obj.filter_value}</span>
                      )}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="outline" className="text-xs">{periodLabels[obj.period_type] ?? obj.period_type}</Badge>
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
