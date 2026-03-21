import { useEffect, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAvatar } from "@/contexts/AvatarContext";
import { User, Lock, Check, BookOpen, Star } from "lucide-react";

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

// Decorative floating book icons
function FloatingDecor() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.07]">
      <div className="absolute top-[10%] left-[8%] text-4xl rotate-[-15deg]">📚</div>
      <div className="absolute top-[25%] right-[12%] text-3xl rotate-[20deg]">📖</div>
      <div className="absolute top-[45%] left-[5%] text-2xl rotate-[10deg]">✨</div>
      <div className="absolute top-[60%] right-[8%] text-3xl rotate-[-10deg]">🏛️</div>
      <div className="absolute top-[75%] left-[12%] text-2xl rotate-[25deg]">📕</div>
      <div className="absolute top-[88%] right-[15%] text-2xl rotate-[-20deg]">🔖</div>
      <div className="absolute top-[35%] left-[80%] text-2xl rotate-[5deg]">📗</div>
      <div className="absolute top-[55%] left-[15%] text-3xl rotate-[-8deg]">🌟</div>
    </div>
  );
}

// SVG curved path connector between two points
function CurvedConnector({ fromX, fromY, toX, toY, completed, isCurrent }: {
  fromX: number; fromY: number; toX: number; toY: number; completed: boolean; isCurrent: boolean;
}) {
  const midY = (fromY + toY) / 2;
  const d = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;

  return (
    <path
      d={d}
      fill="none"
      stroke={completed ? "url(#completedGrad)" : isCurrent ? "url(#currentGrad)" : "hsl(var(--border))"}
      strokeWidth={completed ? 4 : 3}
      strokeDasharray={completed ? "none" : "8 6"}
      strokeLinecap="round"
      className={isCurrent ? "animate-pulse" : ""}
    />
  );
}

