import { Check, Lock, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Tier {
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
  subTiers?: Tier[];
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  order: number;
  reward_type: string;
  reward_value: string;
  tiers: Tier[];
  allCompleted: boolean;
  inProgress: boolean;
}

interface ProgressionDetailsProps {
  challenges: Challenge[];
  currentTierId: string | null;
  highlightedTierId: string | null;
}

export function ProgressionDetails({ challenges, currentTierId, highlightedTierId }: ProgressionDetailsProps) {
  const sortedChallenges = [...challenges].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col gap-5 overflow-y-auto h-full py-4 px-4">
      {sortedChallenges.map((challenge) => {
        const topTiers = challenge.tiers
          .filter((t) => !t.parent_tier_id)
          .sort((a, b) => a.order - b.order);

        const completedCount = topTiers.filter((t) => t.completed).length;

        return (
          <div
            key={challenge.id}
            className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
          >
            {/* Challenge header */}
            <div className="flex items-start gap-3 p-4 border-b border-border bg-muted/30">
              <span className="text-2xl">🏆</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground truncate">{challenge.name}</h3>
                  {challenge.allCompleted && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      <Check className="h-3 w-3" /> Accompli
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{challenge.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                    🎖 {challenge.reward_value}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {completedCount}/{topTiers.length} paliers
                  </span>
                </div>
                <Progress value={(completedCount / Math.max(topTiers.length, 1)) * 100} className="h-1.5 mt-2" />
              </div>
            </div>

            {/* Tiers list */}
            <div className="divide-y divide-border">
              {topTiers.map((tier) => {
                const isCurrent = tier.id === currentTierId;
                const isHighlighted = tier.id === highlightedTierId;

                return (
                  <div
                    key={tier.id}
                    id={`tier-${tier.id}`}
                    className={`p-3 transition-colors ${
                      isHighlighted ? "bg-violet-50 ring-1 ring-violet-300" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Status icon */}
                      <div className="mt-0.5">
                        {tier.completed ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          </div>
                        ) : isCurrent ? (
                          <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
                            <Circle className="h-3 w-3 text-violet-500 fill-violet-500 animate-pulse" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">
                            Palier {tier.order}
                          </span>
                          <span className="text-xs text-foreground font-medium truncate">
                            {tier.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{tier.description}</p>

                        {/* Status text */}
                        <div className="flex items-center gap-2 mt-1">
                          {tier.completed && tier.completed_at && (
                            <span className="text-[10px] text-emerald-600">
                              ✅ Complété le {format(new Date(tier.completed_at), "dd/MM/yyyy", { locale: fr })}
                            </span>
                          )}
                          {isCurrent && (
                            <span className="text-[10px] text-violet-600 font-medium">🔵 En cours</span>
                          )}
                          {!tier.completed && !isCurrent && (
                            <span className="text-[10px] text-muted-foreground">🔒 Verrouillé</span>
                          )}
                          {tier.reward_value && (
                            <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-px">
                              +{tier.reward_value}
                            </span>
                          )}
                        </div>

                        {/* Sub-tiers */}
                        {tier.subTiers && tier.subTiers.length > 0 && (
                          <div className="mt-2 ml-2 space-y-1.5 border-l-2 border-border pl-3">
                            {/* Mini progress */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground">
                                {tier.subTiers.filter((s) => s.completed).length}/{tier.subTiers.length} complétés
                              </span>
                              <Progress
                                value={
                                  (tier.subTiers.filter((s) => s.completed).length /
                                    Math.max(tier.subTiers.length, 1)) *
                                  100
                                }
                                className="h-1 w-16"
                              />
                            </div>

                            {tier.subTiers
                              .sort((a, b) => a.order - b.order)
                              .map((sub) => (
                                <div key={sub.id} className="flex items-center gap-2">
                                  {sub.completed ? (
                                    <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                                  ) : (
                                    <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                                  )}
                                  <span
                                    className={`text-[11px] ${
                                      sub.completed ? "text-foreground" : "text-muted-foreground"
                                    }`}
                                  >
                                    {sub.name}
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
