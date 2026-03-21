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

/* ── Floating golden dust motes ── */
function GoldenDust() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${1.5 + Math.random() * 2.5}px`,
            height: `${1.5 + Math.random() * 2.5}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `radial-gradient(circle, #FFD700 0%, #F0C040 60%, transparent 100%)`,
            opacity: 0.25 + Math.random() * 0.3,
            animation: `floatDust ${8 + Math.random() * 12}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 10}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes floatDust {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
          25% { transform: translate(${15}px, -${20}px) scale(1.3); opacity: 0.5; }
          50% { transform: translate(-${10}px, -${40}px) scale(0.8); opacity: 0.35; }
          75% { transform: translate(${20}px, -${15}px) scale(1.1); opacity: 0.45; }
        }
      `}</style>
    </div>
  );
}

/* ── Ex-Libris profile banner ── */
function ExLibrisBanner({ pseudo, avatarUrl, totalXP, maxXP }: {
  pseudo: string; avatarUrl: string | null; totalXP: number; maxXP: number;
}) {
  const xpPercent = maxXP > 0 ? Math.round((totalXP / maxXP) * 100) : 0;

  return (
    <div className="flex justify-center px-4 pt-4 pb-2 shrink-0 z-10 relative">
      <div
        className="relative flex items-center gap-4 px-6 py-4 rounded-none max-w-sm w-full"
        style={{
          background: "linear-gradient(135deg, #F5E6D0 0%, #EDE0D4 50%, #F5E6D0 100%)",
          border: "3px double #8B7D6B",
          boxShadow: "inset 0 0 20px rgba(62, 44, 28, 0.08), 0 4px 12px rgba(62, 44, 28, 0.15)",
        }}
      >
        {/* Ornate corner decorations */}
        <svg className="absolute top-1 left-1 w-5 h-5 text-[#8B7D6B] opacity-60" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 19V8C1 4.13 4.13 1 8 1h11" /><circle cx="4" cy="16" r="1.5" fill="currentColor" /></svg>
        <svg className="absolute top-1 right-1 w-5 h-5 text-[#8B7D6B] opacity-60 scale-x-[-1]" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 19V8C1 4.13 4.13 1 8 1h11" /><circle cx="4" cy="16" r="1.5" fill="currentColor" /></svg>
        <svg className="absolute bottom-1 left-1 w-5 h-5 text-[#8B7D6B] opacity-60 scale-y-[-1]" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 19V8C1 4.13 4.13 1 8 1h11" /><circle cx="4" cy="16" r="1.5" fill="currentColor" /></svg>
        <svg className="absolute bottom-1 right-1 w-5 h-5 text-[#8B7D6B] opacity-60 scale-[-1]" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 19V8C1 4.13 4.13 1 8 1h11" /><circle cx="4" cy="16" r="1.5" fill="currentColor" /></svg>

        {/* "EX LIBRIS" tiny label */}
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5" style={{ background: "#F5E6D0", borderBottom: "1px solid #C4B59D" }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "8px", letterSpacing: "3px", color: "#8B7D6B", fontWeight: 600 }}>EX LIBRIS</span>
        </div>

        {/* Avatar in golden oval frame */}
        <div className="relative shrink-0">
          <div className="rounded-full p-[3px]" style={{ background: "linear-gradient(135deg, #C9A84C, #D4A843, #C9A84C)", boxShadow: "0 0 8px rgba(201, 168, 76, 0.4)" }}>
            <Avatar className="h-12 w-12 border-2 border-[#F5E6D0]">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="Avatar" /> : null}
              <AvatarFallback style={{ background: "#EDE0D4", color: "#5C3A21" }}><User className="h-5 w-5" /></AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "14px", fontWeight: 700, color: "#3E2C1C" }} className="truncate">{pseudo || "Lecteur"}</span>

          {/* XP bar as wood/leather */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "#5C3A21", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.4)" }}>
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${xpPercent}%`, background: "linear-gradient(90deg, #C9A84C, #D4A843, #FFD700)" }}
              />
            </div>
            {/* XP coin */}
            <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "radial-gradient(circle at 35% 35%, #FFD700, #C9A84C, #A88734)", border: "1.5px solid #A88734", boxShadow: "0 1px 4px rgba(168,135,52,0.5), inset 0 1px 2px rgba(255,255,255,0.3)" }}>
              <span style={{ fontFamily: "'Lora', serif", fontSize: "7px", fontWeight: 700, color: "#5C3A21" }}>XP</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: "11px", color: "#8B7D6B", fontStyle: "italic" }}>En quête d'aventure littéraire</span>
            <span style={{ fontFamily: "'Lora', serif", fontSize: "9px", color: "#8B7D6B", fontWeight: 600 }}>{totalXP}/{maxXP}</span>
          </div>
        </div>
      </div>
    </div>
  );
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
    topLevel.forEach((t) => { t.subTiers = subTiers.filter((s) => s.parent_tier_id === t.id); });
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
        if (!t.completed) { setCurrentTierId(t.id); found = true; break; }
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
      <div className="flex items-center justify-center flex-1" style={{ background: "#F5E6D0" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#5C3A21] border-t-transparent" />
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "13px", color: "#8B7D6B" }}>Chargement de votre aventure…</span>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden" style={{ background: "#F5E6D0" }}>
        <div className="flex items-center justify-center p-2 border-b shrink-0" style={{ borderColor: "#C4B59D", background: "#EDE0D4" }}>
          <div className="inline-flex items-center gap-0.5 rounded-lg p-1" style={{ border: "1px solid #C4B59D", background: "#F5E6D0" }}>
            <button
              onClick={() => setMobileView("map")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{
                fontFamily: "'Lora', serif",
                ...(mobileView === "map" ? { background: "#5C3A21", color: "#F5E6D0" } : { color: "#8B7D6B" }),
              }}
            >
              <MapIcon className="h-3.5 w-3.5" /> Carte
            </button>
            <button
              onClick={() => setMobileView("details")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{
                fontFamily: "'Lora', serif",
                ...(mobileView === "details" ? { background: "#5C3A21", color: "#F5E6D0" } : { color: "#8B7D6B" }),
              }}
            >
              <BookOpen className="h-3.5 w-3.5" /> Journal
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
    <div className="flex flex-1 overflow-hidden">
      {/* Left column - Parchment map */}
      <div className="w-1/2 border-r overflow-hidden relative flex flex-col" style={{ borderColor: "#C4B59D" }}>
        {/* Parchment background with blurred library */}
        <div className="absolute inset-0 z-0" style={{
          background: `
            url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E"),
            radial-gradient(ellipse at 30% 70%, rgba(201,168,76,0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 30%, rgba(92,58,33,0.05) 0%, transparent 50%),
            linear-gradient(to bottom, #F5E6D0, #EDE0D4, #F5E6D0)
          `,
        }} />

        {/* Manuscript ornate border */}
        <div className="absolute inset-2 z-0 pointer-events-none" style={{ border: "1px solid rgba(139, 125, 107, 0.2)", borderRadius: "2px" }}>
          <div className="absolute inset-1" style={{ border: "1px solid rgba(139, 125, 107, 0.1)" }} />
        </div>

        <GoldenDust />

        <ExLibrisBanner pseudo={pseudo} avatarUrl={avatarUrl} totalXP={totalXP} maxXP={maxXP} />

        <div className="flex-1 overflow-auto relative z-1">
          <ProgressionMap challenges={mapChallenges} tiers={mapTiers} currentTierId={currentTierId} onTierClick={handleTierClick} />
        </div>
      </div>

      {/* Right column - Quest Journal */}
      <div className="w-1/2 overflow-auto relative" style={{ background: "#FFF8F0" }}>
        {/* Lined paper effect */}
        <div className="absolute inset-0 pointer-events-none z-0" style={{
          backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, rgba(196, 181, 157, 0.15) 27px, rgba(196, 181, 157, 0.15) 28px)",
          backgroundSize: "100% 28px",
        }} />
        {/* Dog-eared corner */}
        <div className="absolute top-0 right-0 w-8 h-8 z-10 pointer-events-none" style={{
          background: "linear-gradient(225deg, #EDE0D4 50%, transparent 50%)",
          boxShadow: "-1px 1px 2px rgba(0,0,0,0.05)",
        }} />

        {/* Journal title */}
        <div className="relative z-1 text-center pt-6 pb-3">
          <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: "22px", color: "#5C3A21", fontWeight: 700 }}>
            Mon journal de quête
          </span>
          {/* Decorative flourish */}
          <div className="flex justify-center mt-1">
            <svg width="120" height="12" viewBox="0 0 120 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 6C10 6 20 2 30 6C40 10 50 2 60 6C70 10 80 2 90 6C100 10 110 6 110 6" stroke="#C4B59D" strokeWidth="1" fill="none" />
              <circle cx="60" cy="6" r="2" fill="#C9A84C" />
            </svg>
          </div>
        </div>

        <div className="relative z-1">
          <ProgressionDetails challenges={challenges} currentTierId={currentTierId} highlightedTierId={highlightedTierId} />
        </div>
      </div>
    </div>
  );
}
