import { useState, useMemo, useEffect, useCallback } from "react";
import { useBooks } from "@/contexts/BooksContext";
import { useReadingSessions, type ReadingSession } from "@/hooks/useReadingSessions";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, startOfYear, endOfMonth, isAfter, isBefore, parseISO, format, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

import { StatsSummaryCards } from "@/components/stats/StatsSummaryCards";
import { StatsReadingEvolution } from "@/components/stats/StatsReadingEvolution";
import { StatsGenreChart } from "@/components/stats/StatsGenreChart";
import { StatsFormatChart } from "@/components/stats/StatsFormatChart";
import { StatsRatingChart } from "@/components/stats/StatsRatingChart";
import { StatsWeekdayChart } from "@/components/stats/StatsWeekdayChart";
import { StatsHighlights } from "@/components/stats/StatsHighlights";

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

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

function dateInRange(dateStr: string | undefined | null, start: Date | null, end: Date | null): boolean {
  if (!dateStr) return !start; // include if no filter
  try {
    const d = parseISO(dateStr);
    if (start && isBefore(d, start)) return false;
    if (end && isAfter(d, end)) return false;
    return true;
  } catch {
    return true;
  }
}

// JS getDay: 0=Sun..6=Sat → convert to 0=Mon..6=Sun
function toMondayIndex(d: Date) {
  const day = getDay(d);
  return day === 0 ? 6 : day - 1;
}

export function StatistiquesContent() {
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<string>("all"); // "all" or "0"-"11"
  const [selectedYear, setSelectedYear] = useState<string>("all"); // "all" or year string

  const { books } = useBooks();
  const { data: sessions = [] } = useReadingSessions();
  const memberSince = useMemberSince();

  // Build year options from member since
  const yearOptions = useMemo(() => {
    const startYear = memberSince ? memberSince.getFullYear() : currentYear;
    const years: number[] = [];
    for (let y = startYear; y <= currentYear; y++) years.push(y);
    return years;
  }, [memberSince, currentYear]);

  // Compute date range from filters
  const { rangeStart, rangeEnd } = useMemo(() => {
    let start: Date | null = null;
    let end: Date | null = null;

    if (selectedYear !== "all") {
      const year = parseInt(selectedYear);
      if (selectedMonth !== "all") {
        const month = parseInt(selectedMonth);
        start = new Date(year, month, 1);
        end = endOfMonth(start);
      } else {
        start = startOfYear(new Date(year, 0, 1));
        end = new Date(year, 11, 31, 23, 59, 59);
      }
    } else if (selectedMonth !== "all") {
      const month = parseInt(selectedMonth);
      start = new Date(currentYear, month, 1);
      end = endOfMonth(start);
    }

    return { rangeStart: start, rangeEnd: end };
  }, [selectedMonth, selectedYear, currentYear]);

  // Filtered data
  const filteredBooks = useMemo(
    () => books.filter((b) => dateInRange(b.endDate || b.startDate, rangeStart, rangeEnd)),
    [books, rangeStart, rangeEnd],
  );
  const filteredSessions = useMemo(
    () => sessions.filter((s) => dateInRange(s.session_date, rangeStart, rangeEnd)),
    [sessions, rangeStart, rangeEnd],
  );

  const finishedStatuses = ["Lu", "Lecture terminée"];

  // ---- Summary ----
  const booksFinished = filteredBooks.filter((b) => finishedStatuses.includes(b.status)).length;
  const totalPagesRead = filteredBooks.reduce((s, b) => s + (b.pagesRead ?? 0), 0);
  const totalReadingMinutes = filteredSessions.reduce((s, se) => s + se.duration_minutes, 0);
  const totalSessions = filteredSessions.length;

  const daySpan = useMemo(() => {
    if (!rangeStart) {
      if (filteredSessions.length === 0) return 1;
      const dates = filteredSessions.map((s) => new Date(s.session_date).getTime());
      return Math.max(1, Math.ceil((Math.max(...dates) - Math.min(...dates)) / 86400000) + 1);
    }
    const endMs = rangeEnd ? rangeEnd.getTime() : Date.now();
    return Math.max(1, Math.ceil((endMs - rangeStart.getTime()) / 86400000));
  }, [rangeStart, rangeEnd, filteredSessions]);

  const avgPagesPerDay = totalPagesRead / daySpan;

  // ---- Evolution chart ----
  const evolutionData = useMemo(() => {
    if (filteredSessions.length === 0) return [];
    const byKey = new Map<string, number>();
    const useWeeks = selectedMonth !== "all";
    filteredSessions.forEach((s) => {
      const d = new Date(s.session_date);
      const key = useWeeks
        ? `S${Math.ceil(d.getDate() / 7)}`
        : format(d, "MMM yy", { locale: fr });
      byKey.set(key, (byKey.get(key) ?? 0) + (s.last_page_reached ?? 0));
    });
    return Array.from(byKey.entries()).map(([label, pages]) => ({ label, pages }));
  }, [filteredSessions, selectedMonth]);

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

  const filterLabel = useMemo(() => {
    if (selectedMonth === "all" && selectedYear === "all") return "Depuis mon inscription";
    const parts: string[] = [];
    if (selectedMonth !== "all") parts.push(MONTHS[parseInt(selectedMonth)]);
    if (selectedYear !== "all") parts.push(selectedYear);
    return parts.join(" ");
  }, [selectedMonth, selectedYear]);

  return (
    <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-5">
      {/* Period filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="Mois" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les mois</SelectItem>
            {MONTHS.map((m, i) => (
              <SelectItem key={i} value={String(i)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[130px] h-9 text-sm">
            <SelectValue placeholder="Année" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {yearOptions.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        
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
