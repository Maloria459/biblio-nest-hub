import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, FileText, Clock, TrendingUp, CalendarCheck } from "lucide-react";
import { formatTotalReadingTime } from "@/hooks/useReadingSessions";

interface StatsSummaryCardsProps {
  booksFinished: number;
  totalPagesRead: number;
  totalReadingMinutes: number;
  avgPagesPerDay: number;
  totalSessions: number;
}

const items = [
  { key: "booksFinished", label: "Livres terminés", icon: BookOpen, format: (v: number) => String(v) },
  { key: "totalPagesRead", label: "Pages lues", icon: FileText, format: (v: number) => v.toLocaleString("fr-FR") },
  { key: "totalReadingMinutes", label: "Temps de lecture", icon: Clock, format: (v: number) => formatTotalReadingTime(v) },
  { key: "avgPagesPerDay", label: "Pages / jour", icon: TrendingUp, format: (v: number) => v.toFixed(1) },
  { key: "totalSessions", label: "Sessions", icon: CalendarCheck, format: (v: number) => String(v) },
] as const;

export function StatsSummaryCards(props: StatsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map(({ key, label, icon: Icon, format }) => (
        <Card key={key} className="border-border/60">
          <CardContent className="p-4 flex flex-col items-center gap-1 text-center">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <span className="text-2xl font-bold font-[family-name:var(--font-display)] text-foreground">
              {format(props[key])}
            </span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
