import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useListClubs, useSubmitClubInquiry, useListCorpBattles, useCreateCorpBattle, useCreateClub } from "@/hooks/use-firestore";
type Club2 = any;
type CorpBattle = any;
import { useQueryClient } from "@tanstack/react-query";
import {
  Lock, Users, MapPin, ChevronDown, ChevronUp, Send,
  Swords, Trophy, ArrowLeft, Plus, Calendar, Shield, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSessionProfile } from "@/hooks/use-session";
import {
  sportEmoji, sportHex, sportColor, dopeLevel, reliabilityBadge, memberLoyaltyColor, SPORT_LABELS, LOYALTY_TIERS,
} from "@/lib/sport-meta";
import { Bolt } from "@/components/bolt";

// ── Corps clash intro ─────────────────────────────────────────────────────────
function ClashIntro({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <>
      <style>{`
        @keyframes clashFromLeft {
          0%   { transform: translateX(-150vw) rotate(-14deg); filter: drop-shadow(0 0 20px #00B4E080); }
          62%  { transform: translateX(0)      rotate(-14deg); filter: drop-shadow(0 0 40px #00B4E0cc); opacity: 1; }
          76%  { transform: translateX(0)      rotate(-14deg); filter: drop-shadow(0 0 110px #00B4E0) brightness(3.5); opacity: 1; }
          100% { transform: translateX(0)      rotate(-14deg); opacity: 0; }
        }
        @keyframes clashFromRight {
          0%   { transform: translateX(150vw) rotate(14deg) scaleX(-1); filter: drop-shadow(0 0 20px #f9731680); }
          62%  { transform: translateX(0)     rotate(14deg) scaleX(-1); filter: drop-shadow(0 0 40px #f97316cc); opacity: 1; }
          76%  { transform: translateX(0)     rotate(14deg) scaleX(-1); filter: drop-shadow(0 0 110px #f97316) brightness(3.5); opacity: 1; }
          100% { transform: translateX(0)     rotate(14deg) scaleX(-1); opacity: 0; }
        }
        @keyframes shockRing {
          0%   { transform: scale(0.1); opacity: 0.9; }
          100% { transform: scale(7);   opacity: 0; }
        }
        @keyframes clashFlash {
          0%, 68% { opacity: 0; }
          76%     { opacity: 0.95; }
          83%     { opacity: 0.08; }
          90%     { opacity: 0.7; }
          100%    { opacity: 0; }
        }
        @keyframes overlayOut {
          0%, 78% { opacity: 1; }
          100%    { opacity: 0; }
        }
      `}</style>

      <div
        className="fixed inset-0 z-[999] pointer-events-none overflow-hidden"
        style={{ background: "#080c10", animation: "overlayOut 1s ease-in-out forwards" }}
      >
        {/* Cyan bolt — from left */}
        <Bolt style={{
          position: "absolute",
          width: 210, height: 420,
          left: "calc(50% - 105px)",
          top:  "calc(50% - 210px)",
          color: "#00B4E0",
          animation: "clashFromLeft 1s cubic-bezier(0.35,0,0.55,1) forwards",
        }} />

        {/* Orange bolt — from right, mirrored */}
        <Bolt style={{
          position: "absolute",
          width: 210, height: 420,
          left: "calc(50% - 105px)",
          top:  "calc(50% - 210px)",
          color: "#6366f1",
          animation: "clashFromRight 1s cubic-bezier(0.35,0,0.55,1) forwards",
        }} />

        {/* Shockwave rings */}
        {[0, 0.06, 0.12].map((delay, i) => (
          <div key={i} style={{
            position: "absolute",
            left: "50%", top: "50%",
            width: 64, height: 64,
            marginLeft: -32, marginTop: -32,
            borderRadius: "50%",
            border: `${2.5 - i * 0.5}px solid ${i % 2 === 0 ? "#00B4E070" : "#f9731670"}`,
            animation: `shockRing 0.65s ease-out ${0.62 + delay}s forwards`,
            opacity: 0,
          }} />
        ))}

        {/* Impact flash */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 50% 50%, #ffffff 0%, #00B4E070 30%, #f9731650 65%, transparent 80%)",
          animation: "clashFlash 1s ease-in-out forwards",
        }} />
      </div>
    </>
  );
}

