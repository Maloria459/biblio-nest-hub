import { useState, useMemo, useEffect } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useBooks } from "@/contexts/BooksContext";
import { useReadingSessions, type ReadingSession } from "@/hooks/useReadingSessions";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, startOfYear, isAfter, parseISO, format, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import type { Book } from "@/data/mockBooks";

import { StatsSummaryCards } from "@/components/stats/StatsSummaryCards";
import { StatsReadingEvolution } from "@/components/stats/StatsReadingEvolution";
import { StatsGenreChart } from "@/components/stats/StatsGenreChart";
import { StatsFormatChart } from "@/components/stats/StatsFormatChart";
import { StatsRatingChart } from "@/components/stats/StatsRatingChart";
import { StatsWeekdayChart } from "@/components/stats/StatsWeekdayChart";
import { StatsHighlights } from "@/components/stats/StatsHighlights";

type Period = "month" | "year" | "all";

function useMemberSince() {
  const { user } = useAuth();
  const [since, setSince] = useState<Date | null>(null);
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("created_at")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.created_at) setSince(new Date(data.created_at));
      });
  }, [user]);
  return since;
}

function filterDate(dateStr: string | undefined | null, start: Date | null): boolean {
  if (!start || !dateStr) return true;
  try {
    return isAfter(parseISO(dateStr), start);
  } catch {
    return true;
  }
}

function periodStart(period: Period): Date | null {
  const now = new Date();
  if (period === "month") return startOfMonth(now);
  if (period === "year") return startOfYear(now);
  return null;
}

// JS getDay: 0=Sun..6=Sat → convert to 0=Mon..6=Sun
function toMondayIndex(d: Date) {
  const day = getDay(d);
  return day === 0 ? 6 : day - 1;
}

