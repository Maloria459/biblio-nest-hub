import { useEffect, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAvatar } from "@/contexts/AvatarContext";
import { User, Lock } from "lucide-react";

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

/* ── Decorative scattered library items ── */
function LibraryDecorations() {
  const items = [
    { emoji: "📚", top: "8%", left: "6%", rotate: -12, size: "22px" },
    { emoji: "☕", top: "22%", right: "10%", rotate: 8, size: "18px" },
    { emoji: "🪶", top: "38%", left: "4%", rotate: 20, size: "20px" },
    { emoji: "👓", top: "52%", right: "6%", rotate: -5, size: "18px" },
    { emoji: "🔖", top: "65%", left: "10%", rotate: 15, size: "16px" },
    { emoji: "📕", top: "78%", right: "12%", rotate: -18, size: "18px" },
    { emoji: "🐱", top: "45%", left: "82%", rotate: 0, size: "16px" },
    { emoji: "📗", top: "30%", left: "85%", rotate: 10, size: "16px" },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.12]">
      {items.map((item, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: item.top,
            left: item.left,
            right: (item as any).right,
            transform: `rotate(${item.rotate}deg)`,
            fontSize: item.size,
            filter: "sepia(0.6)",
          }}
        >
          {item.emoji}
        </div>
      ))}
    </div>
  );
}

/* ── Candle with flickering flame ── */
function Candle({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute pointer-events-none" style={{ left: x - 8, top: y - 24 }}>
      {/* Flame */}
      <div
        className="mx-auto w-2.5 h-4 rounded-full"
        style={{
          background: "radial-gradient(ellipse at 50% 80%, #FFD700, #E8913A 50%, transparent 100%)",
          animation: "candleFlicker 1.5s ease-in-out infinite alternate",
          filter: "blur(0.3px)",
        }}
      />
      {/* Glow */}
      <div
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255, 215, 0, 0.2) 0%, transparent 70%)",
          animation: "candleFlicker 2s ease-in-out infinite alternate",
        }}
      />
      {/* Candle body */}
      <div className="mx-auto w-2 h-5 rounded-b" style={{ background: "linear-gradient(to bottom, #EDE0D4, #D4C5B0)" }} />
      <style>{`
        @keyframes candleFlicker {
          0% { opacity: 0.7; transform: scaleY(1) scaleX(1); }
          33% { opacity: 1; transform: scaleY(1.1) scaleX(0.9); }
          66% { opacity: 0.8; transform: scaleY(0.95) scaleX(1.05); }
          100% { opacity: 0.9; transform: scaleY(1.05) scaleX(0.95); }
        }
      `}</style>
    </div>
  );
}

/* ── Ink-drawn quill path connector ── */
function InkPathConnector({ fromX, fromY, toX, toY, completed, isCurrent }: {
  fromX: number; fromY: number; toX: number; toY: number; completed: boolean; isCurrent: boolean;
}) {
  const midY = (fromY + toY) / 2;
  const d = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;

  return (
    <>
      {/* Shadow / thickness variation for ink effect */}
      <path
        d={d}
        fill="none"
        stroke={completed ? "#3E2C1C" : "#C4B59D"}
        strokeWidth={completed ? 5 : 3}
        strokeLinecap="round"
        strokeDasharray={completed ? "none" : "12 8"}
        opacity={completed ? 0.15 : 0.08}
        transform="translate(1, 1)"
      />
      <path
        d={d}
        fill="none"
        stroke={completed ? "#3E2C1C" : isCurrent ? "#8B7D6B" : "#C4B59D"}
        strokeWidth={completed ? 3.5 : 2.5}
        strokeLinecap="round"
        strokeDasharray={completed ? "none" : "10 7"}
        className={isCurrent ? "animate-pulse" : ""}
        style={{ filter: completed ? "none" : "url(#inkBlur)" }}
      />
    </>
  );
}

