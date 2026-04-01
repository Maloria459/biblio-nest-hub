import { useState, useMemo, useEffect } from "react";
import { useBooks } from "@/contexts/BooksContext";
import { useReadingSessions, type ReadingSession } from "@/hooks/useReadingSessions";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isAfter, isBefore, parseISO, format, getDay, getISOWeek, addWeeks, addMonths, addYears, subWeeks, subMonths, subYears, eachDayOfInterval, eachWeekOfInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { StatsLectureBlock } from "@/components/stats/StatsLectureBlock";
import { StatsBibliothequeBlock } from "@/components/stats/StatsBibliothequeBlock";
import { StatsObjectifsBlock } from "@/components/stats/StatsObjectifsBlock";
import { StatsGamificationBlock } from "@/components/stats/StatsGamificationBlock";
import { StatsCommunauteBlock } from "@/components/stats/StatsCommunauteBlock";

function useMemberSince() {
  const { user } = useAuth();
  const [since, setSince] = useState<Date | null>(null);
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("created_at").eq("user_id", user.id).single().then(({ data }) => {
      if (data?.created_at) setSince(new Date(data.created_at));
    });
  }, [user]);
  return since;
}

function dateInRange(dateStr: string | undefined | null, start: Date | null, end: Date | null): boolean {
  if (!dateStr) return !start;
  try {
    const d = parseISO(dateStr);
    if (start && isBefore(d, start)) return false;
    if (end && isAfter(d, end)) return false;
    return true;
  } catch { return true; }
}