// Book-shaped tier node
function TierNode({
  tier,
  isCurrent,
  isCompleted,
  isLocked,
  position,
  avatarUrl,
  onTierClick,
  nodeRef,
}: {
  tier: Tier;
  isCurrent: boolean;
  isCompleted: boolean;
  isLocked: boolean;
  position: { x: number; y: number };
  avatarUrl: string | null;
  onTierClick: (id: string) => void;
  nodeRef?: React.RefObject<HTMLDivElement>;
}) {
  const nodeSize = 62;

  return (
    <div
      ref={nodeRef}
      className="absolute"
      style={{
        left: position.x - nodeSize / 2,
        top: position.y - nodeSize / 2,
        width: nodeSize,
        height: nodeSize,
      }}
    >
      {/* Glow effect for current tier */}
      {isCurrent && (
        <div className="absolute -inset-3 rounded-full animate-pulse"
          style={{
            background: "radial-gradient(circle, hsla(270, 70%, 60%, 0.35) 0%, transparent 70%)",
          }}
        />
      )}

      {/* Sparkle ring for completed */}
      {isCompleted && (
        <div className="absolute -inset-1.5 rounded-full"
          style={{
            background: "conic-gradient(from 0deg, hsla(45, 90%, 55%, 0.4), hsla(150, 60%, 45%, 0.4), hsla(45, 90%, 55%, 0.4))",
          }}
        />
      )}

      <button
        onClick={() => !isLocked && onTierClick(tier.id)}
        disabled={isLocked}
        className={`relative z-10 w-full h-full rounded-full flex flex-col items-center justify-center font-bold transition-all duration-300 border-[3px]
          ${isCompleted
            ? "bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 text-amber-900 border-amber-600 shadow-[0_0_20px_hsla(45,90%,55%,0.4)] hover:scale-110 cursor-pointer"
            : isCurrent
              ? "bg-gradient-to-br from-violet-400 via-purple-500 to-indigo-600 text-white border-violet-300 shadow-[0_0_25px_hsla(270,70%,60%,0.5)] hover:scale-110 cursor-pointer"
              : "bg-gradient-to-br from-gray-200 to-gray-300 text-gray-400 border-gray-300 cursor-not-allowed opacity-70"
          }`}
      >
        {isCompleted ? (
          <Star className="h-5 w-5 fill-current" />
        ) : isLocked ? (
          <Lock className="h-4 w-4" />
        ) : (
          <BookOpen className="h-5 w-5" />
        )}
        <span className="text-[9px] font-bold mt-0.5">CH.{tier.order}</span>
      </button>

      {/* Tier label */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm
            ${isCompleted
              ? "bg-amber-100 text-amber-800 border border-amber-300"
              : isCurrent
                ? "bg-violet-100 text-violet-800 border border-violet-300"
                : "bg-muted text-muted-foreground border border-border"
            }`}
        >
          {tier.name.length > 20 ? tier.name.slice(0, 18) + "…" : tier.name}
        </span>
      </div>

      {/* Avatar on current tier */}
      {isCurrent && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 animate-pulse opacity-60" />
            <Avatar className="relative h-11 w-11 border-[3px] border-white shadow-xl">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt="Avatar" />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-white" />
          </div>
        </div>
      )}
    </div>
  );
}

export function ProgressionMap({ challenges, tiers, currentTierId, onTierClick }: ProgressionMapProps) {
  const { avatarUrl } = useAvatar();
  const currentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const topLevelTiers = tiers.filter((t) => !t.parent_tier_id).sort((a, b) => a.order - b.order);
  const sortedChallenges = [...challenges].sort((a, b) => a.order - b.order);

  // Auto-scroll to current tier
  useEffect(() => {
    if (currentRef.current && containerRef.current) {
      setTimeout(() => {
        currentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 400);
    }
  }, [currentTierId]);

  // Calculate positions for zigzag path
  const containerWidth = 320;
  const nodeSpacingY = 110;
  const startY = topLevelTiers.length * nodeSpacingY + 80;
  const leftX = 90;
  const rightX = containerWidth - 90;

  const nodePositions = topLevelTiers.map((tier, i) => {
    const y = startY - (i * nodeSpacingY);
    const x = i % 2 === 0 ? leftX : rightX;
    return { tier, x, y };
  });

  const totalHeight = startY + 100;

  return (
    <div
      ref={containerRef}
      className="relative h-full overflow-y-auto"
      style={{ scrollBehavior: "smooth" }}
    >
      <FloatingDecor />

      <div className="relative mx-auto" style={{ width: containerWidth, height: totalHeight }}>
        {/* SVG paths */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={containerWidth}
          height={totalHeight}
          viewBox={`0 0 ${containerWidth} ${totalHeight}`}
        >
          <defs>
            <linearGradient id="completedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(45, 90%, 55%)" />
              <stop offset="100%" stopColor="hsl(35, 85%, 50%)" />
            </linearGradient>
            <linearGradient id="currentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(270, 70%, 60%)" />
              <stop offset="100%" stopColor="hsl(240, 60%, 55%)" />
            </linearGradient>
          </defs>

          {/* Starting flag to first node */}
          {nodePositions.length > 0 && (
            <CurvedConnector
              fromX={containerWidth / 2}
              fromY={startY + 30}
              toX={nodePositions[0].x}
              toY={nodePositions[0].y}
              completed={nodePositions[0].tier.completed}
              isCurrent={nodePositions[0].tier.id === currentTierId}
            />
          )}

          {/* Connect consecutive nodes */}
          {nodePositions.map((pos, i) => {
            if (i === 0) return null;
            const prev = nodePositions[i - 1];
            return (
              <CurvedConnector
                key={pos.tier.id}
                fromX={prev.x}
                fromY={prev.y}
                toX={pos.x}
                toY={pos.y}
                completed={pos.tier.completed}
                isCurrent={pos.tier.id === currentTierId}
              />
            );
          })}
        </svg>

        {/* Starting point */}
        <div
          className="absolute flex flex-col items-center"
          style={{ left: containerWidth / 2 - 28, top: startY + 10 }}
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 via-orange-400 to-red-400 flex items-center justify-center shadow-lg border-[3px] border-amber-600">
            <span className="text-xl">🏰</span>
          </div>
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mt-1.5 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            Début de l'aventure
          </span>
        </div>

        {/* Challenge banners */}
        {sortedChallenges.map((challenge, ci) => {
          // Place banner above the first tier of each challenge
          const challengeTiersInOrder = topLevelTiers.sort((a, b) => a.order - b.order);
          const firstTierIndex = 0; // For single challenge
          const bannerY = ci === 0
            ? nodePositions[nodePositions.length - 1]?.y - 55 ?? 20
            : 20;

          if (ci > 0) return null; // Only handle first challenge for now

          return (
            <div
              key={challenge.id}
              className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
              style={{ top: bannerY }}
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-100 via-amber-50 to-orange-100 border-2 border-amber-300 shadow-md">
                <span className="text-lg">🏆</span>
                <div className="flex flex-col">
                  <span className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider">Défi #{challenge.order}</span>
                  <span className="text-xs font-bold text-amber-900">{challenge.name}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Tier nodes */}
        {nodePositions.map((pos, i) => {
          const isCompleted = pos.tier.completed;
          const isCurrent = pos.tier.id === currentTierId;
          const isLocked = !isCompleted && !isCurrent;

          return (
            <TierNode
              key={pos.tier.id}
              tier={pos.tier}
              isCurrent={isCurrent}
              isCompleted={isCompleted}
              isLocked={isLocked}
              position={pos}
              avatarUrl={avatarUrl}
              onTierClick={onTierClick}
              nodeRef={isCurrent ? currentRef as React.RefObject<HTMLDivElement> : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
