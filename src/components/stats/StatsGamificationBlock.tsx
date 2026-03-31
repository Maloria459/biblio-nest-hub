import { Award, Coins, FileText, Trophy, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  challengesCompleted: number;
  totalEclats: number;
  totalXpPages: number;
  totalBadges: number;
  currentRank: string;
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

export function StatsGamificationBlock(props: Props) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">🏆 Ma quête littéraire</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatItem icon={Trophy} label="Défis réalisés" value={String(props.challengesCompleted)} />
          <StatItem icon={Coins} label="Éclats d'encre" value={String(props.totalEclats)} />
          <StatItem icon={FileText} label="Pages (XP)" value={String(props.totalXpPages)} />
          <StatItem icon={Award} label="Badges obtenus" value={String(props.totalBadges)} />
          <StatItem icon={Star} label="Rang actuel" value={props.currentRank} />
        </div>
      </CardContent>
    </Card>
  );
}