export function StatistiquesContent() {
  const [period, setPeriod] = useState<Period>("all");
  const { books } = useBooks();
  const { data: sessions = [] } = useReadingSessions();
  useMemberSince(); // prefetch

  const start = periodStart(period);

  // Filtered data
  const filteredBooks = useMemo(
    () => books.filter((b) => filterDate(b.endDate || b.startDate, start)),
    [books, start],
  );
  const filteredSessions = useMemo(
    () => sessions.filter((s) => filterDate(s.session_date, start)),
    [sessions, start],
  );

  const finishedStatuses = ["Lu", "Lecture terminée"];

  // ---- Summary ----
  const booksFinished = filteredBooks.filter((b) => finishedStatuses.includes(b.status)).length;
  const totalPagesRead = filteredBooks.reduce((s, b) => s + (b.pagesRead ?? 0), 0);
  const totalReadingMinutes = filteredSessions.reduce((s, se) => s + se.duration_minutes, 0);
  const totalSessions = filteredSessions.length;

  const daySpan = useMemo(() => {
    if (!start) {
      if (filteredSessions.length === 0) return 1;
      const dates = filteredSessions.map((s) => new Date(s.session_date).getTime());
      return Math.max(1, Math.ceil((Math.max(...dates) - Math.min(...dates)) / 86400000) + 1);
    }
    return Math.max(1, Math.ceil((Date.now() - start.getTime()) / 86400000));
  }, [start, filteredSessions]);

  const avgPagesPerDay = totalPagesRead / daySpan;

  // ---- Evolution chart ----
  const evolutionData = useMemo(() => {
    if (filteredSessions.length === 0) return [];
    const byKey = new Map<string, number>();
    const useWeeks = period === "month";
    filteredSessions.forEach((s) => {
      const d = new Date(s.session_date);
      const key = useWeeks
        ? `S${Math.ceil(d.getDate() / 7)}`
        : format(d, "MMM yy", { locale: fr });
      byKey.set(key, (byKey.get(key) ?? 0) + (s.last_page_reached ?? 0));
    });
    return Array.from(byKey.entries()).map(([label, pages]) => ({ label, pages }));
  }, [filteredSessions, period]);

  // ---- Genre chart ----
  const genreData = useMemo(() => {
    const map = new Map<string, number>();
    filteredBooks.forEach((b) => {
      if (b.genre) map.set(b.genre, (map.get(b.genre) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredBooks]);

  // ---- Format chart ----
  const formatData = useMemo(() => {
    const map = new Map<string, number>();
    filteredBooks.forEach((b) => {
      if (b.format) map.set(b.format, (map.get(b.format) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredBooks]);

  // ---- Rating distribution ----
  const ratingDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    filteredBooks.forEach((b) => {
      if (b.rating && b.rating >= 1 && b.rating <= 5) dist[b.rating - 1]++;
    });
    return dist;
  }, [filteredBooks]);

  const ratingAvg = useMemo(() => {
    const rated = filteredBooks.filter((b) => b.rating);
    if (rated.length === 0) return null;
    return rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length;
  }, [filteredBooks]);

  // ---- Weekday chart ----
  const weekdayMinutes = useMemo(() => {
    const arr = [0, 0, 0, 0, 0, 0, 0];
    filteredSessions.forEach((s) => {
      const idx = toMondayIndex(new Date(s.session_date));
      arr[idx] += s.duration_minutes;
    });
    return arr;
  }, [filteredSessions]);

  // ---- Highlights ----
  const highlights = useMemo(() => {
    const finished = filteredBooks.filter((b) => finishedStatuses.includes(b.status) && b.pages);
    const longestBook = finished.sort((a, b) => (b.pages ?? 0) - (a.pages ?? 0))[0] ?? null;

    const longestSession = filteredSessions.length
      ? filteredSessions.reduce((best, s) => (s.duration_minutes > best.duration_minutes ? s : best), filteredSessions[0])
      : null;

    // Best month
    const monthMap = new Map<string, number>();
    filteredBooks
      .filter((b) => finishedStatuses.includes(b.status) && b.endDate)
      .forEach((b) => {
        const key = format(parseISO(b.endDate!), "MMMM yyyy", { locale: fr });
        monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
      });
    let bestMonth: string | null = null;
    let bestMonthCount = 0;
    monthMap.forEach((count, month) => {
      if (count > bestMonthCount) {
        bestMonth = month;
        bestMonthCount = count;
      }
    });

    const coupsDeCoeur = filteredBooks.filter((b) => b.coupDeCoeur).length;
    const avgSession = totalSessions > 0 ? totalReadingMinutes / totalSessions : null;

    return {
      longestBookTitle: longestBook?.title ?? null,
      longestBookPages: longestBook?.pages ?? null,
      longestSessionMinutes: longestSession?.duration_minutes ?? null,
      bestMonth,
      bestMonthCount: bestMonthCount || null,
      coupsDeCoeur,
      avgSessionMinutes: avgSession,
    };
  }, [filteredBooks, filteredSessions, totalSessions, totalReadingMinutes]);

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* Period filter */}
      <div className="flex justify-center">
        <ToggleGroup
          type="single"
          value={period}
          onValueChange={(v) => v && setPeriod(v as Period)}
          className="bg-muted rounded-lg p-0.5"
        >
          <ToggleGroupItem value="month" className="text-xs px-3 py-1.5 rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm">
            Ce mois
          </ToggleGroupItem>
          <ToggleGroupItem value="year" className="text-xs px-3 py-1.5 rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm">
            Cette année
          </ToggleGroupItem>
          <ToggleGroupItem value="all" className="text-xs px-3 py-1.5 rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm">
            Depuis mon inscription
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <StatsSummaryCards
        booksFinished={booksFinished}
        totalPagesRead={totalPagesRead}
        totalReadingMinutes={totalReadingMinutes}
        avgPagesPerDay={avgPagesPerDay}
        totalSessions={totalSessions}
      />

      <StatsReadingEvolution data={evolutionData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <StatsGenreChart data={genreData} />
        <StatsFormatChart data={formatData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <StatsRatingChart distribution={ratingDistribution} average={ratingAvg} />
        <StatsWeekdayChart minutesByDay={weekdayMinutes} />
      </div>

      <StatsHighlights {...highlights} />
    </div>
  );
}
