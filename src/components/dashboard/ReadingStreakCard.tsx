import { useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useReadingSessions } from "@/hooks/useReadingSessions";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Book, BookOpen, Flame } from "lucide-react";

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function ReadingStreakCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: sessions = [] } = useReadingSessions();

  const { data: activities = [] } = useQuery({
    queryKey: ["reading-activity", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reading_activity")
        .select("activity_date")
        .eq("user_id", user!.id);
      return (data || []) as { activity_date: string }[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Realtime subscription for instant streak updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("reading-activity-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "reading_activity", filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["reading-activity", user.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "reading_sessions", filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["reading-sessions", user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  // Merge session dates + activity dates
  const activeDates = useMemo(() => {
    const s = new Set<string>();
    sessions.forEach((sess) => {
      const d = new Date(sess.session_date);
      s.add(dateKey(d));
    });
    activities.forEach((a) => {
      s.add(a.activity_date);
    });
    return s;
  }, [sessions, activities]);

  const totalStreak = useMemo(() => {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start checking from today
    if (activeDates.has(dateKey(today))) {
      // Today has activity — count from today backwards
      const d = new Date(today);
      while (activeDates.has(dateKey(d))) {
        streak++;
        d.setDate(d.getDate() - 1);
      }
    } else {
      // Today has no activity yet — day is still in progress, check from yesterday
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      while (activeDates.has(dateKey(d))) {
        streak++;
        d.setDate(d.getDate() - 1);
      }
    }
    return streak;
  }, [activeDates]);

  const weekDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = dateKey(today);
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = dateKey(d);
      return {
        label: DAY_LABELS[i],
        active: activeDates.has(key),
        isFuture: d > today,
        isToday: key === todayKey,
      };
    });
  }, [activeDates]);

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
