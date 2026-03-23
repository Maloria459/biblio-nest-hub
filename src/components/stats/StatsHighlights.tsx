import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Timer, CalendarHeart, Heart, Hourglass } from "lucide-react";
import { formatTotalReadingTime } from "@/hooks/useReadingSessions";

interface Props {
  longestBookTitle: string | null;
  longestBookPages: number | null;
  longestSessionMinutes: number | null;
  bestMonth: string | null;
  bestMonthCount: number | null;
  coupsDeCoeur: number;
  avgSessionMinutes: number | null;
}

export function StatsHighlights(props: Props) {
  const highlights = [
    {
      icon: Trophy,
      label: "Plus long livre lu",
      value: props.longestBookTitle ? `${props.longestBookTitle} (${props.longestBookPages} p.)` : "—",
    },
    {
      icon: Timer,
      label: "Plus longue session",
      value: props.longestSessionMinutes != null ? formatTotalReadingTime(props.longestSessionMinutes) : "—",
    },
    {
      icon: CalendarHeart,
      label: "Meilleur mois",
      value: props.bestMonth ? `${props.bestMonth} (${props.bestMonthCount} livre${(props.bestMonthCount ?? 0) > 1 ? "s" : ""})` : "—",
    },
    {
      icon: Heart,
      label: "Coups de cœur",
      value: String(props.coupsDeCoeur),
    },
    {
      icon: Hourglass,
      label: "Durée moy. / session",
      value: props.avgSessionMinutes != null ? formatTotalReadingTime(props.avgSessionMinutes) : "—",
    },
  ];

  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Records & faits marquants</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {highlights.map((h) => (
            <div key={h.label} className="flex items-start gap-2">
              <h.icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{h.label}</p>
                <p className="text-sm font-semibold text-foreground truncate">{h.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
