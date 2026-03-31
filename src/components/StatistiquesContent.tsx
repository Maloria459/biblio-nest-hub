import { useState, useMemo, useEffect } from "react";
import { useBooks } from "@/contexts/BooksContext";
import { useReadingSessions, type ReadingSession } from "@/hooks/useReadingSessions";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isAfter, isBefore, parseISO, format, getDay, addWeeks, addMonths, addYears, subWeeks, subMonths, subYears } from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

import { StatsLectureBlock } from "@/components/stats/StatsLectureBlock";
import { StatsBibliothequeBlock } from "@/components/stats/StatsBibliothequeBlock";
import { StatsObjectifsBlock } from "@/components/stats/StatsObjectifsBlock";
import { StatsGamificationBlock } from "@/components/stats/StatsGamificationBlock";
import { StatsCommunauteBlock } from "@/components/stats/StatsCommunauteBlock";

const PERIOD_MODES = [
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
  { value: "year", label: "Année" },
  { value: "all", label: "Global" },
];

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

function getPeriodRange(mode: string, offset: number) {
  const base = new Date();
  if (mode === "week") {
    const shifted = addWeeks(base, offset);
    return { rangeStart: startOfWeek(shifted, { weekStartsOn: 1 }), rangeEnd: endOfWeek(shifted, { weekStartsOn: 1 }) };
  }
  if (mode === "month") {
    const shifted = addMonths(base, offset);
    return { rangeStart: startOfMonth(shifted), rangeEnd: endOfMonth(shifted) };
  }
  if (mode === "year") {
    const shifted = addYears(base, offset);
    return { rangeStart: startOfYear(shifted), rangeEnd: endOfYear(shifted) };
  }
  return { rangeStart: null, rangeEnd: null };
}

function getPeriodLabel(mode: string, offset: number): string {
  const base = new Date();
  if (mode === "week") {
    const shifted = addWeeks(base, offset);
    const start = startOfWeek(shifted, { weekStartsOn: 1 });
    return `Semaine du ${format(start, "d MMMM yyyy", { locale: fr })}`;
  }
  if (mode === "month") {
    const shifted = addMonths(base, offset);
    return format(shifted, "MMMM yyyy", { locale: fr });
  }
  if (mode === "year") {
    const shifted = addYears(base, offset);
    return format(shifted, "yyyy");
  }
  return "Depuis mon inscription";
}

export function StatistiquesContent() {
  const [mode, setMode] = useState("all");
  const [offset, setOffset] = useState(0);
  const { books } = useBooks();
  const { data: sessions = [] } = useReadingSessions();
  const { user } = useAuth();
  const memberSince = useMemberSince();

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    setOffset(0);
  };

  const { rangeStart, rangeEnd } = useMemo(() => getPeriodRange(mode, offset), [mode, offset]);
  const periodLabel = useMemo(() => getPeriodLabel(mode, offset), [mode, offset]);

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

  // Evolution chart
  const evolutionData = useMemo(() => {
    if (filteredSessions.length === 0) return [];
    const byKey = new Map<string, number>();
    const useWeeks = mode === "month" || mode === "week";
    filteredSessions.forEach((s) => {
      const d = new Date(s.session_date);
      const key = useWeeks ? `S${Math.ceil(d.getDate() / 7)}` : format(d, "MMM yy", { locale: fr });
      byKey.set(key, (byKey.get(key) ?? 0) + (s.last_page_reached ?? 0));
    });
    return Array.from(byKey.entries()).map(([label, pages]) => ({ label, pages }));
  }, [filteredSessions, mode]);

  // Weekday chart
  const weekdayMinutes = useMemo(() => {
    const arr = [0, 0, 0, 0, 0, 0, 0];
    filteredSessions.forEach((s) => { arr[toMondayIndex(new Date(s.session_date))] += s.duration_minutes; });
    return arr;
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
  const objectivesCompleted = 0; // TODO: compute when progress tracking is available
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {PERIOD_MODES.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleModeChange(opt.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                mode === opt.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {mode !== "all" && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOffset((o) => o - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-foreground min-w-[180px] text-center capitalize">
              {periodLabel}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOffset((o) => o + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {(mode !== "all" || offset !== 0) && (
          <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => { setMode("all"); setOffset(0); }}>
            <RotateCcw className="h-3 w-3 mr-1" />
            Réinitialiser
          </Button>
        )}
      </div>

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

      {/* Gamification */}
      <StatsGamificationBlock
        challengesCompleted={challengesCompleted}
        totalEclats={0}
        totalXpPages={0}
        totalBadges={0}
        currentRank="Novice des Pages"
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
