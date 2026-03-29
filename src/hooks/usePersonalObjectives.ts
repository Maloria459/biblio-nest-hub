import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBooks } from "@/contexts/BooksContext";
import { useReadingSessions } from "@/hooks/useReadingSessions";
import { useMemo } from "react";
import {
  startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, startOfYear, endOfYear,
  parseISO, isAfter, isBefore, isEqual,
  subMonths, subYears, differenceInDays, eachDayOfInterval,
  format as fmtDate,
} from "date-fns";
import { toast } from "sonner";

/* ───────── objective_type catalogue ───────── */

export interface ObjectiveTypeOption {
  value: string;
  label: string;
  category: string;
  needsFilter?: "author" | "genre" | "format" | "series";
  inverted?: boolean;
  periodLocked?: string;   // forced period (hides selector)
  noPeriod?: boolean;       // no period at all (cumulative / one-shot)
  binary?: boolean;         // 0/1 objective (target auto = 1, hides target input)
  needsSecondTarget?: boolean; // e.g. read_duration_streak: X min + Y days
  timeUnit?: boolean;       // shows minutes/hours selector
  description?: string;
}

export const OBJECTIVE_TYPES: ObjectiveTypeOption[] = [
  // 📖 LECTURE (PAGES & TEMPS)
  { value: "read_pages_period", label: "Lire X pages", category: "Lecture", description: "Pages lues (sessions) sur la période choisie." },
  { value: "read_pages_session", label: "Lire X pages pendant une session", category: "Lecture", noPeriod: true, description: "Atteint dès qu'une session enregistre X pages lues." },
  { value: "read_duration", label: "Lire pendant X minutes/heures", category: "Lecture", noPeriod: true, timeUnit: true, description: "Atteint dès qu'une session dure X minutes/heures." },
  { value: "read_duration_day", label: "Lire X min/h par jour", category: "Lecture", timeUnit: true, description: "Temps de lecture cumulé par jour sur la période choisie." },
  { value: "read_duration_week", label: "Lire X min/h par semaine", category: "Lecture", timeUnit: true, description: "Temps de lecture cumulé par semaine sur la période choisie." },
  { value: "read_duration_month", label: "Lire X min/h par mois", category: "Lecture", timeUnit: true, description: "Temps de lecture cumulé par mois sur la période choisie." },
  { value: "read_duration_streak", label: "Atteindre X min/jour pendant Y jours d'affilée", category: "Lecture", needsSecondTarget: true, timeUnit: true, noPeriod: true, description: "Nombre de jours consécutifs où le temps de lecture dépasse X minutes." },

  // 📚 LIVRES TERMINÉS
  { value: "finish_books", label: "Finir X livres", category: "Livres terminés", noPeriod: true, description: "Nombre total de livres terminés." },
  { value: "finish_books_month", label: "Finir X livres dans le mois", category: "Livres terminés", periodLocked: "month", description: "Livres terminés ce mois-ci." },
  { value: "finish_books_year", label: "Finir X livres dans l'année", category: "Livres terminés", periodLocked: "year", description: "Livres terminés cette année." },
  { value: "read_big_book", label: "Lire un livre de plus de X pages", category: "Livres terminés", binary: false, noPeriod: true, description: "Atteint dès qu'un livre terminé dépasse X pages." },
  { value: "finish_book_fast", label: "Finir un livre en moins de X jours", category: "Livres terminés", binary: false, noPeriod: true, description: "Atteint si un livre a été lu (début → fin) en moins de X jours." },

  // ⏱️ SESSIONS
  { value: "sessions_count", label: "Réaliser X sessions de lecture", category: "Sessions", description: "Nombre total de sessions enregistrées." },
  { value: "session_per_day", label: "Lire au moins une session par jour", category: "Sessions", binary: true, description: "Atteint si au moins une session est enregistrée chaque jour sur la période." },
  { value: "sessions_per_week", label: "Lire X sessions par semaine", category: "Sessions", description: "Sessions enregistrées par semaine sur la période choisie." },
  { value: "sessions_per_month", label: "Lire X sessions par mois", category: "Sessions", description: "Sessions enregistrées par mois sur la période choisie." },

  // 🎯 DIVERSITÉ & DÉCOUVERTE
  { value: "read_genre", label: "Lire X livres d'un genre", category: "Diversité", needsFilter: "genre", noPeriod: true, description: "Livres terminés du genre sélectionné." },
  { value: "read_author", label: "Lire X livres d'un auteur", category: "Diversité", needsFilter: "author", noPeriod: true, description: "Livres terminés de l'auteur sélectionné." },
  { value: "read_format", label: "Lire X livres d'un format", category: "Diversité", needsFilter: "format", noPeriod: true, description: "Livres terminés dans le format sélectionné." },
  { value: "finish_series", label: "Finir une saga/série", category: "Diversité", needsFilter: "series", binary: true, noPeriod: true, description: "Tous les livres de la série sélectionnée sont terminés." },
  { value: "read_new_genre", label: "Lire un livre d'un genre jamais lu", category: "Diversité", binary: true, noPeriod: true, description: "Atteint si un livre est terminé dans un genre nouveau pour vous." },
  { value: "read_old_book", label: "Lire un livre commencé depuis longtemps", category: "Diversité", binary: true, noPeriod: true, description: "Atteint si un livre « En cours » depuis plus de 2 mois est terminé." },

  // 🔥 RÉGULARITÉ & STREAKS
  { value: "read_daily_streak", label: "Lire tous les jours pendant X jours", category: "Régularité", noPeriod: true, description: "Nombre de jours consécutifs avec au moins une session." },
  { value: "read_weekly_streak", label: "Lire chaque semaine pendant X semaines", category: "Régularité", noPeriod: true, description: "Nombre de semaines consécutives avec au moins une session." },

  // 📦 BIBLIOTHÈQUE & FICHES
  { value: "finish_in_progress", label: "Finir les livres en cours", category: "Bibliothèque", binary: true, noPeriod: true, description: "Atteint quand vous n'avez plus de livres « En cours de lecture »." },
  { value: "clear_pal", label: "Vider X livres de ma PAL", category: "Bibliothèque", description: "Livres sortis de votre PAL (terminés) sur la période." },
  { value: "write_reviews", label: "Rédiger X avis", category: "Bibliothèque", noPeriod: true, description: "Livres avec un avis rédigé." },
  { value: "add_citations", label: "Ajouter X citations", category: "Bibliothèque", noPeriod: true, description: "Nombre total de citations enregistrées." },
  { value: "fill_book_sheets", label: "Remplir X fiches de lecture complètes", category: "Bibliothèque", noPeriod: true, description: "Fiches avec synopsis, note, avis, citations, passages et personnages remplis." },
  { value: "buy_from_wishlist", label: "Acheter X livres de ma wishlist", category: "Bibliothèque", noPeriod: true, description: "Livres passés de la wishlist à un autre statut." },
  { value: "budget_max", label: "Dépenser moins de X € en livres", category: "Bibliothèque", inverted: true, description: "Total dépensé en livres sur la période (ne pas dépasser)." },

  // 🏆 RECORDS & DÉFIS
  { value: "beat_daily_pages", label: "Battre son record de pages en un jour", category: "Records", binary: true, noPeriod: true, description: "Atteint si vous lisez plus de pages en un jour que votre meilleur record." },
  { value: "beat_reading_minutes", label: "Battre son record de minutes lues", category: "Records", binary: true, noPeriod: true, description: "Atteint si une session bat votre record de durée." },
  { value: "read_more_than_last_month", label: "Lire plus que le mois précédent", category: "Records", periodLocked: "month", binary: true, description: "Plus de pages lues ce mois que le mois dernier." },
  { value: "read_more_than_last_year", label: "Lire plus de livres que l'an dernier", category: "Records", periodLocked: "year", binary: true, description: "Plus de livres terminés cette année que l'an dernier." },
  { value: "cumulative_pages", label: "Atteindre X pages cumulées", category: "Records", noPeriod: true, description: "Total de pages lues depuis la création du compte." },
];

