import { BookOpen, FileText, Clock, TrendingUp, CalendarCheck, Heart, Trophy, Timer, CalendarHeart, Flame } from "lucide-react";
import { formatTotalReadingTime } from "@/hooks/useReadingSessions";
import { StatsReadingEvolution } from "./StatsReadingEvolution";
import { StatsWeekdayChart } from "./StatsWeekdayChart";
import { StatsRatingChart } from "./StatsRatingChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  booksFinished: number;
  totalPagesRead: number;
  totalSessions: number;
  totalReadingMinutes: number;
  avgReadingMinutes: number | null;
  avgPagesPerDay: number;
  coupsDeCoeur: number;
  longestSessionMinutes: number | null;
  longestBookTitle: string | null;
  longestBookPages: number | null;
  bestPeriodLabel: string | null;
  bestPeriodCount: number | null;
  longestStreak: number;
  evolutionData: { label: string; pages: number }[];
  weekdayMinutes: number[];
  ratingDistribution: number[];
  ratingAverage: number | null;
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

export function StatsLectureBlock(props: Props) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">📖 Lecture</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Chiffres clés */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Chiffres clés</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <StatItem icon={BookOpen} label="Livres terminés" value={String(props.booksFinished)} />
            <StatItem icon={FileText} label="Pages lues" value={props.totalPagesRead.toLocaleString("fr-FR")} />
            <StatItem icon={CalendarCheck} label="Sessions" value={String(props.totalSessions)} />
            <StatItem icon={Clock} label="Temps total" value={formatTotalReadingTime(props.totalReadingMinutes)} />
            <StatItem icon={Clock} label="Temps moyen / session" value={props.avgReadingMinutes != null ? formatTotalReadingTime(props.avgReadingMinutes) : "—"} />
            <StatItem icon={TrendingUp} label="Pages / jour" value={props.avgPagesPerDay.toFixed(1)} />
            <StatItem icon={Heart} label="Coups de cœur" value={String(props.coupsDeCoeur)} />
            <StatItem icon={Flame} label="Plus long streak" value={`${props.longestStreak} jour${props.longestStreak !== 1 ? "s" : ""}`} />
          </div>
        </div>

        {/* Records */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Records</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatItem icon={Trophy} label="Plus long livre lu" value={props.longestBookTitle ? `${props.longestBookTitle} (${props.longestBookPages} p.)` : "—"} />
            <StatItem icon={Timer} label="Plus longue session" value={props.longestSessionMinutes != null ? formatTotalReadingTime(props.longestSessionMinutes) : "—"} />
            <StatItem icon={CalendarHeart} label="Meilleure période" value={props.bestPeriodLabel ? `${props.bestPeriodLabel} (${props.bestPeriodCount} livre${(props.bestPeriodCount ?? 0) > 1 ? "s" : ""})` : "—"} />
          </div>
        </div>

        {/* Graphiques */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Graphiques</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StatsReadingEvolution data={props.evolutionData} />
            <StatsWeekdayChart minutesByDay={props.weekdayMinutes} />
            <StatsRatingChart distribution={props.ratingDistribution} average={props.ratingAverage} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
