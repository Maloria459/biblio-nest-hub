import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Target } from "lucide-react";

interface PersonalObjective {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
}

// Placeholder: will be replaced with real data from "Mon profil → Mes objectifs personnels"
const pinnedObjectives: PersonalObjective[] = [];

export function PersonalObjectivesCard() {
  const slots = Array.from({ length: 3 }, (_, i) => pinnedObjectives[i] ?? null);

  return (
    <Card className="rounded-lg border border-border bg-card p-4 flex flex-col min-h-[220px] max-h-[320px]">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
        <Target className="h-4 w-4" />
        <span>Mes objectifs personnels en cours</span>
      </div>

      {pinnedObjectives.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-1">
          {/* 3 empty placeholder rows */}
          <div className="w-full space-y-2 mb-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center justify-center h-10 rounded border border-dashed border-border"
              >
                <span className="text-xs text-muted-foreground">Aucun objectif sélectionné</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center">Aucun objectif suivi pour le moment</p>
          <p className="text-xs text-muted-foreground text-center">
            Créez et suivez vos objectifs dans Mon profil → Mes objectifs personnels
          </p>
        </div>
      ) : (
        <div className="flex-1 space-y-0">
          {slots.map((obj, i) => (
            <div key={i}>
              {i > 0 && <Separator className="my-2" />}
              {obj ? (
                <div className="flex items-center gap-3">
                  <p className="font-medium text-sm text-foreground line-clamp-2 leading-tight flex-1 min-w-0">
                    {obj.name}
                  </p>
                  <div className="w-28 shrink-0 space-y-0.5">
                    <Progress
                      value={obj.targetValue > 0 ? (obj.currentValue / obj.targetValue) * 100 : 0}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {obj.currentValue}/{obj.targetValue}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-10 rounded border border-dashed border-border">
                  <span className="text-xs text-muted-foreground">Aucun objectif sélectionné</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
