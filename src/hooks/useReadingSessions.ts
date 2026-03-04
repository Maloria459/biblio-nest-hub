import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ReadingSession {
  id: string;
  book_id: string;
  session_date: string;
  duration_minutes: number;
  last_page_reached: number | null;
  user_id: string;
  created_at: string;
}

export function useReadingSessions() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["reading-sessions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reading_sessions")
        .select("*")
        .eq("user_id", user!.id)
        .order("session_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReadingSession[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return query;
}

export function useInvalidateSessions() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return () => {
    qc.invalidateQueries({ queryKey: ["reading-sessions", user?.id] });
    qc.invalidateQueries({ queryKey: ["last-reading-session", user?.id] });
  };
}

export function formatDurationHMS(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatDurationShort(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

export function formatDurationFull(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  const s = Math.round((minutes - Math.floor(minutes)) * 60);
  if (h > 0 && m > 0 && s > 0) return `${h}h ${m}min ${s}s`;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  if (m > 0 && s > 0) return `${m}min ${s}s`;
  if (m > 0) return `${m}min`;
  return `${s}s`;
}

export function formatTotalReadingTime(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h > 0 && m > 0) return `${h} h ${m} min`;
  if (h > 0) return `${h} h`;
  return `${m} min`;
}