/* ── Book-shaped tier node ── */
function BookNode({
  tier, isCurrent, isCompleted, isLocked, position, avatarUrl, onTierClick, nodeRef,
}: {
  tier: Tier; isCurrent: boolean; isCompleted: boolean; isLocked: boolean;
  position: { x: number; y: number }; avatarUrl: string | null;
  onTierClick: (id: string) => void; nodeRef?: React.RefObject<HTMLDivElement>;
}) {
  const bookW = 56;
  const bookH = 68;

  return (
    <div
      ref={nodeRef}
      className="absolute"
      style={{
        left: position.x - bookW / 2,
        top: position.y - bookH / 2,
        width: bookW,
        height: bookH,
      }}
    >
      {/* Golden particles for current tier */}
      {isCurrent && (
        <div className="absolute -inset-4 pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${1.5 + Math.random() * 2}px`,
                height: `${1.5 + Math.random() * 2}px`,
                left: `${20 + Math.random() * 60}%`,
                top: `${10 + Math.random() * 80}%`,
                background: "#FFD700",
                opacity: 0.6,
                animation: `floatParticle ${2 + Math.random() * 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
          <style>{`
            @keyframes floatParticle {
              0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
              50% { transform: translateY(-12px) scale(1.3); opacity: 0.7; }
            }
          `}</style>
        </div>
      )}

      <button
        onClick={() => !isLocked && onTierClick(tier.id)}
        disabled={isLocked}
        className="relative z-10 w-full h-full flex flex-col items-center justify-center transition-all duration-300"
        style={{ cursor: isLocked ? "not-allowed" : "pointer" }}
      >
        {/* Book shape */}
        <div
          className="relative w-full h-full rounded-sm flex flex-col items-center justify-center"
          style={{
            ...(isCompleted ? {
              background: "linear-gradient(135deg, #6B2D3E, #8B3D4E, #6B2D3E)",
              border: "2px solid #C9A84C",
              boxShadow: "0 3px 12px rgba(107, 45, 62, 0.4), inset 0 1px 0 rgba(201, 168, 76, 0.3)",
            } : isCurrent ? {
              background: "linear-gradient(135deg, #5C3A21, #7A4E30, #5C3A21)",
              border: "2px solid #D4A843",
              boxShadow: "0 0 20px rgba(212, 168, 67, 0.4), 0 3px 12px rgba(92, 58, 33, 0.4)",
              animation: "bookPulse 3s ease-in-out infinite",
            } : {
              background: "linear-gradient(135deg, #A89B8C, #8B7D6B)",
              border: "2px solid #C4B59D",
              opacity: 0.6,
            }),
          }}
        >
          {/* Book spine line */}
          <div className="absolute left-[6px] top-1 bottom-1 w-[2px] rounded-full" style={{
            background: isCompleted ? "rgba(201, 168, 76, 0.4)" : isCurrent ? "rgba(212, 168, 67, 0.3)" : "rgba(196, 181, 157, 0.3)",
          }} />

          {/* Icon */}
          {isCompleted ? (
            <span className="text-lg" style={{ filter: "drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))" }}>✦</span>
          ) : isLocked ? (
            <Lock className="h-4 w-4" style={{ color: "#C4B59D" }} />
          ) : (
            <span className="text-lg" style={{ animation: "pageFlip 4s ease-in-out infinite" }}>📖</span>
          )}

          {/* Chapter number on spine */}
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "9px",
            fontWeight: 700,
            color: isCompleted ? "#C9A84C" : isCurrent ? "#D4A843" : "#C4B59D",
            marginTop: "2px",
          }}>
            Ch.{tier.order}
          </span>
        </div>

        <style>{`
          @keyframes bookPulse {
            0%, 100% { box-shadow: 0 0 15px rgba(212, 168, 67, 0.3), 0 3px 12px rgba(92, 58, 33, 0.4); }
            50% { box-shadow: 0 0 25px rgba(212, 168, 67, 0.5), 0 3px 12px rgba(92, 58, 33, 0.4); }
          }
          @keyframes pageFlip {
            0%, 100% { transform: rotateY(0deg); }
            25% { transform: rotateY(-8deg); }
            75% { transform: rotateY(8deg); }
          }
        `}</style>
      </button>

      {/* Parchment scroll label */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-20">
        <div className="relative px-3 py-1 rounded-sm" style={{
          background: "linear-gradient(135deg, #F5E6D0, #EDE0D4)",
          border: "1px solid #C4B59D",
          boxShadow: "0 2px 4px rgba(62, 44, 28, 0.1)",
        }}>
          {/* Scroll curl edges */}
          <div className="absolute -left-1 top-0 bottom-0 w-1.5" style={{ background: "linear-gradient(90deg, transparent, rgba(196,181,157,0.3))", borderRadius: "2px 0 0 2px" }} />
          <div className="absolute -right-1 top-0 bottom-0 w-1.5" style={{ background: "linear-gradient(270deg, transparent, rgba(196,181,157,0.3))", borderRadius: "0 2px 2px 0" }} />
          <span style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "10px",
            fontWeight: 600,
            color: "#3E2C1C",
          }}>
            {tier.name}
          </span>
        </div>
      </div>

      {/* Avatar sitting on current book */}
      {isCurrent && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-20">
          <div className="relative" style={{ animation: "avatarBounce 3s ease-in-out infinite" }}>
            <div className="rounded-full p-[2px]" style={{ background: "linear-gradient(135deg, #C9A84C, #D4A843)", boxShadow: "0 0 12px rgba(201, 168, 76, 0.4)" }}>
              <Avatar className="h-10 w-10 border-2 border-[#F5E6D0]">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt="Avatar" /> : null}
                <AvatarFallback style={{ background: "#5C3A21", color: "#F5E6D0" }}>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0" style={{
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "6px solid #C9A84C",
            }} />
          </div>
          <style>{`
            @keyframes avatarBounce {
              0%, 100% { transform: translateX(-50%) translateY(0); }
              50% { transform: translateX(-50%) translateY(-4px); }
            }
          `}</style>
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

  useEffect(() => {
    if (currentRef.current && containerRef.current) {
      setTimeout(() => {
        currentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 400);
    }
  }, [currentTierId]);

  const containerWidth = 320;
  const nodeSpacingY = 120;
  const startY = topLevelTiers.length * nodeSpacingY + 80;
  const leftX = 90;
  const rightX = containerWidth - 90;

  const nodePositions = topLevelTiers.map((tier, i) => {
    const y = startY - (i * nodeSpacingY);
    const x = i % 2 === 0 ? leftX : rightX;
    return { tier, x, y };
  });

  const totalHeight = startY + 120;

  // Place candles at every 3rd node
  const candlePositions = nodePositions.filter((_, i) => i % 3 === 1).map((p) => ({
    x: p.x > containerWidth / 2 ? p.x - 45 : p.x + 45,
    y: p.y - 10,
  }));

  return (
    <div
      ref={containerRef}
      className="relative h-full overflow-y-auto"
      style={{ scrollBehavior: "smooth" }}
    >
      <LibraryDecorations />

      <div className="relative mx-auto" style={{ width: containerWidth, height: totalHeight }}>
        {/* SVG ink paths */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={containerWidth}
          height={totalHeight}
          viewBox={`0 0 ${containerWidth} ${totalHeight}`}
        >
          <defs>
            <filter id="inkBlur">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.3" />
            </filter>
          </defs>

          {nodePositions.length > 0 && (
            <InkPathConnector
              fromX={containerWidth / 2}
              fromY={startY + 30}
              toX={nodePositions[0].x}
              toY={nodePositions[0].y}
              completed={nodePositions[0].tier.completed}
              isCurrent={nodePositions[0].tier.id === currentTierId}
            />
          )}

          {nodePositions.map((pos, i) => {
            if (i === 0) return null;
            const prev = nodePositions[i - 1];
            return (
              <InkPathConnector
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

        {/* Starting point — glowing open book portal */}
        <div
          className="absolute flex flex-col items-center"
          style={{ left: containerWidth / 2 - 32, top: startY + 10 }}
        >
          <div className="relative">
            {/* Glow */}
            <div className="absolute -inset-3 rounded-full" style={{
              background: "radial-gradient(circle, rgba(255, 215, 0, 0.25) 0%, rgba(201, 168, 76, 0.1) 50%, transparent 70%)",
              animation: "candleFlicker 3s ease-in-out infinite alternate",
            }} />
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{
              background: "linear-gradient(135deg, #5C3A21, #7A4E30)",
              border: "3px solid #C9A84C",
              boxShadow: "0 0 20px rgba(201, 168, 76, 0.3), inset 0 2px 4px rgba(0,0,0,0.2)",
            }}>
              <span className="text-2xl">📖</span>
            </div>
          </div>
          <span style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "11px",
            fontWeight: 600,
            fontStyle: "italic",
            color: "#5C3A21",
            marginTop: "8px",
            background: "linear-gradient(135deg, #F5E6D0, #EDE0D4)",
            padding: "2px 10px",
            borderRadius: "2px",
            border: "1px solid #C4B59D",
          }}>
            Il était une fois…
          </span>
        </div>

        {/* Candles */}
        {candlePositions.map((cp, i) => (
          <Candle key={i} x={cp.x} y={cp.y} />
        ))}

        {/* Challenge chapter title banners */}
        {sortedChallenges.map((challenge, ci) => {
          const lastPos = nodePositions[nodePositions.length - 1];
          const bannerY = ci === 0 ? (lastPos ? lastPos.y - 60 : 20) : 20;
          if (ci > 0) return null;

          const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
          const challengeIcons = ["📖", "📚", "🪶", "🏆", "⭐"];

          return (
            <div
              key={challenge.id}
              className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center"
              style={{ top: bannerY }}
            >
              <div className="flex flex-col items-center px-6 py-3 rounded-sm" style={{
                background: "linear-gradient(135deg, #F5E6D0, #EDE0D4, #F5E6D0)",
                border: "2px solid #C4B59D",
                boxShadow: "0 4px 12px rgba(62, 44, 28, 0.12)",
              }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 900, color: "#5C3A21", letterSpacing: "2px" }}>
                  {romanNumerals[ci] || ci + 1}
                </span>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "8px", color: "#8B7D6B", letterSpacing: "3px", fontWeight: 600, textTransform: "uppercase", marginTop: "2px" }}>
                  Chapitre
                </span>
                {/* Flourish */}
                <svg width="60" height="8" viewBox="0 0 60 8" className="my-1">
                  <path d="M5 4 Q15 0 30 4 Q45 8 55 4" stroke="#C9A84C" strokeWidth="1" fill="none" />
                  <circle cx="30" cy="4" r="1.5" fill="#C9A84C" />
                </svg>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "11px", fontWeight: 700, color: "#3E2C1C" }}>
                  {challengeIcons[ci] || "📖"} {challenge.name}
                </span>
              </div>
            </div>
          );
        })}

        {/* Book tier nodes */}
        {nodePositions.map((pos) => {
          const isCompleted = pos.tier.completed;
          const isCurrent = pos.tier.id === currentTierId;
          const isLocked = !isCompleted && !isCurrent;

          return (
            <BookNode
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