/* ───────── DB row type ───────── */

export interface PersonalObjective {
  id: string;
  user_id: string;
  objective_type: string;
  target_value: number;
  filter_value: string | null;
  period_type: string;
  start_date: string | null;
  end_date: string | null;
  pinned: boolean;
  recurring: boolean;
  created_at: string;
}

export interface ObjectiveWithProgress extends PersonalObjective {
  currentValue: number;
  label: string;
}

/* ───────── period helpers ───────── */

function periodRange(obj: PersonalObjective): { start: Date; end: Date } | null {
  const now = new Date();
  switch (obj.period_type) {
    case "day":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "week":
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case "month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "year":
      return { start: startOfYear(now), end: endOfYear(now) };
    case "custom":
      if (obj.start_date && obj.end_date)
        return { start: parseISO(obj.start_date), end: parseISO(obj.end_date) };
      return null;
    default:
      return null;
  }
}

function inRange(dateStr: string | undefined | null, range: { start: Date; end: Date } | null): boolean {
  if (!dateStr || !range) return !range; // if no range, count everything
  try {
    const d = parseISO(dateStr);
    return (isAfter(d, range.start) || isEqual(d, range.start)) &&
           (isBefore(d, range.end) || isEqual(d, range.end));
  } catch { return false; }
}

