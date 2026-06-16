import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bolt } from "@/components/bolt";
import { BadgeCheck, MapPin, Trophy, Target, Flame } from "lucide-react";
import { dopeLevel, boltLevel, sportHex, sportEmoji } from "@/lib/sport-meta";
import type { LucideIcon } from "lucide-react";

interface PlayerCardProfile {
  id?: string;
  name?: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
  locationArea?: string;
  locationCity?: string;
  sports?: Array<{ sport: string; skillLevel: string }>;
  gamesPlayed?: number;
  gamesHosted?: number;
  streakWeeks?: number;
}

interface PlayerCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: PlayerCardProfile;
  dopeRating: number; // 1-10
}

export function PlayerCardModal({ open, onOpenChange, profile, dopeRating }: PlayerCardModalProps) {
  const clampedRating = Math.max(1, Math.min(10, Math.round(dopeRating || 5)));
  const dope = dopeLevel(clampedRating);
  const bolt = boltLevel(profile.streakWeeks || 0, profile.gamesPlayed || 0);
  const primarySport = profile.sports?.[0]?.sport ?? "other";
  const hex = sportHex(primarySport);
  // T10 Galactic → purple shimmer; T9 Mythic → gold pulse
  const isGalactic = clampedRating === 9;
  const isMythic = clampedRating === 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 border-0 bg-transparent shadow-none [&>button]:hidden">
        <style>{`
          @keyframes pc-enter {
            from { opacity: 0; transform: scale(0.7) rotateY(140deg); }
            to   { opacity: 1; transform: scale(1)   rotateY(0); }
          }
          @keyframes pc-float {
            0%,100% { transform: translateY(0); }
            50%     { transform: translateY(-5px); }
          }
          @keyframes pc-mythic {
            0%   { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
          }
          @keyframes pc-shine {
            0%   { transform: translateX(-120%) skewX(-20deg); }
            60%  { transform: translateX(220%)  skewX(-20deg); }
            100% { transform: translateX(220%)  skewX(-20deg); }
          }
          @keyframes pc-galactic-pulse {
            0%,100% { box-shadow: 0 0 50px #fbbf24aa, 0 20px 50px #fbbf2440; }
            50%     { box-shadow: 0 0 90px #fbbf24ee, 0 20px 60px #fde68a80; }
          }
          .pc-wrap     { animation: pc-enter 600ms cubic-bezier(.2,.7,.2,1.3) backwards,
                                    pc-float 4.5s ease-in-out 800ms infinite; }
          .pc-mythic   { background: linear-gradient(120deg, #5b21b6, #8b5cf6, #c4b5fd, #8b5cf6, #5b21b6);
                         background-size: 300% 300%; animation: pc-mythic 4s linear infinite; }
          .pc-galactic { background: linear-gradient(135deg, #fbbf24 0%, #fde68a 50%, #fbbf24 100%);
                         animation: pc-galactic-pulse 2.2s ease-in-out infinite; }
          .pc-shine    { animation: pc-shine 2.6s ease-in-out 700ms infinite; }
        `}</style>

        <div className="pc-wrap relative" style={{ perspective: 1200 }}>
          {/* OUTER BORDER — color driven by dope tier */}
          <div
            className={`rounded-3xl p-[3px] relative ${isMythic ? "pc-mythic" : isGalactic ? "pc-galactic" : ""}`}
            style={
              isMythic
                ? { boxShadow: `0 0 70px #8b5cf6cc, 0 20px 60px #5b21b6aa` }
                : isGalactic
                ? undefined
                : {
                    background: `linear-gradient(135deg, ${dope.color} 0%, ${dope.glow} 50%, ${dope.color} 100%)`,
                    boxShadow: `0 0 60px ${dope.color}90, 0 20px 50px ${dope.color}40`,
                  }
            }
          >
            <div
              className="rounded-[22px] overflow-hidden relative"
              style={{ background: "linear-gradient(180deg, #0a0e14 0%, #0d1117 100%)" }}
            >
              {/* PHOTO PANEL */}
              <div
                className="relative pt-12 pb-6"
                style={{ background: `linear-gradient(180deg, ${hex.accent}1f 0%, transparent 100%)` }}
              >
                <Bolt
                  style={{
                    position: "absolute", top: 6, left: 6, width: 60, height: 120,
                    color: dope.color, opacity: 0.18,
                    transform: "rotate(-18deg)", pointerEvents: "none",
                  }}
                />
                <Bolt
                  style={{
                    position: "absolute", top: 6, right: 6, width: 60, height: 120,
                    color: dope.color, opacity: 0.18,
                    transform: "rotate(18deg) scaleX(-1)", pointerEvents: "none",
                  }}
                />

                {/* Sport emoji top-left */}
                <div
                  className="absolute top-3 left-3 z-10 w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: `${hex.accent}25`, border: `1.5px solid ${hex.accent}70` }}
                >
                  {sportEmoji(primarySport)}
                </div>

                {/* Tier chip top-right */}
                <div
                  className="absolute top-3 right-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-black tracking-widest uppercase"
                  style={{
                    background: dope.color,
                    color: "#0a0e14",
                    boxShadow: `0 0 16px ${dope.color}cc`,
                  }}
                >
                  T{clampedRating} · {dope.tier}
                </div>

                {/* Big avatar */}
                <div className="flex justify-center">
                  <div className="relative">
                    <Avatar
                      className="w-40 h-40 border-4 shadow-2xl"
                      style={{
                        borderColor: dope.color,
                        boxShadow: `0 0 50px ${dope.color}bb, inset 0 0 30px ${dope.color}30`,
                      }}
                    >
                      <AvatarImage src={profile.avatarUrl ?? undefined} />
                      <AvatarFallback
                        className="text-6xl font-black"
                        style={{
                          background: `linear-gradient(135deg, ${dope.color}40, ${hex.accent}20)`,
                          color: dope.color,
                        }}
                      >
                        {(profile.name ?? "?").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {profile.isVerified && (
                      <div className="absolute bottom-1 right-1 bg-background rounded-full p-1 shadow-lg">
                        <BadgeCheck className="w-7 h-7 text-blue-400 fill-blue-400/30" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Shine sweep across the photo panel */}
                <div
                  className="pc-shine absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)",
                    width: "60%",
                  }}
                />
              </div>

              {/* NAME + LOCATION */}
              <div className="px-5 text-center pb-3">
                <h2
                  className="text-2xl font-black tracking-tight leading-tight"
                  style={{ color: "#fff", textShadow: `0 0 22px ${dope.color}aa` }}
                >
                  {profile.name ?? "Unknown Player"}
                </h2>
                {(profile.locationArea || profile.locationCity) && (
                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
                    <MapPin className="w-3 h-3" style={{ color: hex.accent }} />
                    {profile.locationArea || "Ahmedabad"}
                    {profile.locationCity ? `, ${profile.locationCity}` : ""}
                  </p>
                )}
              </div>

              {/* STAT BARS */}
              <div className="px-5 pb-4 space-y-3">
                <StatBar label="DOPE" value={clampedRating} color={dope.color} icon={dope.emoji} />
                <StatBar label="BOLT" value={bolt} color="#00B4E0" icon="⚡" />
              </div>

              {/* DESCRIPTION CARD */}
              <div className="px-5 pb-5">
                <div
                  className="rounded-xl border p-3 text-center"
                  style={{ borderColor: `${dope.color}40`, background: `${dope.color}10` }}
                >
                  <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: dope.color }}>
                    {dope.emoji} {dope.name}
                  </div>
                  <p className="text-[11px] italic text-muted-foreground leading-relaxed">"{dope.desc}"</p>
                </div>
              </div>

              {/* BOTTOM STAT STRIP */}
              <div className="grid grid-cols-3 gap-px" style={{ background: `${dope.color}30` }}>
                <BottomStat icon={Trophy} value={profile.gamesPlayed || 0} label="Played" color={dope.color} />
                <BottomStat icon={Target} value={profile.gamesHosted || 0} label="Hosted" color={dope.color} />
                <BottomStat icon={Flame}  value={`${profile.streakWeeks || 0}w`} label="Streak" color="#f59e0b" />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatBar({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] font-black tracking-widest mb-1.5">
        <span className="flex items-center gap-1.5" style={{ color }}>
          <span className="text-sm">{icon}</span>
          {label}
        </span>
        <span className="text-white">{value}<span className="text-muted-foreground font-medium">/10</span></span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden relative" style={{ background: "#1a1f2e" }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0"
            style={{
              left: `${i * 10}%`,
              width: "1px",
              background: i === 0 ? "transparent" : "#0a0e14",
              zIndex: 2,
            }}
          />
        ))}
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${value * 10}%`,
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            boxShadow: `0 0 14px ${color}aa`,
          }}
        />
      </div>
    </div>
  );
}

function BottomStat({ icon: Icon, value, label, color }: {
  icon: LucideIcon;
  value: number | string;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-3" style={{ background: "#0a0e14" }}>
      <Icon className="w-3.5 h-3.5 mb-1" style={{ color }} />
      <div className="text-sm font-black text-white">{value}</div>
      <div className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">{label}</div>
    </div>
  );
}
