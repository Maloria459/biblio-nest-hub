import { Check, Lock, Circle, BookOpen, Award, ChevronDown } from "lucide-react";
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

/* ── XP Coin badge ── */
function XPCoin({ value }: { value: string }) {
  const match = value.match(/(\d+)/);
  const num = match ? match[1] : value;

  return (
    <div
      className="shrink-0 w-9 h-9 rounded-full flex flex-col items-center justify-center transition-all duration-300 hover:scale-110"
      style={{
        background: "radial-gradient(circle at 35% 35%, #FFD700, #C9A84C 60%, #A88734)",
        border: "2px solid #A88734",
        boxShadow: "0 2px 6px rgba(168, 135, 52, 0.4), inset 0 1px 3px rgba(255, 255, 255, 0.3)",
      }}
    >
      <span style={{ fontFamily: "'Lora', serif", fontSize: "9px", fontWeight: 700, color: "#5C3A21", lineHeight: 1 }}>+{num}</span>
      <span style={{ fontFamily: "'Lora', serif", fontSize: "6px", fontWeight: 600, color: "#5C3A21", lineHeight: 1 }}>XP</span>
    </div>
  );
}

/* ── Status badge ── */
function TierStatusBadge({ completed, isCurrent, completedAt }: { completed: boolean; isCurrent: boolean; completedAt: string | null }) {
  if (completed) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
          background: "linear-gradient(135deg, rgba(45, 95, 62, 0.15), rgba(45, 95, 62, 0.1))",
          color: "#2D5F3E",
          border: "1px solid rgba(45, 95, 62, 0.3)",
          fontFamily: "'Lora', serif",
        }}>
          <Check className="h-3 w-3" /> Accompli
        </span>
        {completedAt && (
          <span style={{ fontSize: "9px", color: "#8B7D6B", fontFamily: "'Merriweather', serif" }}>
            le {format(new Date(completedAt), "dd/MM/yyyy", { locale: fr })}
          </span>
        )}
      </div>
    );
  }
  if (isCurrent) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse" style={{
        background: "linear-gradient(135deg, rgba(232, 145, 58, 0.15), rgba(232, 145, 58, 0.1))",
        color: "#E8913A",
        border: "1px solid rgba(232, 145, 58, 0.3)",
        fontFamily: "'Lora', serif",
      }}>
        <Circle className="h-2.5 w-2.5 fill-[#E8913A] text-[#E8913A]" /> En cours
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full" style={{
      background: "rgba(139, 125, 107, 0.1)",
      color: "#8B7D6B",
      border: "1px solid rgba(139, 125, 107, 0.2)",
      fontFamily: "'Lora', serif",
    }}>
      <Lock className="h-2.5 w-2.5" /> Verrouillé
    </span>
  );
}

