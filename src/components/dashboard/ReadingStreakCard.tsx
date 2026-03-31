import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useReadingSessions } from "@/hooks/useReadingSessions";
import { Book, BookOpen, Flame } from "lucide-react";

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function ReadingStreakCard() {
  const { data: sessions = [] } = useReadingSessions();

  // Set of dates that have at least one session
  const sessionDates = useMemo(() => {
    const s = new Set<string>();
    sessions.forEach((sess) => {
      const d = new Date(sess.session_date);
      s.add(dateKey(d));
    });
    return s;
  }, [sessions]);

  // Current streak (consecutive days going back from today)
  const totalStreak = useMemo(() => {
    let streak = 0;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    while (sessionDates.has(dateKey(d))) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }, [sessionDates]);

  // Current week Mon–Sun
  const weekDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = dateKey(today);
    // Find Monday of current week
    const dayOfWeek = today.getDay(); // 0=Sun
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = dateKey(d);
      return {
        label: DAY_LABELS[i],
        active: sessionDates.has(key),
        isFuture: d > today,
        isToday: key === todayKey,
      };
    });
  }, [sessionDates]);

  return (
    <Card className="border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Flame className="h-4 w-4" />
          <span>Streak de lecture</span>
        </div>
        <span className="text-sm font-bold text-foreground">
          {totalStreak} jour{totalStreak !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        {weekDays.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
            {day.active ? (
              <BookOpen className="h-6 w-6 text-foreground" />
            ) : (
              <Book className={`h-6 w-6 ${day.isFuture ? "text-muted-foreground/20" : "text-muted-foreground/40"}`} />
            )}
            <span className={`text-[10px] ${day.isToday ? "font-bold text-foreground" : "text-muted-foreground"}`}>
              {day.label}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
