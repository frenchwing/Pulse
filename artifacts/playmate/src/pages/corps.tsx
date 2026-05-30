import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useListClubs, useSubmitClubInquiry, useListCorpBattles, useCreateCorpBattle } from "@/hooks/use-firestore";
type Club2 = any;
type CorpBattle = any;
import { useQueryClient } from "@tanstack/react-query";
import {
  Lock, Users, MapPin, ChevronDown, ChevronUp, Send,
  Swords, Trophy, ArrowLeft, Plus, Calendar, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  sportEmoji, sportHex, sportColor, dopeLevel, reliabilityBadge, memberLoyaltyColor, SPORT_LABELS, LOYALTY_TIERS,
} from "@/lib/sport-meta";

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
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const hex = sportHex(corp.sport);
  const rb = reliabilityBadge(corp.reliabilityScore);
  const members = corp.memberNames as string[];

  const inquire = useSubmitClubInquiry({
    mutation: {
      onSuccess: () => {
        toast({ title: "Request sent!", description: `${corp.name} will review your application.` });
        setOpen(false); setName(""); setPhone(""); setMessage("");
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
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${hex.glow}, ${hex.accent})` }} />

      <div className="p-5 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 font-black shadow-lg"
            style={{ background: `${hex.accent}22`, border: `1.5px solid ${hex.accent}44` }}
          >
            {sportEmoji(corp.sport)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-black text-foreground tracking-tight leading-tight">{corp.name}</h3>
            {corp.tagline && (
              <p className="text-xs text-muted-foreground italic mt-0.5 truncate">&ldquo;{corp.tagline}&rdquo;</p>
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
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {/* Reliability */}
          <div className={`rounded-lg px-2 py-1.5 border text-center ${rb.color} ${rb.border}`}>
            <div className="text-base">{rb.emoji}</div>
            <div className="text-[9px] font-black uppercase tracking-wide leading-tight">{rb.label}</div>
          </div>

          {/* Dope level */}
          <div className="rounded-lg px-2 py-1.5 border border-border/60 bg-background/30 text-center">
            <div className="text-base">{dopeLevel(corp.avgDopeLevel).emoji}</div>
            <div className="text-[9px] font-black uppercase tracking-wide leading-tight" style={{ color: dopeLevel(corp.avgDopeLevel).color }}>
              Lv.{corp.avgDopeLevel}
            </div>
          </div>

          {/* Record */}
          <div className="rounded-lg px-2 py-1.5 border border-border/60 bg-background/30 text-center">
            <div className="text-sm font-black" style={{ color: hex.accent }}>
              {corp.wins}W-{corp.losses}L
            </div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide leading-tight">Record</div>
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
          variant="outline"
          size="sm"
          className="w-full gap-2 font-medium transition-all"
          style={open ? {} : { borderColor: `${hex.accent}40`, color: hex.accent }}
          onClick={() => setOpen(v => !v)}
        >
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {open ? "Close" : "Request to Join"}
        </Button>

        {open && (
          <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
            <p className="text-xs text-muted-foreground">Your request goes to the corp leader for review.</p>
            <Input placeholder="Your name *" value={name} onChange={e => setName(e.target.value)} className="bg-background/60 text-sm h-8" />
            <Input placeholder="Phone (optional)" value={phone} onChange={e => setPhone(e.target.value)} className="bg-background/60 text-sm h-8" />
            <Textarea
              placeholder="Why do you want to join? (optional)"
              value={message} onChange={e => setMessage(e.target.value)}
              className="bg-background/60 text-sm resize-none" rows={2}
            />
            <Button
              size="sm" className="w-full font-bold gap-2 text-primary-foreground"
              style={{ background: hex.accent, color: hex.dim }}
              disabled={!name.trim() || inquire.isPending}
              onClick={() => inquire.mutate({ id: corp.id, data: { applicantName: name, applicantPhone: phone || undefined, message: message || undefined } })}
            >
              <Send className="w-3 h-3" />
              {inquire.isPending ? "Sending…" : "Send Request"}
            </Button>
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
            className="group rounded-2xl p-5 flex flex-col items-center gap-3 border transition-all hover:scale-105 active:scale-95 cursor-pointer"
            style={{
              background: `linear-gradient(145deg, ${hex.accent}18 0%, ${hex.dim} 70%)`,
              borderColor: `${hex.accent}30`,
            }}
          >
            {/* Sport icon */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-lg transition-transform group-hover:scale-110"
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

  const { data: allCorps = [], isLoading: corpsLoading } = useListClubs({ sport });
  const { data: battles = [], isLoading: battlesLoading } = useListCorpBattles({ sport });

  const hex = sportHex(sport);

  return (
    <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Sport header */}
      <div className="sticky top-14 z-40 border-b border-border backdrop-blur bg-card/80">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> All Corps
          </button>
          <div className="w-px h-4 bg-border" />
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-lg"
            style={{ background: `${hex.accent}20`, border: `1px solid ${hex.accent}40` }}
          >
            {sportEmoji(sport)}
          </div>
          <h2 className="font-black text-lg capitalize" style={{ color: hex.accent }}>{sport} Corps</h2>
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
    <div className="flex-1 bg-background animate-in fade-in duration-400">
      {/* Hero */}
      <div className="bg-card border-b border-border pt-8 pb-7 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end gap-3 mb-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-primary">The Corps</h1>
            <span className="text-4xl mb-0.5">⚔️</span>
          </div>
          <p className="text-muted-foreground text-base">
            Elite sports crews of Ahmedabad. Pick your sport. Find your people.
          </p>
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
          <div className="text-center py-20 text-muted-foreground">
            <div className="text-5xl mb-4">⚔️</div>
            <p className="text-lg font-bold text-foreground mb-2">No corps formed yet</p>
            <p className="text-sm">Be the first to establish one.</p>
          </div>
        ) : (
          <SportGrid sports={sportsWithCorps} onSelect={handleSelectSport} />
        )}
      </div>
    </div>
  );
}