/* ───────── helper: parse filter_value JSON ───────── */
function parseFilterJson(fv: string | null): Record<string, any> {
  if (!fv) return {};
  try { return JSON.parse(fv); } catch { return {}; }
}

/* ───────── helper: calculate pages read per session ───────── */
function getPagesPerSession(session: any, allSessions: any[]): number {
  const sorted = [...allSessions]
    .filter((s) => s.last_page_reached != null)
    .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());
  const idx = sorted.findIndex((s) => s.id === session.id);
  let prevPage = 0;
  for (let i = idx - 1; i >= 0; i--) {
    if (sorted[i].book_id === session.book_id && sorted[i].reread_number === session.reread_number) {
      prevPage = sorted[i].last_page_reached ?? 0;
      break;
    }
  }
  return (session.last_page_reached ?? 0) - prevPage;
}

/* ───────── helper: current daily streak ───────── */
function currentDailyStreak(sessions: any[]): number {
  if (sessions.length === 0) return 0;
  const days = new Set(sessions.map((s) => s.session_date?.slice(0, 10)).filter(Boolean));
  const sortedDays = [...days].sort().reverse();
  const today = fmtDate(new Date(), "yyyy-MM-dd");
  const yesterday = fmtDate(new Date(Date.now() - 86400000), "yyyy-MM-dd");
  if (!sortedDays.includes(today) && !sortedDays.includes(yesterday)) return 0;
  let streak = 0;
  let checkDate = sortedDays.includes(today) ? new Date() : new Date(Date.now() - 86400000);
  while (true) {
    const dateStr = fmtDate(checkDate, "yyyy-MM-dd");
    if (days.has(dateStr)) {
      streak++;
      checkDate = new Date(checkDate.getTime() - 86400000);
    } else break;
  }
  return streak;
}

/* ───────── helper: current weekly streak ───────── */
function currentWeeklyStreak(sessions: any[]): number {
  if (sessions.length === 0) return 0;
  const weeks = new Set(sessions.map((s) => {
    const d = parseISO(s.session_date);
    const ws = startOfWeek(d, { weekStartsOn: 1 });
    return fmtDate(ws, "yyyy-MM-dd");
  }));
  const sortedWeeks = [...weeks].sort().reverse();
  let streak = 0;
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  let checkWeek = currentWeekStart;
  while (true) {
    const weekStr = fmtDate(checkWeek, "yyyy-MM-dd");
    if (sortedWeeks.includes(weekStr)) {
      streak++;
      checkWeek = new Date(checkWeek.getTime() - 7 * 86400000);
    } else break;
  }
  return streak;
}

/* ───────── hook ───────── */

