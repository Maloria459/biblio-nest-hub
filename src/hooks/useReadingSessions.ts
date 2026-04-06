import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const PAGE_SIZE = 1000;

export interface ReadingSession {
  id: string;
  book_id: string;
  session_date: string;
  duration_minutes: number;
  last_page_reached: number | null;
  user_id: string;
  created_at: string;
  reread_number: number;
}

async function fetchAllSessions(userId: string): Promise<ReadingSession[]> {
  const rows: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("reading_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("session_date", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (data) rows.push(...data);
    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows as ReadingSession[];
}

export function useReadingSessions() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["reading-sessions", user?.id],
    queryFn: () => fetchAllSessions(user!.id),
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
    qc.invalidateQueries({ queryKey: ["reading-activity", user?.id] });
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
