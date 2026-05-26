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

export function sportEmoji(type: string): string {
  return SPORT_EMOJI[type?.toLowerCase()] ?? "🏅";
}

export function sportColor(type: string): string {
  return SPORT_COLOR[type?.toLowerCase()] ?? "bg-slate-500/20 text-slate-300 border-slate-500/30";
}

export const SPORT_LABELS: { value: string; label: string }[] = [
  { value: "badminton", label: "Badminton" },
  { value: "tennis", label: "Tennis" },
  { value: "pickleball", label: "Pickleball" },
  { value: "football", label: "Football" },
  { value: "basketball", label: "Basketball" },
  { value: "cricket", label: "Cricket" },
  { value: "volleyball", label: "Volleyball" },
  { value: "running", label: "Running" },
  { value: "cycling", label: "Cycling" },
  { value: "gym", label: "Gym" },
  { value: "swimming", label: "Swimming" },
  { value: "throwball", label: "Throwball" },
  { value: "other", label: "Other" },
];
