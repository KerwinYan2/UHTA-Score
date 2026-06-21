"use client";

interface CoinProps {
  flipping: boolean;
  targetSide: "heads" | "tails" | null;
  flipKey: number;
}

export default function Coin({ flipping, targetSide, flipKey }: CoinProps) {
  const flipClass =
    flipping && targetSide === "tails"
      ? "coin-flip-tails"
      : flipping
        ? "coin-flip-heads"
        : targetSide === "tails"
          ? "coin-rest-tails"
          : targetSide === "heads"
            ? "coin-rest-heads"
            : "";

  return (
    <div className="coin-scene">
      <div key={flipKey} className={`coin ${flipClass}`}>
        <div className="coin-face coin-heads">
          <svg viewBox="0 0 100 100" className="coin-svg" aria-hidden>
            <defs>
              <radialGradient id="goldBase" cx="38%" cy="32%" r="65%">
                <stop offset="0%" stopColor="#FFF4C8" />
                <stop offset="35%" stopColor="#E8C04A" />
                <stop offset="70%" stopColor="#B8860B" />
                <stop offset="100%" stopColor="#8B6914" />
              </radialGradient>
              <radialGradient id="goldRing" cx="50%" cy="50%" r="50%">
                <stop offset="82%" stopColor="transparent" />
                <stop offset="83%" stopColor="#C9A227" stopOpacity="0.6" />
                <stop offset="88%" stopColor="#F5E6A3" stopOpacity="0.8" />
                <stop offset="93%" stopColor="#9A7B0A" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#6B5208" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="url(#goldBase)" />
            <circle cx="50" cy="50" r="48" fill="url(#goldRing)" />
            {/* Reeded edge ticks */}
            {Array.from({ length: 48 }).map((_, i) => {
              const angle = (i * 360) / 48;
              const rad = (angle * Math.PI) / 180;
              const x1 = 50 + 44 * Math.cos(rad);
              const y1 = 50 + 44 * Math.sin(rad);
              const x2 = 50 + 48 * Math.cos(rad);
              const y2 = 50 + 48 * Math.sin(rad);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#9A7B0A"
                  strokeWidth="0.6"
                  opacity="0.5"
                />
              );
            })}
            <circle cx="50" cy="50" r="34" fill="none" stroke="#A67C00" strokeWidth="1.2" opacity="0.5" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="#F5E6A3" strokeWidth="0.8" opacity="0.4" />
            {/* Tennis ball relief */}
            <circle cx="50" cy="50" r="18" fill="#C9A227" opacity="0.25" />
            <path
              d="M 36 42 Q 50 28 64 42"
              fill="none"
              stroke="#8B6914"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.45"
            />
            <path
              d="M 36 58 Q 50 72 64 58"
              fill="none"
              stroke="#8B6914"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.45"
            />
            <text
              x="50"
              y="88"
              textAnchor="middle"
              fontSize="7"
              fontWeight="600"
              fill="#8B6914"
              opacity="0.6"
              letterSpacing="2"
            >
              UHTA
            </text>
          </svg>
        </div>

        {/* Tails — silver */}
        <div className="coin-face coin-tails">
          <svg viewBox="0 0 100 100" className="coin-svg" aria-hidden>
            <defs>
              <radialGradient id="silverBase" cx="38%" cy="32%" r="65%">
                <stop offset="0%" stopColor="#F8F8F8" />
                <stop offset="35%" stopColor="#D0D0D0" />
                <stop offset="70%" stopColor="#909090" />
                <stop offset="100%" stopColor="#606060" />
              </radialGradient>
              <radialGradient id="silverRing" cx="50%" cy="50%" r="50%">
                <stop offset="82%" stopColor="transparent" />
                <stop offset="83%" stopColor="#A0A0A0" stopOpacity="0.6" />
                <stop offset="88%" stopColor="#E8E8E8" stopOpacity="0.8" />
                <stop offset="93%" stopColor="#707070" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#505050" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="url(#silverBase)" />
            <circle cx="50" cy="50" r="48" fill="url(#silverRing)" />
            {Array.from({ length: 48 }).map((_, i) => {
              const angle = (i * 360) / 48;
              const rad = (angle * Math.PI) / 180;
              const x1 = 50 + 44 * Math.cos(rad);
              const y1 = 50 + 44 * Math.sin(rad);
              const x2 = 50 + 48 * Math.cos(rad);
              const y2 = 50 + 48 * Math.sin(rad);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#606060"
                  strokeWidth="0.6"
                  opacity="0.4"
                />
              );
            })}
            <circle cx="50" cy="50" r="34" fill="none" stroke="#707070" strokeWidth="1.2" opacity="0.4" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="#E0E0E0" strokeWidth="0.8" opacity="0.35" />
            <circle cx="50" cy="50" r="18" fill="#808080" opacity="0.2" />
            <text
              x="50"
              y="54"
              textAnchor="middle"
              fontSize="22"
              fontWeight="700"
              fill="#505050"
              opacity="0.35"
            >
              2
            </text>
            <text
              x="50"
              y="88"
              textAnchor="middle"
              fontSize="7"
              fontWeight="600"
              fill="#505050"
              opacity="0.5"
              letterSpacing="2"
            >
              UHTA
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}
