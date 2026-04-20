import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ReadingSession } from "@/hooks/useReadingSessions";
import { formatDurationFull } from "@/hooks/useReadingSessions";
import type { Book } from "@/data/mockBooks";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

interface Props {
  sessions: ReadingSession[];
  books: Book[];
}

export function SessionsCalendarView({ sessions, books }: Props) {
  const now = new Date();
  const [monthOffset, setMonthOffset] = useState(0);

  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  // Group sessions of the visible month by day
  const sessionsByDay = useMemo(() => {
    const map = new Map<number, { book: Book; session: ReadingSession }[]>();
    for (const s of sessions) {
      const d = new Date(s.session_date);
      if (d.getFullYear() !== viewYear || d.getMonth() !== viewMonth) continue;
      const book = books.find((b) => b.id === s.book_id);
      if (!book) continue;
      const day = d.getDate();
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push({ book, session: s });
    }
    return map;
  }, [sessions, books, viewYear, viewMonth]);

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

            const dayItems = sessionsByDay.get(day) ?? [];
            // Unique books for this day
            const uniqueBooksMap = new Map<string, Book>();
            dayItems.forEach((it) => uniqueBooksMap.set(it.book.id, it.book));
            const uniqueBooks = [...uniqueBooksMap.values()];
            const hasContent = uniqueBooks.length > 0;
            const isToday = isCurrentMonth && day === today;

            const tooltipLines = dayItems.map(
              ({ book, session }) =>
                `${book.title} — ${formatDurationFull(session.duration_minutes)}${
                  session.last_page_reached != null ? ` (p.${session.last_page_reached})` : ""
                }`,
            );

            const cell = (
              <div
                className={`aspect-square rounded-md border p-1 flex flex-col gap-1 ${
                  isToday ? "border-foreground bg-muted/30" : "border-border bg-card"
                } ${hasContent ? "" : "opacity-70"}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] ${isToday ? "font-bold text-foreground" : "text-muted-foreground"}`}
                  >
                    {day}
                  </span>
                  {dayItems.length > 1 && (
                    <span className="text-[9px] font-medium bg-muted rounded-full px-1.5 leading-none py-0.5">
                      {dayItems.length}
                    </span>
                  )}
                </div>

                {hasContent && (
                  <div className="flex-1 flex items-center justify-center gap-0.5 overflow-hidden">
                    {uniqueBooks.slice(0, 3).map((b) =>
                      b.coverUrl ? (
                        <img
                          key={b.id}
                          src={b.coverUrl}
                          alt={b.title}
                          className="h-full w-auto max-w-full object-contain rounded-sm"
                        />
                      ) : (
                        <div
                          key={b.id}
                          className="h-full aspect-[2/3] flex items-center justify-center bg-secondary rounded-sm"
                        >
                          <BookOpen className="h-3 w-3 text-muted-foreground" />
                        </div>
                      ),
                    )}
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

      {sessions.length > 0 && sessionsByDay.size === 0 && (
        <p className="text-center text-xs text-muted-foreground mt-6">
          Aucune session de lecture ce mois-ci
        </p>
      )}
    </div>
  );
}
