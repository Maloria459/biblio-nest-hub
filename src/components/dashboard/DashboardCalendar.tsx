import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useBooks } from "@/contexts/BooksContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function parsePublicationDate(dateStr: string): Date | null {
  const dmyMatch = dateStr.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) return new Date(+dmyMatch[3], +dmyMatch[2] - 1, +dmyMatch[1]);
  const isoMatch = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return new Date(+isoMatch[1], +isoMatch[2] - 1, +isoMatch[3]);
  return null;
}

interface CalendarEvent {
  date: number;
  type: "literary" | "club";
  name: string;
}

interface CalendarRelease {
  date: number;
  title: string;
  coverUrl: string | null;
}

export function DashboardCalendar() {
  const { books } = useBooks();
  const { user } = useAuth();
  const now = new Date();
  const [monthOffset, setMonthOffset] = useState(0);

  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const monthLabel = viewDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  // Literary events
  const { data: literaryEvents = [] } = useQuery({
    queryKey: ["literary-events-cal", user?.id, viewYear, viewMonth],
    queryFn: async () => {
      const startDate = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-01`;
      const endDate = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-31`;
      const { data } = await supabase
        .from("literary_events")
        .select("event_name, event_date")
        .eq("user_id", user!.id)
        .gte("event_date", startDate)
        .lte("event_date", endDate);
      return (data ?? []).map((e) => ({
        date: new Date(e.event_date).getDate(),
        type: "literary" as const,
        name: e.event_name,
      }));
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Book club events
  const { data: clubEvents = [] } = useQuery({
    queryKey: ["club-events-cal", user?.id, viewYear, viewMonth],
    queryFn: async () => {
      const startDate = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-01`;
      const endDate = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-31`;
      const { data } = await supabase
        .from("book_club_events")
        .select("event_name, event_date")
        .eq("user_id", user!.id)
        .gte("event_date", startDate)
        .lte("event_date", endDate);
      return (data ?? []).map((e) => ({
        date: new Date(e.event_date).getDate(),
        type: "club" as const,
        name: e.event_name,
      }));
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const allEvents: CalendarEvent[] = useMemo(
    () => [...literaryEvents, ...clubEvents],
    [literaryEvents, clubEvents],
  );

  // Upcoming releases from wishlist
  const releases: CalendarRelease[] = useMemo(() => {
    return books
      .filter((b) => {
        if (b.status !== "Wishlist" || !b.publicationDate) return false;
        const d = parsePublicationDate(b.publicationDate);
        if (!d) return false;
        return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
      })
      .map((b) => {
        const d = parsePublicationDate(b.publicationDate!)!;
        return { date: d.getDate(), title: b.title, coverUrl: b.coverUrl ?? null };
      });
  }, [books, viewYear, viewMonth]);

  // Build calendar grid
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = (() => {
    const d = new Date(viewYear, viewMonth, 1).getDay();
    return d === 0 ? 6 : d - 1; // Monday-based
  })();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const today = now.getDate();
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  return (
    <Card className="h-full flex flex-col border-border bg-card p-4">
      {/* Month header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setMonthOffset((o) => o - 1)} className="p-1 rounded hover:bg-muted">
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <span className="text-sm font-medium text-foreground capitalize">{monthLabel}</span>
        <button onClick={() => setMonthOffset((o) => o + 1)} className="p-1 rounded hover:bg-muted">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-[10px] text-muted-foreground text-center font-medium">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <TooltipProvider delayDuration={200}>
        <div className="grid grid-cols-7 gap-x-0.5 gap-y-1 flex-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />;

            const dayReleases = releases.filter((r) => r.date === day);
            const dayEvents = allEvents.filter((e) => e.date === day);
            const hasRelease = dayReleases.length > 0;
            const hasContent = hasRelease || dayEvents.length > 0;
            const isToday = isCurrentMonth && day === today;

            const tooltipLines = [
              ...dayReleases.map((r) => `📚 ${r.title}`),
              ...dayEvents.map((e) => `${e.type === "literary" ? "📖" : "👥"} ${e.name}`),
            ];

            const cell = (
              <div className="flex flex-col items-center gap-0.5">
                {/* Date number */}
                <div
                  className={`w-full flex items-center justify-center rounded text-[11px] h-5 ${
                    isToday ? "bg-foreground text-background font-bold" : "text-foreground font-medium"
                  }`}
                >
                  {day}
                </div>
                {/* Content box below the date */}
                {hasContent && (
                  <div className="w-full rounded overflow-hidden bg-muted/50 flex items-center justify-center" style={{ minHeight: 24 }}>
                    {hasRelease && dayReleases[0].coverUrl ? (
                      <img
                        src={dayReleases[0].coverUrl}
                        alt={dayReleases[0].title}
                        className="w-full h-6 object-cover rounded"
                      />
                    ) : dayEvents.length > 0 ? (
                      <div className="flex gap-0.5 py-1">
                        {dayEvents.slice(0, 3).map((e, j) => (
                          <div
                            key={j}
                            className={`h-1.5 w-1.5 rounded-full ${
                              e.type === "literary" ? "bg-foreground" : "bg-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                    ) : hasRelease ? (
                      <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                    ) : null}
                  </div>
                )}
              </div>
            );

            if (tooltipLines.length > 0) {
              return (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>{cell}</TooltipTrigger>
                  <TooltipContent side="top" className="text-xs max-w-[200px]">
                    {tooltipLines.map((line, j) => (
                      <p key={j}>{line}</p>
                    ))}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={i}>{cell}</div>;
          })}
        </div>
      </TooltipProvider>
    </Card>
  );
}