export function ProgressionDetails({ challenges, currentTierId, highlightedTierId }: ProgressionDetailsProps) {
  const sortedChallenges = [...challenges].sort((a, b) => b.order - a.order);

  return (
    <div className="flex flex-col-reverse gap-6 overflow-y-auto h-full py-5 px-5">
      {sortedChallenges.map((challenge) => {
        const topTiers = challenge.tiers
          .filter((t) => !t.parent_tier_id)
          .sort((a, b) => b.order - a.order);

        const completedCount = topTiers.filter((t) => t.completed).length;
        const progressPercent = (completedCount / Math.max(topTiers.length, 1)) * 100;
        const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

        return (
          <Collapsible
            key={challenge.id}
            defaultOpen={challenge.inProgress || challenge.allCompleted}
          >
            <div
              className="rounded-sm overflow-hidden flex flex-col-reverse"
              style={{
                border: "2px solid #C4B59D",
                boxShadow: "0 4px 12px rgba(62, 44, 28, 0.08)",
              }}
            >
              {/* Challenge header — leather book cover style */}
              <CollapsibleTrigger className="w-full text-left cursor-pointer group">
                <div
                  className="relative p-5 overflow-hidden"
                  style={{
                    background: challenge.allCompleted
                      ? "linear-gradient(135deg, #6B2D3E, #8B3D4E, #6B2D3E)"
                      : "linear-gradient(135deg, #5C3A21, #7A4E30, #5C3A21)",
                    borderTop: "2px solid #C4B59D",
                  }}
                >
                  {/* Leather texture overlay */}
                  <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
                    opacity: 0.5,
                  }} />

                  <div className="relative flex items-center gap-4">
                    {/* Roman numeral */}
                    <div className="shrink-0 w-12 h-12 rounded-sm flex items-center justify-center" style={{
                      border: "2px solid rgba(201, 168, 76, 0.5)",
                      background: "rgba(201, 168, 76, 0.1)",
                    }}>
                      <span style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "18px",
                        fontWeight: 900,
                        color: "#C9A84C",
                        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                      }}>
                        {romanNumerals[challenge.order - 1] || challenge.order}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{
                          fontFamily: "'Cormorant Garamond', serif",
                          fontSize: "9px",
                          fontWeight: 700,
                          letterSpacing: "3px",
                          color: "rgba(201, 168, 76, 0.7)",
                          textTransform: "uppercase",
                        }}>
                          DÉFI #{challenge.order}
                        </span>
                        {challenge.allCompleted && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-sm" style={{
                            background: "rgba(201, 168, 76, 0.2)",
                            color: "#C9A84C",
                            border: "1px solid rgba(201, 168, 76, 0.4)",
                            fontFamily: "'Lora', serif",
                          }}>
                            ⭐ Accompli !
                          </span>
                        )}
                      </div>
                      <h3 style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#F5E6D0",
                        marginTop: "2px",
                        textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                      }}>
                        {challenge.name}
                      </h3>

                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="inline-flex items-center gap-1" style={{ fontSize: "10px", fontWeight: 600, color: "#C9A84C", fontFamily: "'Lora', serif" }}>
                          <Award className="h-3 w-3" /> {challenge.reward_value}
                        </span>
                        {/* Small book icons for progress */}
                        <div className="flex items-center gap-1">
                          {topTiers.map((t, i) => (
                            <span key={i} style={{ fontSize: "10px", opacity: t.completed ? 1 : 0.3, filter: t.completed ? "none" : "grayscale(1)" }}>📕</span>
                          ))}
                        </div>
                      </div>

                      {/* Bookmark progress bar */}
                      <div className="mt-2 h-2 w-full rounded-sm overflow-hidden" style={{
                        background: "rgba(0,0,0,0.3)",
                      }}>
                        <div
                          className="h-full rounded-sm transition-all duration-700 ease-out relative"
                          style={{
                            width: `${progressPercent}%`,
                            background: "linear-gradient(90deg, #C9A84C, #D4A843, #FFD700)",
                          }}
                        />
                      </div>
                    </div>

                    <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200 rotate-180 group-data-[state=open]:rotate-0" style={{ color: "#C9A84C" }} />
                  </div>
                </div>
              </CollapsibleTrigger>

              {/* Tiers list — journal entries */}
              <CollapsibleContent>
                <div style={{ background: "#FFF8F0" }}>
                  {topTiers.map((tier, ti) => {
                    const isCurrent = tier.id === currentTierId;
                    const isHighlighted = tier.id === highlightedTierId;

                    // Status border color
                    const borderColor = tier.completed ? "#2D5F3E" : isCurrent ? "#E8913A" : "#6B2D3E";

                    return (
                      <Collapsible key={tier.id} defaultOpen={isCurrent || tier.completed}>
                        <div
                          id={`tier-${tier.id}`}
                          className="transition-all duration-500"
                          style={{
                            borderBottom: "1px solid rgba(196, 181, 157, 0.3)",
                            ...(isHighlighted ? {
                              background: "rgba(232, 145, 58, 0.08)",
                              boxShadow: "inset 0 0 0 2px rgba(232, 145, 58, 0.3)",
                            } : isCurrent ? {
                              background: "rgba(232, 145, 58, 0.04)",
                            } : {}),
                          }}
                        >
                          <CollapsibleTrigger className="w-full text-left p-4 flex items-center gap-3.5 group cursor-pointer transition-colors hover:bg-[rgba(196,181,157,0.08)]">
                            {/* Thick left border */}
                            <div className="self-stretch w-1 rounded-full shrink-0" style={{ background: borderColor }} />

                            <div className="shrink-0">
                              {tier.completed ? (
                                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{
                                  background: "radial-gradient(circle at 35% 35%, #C9A84C, #A88734)",
                                  border: "2px solid #A88734",
                                  boxShadow: "0 2px 6px rgba(168, 135, 52, 0.3)",
                                }}>
                                  <Check className="h-4 w-4" style={{ color: "#5C3A21" }} />
                                </div>
                              ) : isCurrent ? (
                                <div className="w-9 h-9 rounded-sm flex items-center justify-center" style={{
                                  background: "linear-gradient(135deg, #5C3A21, #7A4E30)",
                                  border: "2px solid #D4A843",
                                  animation: "pageFlipIcon 3s ease-in-out infinite",
                                }}>
                                  <BookOpen className="h-4 w-4" style={{ color: "#D4A843" }} />
                                </div>
                              ) : (
                                <div className="w-9 h-9 rounded-sm flex items-center justify-center" style={{
                                  background: "#EDE0D4",
                                  border: "2px solid #C4B59D",
                                }}>
                                  <Lock className="h-4 w-4" style={{ color: "#A89B8C" }} />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span style={{
                                  fontFamily: "'Cormorant Garamond', serif",
                                  fontSize: "9px",
                                  fontWeight: 700,
                                  letterSpacing: "2px",
                                  color: "#8B7D6B",
                                  textTransform: "uppercase",
                                }}>
                                  Chapitre {tier.order}
                                </span>
                                <TierStatusBadge completed={tier.completed} isCurrent={isCurrent} completedAt={tier.completed_at} />
                              </div>
                              <h4 style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: "13px",
                                fontWeight: 700,
                                color: "#3E2C1C",
                                marginTop: "2px",
                              }}>
                                {tier.name}
                              </h4>
                            </div>

                            {tier.reward_value && <XPCoin value={tier.reward_value} />}

                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" style={{ color: "#8B7D6B" }} />
                          </CollapsibleTrigger>

                          <CollapsibleContent className="px-4 pb-4 pl-[4.75rem]">
                            <p style={{
                              fontFamily: "'Merriweather', serif",
                              fontSize: "11px",
                              color: "#8B7D6B",
                              lineHeight: 1.7,
                            }}>
                              {tier.description}
                            </p>

                            {tier.subTiers && tier.subTiers.length > 0 && (
                              <div className="mt-3 ml-1 space-y-2 pl-4" style={{ borderLeft: "2px dashed #C9A84C" }}>
                                <div className="flex items-center gap-2">
                                  <span style={{ fontSize: "10px", fontWeight: 500, color: "#8B7D6B", fontFamily: "'Lora', serif" }}>
                                    Quêtes : {tier.subTiers.filter((s) => s.completed).length}/{tier.subTiers.length}
                                  </span>
                                  <div className="h-1.5 w-20 rounded-full overflow-hidden" style={{ background: "rgba(196,181,157,0.3)" }}>
                                    <div
                                      className="h-full rounded-full transition-all"
                                      style={{
                                        width: `${(tier.subTiers.filter((s) => s.completed).length / Math.max(tier.subTiers.length, 1)) * 100}%`,
                                        background: "linear-gradient(90deg, #C9A84C, #D4A843)",
                                      }}
                                    />
                                  </div>
                                </div>

                                {tier.subTiers.sort((a, b) => a.order - b.order).map((sub) => (
                                  <div key={sub.id} className="flex items-center gap-2.5 py-1">
                                    {sub.completed ? (
                                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{
                                        background: "radial-gradient(circle at 35% 35%, #C9A84C, #A88734)",
                                      }}>
                                        <Check className="h-3 w-3" style={{ color: "#5C3A21" }} />
                                      </div>
                                    ) : (
                                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{
                                        background: "#EDE0D4",
                                        border: "1px solid #C4B59D",
                                      }}>
                                        <Lock className="h-2.5 w-2.5" style={{ color: "#A89B8C" }} />
                                      </div>
                                    )}
                                    <span style={{
                                      fontFamily: "'Merriweather', serif",
                                      fontSize: "11px",
                                      fontWeight: sub.completed ? 600 : 400,
                                      color: sub.completed ? "#3E2C1C" : "#A89B8C",
                                    }}>
                                      {sub.name}
                                    </span>
                                    {sub.completed && <span style={{ fontSize: "9px", color: "#C9A84C" }}>✦</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </CollapsibleContent>
                        </div>

                        <style>{`
                          @keyframes pageFlipIcon {
                            0%, 100% { transform: rotateY(0deg); }
                            50% { transform: rotateY(10deg); }
                          }
                        `}</style>
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
