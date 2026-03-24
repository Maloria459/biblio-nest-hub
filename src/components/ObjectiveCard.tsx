import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Pin, PinOff, Trash2, Pencil, Copy, RefreshCw, PartyPopper } from "lucide-react";
import { OBJECTIVE_TYPES, type PersonalObjective, type ObjectiveWithProgress } from "@/hooks/usePersonalObjectives";

function getProgressColor(pct: number, inverted?: boolean): string {
  if (inverted) {
    if (pct < 50) return "bg-green-500";
    if (pct < 85) return "bg-orange-500";
    return "bg-red-500";
  }
  if (pct >= 75) return "bg-green-500";
  if (pct >= 25) return "bg-orange-500";
  return "bg-red-500";
}

export function isObjectiveCompleted(obj: ObjectiveWithProgress): boolean {
  const typeMeta = OBJECTIVE_TYPES.find((t) => t.value === obj.objective_type);
  return typeMeta?.inverted
    ? obj.currentValue <= obj.target_value
    : obj.currentValue >= obj.target_value;
}

const MILESTONES = [25, 50, 75];

interface ObjectiveCardProps {
  obj: ObjectiveWithProgress;
  onEdit: (obj: PersonalObjective) => void;
  onDuplicate: (obj: PersonalObjective) => void;
  onTogglePin: (obj: PersonalObjective) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

export function ObjectiveCard({ obj, onEdit, onDuplicate, onTogglePin, onDelete, readOnly }: ObjectiveCardProps) {
  const typeMeta = OBJECTIVE_TYPES.find((t) => t.value === obj.objective_type);
  const isInverted = typeMeta?.inverted;
  const pct = obj.target_value > 0 ? Math.min(100, (obj.currentValue / obj.target_value) * 100) : 0;
  const completed = isObjectiveCompleted(obj);

  return (
    <Card className={`p-4 flex flex-col gap-2 ${readOnly ? "opacity-75" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground leading-tight line-clamp-2">
            {obj.label}
          </p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <Badge variant="outline" className="text-xs">{typeMeta?.category ?? ""}</Badge>
            {completed && <Badge variant="default" className="text-xs">Terminé</Badge>}
            {!completed && obj.period_type === "custom" && obj.end_date && new Date(obj.end_date) < new Date() && (
              <Badge variant="destructive" className="text-xs">Expiré</Badge>
            )}
            {obj.recurring && (
              <Badge variant="secondary" className="text-xs gap-1">
                <RefreshCw className="h-2.5 w-2.5" />
                Récurrent
              </Badge>
            )}
          </div>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-0.5 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(obj)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Modifier</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDuplicate(obj)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Dupliquer</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onTogglePin(obj)}>
                  {obj.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{obj.pinned ? "Désépingler" : "Épingler"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(obj.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Supprimer</TooltipContent>
            </Tooltip>
          </div>
        )}
        {readOnly && (
          <div className="flex items-center gap-0.5 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDuplicate(obj)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Relancer comme nouvel objectif</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(obj.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Supprimer</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="relative">
          <Progress
            value={pct}
            className="h-2"
            indicatorClassName={getProgressColor(pct, isInverted)}
          />
          {!isInverted && (
            <div className="absolute inset-0 flex items-center pointer-events-none">
              {MILESTONES.map((m) => (
                <div
                  key={m}
                  className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full border border-background"
                  style={{ left: `${m}%`, transform: `translateX(-50%) translateY(-50%)` }}
                  title={`${m}%`}
                >
                  <div className={`w-full h-full rounded-full ${pct >= m ? "bg-foreground/40" : "bg-muted-foreground/30"}`} />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          {completed ? (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <PartyPopper className="h-3 w-3" /> Atteint !
            </span>
          ) : pct >= 75 ? (
            <span className="text-xs text-muted-foreground">💪 Presque !</span>
          ) : pct >= 50 ? (
            <span className="text-xs text-muted-foreground">🔥 Mi-parcours</span>
          ) : pct >= 25 ? (
            <span className="text-xs text-muted-foreground">🚀 Bon début</span>
          ) : null}
          <p className="text-xs text-muted-foreground text-right ml-auto">
            {obj.currentValue} / {obj.target_value}
            {isInverted ? " €" : ""}
          </p>
        </div>
      </div>
    </Card>
  );
}
