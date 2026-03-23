import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBooks } from "@/contexts/BooksContext";
import { useReadingSessions } from "@/hooks/useReadingSessions";
import { useMemo } from "react";
import {
  startOfMonth, endOfMonth, startOfYear, endOfYear,
  parseISO, isAfter, isBefore, isEqual,
} from "date-fns";
import { toast } from "sonner";

/* ───────── objective_type catalogue ───────── */

export interface ObjectiveTypeOption {
  value: string;
  label: string;
  category: string;
  needsFilter?: "author" | "genre" | "format" | "publisher" | "series";
  /** When true the objective is "spend less than X" (inverted progress) */
  inverted?: boolean;
}

export const OBJECTIVE_TYPES: ObjectiveTypeOption[] = [
  // Lecture
  { value: "read_books", label: "Lire X livres", category: "Lecture" },
  { value: "read_pages", label: "Lire X pages", category: "Lecture" },
  { value: "read_minutes", label: "Lire pendant X minutes", category: "Lecture" },
  { value: "sessions_count", label: "Effectuer X sessions de lecture", category: "Lecture" },
  { value: "read_author", label: "Lire X livres d'un auteur", category: "Lecture", needsFilter: "author" },
  { value: "read_genre", label: "Lire X livres d'un genre", category: "Lecture", needsFilter: "genre" },
  { value: "read_format", label: "Lire X livres dans un format", category: "Lecture", needsFilter: "format" },
  { value: "read_publisher", label: "Lire X livres d'un éditeur", category: "Lecture", needsFilter: "publisher" },
  { value: "read_series", label: "Lire X livres d'une série", category: "Lecture", needsFilter: "series" },
  { value: "read_big_book", label: "Terminer un livre de plus de X pages", category: "Lecture" },
  // Bibliothèque
  { value: "buy_books", label: "Acheter X livres", category: "Bibliothèque" },
  { value: "add_wishlist", label: "Ajouter X livres à la wishlist", category: "Bibliothèque" },
  { value: "add_pal", label: "Ajouter X livres dans ma PAL", category: "Bibliothèque" },
  { value: "clear_pal", label: "Vider X livres de ma PAL", category: "Bibliothèque" },
  { value: "loan_books", label: "Prêter X livres", category: "Bibliothèque" },
  { value: "borrow_books", label: "Emprunter X livres", category: "Bibliothèque" },
  { value: "collections_count", label: "Créer X collections", category: "Bibliothèque" },
  { value: "add_to_collections", label: "Ajouter X livres dans des collections", category: "Bibliothèque" },
  { value: "write_reviews", label: "Rédiger X avis", category: "Bibliothèque" },
  { value: "add_citations", label: "Ajouter X citations", category: "Bibliothèque" },
  { value: "budget_max", label: "Dépenser moins de X € en livres", category: "Bibliothèque", inverted: true },
  // Qualité / Engagement
  { value: "coups_de_coeur", label: "Avoir X coups de cœur", category: "Qualité" },
  { value: "rate_books", label: "Noter X livres", category: "Qualité" },
  { value: "avg_rating_above", label: "Atteindre une note moyenne ≥ X", category: "Qualité" },
  { value: "recommend_books", label: "Recommander X livres du mois", category: "Qualité" },
  { value: "fav_characters", label: "Renseigner X personnages préférés", category: "Qualité" },
  { value: "fav_passages", label: "Renseigner X passages préférés", category: "Qualité" },
  // Sessions de lecture
  { value: "reading_days", label: "Lire X jours différents", category: "Sessions" },
  { value: "long_session", label: "Faire une session de plus de X minutes", category: "Sessions" },
  { value: "pages_in_session", label: "Atteindre X pages lues en une session", category: "Sessions" },
  // Communauté
  { value: "attend_literary_events", label: "Participer à X évènements littéraires", category: "Communauté" },
  { value: "attend_book_clubs", label: "Participer à X clubs de lecteurs", category: "Communauté" },
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

/* ───────── hook ───────── */

export function usePersonalObjectives() {
  const { user } = useAuth();
  const { books } = useBooks();
  const { data: sessions = [] } = useReadingSessions();
  const qc = useQueryClient();

  // Fetch collections count
  const { data: collections = [] } = useQuery({
    queryKey: ["collections-for-objectives", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, created_at")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  // Fetch collection_books count
  const { data: collectionBooks = [] } = useQuery({
    queryKey: ["collection-books-for-objectives", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collection_books")
        .select("id, added_at, collection_id");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  // Fetch literary events
  const { data: literaryEvents = [] } = useQuery({
    queryKey: ["literary-events-for-objectives", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("literary_events")
        .select("id, event_date")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  // Fetch book club events
  const { data: bookClubEvents = [] } = useQuery({
    queryKey: ["book-club-events-for-objectives", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("book_club_events")
        .select("id, event_date")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

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
    onSuccess: () => qc.invalidateQueries({ queryKey }),
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

  /* ───────── progression calculation ───────── */

  const objectivesWithProgress: ObjectiveWithProgress[] = useMemo(() => {
    return objectives.map((obj) => {
      const range = periodRange(obj);
      const typeMeta = OBJECTIVE_TYPES.find((t) => t.value === obj.objective_type);
      let currentValue = 0;

      // Helper: finished books in period
      const finishedInRange = books.filter(
        (b) => ["Lu", "Lecture terminée"].includes(b.status) && inRange(b.endDate, range)
      );

      switch (obj.objective_type) {
        case "read_books":
          currentValue = finishedInRange.length;
          break;
        case "read_pages":
          currentValue = finishedInRange.reduce((s, b) => s + (b.pages ?? 0), 0);
          break;
        case "read_minutes":
          currentValue = sessions
            .filter((s) => inRange(s.session_date, range))
            .reduce((s, ss) => s + ss.duration_minutes, 0);
          break;
        case "sessions_count":
          currentValue = sessions.filter((s) => inRange(s.session_date, range)).length;
          break;
        case "read_author":
          currentValue = finishedInRange.filter((b) => b.author === obj.filter_value).length;
          break;
        case "read_genre":
          currentValue = finishedInRange.filter((b) => b.genre === obj.filter_value).length;
          break;
        case "read_format":
          currentValue = finishedInRange.filter((b) => b.format === obj.filter_value).length;
          break;
        case "read_publisher":
          currentValue = finishedInRange.filter((b) => b.publisher === obj.filter_value).length;
          break;
        case "read_series":
          currentValue = finishedInRange.filter((b) => b.series === obj.filter_value).length;
          break;
        case "read_big_book":
          currentValue = finishedInRange.filter((b) => (b.pages ?? 0) > obj.target_value).length > 0 ? 1 : 0;
          break;
        case "buy_books":
          currentValue = books.filter((b) => b.status === "Acheté" && inRange(b.startDate ?? (b as any).created_at, range)).length;
          break;
        case "add_wishlist":
          currentValue = books.filter((b) => b.status === "Wishlist").length;
          break;
        case "add_pal":
          currentValue = books.filter((b) => b.status === "Dans ma PAL").length;
          break;
        case "clear_pal":
          currentValue = finishedInRange.length; // books that went from PAL to read
          break;
        case "loan_books":
          currentValue = books.filter((b) => b.secondaryStatus === "Prêté").length;
          break;
        case "borrow_books":
          currentValue = books.filter((b) => b.secondaryStatus === "Emprunté").length;
          break;
        case "collections_count":
          currentValue = collections.filter((c) => inRange(c.created_at, range)).length;
          break;
        case "add_to_collections":
          currentValue = collectionBooks.filter((cb) => inRange(cb.added_at, range)).length;
          break;
        case "write_reviews":
          currentValue = books.filter((b) => b.avis && b.avis.trim().length > 0 && inRange(b.endDate, range)).length;
          break;
        case "add_citations":
          currentValue = books.reduce((s, b) => s + (b.citations?.length ?? 0), 0);
          break;
        case "budget_max":
          currentValue = books
            .filter((b) => inRange(b.startDate ?? (b as any).created_at, range))
            .reduce((s, b) => s + (b.price ?? 0), 0);
          break;
        case "coups_de_coeur":
          currentValue = books.filter((b) => b.coupDeCoeur && inRange(b.endDate, range)).length;
          break;
        case "rate_books":
          currentValue = books.filter((b) => b.rating != null && inRange(b.endDate, range)).length;
          break;
        case "avg_rating_above": {
          const rated = books.filter((b) => b.rating != null);
          currentValue = rated.length > 0
            ? Math.round((rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length) * 10) / 10
            : 0;
          break;
        }
        case "recommend_books":
          currentValue = books.filter((b) => b.recommandationDuMois).length;
          break;
        case "fav_characters":
          currentValue = books.filter((b) => b.personnagesPreferes && b.personnagesPreferes.trim().length > 0).length;
          break;
        case "fav_passages":
          currentValue = books.filter((b) => b.passagesPreferes && b.passagesPreferes.trim().length > 0).length;
          break;
        case "reading_days": {
          const uniqueDays = new Set(
            sessions.filter((s) => inRange(s.session_date, range)).map((s) => s.session_date.slice(0, 10))
          );
          currentValue = uniqueDays.size;
          break;
        }
        case "long_session":
          currentValue = sessions
            .filter((s) => inRange(s.session_date, range))
            .some((s) => s.duration_minutes > obj.target_value) ? 1 : 0;
          break;
        case "pages_in_session":
          currentValue = sessions
            .filter((s) => inRange(s.session_date, range))
            .some((s) => (s.last_page_reached ?? 0) >= obj.target_value) ? 1 : 0;
          break;
        case "attend_literary_events":
          currentValue = literaryEvents.filter((e) => inRange(e.event_date, range)).length;
          break;
        case "attend_book_clubs":
          currentValue = bookClubEvents.filter((e) => inRange(e.event_date, range)).length;
          break;
        default:
          currentValue = 0;
      }

      return {
        ...obj,
        currentValue,
        label: typeMeta?.label.replace("X", String(obj.target_value)) ?? obj.objective_type,
      };
    });
  }, [objectives, books, sessions, collections, collectionBooks, literaryEvents, bookClubEvents]);

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
    togglePin,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
