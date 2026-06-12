// Aggressive jagged thunderbolt — hard angles, sharp tips, no rounding.
// Replaces the soft lucide Zap for brand/decorative use.
export function Bolt({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 100 200"
      className={className}
      style={style}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Main strike — steep, asymmetric, razor tips */}
      <path
        strokeLinejoin="miter"
        d="M64 0 L6 116 L42 112 L18 200 L96 70 L54 78 L90 0 Z"
      />
      {/* Splinter shard breaking off the strike */}
      <path
        strokeLinejoin="miter"
        opacity="0.55"
        d="M30 86 L2 132 L24 126 L10 162 L44 110 Z"
      />
    </svg>
  );
}
