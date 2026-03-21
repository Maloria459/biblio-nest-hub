import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type ActionType =
  | "complete_tutorial"
  | "upload_avatar"
  | "upload_banner"
  | "add_book_to_library"
  | "add_book_to_wishlist"
  | "add_book_to_tbr";

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

interface ProgressRow {
  id: string;
  user_id: string;
  challenge_id: string;
  tier_id: string;
  completed: boolean;
  completed_at: string | null;
}

interface ChallengeRow {
  id: string;
  name: string;
  reward_type: string;
  reward_value: string;
}

async function countUserAction(userId: string, actionType: ActionType): Promise<number> {
  switch (actionType) {
    case "add_book_to_library": {
      const { count } = await supabase
        .from("books")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .not("status", "in", '("Wishlist","Dans ma PAL")');
      return count ?? 0;
    }
    case "add_book_to_wishlist": {
      const { count } = await supabase
        .from("books")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "Wishlist");
      return count ?? 0;
    }
    case "add_book_to_tbr": {
      const { count } = await supabase
        .from("books")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "Dans ma PAL");
      return count ?? 0;
    }
    case "upload_avatar": {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", userId)
        .maybeSingle();
      return data?.avatar_url ? 1 : 0;
    }
    case "upload_banner": {
      const { data } = await supabase
        .from("profiles")
        .select("banner_url")
        .eq("user_id", userId)
        .maybeSingle();
      return data?.banner_url ? 1 : 0;
    }
    case "complete_tutorial": {
      // Tutorial completion tracked via user_progress directly
      return 0;
    }
    default:
      return 0;
  }
}

export function useProgression() {
  const { user } = useAuth();

  const checkProgression = useCallback(
    async (actionType: ActionType) => {
      if (!user) return;

      try {
        // Get all tiers matching this action type
        const { data: tiers } = await supabase
          .from("challenge_tiers")
          .select("*")
          .eq("action_type", actionType) as { data: TierRow[] | null };

        if (!tiers || tiers.length === 0) return;

        // Get user's existing progress
        const tierIds = tiers.map((t) => t.id);
        const { data: progress } = await supabase
          .from("user_progress")
          .select("*")
          .eq("user_id", user.id)
          .in("tier_id", tierIds) as { data: ProgressRow[] | null };

        const completedSet = new Set(
          (progress ?? []).filter((p) => p.completed).map((p) => p.tier_id)
        );

        // Count the action
        const actionCount = await countUserAction(user.id, actionType);

        for (const tier of tiers) {
          if (completedSet.has(tier.id)) continue;
          if (actionCount < tier.threshold) continue;

          // Mark tier as completed
          const now = new Date().toISOString();
          await supabase.from("user_progress").upsert(
            {
              user_id: user.id,
              challenge_id: tier.challenge_id,
              tier_id: tier.id,
              completed: true,
              completed_at: now,
            },
            { onConflict: "user_id,tier_id" }
          );

          // Check if this is a sub-tier → check if parent is now complete
          if (tier.parent_tier_id) {
            await checkParentTier(user.id, tier.parent_tier_id, tier.challenge_id);
          }

          // Show toast notification
          showTierUnlockedToast(tier.name, tier.reward_value);

          // Check if all tiers of the challenge are complete
          await checkChallengeComplete(user.id, tier.challenge_id);
        }
      } catch (err) {
        console.error("Progression check error:", err);
      }
    },
    [user]
  );

  return { checkProgression };
}

async function checkParentTier(userId: string, parentTierId: string, challengeId: string) {
  // Get all sub-tiers of this parent
  const { data: subTiers } = await supabase
    .from("challenge_tiers")
    .select("id")
    .eq("parent_tier_id", parentTierId) as { data: { id: string }[] | null };

  if (!subTiers || subTiers.length === 0) return;

  const subTierIds = subTiers.map((t) => t.id);
  const { data: progress } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", userId)
    .in("tier_id", subTierIds)
    .eq("completed", true) as { data: any[] | null };

  if ((progress?.length ?? 0) >= subTiers.length) {
    // All sub-tiers complete → mark parent as complete
    await supabase.from("user_progress").upsert(
      {
        user_id: userId,
        challenge_id: challengeId,
        tier_id: parentTierId,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,tier_id" }
    );
  }
}

async function checkChallengeComplete(userId: string, challengeId: string) {
  // Get all top-level tiers (no parent)
  const { data: topTiers } = await supabase
    .from("challenge_tiers")
    .select("id")
    .eq("challenge_id", challengeId)
    .is("parent_tier_id", null) as { data: { id: string }[] | null };

  if (!topTiers || topTiers.length === 0) return;

  const topTierIds = topTiers.map((t) => t.id);
  const { data: progress } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", userId)
    .in("tier_id", topTierIds)
    .eq("completed", true) as { data: any[] | null };

  if ((progress?.length ?? 0) >= topTiers.length) {
    // All tiers complete! Show challenge complete notification
    const { data: challenge } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", challengeId)
      .maybeSingle() as { data: ChallengeRow | null };

    if (challenge) {
      showChallengeCompleteToast(challenge.name, challenge.reward_value);
    }
  }
}

function showTierUnlockedToast(tierName: string, rewardValue: string | null) {
  toast("⭐ Palier débloqué !", {
    description: `${tierName}${rewardValue ? ` — ${rewardValue}` : ""}`,
    duration: 5000,
    action: {
      label: "Voir ma progression",
      onClick: () => {
        window.location.href = "/aventure";
      },
    },
  });
}

function showChallengeCompleteToast(challengeName: string, rewardValue: string) {
  toast("🏆 Défi accompli !", {
    description: `${challengeName} — Récompense : ${rewardValue}`,
    duration: 8000,
    action: {
      label: "Voir ma progression",
      onClick: () => {
        window.location.href = "/aventure";
      },
    },
  });
}