export function usePersonalObjectives() {
  const { user } = useAuth();
  const { books } = useBooks();
  const { data: sessions = [] } = useReadingSessions();
  const qc = useQueryClient();

  const queryKey = ["personal-objectives", user?.id];

  const { data: objectives = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("personal_objectives")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PersonalObjective[];
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  /* CRUD mutations */
  const createMutation = useMutation({
    mutationFn: async (obj: Omit<PersonalObjective, "id" | "user_id" | "created_at">) => {
      const { error } = await supabase.from("personal_objectives").insert({
        ...obj,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey }); toast.success("Objectif créé"); },
    onError: () => toast.error("Erreur lors de la création"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...fields }: Partial<PersonalObjective> & { id: string }) => {
      const { error } = await supabase.from("personal_objectives").update(fields).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey }); toast.success("Objectif mis à jour"); },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("personal_objectives").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey }); toast.success("Objectif supprimé"); },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const togglePin = async (obj: PersonalObjective) => {
    if (!obj.pinned) {
      const pinnedCount = objectives.filter((o) => o.pinned).length;
      if (pinnedCount >= 3) {
        toast.error("Vous pouvez épingler au maximum 3 objectifs");
        return;
      }
    }
    updateMutation.mutate({ id: obj.id, pinned: !obj.pinned });
  };

  const duplicateObjective = (obj: PersonalObjective) => {
    createMutation.mutate({
      objective_type: obj.objective_type,
      target_value: obj.target_value,
      filter_value: obj.filter_value,
      period_type: obj.period_type,
      start_date: obj.start_date,
      end_date: obj.end_date,
      pinned: false,
      recurring: obj.recurring,
    });
  };

  /* ───────── progression calculation ───────── */

  const objectivesWithProgress: ObjectiveWithProgress[] = useMemo(() => {
    return objectives.map((obj) => {
      const typeMeta = OBJECTIVE_TYPES.find((t) => t.value === obj.objective_type);
      // For periodLocked types, use the locked period; for noPeriod, null
      const effectivePeriod = typeMeta?.periodLocked ?? (typeMeta?.noPeriod ? null : obj.period_type);
      const range = effectivePeriod ? periodRange({ ...obj, period_type: effectivePeriod }) : null;
      let currentValue = 0;

      // Parse filter_value as JSON if applicable
      const filterJson = parseFilterJson(obj.filter_value);
      const simpleFilter = filterJson.filter ?? obj.filter_value;
      const timeUnitVal = filterJson.unit ?? "minutes";
      const secondTarget = filterJson.secondTarget ?? obj.target_value;

      // Effective target in minutes for timeUnit types
      const targetInMinutes = typeMeta?.timeUnit
        ? (timeUnitVal === "hours" ? obj.target_value * 60 : obj.target_value)
        : obj.target_value;

      // Helper: finished books
      const allFinished = books.filter((b) => ["Lu", "Lecture terminée"].includes(b.status));
      const finishedInRange = allFinished.filter((b) => inRange(b.endDate, range));

      // Helper: sessions in range
      const sessionsInRange = sessions.filter((s) => inRange(s.session_date, range));

      switch (obj.objective_type) {
        // ── LECTURE ──
        case "read_pages_period": {
          // Sum pages read from sessions in range
          const pagesFromSessions = sessionsInRange.reduce((sum, s) => sum + getPagesPerSession(s, sessions), 0);
          currentValue = Math.max(0, pagesFromSessions);
          break;
        }
        case "read_pages_session":
          currentValue = sessions.some((s) => {
            const pages = getPagesPerSession(s, sessions);
            return pages >= obj.target_value;
          }) ? 1 : 0;
          break;
        case "read_duration":
          currentValue = sessions.some((s) => s.duration_minutes >= targetInMinutes) ? 1 : 0;
          break;
        case "read_duration_day":
        case "read_duration_week":
        case "read_duration_month":
          currentValue = sessionsInRange.reduce((s, ss) => s + ss.duration_minutes, 0);
          // Display in same unit as target
          if (timeUnitVal === "hours") {
            currentValue = Math.round(currentValue / 6) / 10; // 1 decimal
          }
          break;
        case "read_duration_streak": {
          // Count consecutive days where total >= targetInMinutes
          const dayMinutes = new Map<string, number>();
          sessions.forEach((s) => {
            const day = s.session_date?.slice(0, 10);
            if (day) dayMinutes.set(day, (dayMinutes.get(day) ?? 0) + s.duration_minutes);
          });
          // Current streak of days >= targetInMinutes
          let streak = 0;
          let checkDate = new Date();
          const todayStr = fmtDate(checkDate, "yyyy-MM-dd");
          const yesterdayStr = fmtDate(new Date(Date.now() - 86400000), "yyyy-MM-dd");
          const startFrom = (dayMinutes.get(todayStr) ?? 0) >= targetInMinutes ? checkDate
            : (dayMinutes.get(yesterdayStr) ?? 0) >= targetInMinutes ? new Date(Date.now() - 86400000)
            : null;
          if (startFrom) {
            let d = startFrom;
            while (true) {
              const ds = fmtDate(d, "yyyy-MM-dd");
              if ((dayMinutes.get(ds) ?? 0) >= targetInMinutes) {
                streak++;
                d = new Date(d.getTime() - 86400000);
              } else break;
            }
          }
          currentValue = streak;
          // Target is the second target (Y days)
          break;
        }

        // ── LIVRES TERMINÉS ──
        case "finish_books":
        case "finish_books_month":
        case "finish_books_year":
          currentValue = finishedInRange.length;
          break;
        case "read_big_book":
          currentValue = allFinished.some((b) => (b.pages ?? 0) > obj.target_value) ? 1 : 0;
          break;
        case "finish_book_fast": {
          const booksFinishedFast = allFinished.filter((b) => {
            if (!b.startDate || !b.endDate) return false;
            const days = differenceInDays(parseISO(b.endDate), parseISO(b.startDate));
            return days < obj.target_value && days >= 0;
          });
          currentValue = booksFinishedFast.length > 0 ? 1 : 0;
          break;
        }

        // ── SESSIONS ──
        case "sessions_count":
          currentValue = sessionsInRange.length;
          break;
        case "session_per_day": {
          // Check if every day in range has at least one session
          if (range) {
            const endDate = new Date() < range.end ? new Date() : range.end;
            const allDays = eachDayOfInterval({ start: range.start, end: endDate });
            const sessionDays = new Set(sessionsInRange.map((s) => s.session_date?.slice(0, 10)));
            const allDaysHaveSessions = allDays.every((d) => sessionDays.has(fmtDate(d, "yyyy-MM-dd")));
            currentValue = allDaysHaveSessions && allDays.length > 0 ? 1 : 0;
          } else {
            currentValue = 0;
          }
          break;
        }
        case "sessions_per_week":
        case "sessions_per_month":
          currentValue = sessionsInRange.length;
          break;

        // ── DIVERSITÉ ──
        case "read_genre":
          currentValue = finishedInRange.filter((b) => b.genre === simpleFilter).length;
          break;
        case "read_author":
          currentValue = finishedInRange.filter((b) => b.author === simpleFilter).length;
          break;
        case "read_format":
          currentValue = finishedInRange.filter((b) => b.format === simpleFilter).length;
          break;
        case "finish_series": {
          const seriesBooks = books.filter((b) => b.series === simpleFilter);
          currentValue = seriesBooks.length > 0 && seriesBooks.every((b) => ["Lu", "Lecture terminée"].includes(b.status)) ? 1 : 0;
          break;
        }
        case "read_new_genre": {
          const finishedGenres = allFinished.map((b) => b.genre).filter(Boolean);
          const genreCounts = new Map<string, number>();
          finishedGenres.forEach((g) => genreCounts.set(g!, (genreCounts.get(g!) ?? 0) + 1));
          currentValue = [...genreCounts.values()].some((c) => c === 1) ? 1 : 0;
          break;
        }
        case "read_old_book": {
          const twoMonthsAgo = subMonths(new Date(), 2);
          currentValue = allFinished.some((b) => {
            if (!b.startDate || !b.endDate) return false;
            return isBefore(parseISO(b.startDate), twoMonthsAgo);
          }) ? 1 : 0;
          break;
        }

        // ── RÉGULARITÉ ──
        case "read_daily_streak":
          currentValue = currentDailyStreak(sessions);
          break;
        case "read_weekly_streak":
          currentValue = currentWeeklyStreak(sessions);
          break;

        // ── BIBLIOTHÈQUE ──
        case "finish_in_progress": {
          const inProgress = books.filter((b) => b.status === "En cours de lecture");
          currentValue = inProgress.length === 0 ? 1 : 0;
          break;
        }
        case "clear_pal":
          currentValue = finishedInRange.length;
          break;
        case "write_reviews":
          currentValue = books.filter((b) => b.avis && b.avis.trim().length > 0).length;
          break;
        case "add_citations":
          currentValue = books.reduce((s, b) => s + (b.citations?.length ?? 0), 0);
          break;
        case "fill_book_sheets": {
          currentValue = books.filter((b) =>
            b.synopsis && b.synopsis.trim().length > 0 &&
            b.rating != null &&
            b.avis && b.avis.trim().length > 0 &&
            b.citations && b.citations.length > 0 &&
            b.passagesPreferes && b.passagesPreferes.trim().length > 0 &&
            b.personnagesPreferes && b.personnagesPreferes.trim().length > 0
          ).length;
          break;
        }
        case "buy_from_wishlist": {
          // Books that have status != Wishlist but were presumably from wishlist
          // We approximate: books with status "Acheté" that have been recently changed
          currentValue = books.filter((b) => b.status === "Acheté" && inRange(b.startDate ?? (b as any).created_at, range)).length;
          break;
        }
        case "budget_max":
          currentValue = books
            .filter((b) => inRange(b.startDate ?? (b as any).created_at, range))
            .reduce((s, b) => s + (b.price ?? 0), 0);
          break;

        // ── RECORDS ──
        case "beat_daily_pages": {
          const dayPages = new Map<string, number>();
          sessions.forEach((s) => {
            const day = s.session_date?.slice(0, 10);
            if (day && s.last_page_reached != null) {
              const pages = getPagesPerSession(s, sessions);
              dayPages.set(day, (dayPages.get(day) ?? 0) + pages);
            }
          });
          const values = [...dayPages.values()];
          if (values.length >= 2) {
            const sorted = [...values].sort((a, b) => b - a);
            const today = fmtDate(new Date(), "yyyy-MM-dd");
            const todayPages = dayPages.get(today) ?? 0;
            const previousRecord = sorted.find((v) => v !== todayPages) ?? sorted[1] ?? 0;
            currentValue = todayPages > previousRecord ? 1 : 0;
          }
          break;
        }
        case "beat_reading_minutes": {
          const maxMinutes = Math.max(0, ...sessions.slice(1).map((s) => s.duration_minutes));
          const latestSession = sessions[0];
          currentValue = latestSession && latestSession.duration_minutes > maxMinutes ? 1 : 0;
          break;
        }
        case "read_more_than_last_month": {
          const now = new Date();
          const thisMonthRange = { start: startOfMonth(now), end: endOfMonth(now) };
          const lastMonth = subMonths(now, 1);
          const lastMonthRange = { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
          const thisMonthPages = sessions.filter((s) => inRange(s.session_date, thisMonthRange))
            .reduce((sum, s) => sum + getPagesPerSession(s, sessions), 0);
          const lastMonthPages = sessions.filter((s) => inRange(s.session_date, lastMonthRange))
            .reduce((sum, s) => sum + getPagesPerSession(s, sessions), 0);
          currentValue = thisMonthPages > lastMonthPages ? 1 : 0;
          break;
        }
        case "read_more_than_last_year": {
          const now = new Date();
          const thisYear = now.getFullYear();
          const lastYear = thisYear - 1;
          const thisYearBooks = allFinished.filter((b) => b.endDate && parseISO(b.endDate).getFullYear() === thisYear).length;
          const lastYearBooks = allFinished.filter((b) => b.endDate && parseISO(b.endDate).getFullYear() === lastYear).length;
          currentValue = thisYearBooks > lastYearBooks ? 1 : 0;
          break;
        }
        case "cumulative_pages":
          currentValue = sessions.reduce((sum, s) => sum + getPagesPerSession(s, sessions), 0);
          break;

        default:
          currentValue = 0;
      }

      // Build label
      const periodLabel = effectivePeriod === "day" ? " (aujourd'hui)"
        : effectivePeriod === "week" ? " (cette semaine)"
        : effectivePeriod === "month" ? " (ce mois)"
        : effectivePeriod === "year" ? " (cette année)"
        : obj.period_type === "custom" && obj.start_date && obj.end_date
          ? ` (${obj.start_date} → ${obj.end_date})`
          : "";

      const rawLabel = typeMeta?.label ?? obj.objective_type;
      let label = rawLabel.replace("X", String(obj.target_value));

      // Handle second target for streak
      if (typeMeta?.needsSecondTarget && filterJson.secondTarget) {
        label = label.replace("Y", String(filterJson.secondTarget));
      }

      // Replace filter display (only for filter types)
      if (simpleFilter && typeMeta?.needsFilter) {
        // filter info is NOT shown in label per user request
      }

      // Append time unit
      if (typeMeta?.timeUnit) {
        label = label.replace("min/h", timeUnitVal === "hours" ? "h" : "min")
                     .replace("minutes/heures", timeUnitVal === "hours" ? "heures" : "minutes");
      }

      label += periodLabel;

      return {
        ...obj,
        currentValue,
        label,
      };
    });
  }, [objectives, books, sessions]);

  const pinnedObjectives = useMemo(
    () => objectivesWithProgress.filter((o) => o.pinned).slice(0, 3),
    [objectivesWithProgress]
  );

  return {
    objectives: objectivesWithProgress,
    pinnedObjectives,
    isLoading,
    createObjective: createMutation.mutate,
    updateObjective: updateMutation.mutate,
    deleteObjective: deleteMutation.mutate,
    duplicateObjective,
    togglePin,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
