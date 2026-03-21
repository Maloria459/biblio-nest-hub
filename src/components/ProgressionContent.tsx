import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ProgressionMap } from "@/components/ProgressionMap";
import { ProgressionDetails } from "@/components/ProgressionDetails";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [challenges, setChallenges] = useState<ProcessedChallenge[]>([]);
  const [allTiers, setAllTiers] = useState<ProcessedTier[]>([]);
  const [currentTierId, setCurrentTierId] = useState<string | null>(null);
  const [highlightedTierId, setHighlightedTierId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"map" | "details">("map");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;

    const [challengeRes, tierRes, progressRes] = await Promise.all([
      supabase.from("challenges").select("*").order("order") as any,
      supabase.from("challenge_tiers").select("*").order("order") as any,
      supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id) as any,
    ]);

    const challengeRows: ChallengeRow[] = challengeRes.data ?? [];
    const tierRows: TierRow[] = tierRes.data ?? [];
    const progressRows: ProgressRow[] = progressRes.data ?? [];

    const progressMap = new Map<string, ProgressRow>();
    progressRows.forEach((p) => progressMap.set(p.tier_id, p));

    // Build processed tiers
    const processedTiers: ProcessedTier[] = tierRows.map((t) => {
      const prog = progressMap.get(t.id);
      return {
        ...t,
        completed: prog?.completed ?? false,
        completed_at: prog?.completed_at ?? null,
      };
    });

    // Attach sub-tiers to parents
    const topLevel = processedTiers.filter((t) => !t.parent_tier_id);
    const subTiers = processedTiers.filter((t) => t.parent_tier_id);

    topLevel.forEach((t) => {
      t.subTiers = subTiers.filter((s) => s.parent_tier_id === t.id);
    });

    // Build challenges
    const processed: ProcessedChallenge[] = challengeRows.map((c) => {
      const cTiers = topLevel.filter((t) => {
        // Match via challenge_id from original tierRows
        const orig = tierRows.find((tr) => tr.id === t.id);
        return orig?.challenge_id === c.id;
      });
      const allCompleted = cTiers.length > 0 && cTiers.every((t) => t.completed);
      const inProgress = cTiers.some((t) => t.completed) && !allCompleted;
      return { ...c, tiers: cTiers, allCompleted, inProgress };
    });

    setChallenges(processed);
    setAllTiers(topLevel);

    // Find current tier (first uncompleted top-level, ordered by challenge then tier order)
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTierClick = (tierId: string) => {
    setHighlightedTierId(tierId);
    // Scroll right column to tier
    const el = document.getElementById(`tier-${tierId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // Clear highlight after animation
    setTimeout(() => setHighlightedTierId(null), 2000);
  };

  // Map-compatible data
  const mapChallenges = challenges.map((c) => ({ id: c.id, name: c.name, order: c.order }));
  const mapTiers = allTiers.map((t) => ({
    id: t.id,
    name: t.name,
    order: t.order,
    parent_tier_id: t.parent_tier_id,
    completed: t.completed,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile tab toggle */}
        <div className="flex items-center justify-center p-2 border-b border-border bg-card">
          <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted p-1">
            <button
              onClick={() => setMobileView("map")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                mobileView === "map"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Carte
            </button>
            <button
              onClick={() => setMobileView("details")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                mobileView === "details"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Détails
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {mobileView === "map" ? (
            <ProgressionMap
              challenges={mapChallenges}
              tiers={mapTiers}
              currentTierId={currentTierId}
              onTierClick={handleTierClick}
            />
          ) : (
            <ProgressionDetails
              challenges={challenges}
              currentTierId={currentTierId}
              highlightedTierId={highlightedTierId}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left column - Map */}
      <div className="w-[45%] border-r border-border overflow-hidden bg-gradient-to-b from-amber-50/30 via-violet-50/20 to-teal-50/30">
        <ProgressionMap
          challenges={mapChallenges}
          tiers={mapTiers}
          currentTierId={currentTierId}
          onTierClick={handleTierClick}
        />
      </div>

      {/* Right column - Details */}
      <div className="w-[55%] overflow-hidden">
        <ProgressionDetails
          challenges={challenges}
          currentTierId={currentTierId}
          highlightedTierId={highlightedTierId}
        />
      </div>
    </div>
  );
}
