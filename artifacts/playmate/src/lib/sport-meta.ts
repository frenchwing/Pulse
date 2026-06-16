export const SPORT_EMOJI: Record<string, string> = {
  tennis: "🎾",
  badminton: "🏸",
  pickleball: "🏓",
  cricket: "🏏",
  football: "⚽",
  basketball: "🏀",
  volleyball: "🏐",
  running: "🏃",
  cycling: "🚴",
  gym: "💪",
  swimming: "🏊",
  coffee: "☕",
  trek: "🥾",
  museum: "🏛️",
  throwball: "🏐",
  other: "🎯",
  sport: "🏅",
  fitness: "🔥",
  adventure: "⛰️",
  hobby: "✨",
  social: "🤝",
};

export const SPORT_COLOR: Record<string, string> = {
  tennis: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  badminton: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  pickleball: "bg-green-500/20 text-green-300 border-green-500/30",
  cricket: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  football: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  basketball: "bg-orange-600/20 text-orange-300 border-orange-600/30",
  volleyball: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  running: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  cycling: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  gym: "bg-red-500/20 text-red-300 border-red-500/30",
  swimming: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  coffee: "bg-amber-700/20 text-amber-300 border-amber-700/30",
  throwball: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  other: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

// Hex color pairs per sport for inline gradient styling in the sport grid
export const SPORT_HEX: Record<string, { accent: string; glow: string; dim: string }> = {
  tennis:     { accent: "#fde047", glow: "#ca8a04", dim: "#1a1200" },
  badminton:  { accent: "#60a5fa", glow: "#2563eb", dim: "#0a1628" },
  pickleball: { accent: "#4ade80", glow: "#16a34a", dim: "#031a0c" },
  cricket:    { accent: "#fb923c", glow: "#ea580c", dim: "#200a00" },
  football:   { accent: "#34d399", glow: "#059669", dim: "#011a10" },
  basketball: { accent: "#f97316", glow: "#c2410c", dim: "#1a0800" },
  volleyball: { accent: "#c084fc", glow: "#9333ea", dim: "#17073a" },
  running:    { accent: "#f472b6", glow: "#db2777", dim: "#1f0019" },
  cycling:    { accent: "#22d3ee", glow: "#0891b2", dim: "#031a20" },
  gym:        { accent: "#f87171", glow: "#dc2626", dim: "#1c0000" },
  swimming:   { accent: "#38bdf8", glow: "#0284c7", dim: "#031525" },
  coffee:     { accent: "#fbbf24", glow: "#b45309", dim: "#150900" },
  throwball:  { accent: "#a78bfa", glow: "#7c3aed", dim: "#0f0527" },
  other:      { accent: "#94a3b8", glow: "#475569", dim: "#0f172a" },
};

export function sportEmoji(type: string): string {
  return SPORT_EMOJI[type?.toLowerCase()] ?? "🏅";
}

export function sportColor(type: string): string {
  return SPORT_COLOR[type?.toLowerCase()] ?? "bg-slate-500/20 text-slate-300 border-slate-500/30";
}

export function sportHex(type: string) {
  return SPORT_HEX[type?.toLowerCase()] ?? { accent: "#94a3b8", glow: "#475569", dim: "#0f172a" };
}

// Dope Levels 1-10 — card-game rarity tier palette (common → mythic)
// color = outline color of the player card at this tier
// glow  = stronger version used for shadows/auras
// tier  = display label (Common / Rare / Epic / Legendary / Mythic)
export const DOPE_LEVELS: Record<number, { name: string; desc: string; emoji: string; color: string; glow: string; tier: string }> = {
  1:  { name: "Just Showed Up",        desc: "Has underdeveloped limbs",                 emoji: "🐣", color: "#f8fafc", glow: "#ffffff", tier: "Rookie"   },
  2:  { name: "Getting Dressed",        desc: "Has the gear, skills still downloading",   emoji: "🌱", color: "#c8a878", glow: "#e0c9a6", tier: "Casual"   },
  3:  { name: "Has a Sports Bag",       desc: "Looks the part, that's about it",          emoji: "🎒", color: "#eab308", glow: "#fde047", tier: "Backup"   },
  4:  { name: "YouTube Certified",      desc: "Studied the move, never landed it",        emoji: "📱", color: "#f97316", glow: "#fb923c", tier: "Solid"    },
  5:  { name: "Weekend Warrior",        desc: "Monday hero, Friday nobody",               emoji: "⚔️", color: "#78350f", glow: "#92400e", tier: "Pro"      },
  6:  { name: "The Regular",            desc: "Courts know the face, not the name",       emoji: "🏃", color: "#8b0000", glow: "#dc2626", tier: "Sharp"    },
  7:  { name: "Local Legend",           desc: "People clear the court for them",          emoji: "🌟", color: "#1f51ff", glow: "#60a5fa", tier: "Elite"    },
  8:  { name: "Streets Know the Name",  desc: "Has a signature move and a nickname",      emoji: "🔥", color: "#10b981", glow: "#34d399", tier: "Legendary"},
  9:  { name: "Walking Highlight Reel", desc: "Only limited by his team",                 emoji: "🎥", color: "#5b21b6", glow: "#8b5cf6", tier: "Mythic"   },
  10: { name: "Too Dope to Explain",    desc: "The court bows before they enter",         emoji: "👑", color: "#fbbf24", glow: "#fde68a", tier: "Galactic" },
};

export function dopeLevel(level: number) {
  const clamped = Math.max(1, Math.min(10, Math.round(level)));
  return DOPE_LEVELS[clamped] ?? DOPE_LEVELS[5];
}

// Reliability badges — score 0-100
export function reliabilityBadge(score: number): { label: string; emoji: string; color: string; border: string } {
  if (score >= 90) return { label: "Iron Guard",   emoji: "🛡️", color: "bg-green-500/20 text-green-300",   border: "border-green-500/40" };
  if (score >= 75) return { label: "Steady Crew",  emoji: "✅", color: "bg-emerald-500/20 text-emerald-300", border: "border-emerald-500/40" };
  if (score >= 60) return { label: "Warming Up",   emoji: "🌡️", color: "bg-yellow-500/20 text-yellow-300",  border: "border-yellow-500/40" };
  if (score >= 40) return { label: "Hit or Miss",  emoji: "⚠️", color: "bg-orange-500/20 text-orange-300",  border: "border-orange-500/40" };
  return                  { label: "Ghost Mode",   emoji: "👻", color: "bg-red-500/20 text-red-300",         border: "border-red-500/40" };
}

// Loyalty badge tiers — based on streakWeeks + gamesPlayed
export const LOYALTY_TIERS = [
  { label: "Blazing",   emoji: "🔥", color: "#00B4E0", ringClass: "ring-[#00B4E0]",  desc: "Unstoppable — courts can't function without them"    },
  { label: "Legend",    emoji: "👑", color: "#f59e0b", ringClass: "ring-amber-500",  desc: "Walls have their name. Courts remember their moves"   },
  { label: "Veteran",   emoji: "⭐", color: "#94a3b8", ringClass: "ring-slate-400",  desc: "Battle-tested, always there when it counts"           },
  { label: "Regular",   emoji: "✅", color: "#22c55e", ringClass: "ring-green-500",  desc: "Shows up, gives 100%, no drama"                       },
  { label: "New Blood", emoji: "🌱", color: "#6b7280", ringClass: "ring-gray-500",   desc: "Still finding their footing — watch this space"       },
] as const;

// Bolt Level 1-10 — momentum/energy rating shown on the player card.
// streakWeeks weighs heavier than total games (bolt = current energy, not lifetime stats)
export function boltLevel(streakWeeks: number, gamesPlayed: number): number {
  const sw = Math.min(streakWeeks || 0, 20);
  const gp = Math.min(gamesPlayed || 0, 100);
  const raw = (sw / 20) * 7 + (gp / 100) * 3;
  return Math.max(1, Math.min(10, Math.round(raw))) || 1;
}

export function loyaltyBadge(streakWeeks: number, gamesPlayed: number) {
  if (streakWeeks >= 10 || gamesPlayed >= 60) return LOYALTY_TIERS[0];
  if (streakWeeks >= 7  || gamesPlayed >= 35) return LOYALTY_TIERS[1];
  if (streakWeeks >= 4  || gamesPlayed >= 20) return LOYALTY_TIERS[2];
  if (streakWeeks >= 2  || gamesPlayed >= 8)  return LOYALTY_TIERS[3];
  return LOYALTY_TIERS[4];
}

// Deterministic loyalty for a member name (no profile data available)
export function memberLoyaltyColor(name: string): string {
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return LOYALTY_TIERS[hash % LOYALTY_TIERS.length].color;
}

// Ghost Factor — inverse of reliability (0=never ghosts, 100=always ghosts)
export interface GhostFactorInfo {
  score: number;
  label: string;
  desc: string;
  face: string;
  ghosts: number;
  color: string;
}

export function ghostFactor(reliabilityScore: number): GhostFactorInfo {
  const score = 100 - Math.max(0, Math.min(100, reliabilityScore ?? 85));
  if (score <= 10) return { score, label: "Solid",   desc: "Never ghosts. An absolute legend.",          face: "😁", ghosts: 1, color: "#22c55e" };
  if (score <= 25) return { score, label: "Trusty",  desc: "Almost always shows up.",                    face: "🙂", ghosts: 1, color: "#4ade80" };
  if (score <= 40) return { score, label: "Iffy",    desc: "Might vanish without a word.",               face: "😐", ghosts: 2, color: "#fbbf24" };
  if (score <= 55) return { score, label: "Flaky",   desc: "Goes poof more than you'd like.",            face: "😕", ghosts: 2, color: "#f97316" };
  if (score <= 70) return { score, label: "Spooky",  desc: "Ghosts more often than they show.",          face: "😬", ghosts: 3, color: "#ef4444" };
  if (score <= 85) return { score, label: "Haunted", desc: "Serial ghoster. You have been warned.",      face: "😱", ghosts: 4, color: "#dc2626" };
                   return { score, label: "Phantom", desc: "Never actually exists at the venue.",        face: "💀", ghosts: 5, color: "#7f1d1d" };
}

// Map skill level text → a specific dope level number (varies by seed so the feed shows many levels)
// Seed can be a Firestore string id or a number.
export function skillToDope(skill: string, seed: number | string = 0): number {
  const ranges: Record<string, [number, number]> = {
    beginner:     [1, 3],
    intermediate: [4, 6],
    advanced:     [7, 8],
    pro:          [9, 10],
  };
  const [min, max] = ranges[skill?.toLowerCase()] ?? [4, 6];
  const n = typeof seed === "number"
    ? seed
    : String(seed).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return min + (n % (max - min + 1));
}

export const SPORT_LABELS: { value: string; label: string }[] = [
  { value: "badminton",  label: "Badminton" },
  { value: "tennis",     label: "Tennis" },
  { value: "pickleball", label: "Pickleball" },
  { value: "football",   label: "Football" },
  { value: "basketball", label: "Basketball" },
  { value: "cricket",    label: "Cricket" },
  { value: "volleyball", label: "Volleyball" },
  { value: "running",    label: "Running" },
  { value: "cycling",    label: "Cycling" },
  { value: "gym",        label: "Gym" },
  { value: "swimming",   label: "Swimming" },
  { value: "throwball",  label: "Throwball" },
  { value: "other",      label: "Other" },
];