function toMondayIndex(d: Date) {
  const day = getDay(d);
  return day === 0 ? 6 : day - 1;
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Generate week options for current year
function getWeekOptions() {
  const now = new Date();
  const year = now.getFullYear();
  const weeks: { value: string; label: string }[] = [];
  let d = startOfWeek(new Date(year, 0, 4), { weekStartsOn: 1 }); // first ISO week
  for (let w = 1; w <= 53; w++) {
    const wStart = startOfWeek(d, { weekStartsOn: 1 });
    if (wStart.getFullYear() > year && w > 1) break;
    weeks.push({
      value: `${year}-W${String(w).padStart(2, "0")}`,
      label: `Sem. ${w} (${format(wStart, "dd/MM", { locale: fr })})`,
    });
    d = addWeeks(d, 1);
  }
  return weeks;
}

function getMonthOptions() {
  return Array.from({ length: 12 }, (_, i) => ({
    value: String(i),
    label: format(new Date(2024, i, 1), "MMMM", { locale: fr }),
  }));
}

function getYearOptions(memberSince: Date | null) {
  const now = new Date();
  const startYear = memberSince ? memberSince.getFullYear() : now.getFullYear() - 5;
  const years: { value: string; label: string }[] = [];
  for (let y = startYear; y <= now.getFullYear(); y++) {
    years.push({ value: String(y), label: String(y) });
  }
  return years;
}

export function StatistiquesContent() {
  const [selectedWeek, setSelectedWeek] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const { books } = useBooks();
  const { data: sessions = [] } = useReadingSessions();
  const { user } = useAuth();
  const memberSince = useMemberSince();

  const weekOptions = useMemo(() => getWeekOptions(), []);
  const monthOptions = useMemo(() => getMonthOptions(), []);
  const yearOptions = useMemo(() => getYearOptions(memberSince), [memberSince]);

  const handleReset = () => {
    setSelectedWeek("all");
    setSelectedMonth("all");
    setSelectedYear("all");
  };

  const hasFilter = selectedWeek !== "all" || selectedMonth !== "all" || selectedYear !== "all";

  // Compute range from selections
  const { rangeStart, rangeEnd, filterMode } = useMemo(() => {
    const now = new Date();
    const year = selectedYear !== "all" ? parseInt(selectedYear) : null;

    if (selectedWeek !== "all") {
      // Week selected: extract year and week number
      const parts = selectedWeek.split("-W");
      const wYear = parseInt(parts[0]);
      const wNum = parseInt(parts[1]);
      let d = startOfWeek(new Date(wYear, 0, 4), { weekStartsOn: 1 });
      d = addWeeks(d, wNum - 1);
      return { rangeStart: startOfWeek(d, { weekStartsOn: 1 }), rangeEnd: endOfWeek(d, { weekStartsOn: 1 }), filterMode: "week" as const };
    }

    if (selectedMonth !== "all" && year) {
      const m = parseInt(selectedMonth);
      return { rangeStart: startOfMonth(new Date(year, m, 1)), rangeEnd: endOfMonth(new Date(year, m, 1)), filterMode: "month" as const };
    }

    if (selectedMonth !== "all") {
      const m = parseInt(selectedMonth);
      return { rangeStart: startOfMonth(new Date(now.getFullYear(), m, 1)), rangeEnd: endOfMonth(new Date(now.getFullYear(), m, 1)), filterMode: "month" as const };
    }

    if (year) {
      return { rangeStart: startOfYear(new Date(year, 0, 1)), rangeEnd: endOfYear(new Date(year, 0, 1)), filterMode: "year" as const };
    }

    return { rangeStart: null, rangeEnd: null, filterMode: "all" as const };
  }, [selectedWeek, selectedMonth, selectedYear]);

  const filteredBooks = useMemo(() => books.filter((b) => dateInRange(b.endDate || b.startDate, rangeStart, rangeEnd)), [books, rangeStart, rangeEnd]);
  const filteredSessions = useMemo(() => sessions.filter((s) => dateInRange(s.session_date, rangeStart, rangeEnd)), [sessions, rangeStart, rangeEnd]);

  const finishedStatuses = ["Lu", "Lecture terminée"];

  // ── Lecture block data ──
  const booksFinished = filteredBooks.filter((b) => finishedStatuses.includes(b.status)).length;
  const totalPagesRead = filteredBooks.reduce((s, b) => s + (b.pagesRead ?? 0), 0);
  const totalReadingMinutes = filteredSessions.reduce((s, se) => s + se.duration_minutes, 0);
  const totalSessions = filteredSessions.length;
  const avgReadingMinutes = totalSessions > 0 ? totalReadingMinutes / totalSessions : null;

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
  const coupsDeCoeur = filteredBooks.filter((b) => b.coupDeCoeur).length;

  // Records
  const readBooks = useMemo(() => filteredBooks.filter((b) => finishedStatuses.includes(b.status)), [filteredBooks]);
  const longestBook = useMemo(() => {
    const finished = readBooks.filter((b) => b.pages);
    return finished.sort((a, b) => (b.pages ?? 0) - (a.pages ?? 0))[0] ?? null;
  }, [readBooks]);

  const longestSession = useMemo(() => {
    if (!filteredSessions.length) return null;
    return filteredSessions.reduce((best, s) => s.duration_minutes > best.duration_minutes ? s : best, filteredSessions[0]);
  }, [filteredSessions]);

  // Best period
  const bestPeriod = useMemo(() => {
    const monthMap = new Map<string, number>();
    readBooks.filter((b) => b.endDate).forEach((b) => {
      const key = format(parseISO(b.endDate!), "MMMM yyyy", { locale: fr });
      monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
    });
    let best: string | null = null;
    let bestCount = 0;
    monthMap.forEach((count, m) => { if (count > bestCount) { best = m; bestCount = count; } });
    return { label: best, count: bestCount || null };
  }, [readBooks]);

  // Longest streak
  const longestStreak = useMemo(() => {
    const dates = new Set<string>();
    filteredSessions.forEach((s) => dates.add(dateKey(new Date(s.session_date))));
    if (dates.size === 0) return 0;
    const sorted = Array.from(dates).sort();
    let max = 1, cur = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const next = new Date(sorted[i]);
      const diff = (next.getTime() - prev.getTime()) / 86400000;
      if (diff === 1) { cur++; max = Math.max(max, cur); } else { cur = 1; }
    }
    return max;
  }, [filteredSessions]);

  // Evolution chart — labels by day for week/month, by month for year/all
  const evolutionData = useMemo(() => {
    if (filteredSessions.length === 0) return [];
    const byKey = new Map<string, number>();

    if (filterMode === "week") {
      // By day of week
      const days = rangeStart && rangeEnd ? eachDayOfInterval({ start: rangeStart, end: rangeEnd }) : [];
      days.forEach(d => {
        const label = format(d, "EEE dd", { locale: fr });
        byKey.set(label, 0);
      });
      filteredSessions.forEach((s) => {
        const d = new Date(s.session_date);
        const label = format(d, "EEE dd", { locale: fr });
        byKey.set(label, (byKey.get(label) ?? 0) + (s.last_page_reached ?? 0));
      });
    } else if (filterMode === "month") {
      // By day
      const days = rangeStart && rangeEnd ? eachDayOfInterval({ start: rangeStart, end: rangeEnd }) : [];
      days.forEach(d => {
        const label = format(d, "dd", { locale: fr });
        byKey.set(label, 0);
      });
      filteredSessions.forEach((s) => {
        const d = new Date(s.session_date);
        const label = format(d, "dd", { locale: fr });
        byKey.set(label, (byKey.get(label) ?? 0) + (s.last_page_reached ?? 0));
      });
    } else if (filterMode === "year") {
      // By month
      for (let m = 0; m < 12; m++) {
        const label = format(new Date(2024, m, 1), "MMM", { locale: fr });
        byKey.set(label, 0);
      }
      filteredSessions.forEach((s) => {
        const d = new Date(s.session_date);
        const label = format(d, "MMM", { locale: fr });
        byKey.set(label, (byKey.get(label) ?? 0) + (s.last_page_reached ?? 0));
      });
    } else {
      // all: by month
      filteredSessions.forEach((s) => {
        const d = new Date(s.session_date);
        const label = format(d, "MMM yy", { locale: fr });
        byKey.set(label, (byKey.get(label) ?? 0) + (s.last_page_reached ?? 0));
      });
    }

    return Array.from(byKey.entries()).map(([label, pages]) => ({ label, pages }));
  }, [filteredSessions, filterMode, rangeStart, rangeEnd]);

  // Weekday chart
  const weekdayMinutes = useMemo(() => {
    const arr = [0, 0, 0, 0, 0, 0, 0];
    const countArr = [0, 0, 0, 0, 0, 0, 0];
    filteredSessions.forEach((s) => {
      const idx = toMondayIndex(new Date(s.session_date));
      arr[idx] += s.duration_minutes;
      countArr[idx]++;
    });
    // Return averages
    return arr.map((total, i) => countArr[i] > 0 ? total / countArr[i] : 0);
  }, [filteredSessions]);

  // ── Rating data ──
  const ratingDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    readBooks.forEach((b) => { if (b.rating && b.rating >= 1 && b.rating <= 5) dist[b.rating - 1]++; });
    return dist;
  }, [readBooks]);

  const ratingAverage = useMemo(() => {
    const rated = readBooks.filter((b) => b.rating && b.rating >= 1);
    if (rated.length === 0) return null;
    return rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length;
  }, [readBooks]);

  // ── Bibliothèque block data ──
  const genreDataOwned = useMemo(() => {
    const map = new Map<string, number>();
    books.forEach((b) => { if (b.genre) map.set(b.genre, (map.get(b.genre) ?? 0) + 1); });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [books]);

  const genreDataRead = useMemo(() => {
    const map = new Map<string, number>();
    readBooks.forEach((b) => { if (b.genre) map.set(b.genre, (map.get(b.genre) ?? 0) + 1); });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [readBooks]);

  const formatDataOwned = useMemo(() => {
    const map = new Map<string, number>();
    books.forEach((b) => { if (b.format) map.set(b.format, (map.get(b.format) ?? 0) + 1); });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [books]);

  const formatDataRead = useMemo(() => {
    const map = new Map<string, number>();
    readBooks.forEach((b) => { if (b.format) map.set(b.format, (map.get(b.format) ?? 0) + 1); });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [readBooks]);

  const totalBooksOwned = books.length;
  const booksAcquired = useMemo(() => filteredBooks.filter((b) => b.price != null && b.price > 0).length, [filteredBooks]);
  const totalSpent = useMemo(() => filteredBooks.reduce((s, b) => s + (b.price ?? 0), 0), [filteredBooks]);

  // ── Objectifs ──
  const { data: objectives = [] } = useQuery({
    queryKey: ["personal-objectives-stats", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("personal_objectives").select("*").eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
  const objectivesCreated = objectives.length;
  const objectivesCompleted = 0;
  const objectivesInProgress = objectivesCreated - objectivesCompleted;

  // ── Gamification ──
  const { data: userProgress = [] } = useQuery({
    queryKey: ["user-progress-stats", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_progress").select("*").eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
  const challengesCompleted = userProgress.filter((p) => p.completed).length;

  // ── Communauté ──
  const { data: pastLiteraryEvents = 0 } = useQuery({
    queryKey: ["past-literary-events", user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { count } = await supabase.from("literary_events").select("id", { count: "exact", head: true }).eq("user_id", user!.id).lt("event_date", today);
      return count ?? 0;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: pastClubEvents = 0 } = useQuery({
    queryKey: ["past-club-events", user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { count } = await supabase.from("book_club_events").select("id", { count: "exact", head: true }).eq("user_id", user!.id).lt("event_date", today);
      return count ?? 0;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-6">
      {/* Period filter */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={selectedWeek} onValueChange={(v) => setSelectedWeek(v)}>
          <SelectTrigger className="w-[200px] h-9 text-xs">
            <SelectValue placeholder="Semaine" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les semaines</SelectItem>
            {weekOptions.map((w) => (
              <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedMonth} onValueChange={(v) => setSelectedMonth(v)}>
          <SelectTrigger className="w-[180px] h-9 text-xs">
            <SelectValue placeholder="Mois" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les mois</SelectItem>
            {monthOptions.map((m) => (
              <SelectItem key={m.value} value={m.value} className="capitalize">{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedYear} onValueChange={(v) => setSelectedYear(v)}>
          <SelectTrigger className="w-[140px] h-9 text-xs">
            <SelectValue placeholder="Année" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les années</SelectItem>
            {yearOptions.map((y) => (
              <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilter && (
          <Button variant="outline" size="sm" className="text-xs h-9" onClick={handleReset}>
            <RotateCcw className="h-3 w-3 mr-1" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Gamification (moved to top) */}
      <StatsGamificationBlock
        challengesCompleted={challengesCompleted}
        totalEclats={0}
        totalXpPages={0}
        totalBadges={0}
        currentRank="Novice des Pages"
      />

      {/* Lecture */}
      <StatsLectureBlock
        booksFinished={booksFinished}
        totalPagesRead={totalPagesRead}
        totalSessions={totalSessions}
        totalReadingMinutes={totalReadingMinutes}
        avgReadingMinutes={avgReadingMinutes}
        avgPagesPerDay={avgPagesPerDay}
        coupsDeCoeur={coupsDeCoeur}
        longestSessionMinutes={longestSession?.duration_minutes ?? null}
        longestBookTitle={longestBook?.title ?? null}
        longestBookPages={longestBook?.pages ?? null}
        bestPeriodLabel={bestPeriod.label}
        bestPeriodCount={bestPeriod.count}
        longestStreak={longestStreak}
        evolutionData={evolutionData}
        weekdayMinutes={weekdayMinutes}
        ratingDistribution={ratingDistribution}
        ratingAverage={ratingAverage}
      />

      {/* Bibliothèque */}
      <StatsBibliothequeBlock
        genreOwned={genreDataOwned}
        genreRead={genreDataRead}
        formatOwned={formatDataOwned}
        formatRead={formatDataRead}
        booksAcquired={booksAcquired}
        totalSpent={totalSpent}
        totalBooks={totalBooksOwned}
      />

      {/* Objectifs */}
      <StatsObjectifsBlock
        objectivesCompleted={objectivesCompleted}
        objectivesCreated={objectivesCreated}
        objectivesInProgress={objectivesInProgress}
      />

      {/* Communauté */}
      <StatsCommunauteBlock
        literaryEventsCount={pastLiteraryEvents}
        clubEventsCount={pastClubEvents}
        publicationsCount={0}
      />
    </div>
  );
}
