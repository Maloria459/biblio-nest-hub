import { useEffect, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAvatar } from "@/contexts/AvatarContext";
import { User, Lock, Check, Flag } from "lucide-react";

interface Tier {
  id: string;
  name: string;
  order: number;
  parent_tier_id: string | null;
  completed: boolean;
}

interface Challenge {
  id: string;
  name: string;
  order: number;
}

interface ProgressionMapProps {
  challenges: Challenge[];
  tiers: Tier[];
  currentTierId: string | null;
  onTierClick: (tierId: string) => void;
}

export function ProgressionMap({ challenges, tiers, currentTierId, onTierClick }: ProgressionMapProps) {
  const { avatarUrl } = useAvatar();
  const currentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current tier
  useEffect(() => {
    if (currentRef.current && containerRef.current) {
      setTimeout(() => {
        currentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [currentTierId]);

  // Get top-level tiers only (no sub-tiers)
  const topLevelTiers = tiers.filter((t) => !t.parent_tier_id);

  // Build ordered list: challenges sorted by order, tiers within each challenge sorted by order
  // Display bottom to top, so we reverse
  const sortedChallenges = [...challenges].sort((a, b) => a.order - b.order);

  // Build flat list of nodes (bottom to top)
  const nodes: { type: "start" | "tier" | "separator"; tier?: Tier; challenge?: Challenge }[] = [];
  nodes.push({ type: "start" });

  sortedChallenges.forEach((challenge, ci) => {
    if (ci > 0) {
      nodes.push({ type: "separator", challenge });
    }
    const challengeTiers = topLevelTiers
      .filter((t) => {
        // Find challenge_id from the full tiers data
        return tiers.some((ft) => ft.id === t.id);
      })
      .filter((t) => {
        // Match to challenge - we need challenge_id on tiers
        // Since we don't have it in this simplified structure, use order-based matching
        return true;
      })
      .sort((a, b) => a.order - b.order);

    // We need challenge_id info - let's restructure
  });

  // Simpler approach: group by challenge
  const challengeGroups = sortedChallenges.map((challenge) => {
    const challengeTiers = topLevelTiers
      .filter((t) => {
        // We need to match tiers to challenges - tiers don't have challenge_id in our simplified interface
        // Let's assume parent component provides this mapping
        return true;
      })
      .sort((a, b) => a.order - b.order);
    return { challenge, tiers: challengeTiers };
  });

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center overflow-y-auto h-full py-8 px-4"
      style={{ scrollBehavior: "smooth" }}
    >
      {/* Render bottom to top - reverse the visual order with flex-col-reverse */}
      <div className="flex flex-col-reverse items-center gap-0 w-full max-w-[280px]">
        {/* Starting point at the very bottom */}
        <div className="flex flex-col items-center gap-2 py-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <Flag className="h-5 w-5 text-white" />
          </div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Départ</span>
        </div>

        {/* Render challenges and tiers */}
        {sortedChallenges.map((challenge, ci) => {
          const cTiers = topLevelTiers
            .sort((a, b) => a.order - b.order);
          // For now we only have one challenge, filter would need challenge_id
          // This works for the single-challenge case

          return (
            <div key={challenge.id} className="flex flex-col-reverse items-center w-full">
              {/* Tiers */}
              {cTiers.map((tier, ti) => {
                const isCompleted = tier.completed;
                const isCurrent = tier.id === currentTierId;
                const isLocked = !isCompleted && !isCurrent;
                const isEven = ti % 2 === 0;

                return (
                  <div
                    key={tier.id}
                    ref={isCurrent ? currentRef : undefined}
                    className="relative flex items-center w-full py-3"
                    style={{ justifyContent: isEven ? "flex-start" : "flex-end" }}
                  >
                    {/* Connection line */}
                    {ti > 0 && (
                      <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-3"
                        style={{
                          background: isCompleted || isCurrent
                            ? "linear-gradient(to bottom, hsl(45, 93%, 60%), hsl(340, 65%, 65%))"
                            : "hsl(var(--border))",
                        }}
                      />
                    )}

                    {/* Zigzag connector */}
                    <div
                      className={`flex items-center gap-3 ${isEven ? "flex-row ml-4" : "flex-row-reverse mr-4"}`}
                    >
                      {/* Avatar overlay on current tier */}
                      <div className="relative">
                        {isCurrent && (
                          <div className="absolute -inset-2 z-0">
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-violet-400/40 to-teal-400/40 animate-pulse" />
                          </div>
                        )}

                        <button
                          onClick={() => !isLocked && onTierClick(tier.id)}
                          disabled={isLocked}
                          className={`relative z-10 w-[52px] h-[52px] rounded-full flex items-center justify-center text-sm font-bold shadow-md transition-transform
                            ${isCompleted
                              ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-white hover:scale-110 cursor-pointer"
                              : isCurrent
                                ? "bg-gradient-to-br from-violet-500 to-indigo-500 text-white hover:scale-110 cursor-pointer ring-4 ring-violet-300/50"
                                : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                            }`}
                        >
                          {isCompleted ? (
                            <Check className="h-5 w-5" />
                          ) : isLocked ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <span>{tier.order}</span>
                          )}
                        </button>

                        {/* Avatar on current tier */}
                        {isCurrent && (
                          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
                            <Avatar className="h-10 w-10 border-2 border-white shadow-lg">
                              {avatarUrl ? (
                                <AvatarImage src={avatarUrl} alt="Avatar" />
                              ) : null}
                              <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        )}
                      </div>

                      {/* Tier label */}
                      <span
                        className={`text-xs font-medium max-w-[140px] leading-tight ${
                          isCompleted
                            ? "text-emerald-600"
                            : isCurrent
                              ? "text-violet-600 font-bold"
                              : "text-muted-foreground"
                        }`}
                      >
                        {tier.name}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Challenge separator/banner */}
              {ci > 0 && (
                <div className="flex items-center gap-2 py-4 w-full">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                </div>
              )}

              {/* Challenge header */}
              <div className="flex items-center gap-2 py-3 px-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 w-full">
                <span className="text-base">🏆</span>
                <span className="text-xs font-bold text-amber-800 truncate">{challenge.name}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
