import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ManualPageUpdate, ReadingSession } from "@/hooks/useReadingSessions";
import { formatDurationFull } from "@/hooks/useReadingSessions";
import type { Book } from "@/data/mockBooks";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

interface Props {
  sessions: ReadingSession[];
  manualUpdates: ManualPageUpdate[];
  books: Book[];
}

type CalendarItem =
  | { book: Book; kind: "session"; session: ReadingSession }
  | { book: Book; kind: "manual"; update: ManualPageUpdate };

export function SessionsCalendarView({ sessions, manualUpdates, books }: Props) {
  const now = new Date();
  const [monthOffset, setMonthOffset] = useState(0);

  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  // Group sessions of the visible month by day
  const activityByDay = useMemo(() => {
    const map = new Map<number, CalendarItem[]>();
    const items: Array<{ date: Date; item: CalendarItem }> = [];

    sessions.forEach((s) => {
      const book = books.find((b) => b.id === s.book_id);
      if (book) items.push({ date: new Date(s.session_date), item: { book, kind: "session", session: s } });
    });

    manualUpdates.forEach((u) => {
      const book = books.find((b) => b.id === u.book_id);
      if (book) items.push({ date: new Date(u.update_date), item: { book, kind: "manual", update: u } });
    });

    const sortedAsc = items.sort((a, b) => a.date.getTime() - b.date.getTime());
    for (const { date: d, item } of sortedAsc) {
      if (d.getFullYear() !== viewYear || d.getMonth() !== viewMonth) continue;
      const day = d.getDate();
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(item);
    }
    return map;
  }, [sessions, manualUpdates, books, viewYear, viewMonth]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = (() => {
    const d = new Date(viewYear, viewMonth, 1).getDay();
    return d === 0 ? 6 : d - 1;
  })();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const today = now.getDate();
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const numRows = cells.length / 7;

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <button onClick={() => setMonthOffset((o) => o - 1)} className="p-1.5 rounded hover:bg-muted">
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <span className="text-sm font-semibold text-foreground capitalize">{monthLabel}</span>
        <button onClick={() => setMonthOffset((o) => o + 1)} className="p-1.5 rounded hover:bg-muted">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1 shrink-0">
        {DAYS.map((d) => (
          <div key={d} className="text-xs text-muted-foreground text-center font-medium">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <TooltipProvider delayDuration={200}>
        <div
          className="grid grid-cols-7 gap-1 flex-1 min-h-0"
          style={{ gridTemplateRows: `repeat(${numRows}, minmax(0, 1fr))` }}
        >
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />;

            const dayItems = activityByDay.get(day) ?? [];
            // Unique books, preserving first-read order
            const uniqueBooksMap = new Map<string, Book>();
            dayItems.forEach((it) => {
              if (!uniqueBooksMap.has(it.book.id)) uniqueBooksMap.set(it.book.id, it.book);
            });
            const uniqueBooks = [...uniqueBooksMap.values()];
            const hasContent = uniqueBooks.length > 0;
            const isToday = isCurrentMonth && day === today;

            const tooltipLines = dayItems.map((item) =>
              item.kind === "session"
                ? `${item.book.title} — ${formatDurationFull(item.session.duration_minutes)}${
                    item.session.last_page_reached != null ? ` (p.${item.session.last_page_reached})` : ""
                  }`
                : `${item.book.title} — progression manuelle +${item.update.pages_delta} page${Math.abs(item.update.pages_delta) > 1 ? "s" : ""} (p.${item.update.pages_value})`,
            );

            const cell = (
              <div
                className={`h-full min-h-0 rounded-md border p-1 flex flex-col gap-1 overflow-hidden ${
                  isToday ? "border-foreground bg-muted/30" : "border-border bg-card"
                } ${hasContent ? "" : "opacity-70"}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] ${isToday ? "font-bold text-foreground" : "text-muted-foreground"}`}
                  >
                    {day}
                  </span>
                  {uniqueBooks.length > 1 && (
                    <span className="text-[9px] font-medium bg-muted rounded-full px-1.5 leading-none py-0.5">
                      {uniqueBooks.length}
                    </span>
                  )}
                </div>

                {hasContent && (
                  <div className="flex-1 flex items-stretch justify-center gap-0.5 overflow-hidden min-h-0">
                    {uniqueBooks.map((b) => (
                      <div
                        key={b.id}
                        className="flex-1 min-w-0 flex items-center justify-center"
                      >
                        {b.coverUrl ? (
                          <img
                            src={b.coverUrl}
                            alt={b.title}
                            className="max-h-full max-w-full object-contain rounded-sm"
                          />
                        ) : (
                          <div className="h-full aspect-[2/3] flex items-center justify-center bg-secondary rounded-sm">
                            <BookOpen className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );

            if (tooltipLines.length > 0) {
              return (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>{cell}</TooltipTrigger>
                  <TooltipContent side="top" className="text-xs max-w-[260px]">
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

      {sessions.length + manualUpdates.length > 0 && activityByDay.size === 0 && (
        <p className="text-center text-xs text-muted-foreground mt-6">
          Aucune session de lecture ce mois-ci
        </p>
      )}
    </div>
  );
}