// ── Dope Level Bar ────────────────────────────────────────────────────────────
function DopeBadge({ level }: { level: number }) {
  const dl = dopeLevel(level);
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-base">{dl.emoji}</span>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: dl.color }}>
          Dope Lv.{level}
        </span>
        <span className="text-[10px] text-muted-foreground leading-tight truncate">{dl.name}</span>
      </div>
    </div>
  );
}

// ── Corp Card ─────────────────────────────────────────────────────────────────
function CorpCard({ corp }: { corp: Club2 }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { uid, profile } = useSessionProfile();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const hex = sportHex(corp.sport);
  const rb = reliabilityBadge(corp.reliabilityScore);
  const members = corp.memberNames as string[];

  const inquire = useSubmitClubInquiry({
    mutation: {
      onSuccess: () => {
        toast({ title: "Request sent!", description: `${corp.name} will review your application.` });
        setOpen(false); setMessage("");
      },
      onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
    },
  });

  return (
    <div
      className="rounded-2xl border border-border overflow-hidden shadow-xl hover:shadow-2xl transition-all group"
      style={{
        background: `linear-gradient(145deg, ${hex.accent}14 0%, ${hex.dim} 50%, #0d1117 100%)`,
        borderColor: `${hex.accent}25`,
      }}
    >
      {/* Banner */}
      <div
        className="relative flex items-center justify-center"
        style={{
          height: 72,
          background: `linear-gradient(135deg, ${hex.accent}40, ${hex.dim})`,
        }}
      >
        <span
          className="text-4xl"
          style={{ filter: `drop-shadow(0 0 12px ${hex.glow})` }}
        >
          {sportEmoji(corp.sport)}
        </span>
        <div
          className="absolute top-2 right-3 font-black text-sm px-2 py-0.5 rounded bg-black/40 text-white"
        >
          {corp.wins}W-{corp.losses}L
        </div>
      </div>

      <div className="p-5 flex flex-col gap-3">
        {/* Header */}
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-black text-foreground tracking-tight leading-tight">{corp.name}</h3>
          {corp.tagline && (
            <p className="text-sm text-muted-foreground italic mt-1">&ldquo;{corp.tagline}&rdquo;</p>
          )}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {corp.area && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5" />{corp.area}
              </span>
            )}
            {corp.isExclusive && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" /> By inquiry
              </span>
            )}
          </div>
        </div>

        {/* Stats row — horizontal with dividers */}
        <div className="flex items-center gap-4 py-2 border-y border-border/40">
          <div className="text-center flex-1">
            <div className="text-base">{rb.emoji}</div>
            <div className="text-[9px] font-black uppercase tracking-wide leading-tight mt-0.5">{rb.label}</div>
            <div className="text-[9px] text-muted-foreground">Reliability</div>
          </div>
          <div className="w-px h-8 bg-border/50" />
          <div className="text-center flex-1">
            <div className="text-base">{dopeLevel(corp.avgDopeLevel).emoji}</div>
            <div className="text-[9px] font-black uppercase tracking-wide leading-tight mt-0.5" style={{ color: dopeLevel(corp.avgDopeLevel).color }}>
              Lv.{corp.avgDopeLevel}
            </div>
            <div className="text-[9px] text-muted-foreground">Dope Lv</div>
          </div>
          <div className="w-px h-8 bg-border/50" />
          <div className="text-center flex-1">
            <div className="text-sm font-black" style={{ color: hex.accent }}>
              {corp.wins}W-{corp.losses}L
            </div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide leading-tight mt-0.5">Record</div>
          </div>
        </div>

        {/* Dope level + members with loyalty rings */}
        <div className="flex items-center justify-between gap-2">
          <DopeBadge level={corp.avgDopeLevel} />
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1.5">
              {members.slice(0, 4).map((m, i) => {
                const loyaltyColor = memberLoyaltyColor(m);
                return (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black"
                    style={{
                      background: hex.accent,
                      color: hex.dim,
                      border: `2px solid ${loyaltyColor}`,
                      boxShadow: `0 0 6px ${loyaltyColor}60`,
                    }}
                    title={`${m} · Loyalty ring`}
                  >{m.charAt(0)}</div>
                );
              })}
              {members.length > 4 && (
                <div className="w-6 h-6 rounded-full text-[8px] flex items-center justify-center border-2 border-card bg-secondary text-muted-foreground font-bold">
                  +{members.length - 4}
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              <span className="text-foreground font-bold">{corp.memberCount}</span>
              {corp.maxMembers ? `/${corp.maxMembers}` : ""} members
            </span>
          </div>
        </div>

        {/* Loyalty ring legend (compact) */}
        <div className="flex items-center gap-2 flex-wrap">
          {LOYALTY_TIERS.map(t => (
            <div key={t.label} className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <div className="w-2 h-2 rounded-full" style={{ background: t.color }} />
              {t.emoji} {t.label}
            </div>
          ))}
        </div>

        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Users className="w-3 h-3" />
          Led by <span className="text-foreground font-medium ml-1">{corp.leaderName}</span>
        </div>

        {/* CTA */}
        <Button
          size="sm"
          className="w-full gap-2 font-black transition-all text-white"
          style={open ? {
            background: "transparent",
            border: `1px solid ${hex.accent}40`,
            color: hex.accent,
          } : {
            background: `linear-gradient(135deg, ${hex.accent}, ${hex.dim === "#080c10" ? hex.accent + "bb" : hex.dim})`,
            boxShadow: `0 0 20px ${hex.glow}30`,
            border: "none",
          }}
          onClick={() => setOpen(v => !v)}
        >
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {open ? "Close" : "Request to Join"}
        </Button>

        {open && (
          <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
            {!uid || !profile ? (
              <>
                <p className="text-xs text-muted-foreground">Sign in to apply — requests are tied to your Pulse profile.</p>
                <Button
                  size="sm" className="w-full font-bold gap-2"
                  style={{ background: hex.accent, color: hex.dim }}
                  onClick={() => setLocation("/onboarding")}
                >
                  Sign in to Apply
                </Button>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Applying as <span className="font-bold text-foreground">{profile.name}</span> — the corp leader will review your request.
                </p>
                <Textarea
                  placeholder="Why do you want to join? (optional)"
                  value={message} onChange={e => setMessage(e.target.value)}
                  className="bg-background/60 text-sm resize-none" rows={2}
                />
                <Button
                  size="sm" className="w-full font-bold gap-2 text-primary-foreground"
                  style={{ background: hex.accent, color: hex.dim }}
                  disabled={inquire.isPending}
                  onClick={() => inquire.mutate({ id: corp.id, data: { applicantName: profile.name, applicantProfileId: uid, applicantPhone: profile.phone || undefined, message: message || undefined } })}
                >
                  <Send className="w-3 h-3" />
                  {inquire.isPending ? "Sending…" : "Send Request"}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Corp Battle Card ──────────────────────────────────────────────────────────
function BattleCard({ battle, corps }: { battle: CorpBattle; corps: Club2[] }) {
  const corp1 = corps.find(c => c.id === battle.corp1Id);
  const corp2 = corps.find(c => c.id === battle.corp2Id);
  if (!corp1 || !corp2) return null;

  const hex = sportHex(battle.sport);
  const isPending = battle.result === "pending";
  const winner = battle.result === "corp1" ? corp1 : battle.result === "corp2" ? corp2 : null;
  const date = new Date(battle.scheduledAt);

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: `${hex.accent}08`, borderColor: `${hex.accent}25` }}
    >
      <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ borderColor: `${hex.accent}20`, background: `${hex.accent}12` }}>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: hex.accent }}>
          ⚔️ Corp Battle
        </span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isPending ? "bg-yellow-500/20 text-yellow-300" : winner ? "bg-green-500/20 text-green-300" : "bg-slate-500/20 text-slate-300"}`}>
          {isPending ? "Scheduled" : winner ? `${winner.name} Won` : "Draw"}
        </span>
      </div>
      <div className="p-3 flex items-center gap-3">
        {/* Corp 1 */}
        <div className="flex-1 text-center">
          <div className="text-2xl mb-1">{sportEmoji(corp1.sport)}</div>
          <div className="text-xs font-black text-foreground leading-tight">{corp1.name}</div>
          {!isPending && <div className="text-lg font-black mt-1" style={{ color: hex.accent }}>{battle.corp1Score ?? "-"}</div>}
        </div>
        {/* VS */}
        <div className="shrink-0 text-center">
          <div className="text-lg font-black text-muted-foreground">VS</div>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </div>
          {battle.location && <div className="text-[9px] text-muted-foreground mt-0.5 max-w-16 truncate">{battle.location}</div>}
        </div>
        {/* Corp 2 */}
        <div className="flex-1 text-center">
          <div className="text-2xl mb-1">{sportEmoji(corp2.sport)}</div>
          <div className="text-xs font-black text-foreground leading-tight">{corp2.name}</div>
          {!isPending && <div className="text-lg font-black mt-1" style={{ color: hex.accent }}>{battle.corp2Score ?? "-"}</div>}
        </div>
      </div>
    </div>
  );
}

// ── Issue Battle Form ─────────────────────────────────────────────────────────
function IssueBattleForm({ sport, corps, onClose }: { sport: string; corps: Club2[]; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [corp1Id, setCorp1Id] = useState<string>("");
  const [corp2Id, setCorp2Id] = useState<string>("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");

  const createBattle = useCreateCorpBattle({
    mutation: {
      onSuccess: () => {
        toast({ title: "⚔️ Challenge Issued!", description: "The battle has been scheduled." });
        qc.invalidateQueries({ queryKey: ["listCorpBattles"] });
        onClose();
      },
      onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
    },
  });

  const hex = sportHex(sport);
  const canSubmit = corp1Id && corp2Id && corp1Id !== corp2Id && date;

  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: `${hex.accent}35`, background: `${hex.accent}08` }}>
      <div className="flex items-center justify-between">
        <h4 className="font-black text-sm" style={{ color: hex.accent }}>⚔️ Issue a Challenge</h4>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">✕ Cancel</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Challenger</label>
          <select
            value={corp1Id}
            onChange={e => setCorp1Id(e.target.value)}
            className="w-full text-xs bg-background/60 border border-border rounded-md px-2 py-1.5 text-foreground"
          >
            <option value="">Pick corp…</option>
            {corps.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Opponent</label>
          <select
            value={corp2Id}
            onChange={e => setCorp2Id(e.target.value)}
            className="w-full text-xs bg-background/60 border border-border rounded-md px-2 py-1.5 text-foreground"
          >
            <option value="">Pick corp…</option>
            {corps.filter(c => String(c.id) !== corp1Id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Date & Time</label>
          <Input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="bg-background/60 text-xs h-8" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Location (optional)</label>
          <Input placeholder="e.g. SGVP Ground" value={location} onChange={e => setLocation(e.target.value)} className="bg-background/60 text-xs h-8" />
        </div>
      </div>
      <Button
        size="sm" className="w-full font-bold gap-2"
        style={{ background: hex.accent, color: hex.dim }}
        disabled={!canSubmit || createBattle.isPending}
        onClick={() => createBattle.mutate({ data: {
          corp1Id: Number(corp1Id), corp2Id: Number(corp2Id),
          sport, scheduledAt: new Date(date).toISOString(), location: location || undefined,
        }})}
      >
        <Swords className="w-3.5 h-3.5" />
        {createBattle.isPending ? "Scheduling…" : "Issue Battle"}
      </Button>
    </div>
  );
}

// ── Create Corp Form ──────────────────────────────────────────────────────────
function CreateCorpForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const { uid, profile } = useSessionProfile();
  const [name, setName] = useState("");
  const [sport, setSport] = useState("");
  const [tagline, setTagline] = useState("");
  const [area, setArea] = useState("");
  const [isExclusive, setIsExclusive] = useState(true);
  const leaderName = profile?.name ?? "";

  const SPORTS = ["Football","Badminton","Cricket","Basketball","Tennis","Volleyball","Running","Cycling","Gym","Swimming","Pickleball","Throwball","Other"];

  const createCorp = useCreateClub({
    mutation: {
      onSuccess: () => {
        toast({ title: "⚔️ Corp founded!", description: `${name} is now on the map.` });
        qc.invalidateQueries({ queryKey: ["clubs"] });
        onClose();
      },
      onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
    },
  });

  const canSubmit = name.trim() && !!profile && sport;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative px-6 pt-8 pb-6 text-center border-b border-border"
          style={{ background: "radial-gradient(ellipse at 50% 0%, #00B4E015, transparent 70%)" }}
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="text-5xl mb-3">⚔️</div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
            Start your own<br />
            <span style={{
              background: "linear-gradient(90deg, #00B4E0, #38bdf8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>corp</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-2">Build your squad. Dominate the city.</p>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Corp Name *</label>
              <Input placeholder="e.g. Dark Knights FC" value={name} onChange={e => setName(e.target.value)} className="bg-background/60" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Leader</label>
              {profile ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background/60 text-sm">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary">
                    {leaderName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold text-foreground">{leaderName}</span>
                  <span className="text-xs text-muted-foreground ml-auto">your profile</span>
                </div>
              ) : (
                <Button
                  type="button" variant="outline" size="sm" className="w-full"
                  onClick={() => { onClose(); setLocation("/onboarding"); }}
                >
                  Sign in to found a corp
                </Button>
              )}
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Sport *</label>
              <div className="flex flex-wrap gap-2">
                {SPORTS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSport(s.toLowerCase())}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${sport === s.toLowerCase() ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Tagline (optional)</label>
              <Input placeholder="e.g. No mercy on the pitch" value={tagline} onChange={e => setTagline(e.target.value)} className="bg-background/60" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Area (optional)</label>
              <Input placeholder="e.g. Navrangpura" value={area} onChange={e => setArea(e.target.value)} className="bg-background/60" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Membership</label>
              <div className="flex rounded-lg overflow-hidden border border-border">
                <button
                  type="button"
                  onClick={() => setIsExclusive(true)}
                  className={`flex-1 py-2 text-xs font-bold transition-colors ${isExclusive ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}
                >
                  By invite
                </button>
                <button
                  type="button"
                  onClick={() => setIsExclusive(false)}
                  className={`flex-1 py-2 text-xs font-bold transition-colors ${!isExclusive ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}
                >
                  Open
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <Button
            className="w-full font-black text-base py-6 gap-2 text-primary-foreground"
            style={{ background: "linear-gradient(135deg, #00B4E0, #0891b2)", boxShadow: "0 0 24px #00B4E030" }}
            disabled={!canSubmit || createCorp.isPending}
            onClick={() => createCorp.mutate({ data: { name, leaderName, leaderProfileId: uid, sport, tagline: tagline || undefined, area: area || undefined, isExclusive } })}
          >
            <Swords className="w-5 h-5" />
            {createCorp.isPending ? "Founding…" : "Found the Corp"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Sport Grid (landing) ──────────────────────────────────────────────────────
function SportGrid({ sports, onSelect }: { sports: string[]; onSelect: (s: string) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {sports.map(sport => {
        const hex = sportHex(sport);
        return (
          <button
            key={sport}
            onClick={() => onSelect(sport)}
            className="group aspect-square rounded-2xl p-5 flex flex-col items-center justify-center gap-3 border cursor-pointer"
            style={{
              background: `linear-gradient(160deg, ${hex.accent}28 0%, ${hex.accent}10 40%, #080c10 100%)`,
              borderColor: `${hex.accent}30`,
              boxShadow: `0 0 24px ${hex.glow}15`,
              borderBottom: `3px solid ${hex.accent}60`,
              transition: "all 0.2s",
            }}
          >
            {/* Sport icon */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl shadow-lg transition-transform group-hover:scale-110"
              style={{
                background: `${hex.accent}20`,
                border: `2px solid ${hex.accent}40`,
                boxShadow: `0 4px 20px ${hex.glow}30`,
              }}
            >
              {sportEmoji(sport)}
            </div>
            {/* Sport name */}
            <div className="text-center">
              <div className="text-sm font-black capitalize tracking-tight" style={{ color: hex.accent }}>
                {sport}
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">Tap to explore</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Corps list for a sport ────────────────────────────────────────────────────
function CorpsList({ sport, onBack }: { sport: string; onBack: () => void }) {
  const { toast } = useToast();
  const [showBattleForm, setShowBattleForm] = useState(false);

  const { data: allCorps = [], isLoading: corpsLoading } = useListClubs(sport);
  const { data: battles = [], isLoading: battlesLoading } = useListCorpBattles(sport);

  const hex = sportHex(sport);

  return (
    <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Sport header */}
      <div className="sticky top-14 z-40 border-b border-border backdrop-blur bg-card/80">
        {/* Colored accent bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${hex.glow}, ${hex.accent}, ${hex.glow})` }} />
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> All Corps
          </button>
          <div className="w-px h-4 bg-border" />
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
            style={{
              background: `${hex.accent}20`,
              border: `1px solid ${hex.accent}40`,
              boxShadow: `0 0 14px ${hex.glow}40`,
            }}
          >
            {sportEmoji(sport)}
          </div>
          <h2 className="font-black text-xl capitalize" style={{ color: hex.accent }}>{sport} Corps</h2>
          <Badge variant="outline" className="ml-auto text-muted-foreground">{allCorps.length} corps</Badge>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 space-y-8">
        {/* Corps grid */}
        {corpsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3].map(i => <div key={i} className="h-64 bg-card animate-pulse rounded-2xl border border-border" />)}
          </div>
        ) : allCorps.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">{sportEmoji(sport)}</div>
            <p className="text-lg font-bold text-foreground mb-1">No {sport} corps yet</p>
            <p className="text-sm text-muted-foreground">Be the first to form one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {allCorps.map(c => <CorpCard key={c.id} corp={c} />)}
          </div>
        )}

        {/* Corp Battles section */}
        {allCorps.length >= 2 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Swords className="w-5 h-5" style={{ color: hex.accent }} />
              <h3 className="text-lg font-black" style={{ color: hex.accent }}>Corp Battles</h3>
              <div className="flex-1 h-px bg-border" />
              <Button
                size="sm"
                variant="outline"
                className="gap-2 text-xs font-bold"
                style={{ borderColor: `${hex.accent}50`, color: hex.accent }}
                onClick={() => setShowBattleForm(v => !v)}
              >
                <Swords className="w-3.5 h-3.5" />
                {showBattleForm ? "Cancel" : "Issue a Challenge"}
              </Button>
            </div>

            {showBattleForm && (
              <div className="mb-4">
                <IssueBattleForm sport={sport} corps={allCorps} onClose={() => setShowBattleForm(false)} />
              </div>
            )}

            {battlesLoading ? (
              <div className="h-24 bg-card animate-pulse rounded-xl border border-border" />
            ) : battles.length === 0 ? (
              <div
                className="rounded-xl border border-dashed p-6 text-center"
                style={{ borderColor: `${hex.accent}30` }}
              >
                <Swords className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: hex.accent }} />
                <p className="text-sm text-muted-foreground">No battles yet. Issue the first challenge.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {battles.map(b => (
                  <BattleCard key={b.id} battle={b} corps={allCorps} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dope Level Legend */}
        <div className="rounded-xl border border-border bg-card/40 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">The Dope Level Scale</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[1,3,5,7,10].map(lvl => {
              const dl = dopeLevel(lvl);
              return (
                <div key={lvl} className="text-center rounded-lg p-2 bg-background/40">
                  <div className="text-xl mb-0.5">{dl.emoji}</div>
                  <div className="text-[9px] font-black uppercase" style={{ color: dl.color }}>Lv.{lvl}</div>
                  <div className="text-[9px] text-muted-foreground leading-tight mt-0.5">{dl.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Corps Page ───────────────────────────────────────────────────────────
export default function CorpsPage() {
  const params = useParams<{ sport?: string }>();
  const [, setLocation] = useLocation();
  const [activeSport, setActiveSport] = useState<string | null>(params.sport ?? null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [clashDone, setClashDone] = useState(false);

  const { data: allCorps = [], isLoading } = useListClubs();

  const sportsWithCorps = [...new Set(allCorps.map(c => c.sport))].sort();

  const handleSelectSport = (sport: string) => {
    setActiveSport(sport);
    setLocation(`/corps/${sport}`, { replace: true });
  };

  const handleBack = () => {
    setActiveSport(null);
    setLocation("/corps", { replace: true });
  };

  if (activeSport) {
    return <CorpsList sport={activeSport} onBack={handleBack} />;
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {!clashDone && <ClashIntro onDone={() => setClashDone(true)} />}
      <div
        className="flex-1 flex flex-col"
        style={{ opacity: clashDone ? 1 : 0, transition: clashDone ? "opacity 0.35s ease-in" : "none" }}
      >
      {showCreateForm && <CreateCorpForm onClose={() => setShowCreateForm(false)} />}

      {/* Hero */}
      <div
        className="border-b border-border pt-12 pb-10 px-4 md:px-8"
        style={{
          position: "relative",
          overflow: "hidden",
          background: "radial-gradient(ellipse 120% 100% at 50% 0%, #6366f108 0%, #00B4E00a 40%, transparent 70%)",
        }}
      >
        {/* Cyan bolt watermark — top-left */}
        <Bolt style={{
          position: "absolute",
          top: 0, left: "-40px",
          width: 240, height: 480,
          color: "#00B4E0",
          opacity: 0.07,
          transform: "rotate(-15deg)",
          pointerEvents: "none",
        }} />
        {/* Orange bolt watermark — top-right */}
        <Bolt style={{
          position: "absolute",
          top: 0, right: "-20px",
          width: 180, height: 360,
          color: "#6366f1",
          opacity: 0.06,
          transform: "rotate(16deg) scaleX(-1)",
          pointerEvents: "none",
        }} />

        <div className="max-w-5xl mx-auto flex items-start justify-between gap-6 flex-wrap relative">
          <div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-none mb-3">
              <span className="text-foreground block">The</span>
              <span style={{
                background: "linear-gradient(135deg, #00B4E0 0%, #818cf8 60%, #6366f1 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>Corps.</span>
            </h1>
            <p className="text-muted-foreground text-base mb-4">
              Elite sports crews of Ahmedabad. Pick your sport. Find your people.
            </p>
            {/* Stats strip */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="rounded-full px-3 py-1 text-xs font-bold border"
                style={{ borderColor: "#00B4E040", color: "#00B4E0", background: "#00B4E010", boxShadow: "0 0 10px #00B4E020" }}
              >
                {allCorps.length} Corps
              </span>
              <span
                className="rounded-full px-3 py-1 text-xs font-bold border"
                style={{ borderColor: "#6366f140", color: "#818cf8", background: "#6366f110", boxShadow: "0 0 10px #6366f120" }}
              >
                {sportsWithCorps.length} Sports
              </span>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="gap-2 font-black text-base text-white shrink-0"
            style={{
              background: "linear-gradient(135deg, #00B4E0, #6366f1)",
              boxShadow: "0 0 30px #00B4E040",
              padding: "24px 32px",
            }}
          >
            <Plus className="w-5 h-5" /> Start a Corp
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="h-32 bg-card animate-pulse rounded-2xl border border-border" />
            ))}
          </div>
        ) : sportsWithCorps.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <Swords className="w-16 h-16 mx-auto mb-5" style={{ opacity: 0.4 }} />
            <p className="text-2xl font-black text-foreground mb-2">No corps formed yet.</p>
            <p className="text-sm mb-8">The arena is empty. Change that.</p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="gap-2 font-black text-base text-white"
              style={{
                background: "linear-gradient(135deg, #00B4E0, #6366f1)",
                boxShadow: "0 0 30px #00B4E040",
                padding: "20px 36px",
              }}
            >
              <Swords className="w-5 h-5" /> Found the First Corp
            </Button>
          </div>
        ) : (
          <SportGrid sports={sportsWithCorps} onSelect={handleSelectSport} />
        )}
      </div>
      </div>
    </div>
  );
}
