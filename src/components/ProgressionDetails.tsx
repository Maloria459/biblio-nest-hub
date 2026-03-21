import { Check, Lock, Circle, BookOpen, Award, Scroll, ChevronDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

const tierEmojis = ["📖", "🖊️", "📚", "💫", "🏆"];

function TierStatusBadge({ completed, isCurrent, completedAt }: { completed: boolean; isCurrent: boolean; completedAt: string | null }) {
  if (completed) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border border-emerald-300">
          <Check className="h-3 w-3" /> Accompli
        </span>
        {completedAt && (
          <span className="text-[9px] text-muted-foreground">
            le {format(new Date(completedAt), "dd/MM/yyyy", { locale: fr })}
          </span>
        )}
      </div>
    );
  }
  if (isCurrent) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 text-violet-700 border border-violet-300 animate-pulse">
        <Circle className="h-2.5 w-2.5 fill-violet-500 text-violet-500" /> En cours
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
      <Lock className="h-2.5 w-2.5" /> Verrouillé
    </span>
  );
}

export function ProgressionDetails({ challenges, currentTierId, highlightedTierId }: ProgressionDetailsProps) {
  // Sort challenges bottom-to-top (lowest order at bottom)
  const sortedChallenges = [...challenges].sort((a, b) => b.order - a.order);

  return (
    <div className="flex flex-col-reverse gap-6 overflow-y-auto h-full py-5 px-5">
      {sortedChallenges.map((challenge) => {
        const topTiers = challenge.tiers
          .filter((t) => !t.parent_tier_id)
          .sort((a, b) => b.order - a.order); // bottom-to-top within challenge

        const completedCount = topTiers.filter((t) => t.completed).length;
        const progressPercent = (completedCount / Math.max(topTiers.length, 1)) * 100;

        return (
          <Collapsible
            key={challenge.id}
            defaultOpen={challenge.inProgress || challenge.allCompleted}
          >
            <div className="rounded-2xl border-2 border-border bg-card shadow-sm overflow-hidden">
              {/* Challenge header - always visible, acts as trigger */}
              <CollapsibleTrigger className="w-full text-left cursor-pointer group">
                <div
                  className="relative p-5 overflow-hidden"
                  style={{
                    background: challenge.allCompleted
                      ? "linear-gradient(135deg, hsla(45, 80%, 92%, 1), hsla(35, 70%, 88%, 1))"
                      : "linear-gradient(135deg, hsla(220, 20%, 97%, 1), hsla(240, 15%, 95%, 1))",
                  }}
                >
                  {/* Decorative corner */}
                  <div className="absolute top-0 right-0 w-20 h-20 opacity-[0.06]">
                    <Scroll className="w-full h-full" />
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Challenge icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md border-2 ${
                      challenge.allCompleted
                        ? "bg-gradient-to-br from-amber-300 to-yellow-500 border-amber-500"
                        : "bg-gradient-to-br from-indigo-400 to-purple-600 border-indigo-300"
                    }`}>
                      {challenge.allCompleted ? (
                        <span className="text-xl">🏆</span>
                      ) : (
                        <BookOpen className="h-5 w-5 text-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Défi #{challenge.order}
                        </span>
                        {challenge.allCompleted && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-200 to-yellow-200 text-amber-800 border border-amber-400">
                            ⭐ Accompli !
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-foreground mt-0.5">{challenge.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700">
                          <Award className="h-3 w-3" /> {challenge.reward_value}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {completedCount}/{topTiers.length} chapitres
                        </span>
                      </div>
                      {/* Mini progress bar */}
                      <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden border border-border">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${progressPercent}%`,
                            background: challenge.allCompleted
                              ? "linear-gradient(90deg, hsl(45, 90%, 55%), hsl(35, 85%, 50%))"
                              : "linear-gradient(90deg, hsl(270, 70%, 60%), hsl(240, 60%, 55%))",
                          }}
                        />
                      </div>
                    </div>

                    {/* Chevron */}
                    <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </div>
                </div>
              </CollapsibleTrigger>

              {/* Collapsible tiers list */}
              <CollapsibleContent>
                <div className="divide-y divide-border">
                  {topTiers.map((tier, ti) => {
                    const isCurrent = tier.id === currentTierId;
                    const isHighlighted = tier.id === highlightedTierId;
                    const emoji = tierEmojis[ti % tierEmojis.length];

                    return (
                      <Collapsible
                        key={tier.id}
                        defaultOpen={isCurrent || tier.completed}
                      >
                        <div
                          id={`tier-${tier.id}`}
                          className={`transition-all duration-500 ${
                            isHighlighted
                              ? "bg-violet-50 ring-2 ring-inset ring-violet-300 shadow-inner"
                              : isCurrent
                                ? "bg-gradient-to-r from-violet-50/50 to-transparent"
                                : ""
                          }`}
                        >
                          <CollapsibleTrigger className="w-full text-left p-4 flex items-center gap-3.5 group cursor-pointer hover:bg-muted/30 transition-colors">
                            <div className="shrink-0">
                              {tier.completed ? (
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-300 to-yellow-500 flex items-center justify-center shadow-sm border border-amber-400">
                                  <span className="text-sm">⭐</span>
                                </div>
                              ) : isCurrent ? (
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center shadow-sm border border-violet-300 animate-pulse">
                                  <span className="text-sm">{emoji}</span>
                                </div>
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center border border-border">
                                  <Lock className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Chapitre {tier.order}
                                </span>
                                <TierStatusBadge
                                  completed={tier.completed}
                                  isCurrent={isCurrent}
                                  completedAt={tier.completed_at}
                                />
                              </div>
                              <h4 className="text-sm font-bold text-foreground mt-0.5">{tier.name}</h4>
                            </div>

                            {tier.reward_value && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border border-amber-200 shrink-0">
                                🎁 +{tier.reward_value}
                              </span>
                            )}

                            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                          </CollapsibleTrigger>

                          <CollapsibleContent className="px-4 pb-4 pl-[4.25rem]">
                            <p className="text-[11px] text-muted-foreground leading-relaxed">{tier.description}</p>

                            {tier.subTiers && tier.subTiers.length > 0 && (
                              <div className="mt-3 ml-1 space-y-2 border-l-2 border-dashed border-amber-200 pl-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-medium text-muted-foreground">
                                    Quêtes : {tier.subTiers.filter((s) => s.completed).length}/{tier.subTiers.length}
                                  </span>
                                  <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden border border-border">
                                    <div
                                      className="h-full rounded-full transition-all"
                                      style={{
                                        width: `${(tier.subTiers.filter((s) => s.completed).length / Math.max(tier.subTiers.length, 1)) * 100}%`,
                                        background: "linear-gradient(90deg, hsl(45, 90%, 55%), hsl(35, 85%, 50%))",
                                      }}
                                    />
                                  </div>
                                </div>

                                {tier.subTiers
                                  .sort((a, b) => a.order - b.order)
                                  .map((sub) => (
                                    <div key={sub.id} className="flex items-center gap-2.5 py-1">
                                      {sub.completed ? (
                                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-300 to-yellow-400 flex items-center justify-center shrink-0">
                                          <Check className="h-3 w-3 text-amber-800" />
                                        </div>
                                      ) : (
                                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border">
                                          <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                                        </div>
                                      )}
                                      <span
                                        className={`text-[11px] font-medium ${
                                          sub.completed ? "text-foreground" : "text-muted-foreground"
                                        }`}
                                      >
                                        {sub.name}
                                      </span>
                                      {sub.completed && (
                                        <span className="text-[9px] text-amber-600">✓</span>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            )}
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}
