import { useState, useMemo, useEffect } from "react";
import { useBooks } from "@/contexts/BooksContext";
import { useReadingSessions, type ReadingSession } from "@/hooks/useReadingSessions";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isAfter, isBefore, parseISO, format, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";

import { StatsLectureBlock } from "@/components/stats/StatsLectureBlock";
import { StatsBibliothequeBlock } from "@/components/stats/StatsBibliothequeBlock";
import { StatsObjectifsBlock } from "@/components/stats/StatsObjectifsBlock";
import { StatsGamificationBlock } from "@/components/stats/StatsGamificationBlock";
import { StatsCommunauteBlock } from "@/components/stats/StatsCommunauteBlock";

const PERIOD_OPTIONS = [
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
  { value: "year", label: "Année" },
  { value: "all", label: "Depuis mon inscription" },
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

export function StatistiquesContent() {
  const [period, setPeriod] = useState("all");
  const { books } = useBooks();
  const { data: sessions = [] } = useReadingSessions();
  const { user } = useAuth();
  const memberSince = useMemberSince();

  // Period range
  const { rangeStart, rangeEnd } = useMemo(() => {
    const now = new Date();
    if (period === "week") return { rangeStart: startOfWeek(now, { weekStartsOn: 1 }), rangeEnd: endOfWeek(now, { weekStartsOn: 1 }) };
    if (period === "month") return { rangeStart: startOfMonth(now), rangeEnd: endOfMonth(now) };
    if (period === "year") return { rangeStart: startOfYear(now), rangeEnd: endOfYear(now) };
    return { rangeStart: null, rangeEnd: null };
  }, [period]);

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
    const useWeeks = period === "month" || period === "week";
    filteredSessions.forEach((s) => {
      const d = new Date(s.session_date);
      const key = useWeeks ? `S${Math.ceil(d.getDate() / 7)}` : format(d, "MMM yy", { locale: fr });
      byKey.set(key, (byKey.get(key) ?? 0) + (s.last_page_reached ?? 0));
    });
    return Array.from(byKey.entries()).map(([label, pages]) => ({ label, pages }));
  }, [filteredSessions, period]);

  // Weekday chart
  const weekdayMinutes = useMemo(() => {
    const arr = [0, 0, 0, 0, 0, 0, 0];
    filteredSessions.forEach((s) => { arr[toMondayIndex(new Date(s.session_date))] += s.duration_minutes; });
    return arr;
  }, [filteredSessions]);

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
  // Placeholder: count objectives that are "completed" — for now we just show the total count
  const objectivesCompleted = 0; // TODO: compute when progress tracking is available

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
    <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-8">
      {/* Period filter */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              period === opt.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
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
      />

      {/* Bibliothèque */}
      <StatsBibliothequeBlock
        genreOwned={genreDataOwned}
        genreRead={genreDataRead}
        formatOwned={formatDataOwned}
        formatRead={formatDataRead}
        booksAcquired={booksAcquired}
        totalSpent={totalSpent}
      />

      {/* Objectifs */}
      <StatsObjectifsBlock objectivesCompleted={objectivesCompleted} />

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
