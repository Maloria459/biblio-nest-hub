import { Target } from "lucide-react";

interface Props {
  objectivesCompleted: number;
}

export function StatsObjectifsBlock({ objectivesCompleted }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-foreground">🎯 Objectifs</h2>
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <Target className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Objectifs personnels réalisés</p>
          <p className="text-sm font-semibold text-foreground">{objectivesCompleted}</p>
        </div>
      </div>
    </div>
  );
}
