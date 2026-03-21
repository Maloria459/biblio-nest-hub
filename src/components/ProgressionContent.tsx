import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ProgressionMap } from "@/components/ProgressionMap";
import { ProgressionDetails } from "@/components/ProgressionDetails";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAvatar } from "@/contexts/AvatarContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Map as MapIcon, User } from "lucide-react";

interface TierRow {
  id: string;
  challenge_id: string;
  name: string;
  description: string;
  order: number;
  parent_tier_id: string | null;
  action_type: string | null;
  threshold: number;
  reward_type: string | null;
  reward_value: string | null;
}

interface ChallengeRow {
  id: string;
  name: string;
  description: string;
  order: number;
  reward_type: string;
  reward_value: string;
}

interface ProgressRow {
  id: string;
  user_id: string;
  challenge_id: string;
  tier_id: string;
  completed: boolean;
  completed_at: string | null;
}

interface ProcessedTier {
  id: string;
  name: string;
  description: string;
  order: number;
  parent_tier_id: string | null;
  action_type: string | null;
  threshold: number;
  reward_type: string | null;
  reward_value: string | null;
  completed: boolean;
  completed_at: string | null;
  subTiers?: ProcessedTier[];
}

interface ProcessedChallenge {
  id: string;
  name: string;
  description: string;
  order: number;
  reward_type: string;
  reward_value: string;
  tiers: ProcessedTier[];
  allCompleted: boolean;
  inProgress: boolean;
}

export function ProgressionContent() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { avatarUrl } = useAvatar();
  const [pseudo, setPseudo] = useState<string>("");
  const [challenges, setChallenges] = useState<ProcessedChallenge[]>([]);
  const [allTiers, setAllTiers] = useState<ProcessedTier[]>([]);
  const [currentTierId, setCurrentTierId] = useState<string | null>(null);
  const [highlightedTierId, setHighlightedTierId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"map" | "details">("map");
  const [loading, setLoading] = useState(true);

  // Fetch pseudo
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("pseudo").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data?.pseudo) setPseudo(data.pseudo as string); });
  }, [user?.id]);

  const loadData = useCallback(async () => {
    if (!user) return;

    const [challengeRes, tierRes, progressRes] = await Promise.all([
      supabase.from("challenges").select("*").order("order") as any,
      supabase.from("challenge_tiers").select("*").order("order") as any,
      supabase.from("user_progress").select("*").eq("user_id", user.id) as any,
    ]);

    const challengeRows: ChallengeRow[] = challengeRes.data ?? [];
    const tierRows: TierRow[] = tierRes.data ?? [];
    const progressRows: ProgressRow[] = progressRes.data ?? [];

    const progressMap: globalThis.Map<string, ProgressRow> = new globalThis.Map();
    progressRows.forEach((p) => progressMap.set(p.tier_id, p));

    const processedTiers: ProcessedTier[] = tierRows.map((t) => {
      const prog = progressMap.get(t.id);
      return { ...t, completed: prog?.completed ?? false, completed_at: prog?.completed_at ?? null };
    });

    const topLevel = processedTiers.filter((t) => !t.parent_tier_id);
    const subTiers = processedTiers.filter((t) => t.parent_tier_id);
    topLevel.forEach((t) => {
      t.subTiers = subTiers.filter((s) => s.parent_tier_id === t.id);
    });

    const processed: ProcessedChallenge[] = challengeRows.map((c) => {
      const cTiers = topLevel.filter((t) => {
        const orig = tierRows.find((tr) => tr.id === t.id);
        return orig?.challenge_id === c.id;
      });
      const allCompleted = cTiers.length > 0 && cTiers.every((t) => t.completed);
      const inProgress = cTiers.some((t) => t.completed) && !allCompleted;
      return { ...c, tiers: cTiers, allCompleted, inProgress };
    });

    setChallenges(processed);
    setAllTiers(topLevel);

    let found = false;
    for (const ch of processed.sort((a, b) => a.order - b.order)) {
      for (const t of ch.tiers.sort((a, b) => a.order - b.order)) {
        if (!t.completed) {
          setCurrentTierId(t.id);
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (!found) setCurrentTierId(null);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleTierClick = (tierId: string) => {
    setHighlightedTierId(tierId);
    const el = document.getElementById(`tier-${tierId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setHighlightedTierId(null), 2000);
  };

  const mapChallenges = challenges.map((c) => ({ id: c.id, name: c.name, order: c.order }));
  const mapTiers = allTiers.map((t) => ({
    id: t.id, name: t.name, order: t.order, parent_tier_id: t.parent_tier_id, completed: t.completed,
  }));

  // Compute total XP
  const totalXP = allTiers.reduce((sum, t) => {
    if (!t.completed || !t.reward_value) return sum;
    const match = t.reward_value.match(/(\d+)/);
    return sum + (match ? parseInt(match[1]) : 0);
  }, 0);

  const maxXP = allTiers.reduce((sum, t) => {
    if (!t.reward_value) return sum;
    const match = t.reward_value.match(/(\d+)/);
    return sum + (match ? parseInt(match[1]) : 0);
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-foreground border-t-transparent" />
          <span className="text-xs text-muted-foreground">Chargement de votre aventure…</span>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center justify-center p-2 border-b border-border bg-card">
          <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted p-1">
            <button
              onClick={() => setMobileView("map")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                mobileView === "map" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" /> Carte
            </button>
            <button
              onClick={() => setMobileView("details")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                mobileView === "details" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" /> Détails
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {mobileView === "map" ? (
            <ProgressionMap challenges={mapChallenges} tiers={mapTiers} currentTierId={currentTierId} onTierClick={handleTierClick} />
          ) : (
            <ProgressionDetails challenges={challenges} currentTierId={currentTierId} highlightedTierId={highlightedTierId} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header bar with XP */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
            <span className="text-lg">📜</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Ma Quête Littéraire</h2>
            <p className="text-[10px] text-muted-foreground">Accomplissez des défis pour progresser dans votre aventure</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200">
            <span className="text-sm">⭐</span>
            <span className="text-sm font-bold text-amber-800">{totalXP}</span>
            <span className="text-[10px] text-amber-600">/ {maxXP} XP</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left column - Map */}
        <div
          className="w-1/2 border-r border-border overflow-hidden relative"
          style={{
            background: `
              radial-gradient(ellipse at 20% 80%, hsla(45, 60%, 90%, 0.5) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, hsla(270, 40%, 92%, 0.4) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, hsla(180, 30%, 95%, 0.3) 0%, transparent 60%),
              linear-gradient(to bottom, hsla(40, 30%, 97%, 1), hsla(220, 15%, 96%, 1))
            `,
          }}
        >
          <ProgressionMap challenges={mapChallenges} tiers={mapTiers} currentTierId={currentTierId} onTierClick={handleTierClick} />
        </div>

        {/* Right column - Details */}
        <div className="w-1/2 overflow-hidden bg-background">
          <ProgressionDetails challenges={challenges} currentTierId={currentTierId} highlightedTierId={highlightedTierId} />
        </div>
      </div>
    </div>
  );
}
