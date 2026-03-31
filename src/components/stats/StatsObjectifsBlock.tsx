import { Target, ListChecks, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  objectivesCompleted: number;
  objectivesCreated: number;
  objectivesInProgress: number;
}

function StatItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

export function StatsObjectifsBlock({ objectivesCompleted, objectivesCreated, objectivesInProgress }: Props) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">🎯 Objectifs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          <StatItem icon={ListChecks} label="Objectifs créés" value={String(objectivesCreated)} />
          <StatItem icon={Clock} label="En cours" value={String(objectivesInProgress)} />
          <StatItem icon={Target} label="Réalisés" value={String(objectivesCompleted)} />
        </div>
      </CardContent>
    </Card>
  );
}
