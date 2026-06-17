import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import {
  GraduationCap, ArrowLeft, Trophy, Swords, Users, Shield,
  BookOpen, ChevronDown, ChevronUp, Send, Star, Medal,
  Calendar, MapPin, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { sportEmoji, sportHex, dopeLevel, SPORT_LABELS } from "@/lib/sport-meta";
import { Bolt } from "@/components/bolt";
import { GiSoccerBall, GiShuttlecock, GiBasketballBall, GiTennisBall, GiCricketBat, GiVolleyballBall, GiCycling, GiPoolDive, GiWeightLiftingUp, GiRunningNinja } from "react-icons/gi";
import type { IconType } from "react-icons";

// ── Static university data ─────────────────────────────────────────────────────

interface UniRecord { w: number; l: number; d: number }
interface UniAthlete { name: string; sport: string; level: number; rollId: string }

interface University {
  id: number;
  name: string;
  short: string;
  emoji: string;
  location: string;
  color: string;
  athletes: UniAthlete[];
  records: Record<string, UniRecord>;
}

const UNIVERSITIES: University[] = [
  {
    id: 1, name: "IIT Gandhinagar", short: "IITGN", emoji: "⚙️",
    location: "Gandhinagar", color: "#3b82f6",
    athletes: [
      { name: "Arjun Mehta",    sport: "cricket",    level: 8, rollId: "22B021" },
      { name: "Priya Shah",     sport: "badminton",  level: 7, rollId: "23B045" },
      { name: "Rohan Patel",    sport: "football",   level: 9, rollId: "21B011" },
      { name: "Sneha Iyer",     sport: "swimming",   level: 6, rollId: "24B033" },
    ],
    records: {
      cricket:    { w: 8, l: 2, d: 1 },
      football:   { w: 6, l: 3, d: 2 },
      badminton:  { w: 7, l: 4, d: 0 },
      basketball: { w: 5, l: 5, d: 1 },
      swimming:   { w: 9, l: 1, d: 0 },
    },
  },
  {
    id: 2, name: "IIM Ahmedabad", short: "IIMA", emoji: "📊",
    location: "Ahmedabad", color: "#ef4444",
    athletes: [
      { name: "Kavya Rao",      sport: "tennis",     level: 7, rollId: "PGP2401" },
      { name: "Dev Sharma",     sport: "cricket",    level: 6, rollId: "PGP2318" },
      { name: "Ananya Joshi",   sport: "basketball", level: 8, rollId: "PGP2455" },
    ],
    records: {
      tennis:     { w: 9, l: 2, d: 0 },
      cricket:    { w: 5, l: 5, d: 1 },
      basketball: { w: 7, l: 3, d: 1 },
      football:   { w: 4, l: 6, d: 2 },
    },
  },
  {
    id: 3, name: "Nirma University", short: "NIRMA", emoji: "🔩",
    location: "Ahmedabad", color: "#8b5cf6",
    athletes: [
      { name: "Harsh Desai",    sport: "football",   level: 9, rollId: "21CE031" },
      { name: "Riya Kapoor",    sport: "volleyball", level: 7, rollId: "22BCA14" },
      { name: "Yash Trivedi",   sport: "cricket",    level: 8, rollId: "21ME022" },
      { name: "Miti Chauhan",   sport: "badminton",  level: 6, rollId: "23MBA08" },
      { name: "Kunal Bhat",     sport: "running",    level: 7, rollId: "22EE041" },
    ],
    records: {
      football:   { w: 9, l: 2, d: 1 },
      cricket:    { w: 7, l: 4, d: 0 },
      volleyball: { w: 8, l: 2, d: 1 },
      badminton:  { w: 5, l: 6, d: 0 },
      running:    { w: 10, l: 1, d: 0 },
    },
  },
  {
    id: 4, name: "PDEU", short: "PDEU", emoji: "⚡",
    location: "Gandhinagar", color: "#f59e0b",
    athletes: [
      { name: "Aditya Nair",    sport: "basketball", level: 8, rollId: "21BCA07" },
      { name: "Pooja Menon",    sport: "swimming",   level: 9, rollId: "22BCE11" },
      { name: "Vivek Gupta",    sport: "cycling",    level: 7, rollId: "21ME38" },
    ],
    records: {
      basketball: { w: 8, l: 3, d: 0 },
      swimming:   { w: 7, l: 3, d: 1 },
      cycling:    { w: 6, l: 4, d: 1 },
      cricket:    { w: 4, l: 6, d: 2 },
    },
  },
  {
    id: 5, name: "CEPT University", short: "CEPT", emoji: "🏛️",
    location: "Ahmedabad", color: "#10b981",
    athletes: [
      { name: "Tara Singh",     sport: "volleyball", level: 8, rollId: "F2022034" },
      { name: "Mihir Soni",     sport: "tennis",     level: 7, rollId: "U2021019" },
      { name: "Falguni Pandya", sport: "running",    level: 9, rollId: "P2023007" },
    ],
    records: {
      volleyball: { w: 6, l: 4, d: 1 },
      tennis:     { w: 7, l: 4, d: 0 },
      running:    { w: 8, l: 2, d: 1 },
      football:   { w: 3, l: 7, d: 1 },
    },
  },
  {
    id: 6, name: "Ahmedabad University", short: "AU", emoji: "🌐",
    location: "Ahmedabad", color: "#06b6d4",
    athletes: [
      { name: "Neel Shah",      sport: "cricket",    level: 7, rollId: "AU21CS014" },
      { name: "Disha Patel",    sport: "badminton",  level: 8, rollId: "AU22BBA022" },
      { name: "Raj Vyas",       sport: "gym",        level: 9, rollId: "AU21EC009" },
    ],
    records: {
      cricket:    { w: 6, l: 5, d: 0 },
      badminton:  { w: 9, l: 2, d: 0 },
      gym:        { w: 7, l: 3, d: 1 },
      tennis:     { w: 5, l: 5, d: 1 },
    },
  },
  {
    id: 7, name: "Gujarat University", short: "GU", emoji: "🏫",
    location: "Ahmedabad", color: "#f97316",
    athletes: [
      { name: "Bharat Modi",    sport: "cricket",    level: 8, rollId: "GU2021BS101" },
      { name: "Leena Mehta",    sport: "volleyball", level: 6, rollId: "GU2022CS044" },
      { name: "Suresh Solanki", sport: "kabaddi",    level: 9, rollId: "GU2020PE007" },
    ],
    records: {
      cricket:    { w: 7, l: 4, d: 1 },
      volleyball: { w: 5, l: 5, d: 2 },
      football:   { w: 6, l: 4, d: 1 },
      kabaddi:    { w: 11, l: 0, d: 1 },
    },
  },
  {
    id: 8, name: "GLS University", short: "GLS", emoji: "📚",
    location: "Ahmedabad", color: "#ec4899",
    athletes: [
      { name: "Roshni Jain",    sport: "throwball",  level: 8, rollId: "GLS22BCA31" },
      { name: "Akash Verma",    sport: "basketball", level: 7, rollId: "GLS21CS18" },
      { name: "Puja Rawal",     sport: "running",    level: 7, rollId: "GLS23BCom09" },
    ],
    records: {
      throwball:  { w: 9, l: 1, d: 1 },
      basketball: { w: 5, l: 6, d: 0 },
      running:    { w: 6, l: 4, d: 1 },
      badminton:  { w: 4, l: 7, d: 0 },
    },
  },
];

interface VarsityClash {
  id: number; sport: string;
  uni1Id: number; uni2Id: number;
  uni1Score: number | null; uni2Score: number | null;
  result: "uni1" | "uni2" | "draw" | "pending";
  date: string; venue: string;
}

const VARSITY_CLASHES: VarsityClash[] = [
  { id: 1,  sport: "cricket",    uni1Id: 1, uni2Id: 3, uni1Score: 186,  uni2Score: 171,  result: "uni1",    date: "2026-05-10", venue: "IITGN Ground"      },
  { id: 2,  sport: "football",   uni1Id: 3, uni2Id: 2, uni1Score: 3,    uni2Score: 1,    result: "uni1",    date: "2026-05-12", venue: "Nirma Arena"       },
  { id: 3,  sport: "basketball", uni1Id: 2, uni2Id: 4, uni1Score: 72,   uni2Score: 68,   result: "uni1",    date: "2026-05-14", venue: "IIMA Court"        },
  { id: 4,  sport: "badminton",  uni1Id: 6, uni2Id: 1, uni1Score: 3,    uni2Score: 2,    result: "uni1",    date: "2026-05-15", venue: "AU Badminton Hall" },
  { id: 5,  sport: "swimming",   uni1Id: 4, uni2Id: 1, uni1Score: 5,    uni2Score: 3,    result: "uni1",    date: "2026-05-17", venue: "PDEU Aqua Center"  },
  { id: 6,  sport: "running",    uni1Id: 3, uni2Id: 5, uni1Score: null, uni2Score: null, result: "pending", date: "2026-06-02", venue: "Nirma Track"       },
  { id: 7,  sport: "volleyball", uni1Id: 5, uni2Id: 7, uni1Score: 3,    uni2Score: 1,    result: "uni1",    date: "2026-05-20", venue: "CEPT Court"        },
  { id: 8,  sport: "tennis",     uni1Id: 2, uni2Id: 6, uni1Score: 6,    uni2Score: 4,    result: "uni1",    date: "2026-05-22", venue: "IIMA Tennis Club"  },
  { id: 9,  sport: "cricket",    uni1Id: 7, uni2Id: 6, uni1Score: null, uni2Score: null, result: "pending", date: "2026-06-05", venue: "GU Ground"         },
  { id: 10, sport: "football",   uni1Id: 1, uni2Id: 5, uni1Score: 2,    uni2Score: 2,    result: "draw",    date: "2026-05-25", venue: "IITGN Ground"      },
];

const SPORT_ICONS: Record<string, IconType> = {
  cricket:    GiCricketBat,
  football:   GiSoccerBall,
  badminton:  GiShuttlecock,
  basketball: GiBasketballBall,
  tennis:     GiTennisBall,
  volleyball: GiVolleyballBall,
  cycling:    GiCycling,
  swimming:   GiPoolDive,
  gym:        GiWeightLiftingUp,
  running:    GiRunningNinja,
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function uniById(id: number) {
  return UNIVERSITIES.find(u => u.id === id)!;
}

function recordPoints(r: UniRecord) {
  return r.w * 3 + r.d;
}

function winRate(r: UniRecord) {
  const total = r.w + r.l + r.d;
  return total ? Math.round((r.w / total) * 100) : 0;
}

// ── Standing table ─────────────────────────────────────────────────────────────

function StandingsTable({ sport }: { sport: string }) {
  const hex = sportHex(sport);

  const rows = UNIVERSITIES
    .filter(u => u.records[sport])
    .map(u => ({ uni: u, rec: u.records[sport] }))
    .sort((a, b) => recordPoints(b.rec) - recordPoints(a.rec));

  if (rows.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <div className="text-4xl mb-2">{sportEmoji(sport)}</div>
        <p className="text-sm">No university standings yet for <span className="capitalize font-bold text-foreground">{sport}</span>.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b border-border"
        style={{ background: `${hex.accent}10` }}
      >
        <Trophy className="w-4 h-4" style={{ color: hex.accent }} />
        <span className="text-xs font-black uppercase tracking-widest" style={{ color: hex.accent }}>
          {sport} Standings
        </span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
            <th className="text-left px-4 py-2">#</th>
            <th className="text-left px-4 py-2">University</th>
            <th className="text-center px-3 py-2">W</th>
            <th className="text-center px-3 py-2">D</th>
            <th className="text-center px-3 py-2">L</th>
            <th className="text-center px-3 py-2">Pts</th>
            <th className="text-center px-3 py-2">Win%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ uni, rec }, i) => (
            <tr
              key={uni.id}
              className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors"
            >
              <td className="px-4 py-2.5">
                <span className={`text-xs font-black ${i === 0 ? "" : i === 1 ? "" : i === 2 ? "" : "text-muted-foreground"}`}
                  style={i < 3 ? { color: ["#f59e0b", "#94a3b8", "#b45309"][i] } : {}}
                >
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                </span>
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-sm shrink-0"
                    style={{ background: `${uni.color}20`, border: `1px solid ${uni.color}40` }}
                  >
                    {uni.emoji}
                  </div>
                  <div>
                    <div className="font-bold text-foreground text-xs">{uni.short}</div>
                    <div className="text-[9px] text-muted-foreground">{uni.name}</div>
                  </div>
                </div>
              </td>
              <td className="px-3 py-2.5 text-center font-bold text-green-400">{rec.w}</td>
              <td className="px-3 py-2.5 text-center text-muted-foreground">{rec.d}</td>
              <td className="px-3 py-2.5 text-center text-red-400">{rec.l}</td>
              <td className="px-3 py-2.5 text-center font-black" style={{ color: hex.accent }}>
                {recordPoints(rec)}
              </td>
              <td className="px-3 py-2.5 text-center">
                <span className="text-xs font-bold text-muted-foreground">{winRate(rec)}%</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Varsity clash card ─────────────────────────────────────────────────────────

function ClashCard({ clash }: { clash: VarsityClash }) {
  const hex = sportHex(clash.sport);
  const uni1 = uniById(clash.uni1Id);
  const uni2 = uniById(clash.uni2Id);
  const isPending = clash.result === "pending";
  const isDraw = clash.result === "draw";
  const winner = clash.result === "uni1" ? uni1 : clash.result === "uni2" ? uni2 : null;

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: `${hex.accent}08`, borderColor: `${hex.accent}25` }}
    >
      <div
        className="flex items-center justify-between px-3 py-1.5 border-b text-xs font-bold uppercase tracking-widest"
        style={{ borderColor: `${hex.accent}20`, background: `${hex.accent}12`, color: hex.accent }}
      >
        <span>{sportEmoji(clash.sport)} Varsity Clash</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isPending ? "bg-yellow-500/20 text-yellow-300" : isDraw ? "bg-slate-500/20 text-slate-300" : "bg-green-500/20 text-green-300"}`}>
          {isPending ? "Upcoming" : isDraw ? "Draw" : `${winner?.short} Won`}
        </span>
      </div>
      <div className="p-3 flex items-center gap-3">
        <div className="flex-1 text-center">
          <div
            className="w-10 h-10 mx-auto mb-1 rounded-xl flex items-center justify-center text-xl"
            style={{ background: `${uni1.color}20`, border: `1.5px solid ${uni1.color}40` }}
          >{uni1.emoji}</div>
          <div className="text-xs font-black" style={{ color: uni1.color }}>{uni1.short}</div>
          {!isPending && <div className="text-xl font-black text-foreground mt-0.5">{clash.uni1Score ?? "–"}</div>}
        </div>
        <div className="shrink-0 text-center">
          <div className="text-sm font-black text-muted-foreground">VS</div>
          <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {new Date(clash.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </div>
          <div className="text-[9px] text-muted-foreground mt-0.5 max-w-20 truncate">{clash.venue}</div>
        </div>
        <div className="flex-1 text-center">
          <div
            className="w-10 h-10 mx-auto mb-1 rounded-xl flex items-center justify-center text-xl"
            style={{ background: `${uni2.color}20`, border: `1.5px solid ${uni2.color}40` }}
          >{uni2.emoji}</div>
          <div className="text-xs font-black" style={{ color: uni2.color }}>{uni2.short}</div>
          {!isPending && <div className="text-xl font-black text-foreground mt-0.5">{clash.uni2Score ?? "–"}</div>}
        </div>
      </div>
    </div>
  );
}

// ── Registration form ──────────────────────────────────────────────────────────

function RegisterForm({ sport, onClose }: { sport: string; onClose: () => void }) {
  const { toast } = useToast();
  const [uniId, setUniId] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedSport, setSelectedSport] = useState(sport || "");
  const [skillLevel, setSkillLevel] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const hex = sportHex(sport || selectedSport || "other");
  const canSubmit = uniId && rollNo && fullName && selectedSport && skillLevel;

  function handleSubmit() {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast({
        title: "🎓 Registration submitted!",
        description: `You're registered as a ${selectedSport} athlete for ${uniById(Number(uniId))?.short ?? "your university"}. Pending verification.`,
      });
      onClose();
    }, 900);
  }

  return (
    <div className="rounded-2xl border p-5 space-y-3 animate-in slide-in-from-top-3 duration-200"
      style={{ borderColor: `${hex.accent}30`, background: `${hex.accent}08` }}
    >
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-black text-sm flex items-center gap-2" style={{ color: hex.accent }}>
          <GraduationCap className="w-4 h-4" /> Register as a Varsity Athlete
        </h4>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
      </div>
      <p className="text-xs text-muted-foreground">Your university ID will be verified before your profile goes live on the standings.</p>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">University *</label>
          <select
            value={uniId}
            onChange={e => setUniId(e.target.value)}
            className="w-full text-xs bg-background/60 border border-border rounded-md px-2 py-1.5 text-foreground"
          >
            <option value="">Select university…</option>
            {UNIVERSITIES.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">University ID / Roll No. *</label>
          <Input
            placeholder="e.g. 22B021"
            value={rollNo}
            onChange={e => setRollNo(e.target.value)}
            className="bg-background/60 text-xs h-8"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Full Name *</label>
        <Input
          placeholder="Your full name"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          className="bg-background/60 text-xs h-8"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Sport *</label>
          <select
            value={selectedSport}
            onChange={e => setSelectedSport(e.target.value)}
            className="w-full text-xs bg-background/60 border border-border rounded-md px-2 py-1.5 text-foreground"
          >
            <option value="">Pick sport…</option>
            {SPORT_LABELS.map(s => (
              <option key={s.value} value={s.value}>{sportEmoji(s.value)} {s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Skill Level *</label>
          <select
            value={skillLevel}
            onChange={e => setSkillLevel(e.target.value)}
            className="w-full text-xs bg-background/60 border border-border rounded-md px-2 py-1.5 text-foreground"
          >
            <option value="">Select level…</option>
            {["beginner", "intermediate", "advanced", "elite"].map(l => (
              <option key={l} value={l} className="capitalize">{l.charAt(0).toUpperCase() + l.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Phone (optional)</label>
        <Input
          placeholder="+91 ..."
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="bg-background/60 text-xs h-8"
        />
      </div>

      <Button
        size="sm"
        className="w-full font-bold gap-2 text-sm"
        style={{ background: hex.accent, color: hex.dim }}
        disabled={!canSubmit || submitting}
        onClick={handleSubmit}
      >
        <Send className="w-3.5 h-3.5" />
        {submitting ? "Submitting…" : "Submit Registration"}
      </Button>
    </div>
  );
}

// ── University card ────────────────────────────────────────────────────────────

function UniCard({ uni, sport }: { uni: University; sport: string }) {
  const [open, setOpen] = useState(false);
  const hex = sportHex(sport);
  const rec = uni.records[sport];
  const athletes = uni.athletes.filter(a => a.sport === sport);

  return (
    <div
      className="rounded-2xl border overflow-hidden shadow-xl hover:shadow-2xl transition-all"
      style={{ background: `linear-gradient(145deg,${uni.color}12 0%,#0d1117 100%)`, borderColor: `${uni.color}25` }}
    >
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg,${uni.color},${uni.color}60)` }} />

      <div className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
            style={{ background: `${uni.color}20`, border: `1.5px solid ${uni.color}40` }}
          >
            {uni.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-black text-foreground tracking-tight leading-tight">{uni.name}</h3>
            <div className="flex items-center gap-1 mt-0.5 text-muted-foreground text-xs">
              <MapPin className="w-2.5 h-2.5" /> {uni.location}
            </div>
            {rec && (
              <div className="flex gap-2 mt-1.5 text-xs font-bold">
                <span className="text-green-400">{rec.w}W</span>
                <span className="text-muted-foreground">{rec.d}D</span>
                <span className="text-red-400">{rec.l}L</span>
                <span className="text-muted-foreground ml-1">· {recordPoints(rec)} pts · {winRate(rec)}% WR</span>
              </div>
            )}
          </div>
        </div>

        {/* Registered athletes */}
        {athletes.length > 0 && (
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
              {sport} Athletes ({athletes.length})
            </div>
            <div className="space-y-1.5">
              {athletes.map((a, i) => {
                const dl = dopeLevel(a.level);
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                      style={{ background: `${uni.color}30`, color: uni.color, border: `1px solid ${uni.color}40` }}
                    >
                      {a.name.charAt(0)}
                    </div>
                    <span className="text-xs font-medium text-foreground flex-1">{a.name}</span>
                    <span className="text-[9px]" style={{ color: dl.color }}>{dl.emoji} Lv.{a.level}</span>
                    <span className="text-[9px] text-muted-foreground font-mono">{a.rollId}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {athletes.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No registered {sport} athletes yet.</p>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 font-medium text-xs"
          style={open ? {} : { borderColor: `${uni.color}40`, color: uni.color }}
          onClick={() => setOpen(v => !v)}
        >
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {open ? "Close" : "Register for this university"}
        </Button>

        {open && (
          <RegisterForm sport={sport} onClose={() => setOpen(false)} />
        )}
      </div>
    </div>
  );
}

// ── Sport drill-down view ──────────────────────────────────────────────────────

type SportTab = "standings" | "clashes" | "roster";

function SportView({ sport, onBack }: { sport: string; onBack: () => void }) {
  const [tab, setTab] = useState<SportTab>("standings");
  const [showRegister, setShowRegister] = useState(false);
  const hex = sportHex(sport);

  const clashes = VARSITY_CLASHES.filter(c => c.sport === sport);
  const unis = UNIVERSITIES.filter(u => u.records[sport]);

  const tabs: { id: SportTab; label: string; icon: React.ReactNode }[] = [
    { id: "standings", label: "Standings", icon: <Trophy className="w-3.5 h-3.5" /> },
    { id: "clashes",   label: "Clashes",   icon: <Swords className="w-3.5 h-3.5" /> },
    { id: "roster",    label: "Roster",    icon: <Users className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Sport header */}
      <div className="sticky top-14 z-40 border-b border-border backdrop-blur bg-card/80">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 flex items-center gap-3 flex-wrap">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> All Sports
          </button>
          <div className="w-px h-4 bg-border" />
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-lg"
            style={{ background: `${hex.accent}20`, border: `1px solid ${hex.accent}40` }}
          >
            {sportEmoji(sport)}
          </div>
          <h2 className="font-black text-lg capitalize" style={{ color: hex.accent }}>{sport} · Varsity</h2>
          <div className="flex-1" />
          <Button
            size="sm"
            className="gap-2 text-xs font-bold"
            style={{ background: hex.accent, color: hex.dim }}
            onClick={() => setShowRegister(v => !v)}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            {showRegister ? "Close" : "Register"}
          </Button>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 md:px-8 flex gap-1 pb-2">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                tab === t.id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              style={tab === t.id ? { background: hex.accent, color: hex.dim } : {}}
            >
              {t.icon}{t.label}
              {t.id === "clashes" && clashes.length > 0 && (
                <span className="bg-secondary rounded-full px-1.5 py-0.5 text-[9px] font-black">{clashes.length}</span>
              )}
              {t.id === "roster" && unis.length > 0 && (
                <span className="bg-secondary rounded-full px-1.5 py-0.5 text-[9px] font-black">{unis.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* Inline register form */}
        {showRegister && (
          <RegisterForm sport={sport} onClose={() => setShowRegister(false)} />
        )}

        {/* Standings */}
        {tab === "standings" && <StandingsTable sport={sport} />}

        {/* Clashes */}
        {tab === "clashes" && (
          <div>
            {clashes.length === 0 ? (
              <div
                className="rounded-xl border border-dashed p-10 text-center"
                style={{ borderColor: `${hex.accent}30` }}
              >
                <Swords className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: hex.accent }} />
                <p className="text-sm text-muted-foreground">No clashes scheduled yet for <span className="capitalize font-bold text-foreground">{sport}</span>.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clashes.map(c => <ClashCard key={c.id} clash={c} />)}
              </div>
            )}
          </div>
        )}

        {/* Roster */}
        {tab === "roster" && (
          <div>
            {unis.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No universities fielding <span className="capitalize font-bold text-foreground">{sport}</span> teams yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {unis.map(u => <UniCard key={u.id} uni={u} sport={sport} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sport throw overlay ────────────────────────────────────────────────────────

function SportThrowOverlay({ sport, onDone }: { sport: string; onDone: () => void }) {
  const hex = sportHex(sport);
  const Icon = SPORT_ICONS[sport];

  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useEffect(() => {
    const t = setTimeout(() => onDoneRef.current(), 780);
    return () => clearTimeout(t);
  }, []); // empty deps — timer fires once regardless of parent re-renders

  return (
    <>
      <style>{`
        @keyframes sportBallThrow {
          0%   { transform: scale(0.03); opacity: 0; }
          15%  { opacity: 1; }
          65%  { transform: scale(4); filter: blur(0px); }
          100% { transform: scale(10); opacity: 0; filter: blur(30px); }
        }
        @keyframes sportThrowFlash {
          0%,75% { opacity: 0; }
          82%    { opacity: 0.9; }
          92%    { opacity: 0.9; }
          100%   { opacity: 0; }
        }
        @keyframes sportOverlayOut {
          0%,80% { opacity: 1; }
          100%   { opacity: 0; }
        }
      `}</style>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ background: "#060a0f", animation: "sportOverlayOut 0.78s ease-in forwards" }}
      >
        {Icon ? (
          <Icon style={{
            width: 120, height: 120,
            color: hex.accent,
            filter: `drop-shadow(0 0 40px ${hex.accent}) drop-shadow(0 0 80px ${hex.glow})`,
            animation: "sportBallThrow 0.78s ease-in forwards",
          }} />
        ) : (
          <div style={{
            fontSize: 100,
            animation: "sportBallThrow 0.78s ease-in forwards",
          }}>
            {sportEmoji(sport)}
          </div>
        )}
        {/* Flash */}
        <div
          className="absolute inset-0"
          style={{ background: "#ffffff", animation: "sportThrowFlash 0.78s ease-in forwards", pointerEvents: "none" }}
        />
      </div>
    </>
  );
}

// ── Sport grid (landing) ───────────────────────────────────────────────────────

function SportGrid({ onSelect }: { onSelect: (s: string) => void }) {
  const sportsWithData = [...new Set([
    ...UNIVERSITIES.flatMap(u => Object.keys(u.records)),
  ])].sort();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {sportsWithData.map(sport => {
        const hex = sportHex(sport);
        const uniCount = UNIVERSITIES.filter(u => u.records[sport]).length;
        const clashCount = VARSITY_CLASHES.filter(c => c.sport === sport).length;

        return (
          <button
            key={sport}
            onClick={() => onSelect(sport)}
            className="group aspect-square rounded-2xl p-5 flex flex-col items-center gap-3 border transition-all hover:scale-105 active:scale-95 cursor-pointer text-left"
            style={{
              background: `linear-gradient(160deg, ${hex.accent}28 0%, ${hex.accent}10 40%, #080c10 100%)`,
              borderColor: `${hex.accent}30`,
              boxShadow: `0 0 24px ${hex.glow}15`,
              borderBottom: `3px solid ${hex.accent}60`,
              transition: "all 0.2s",
            }}
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl transition-transform group-hover:scale-110"
              style={{
                background: `${hex.accent}20`,
                border: `2px solid ${hex.accent}40`,
                boxShadow: `0 4px 20px ${hex.glow}30`,
              }}
            >
              {sportEmoji(sport)}
            </div>
            <div className="text-center w-full">
              <div className="text-sm font-black capitalize tracking-tight" style={{ color: hex.accent }}>
                {sport}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {uniCount} unis · {clashCount} clashes
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function VarsityPage() {
  const params = useParams<{ sport?: string }>();
  const [, setLocation] = useLocation();
  const [activeSport, setActiveSport] = useState<string | null>(params.sport ?? null);
  const [showRegister, setShowRegister] = useState(false);
  const [throwingSport, setThrowingSport] = useState<string | null>(null);

  const handleSelect = (sport: string) => {
    setThrowingSport(sport);
  };

  const onThrowDone = () => {
    const sport = throwingSport!;
    setThrowingSport(null);
    setActiveSport(sport);
    setLocation(`/varsity/${sport}`, { replace: true });
  };

  const handleBack = () => {
    setActiveSport(null);
    setLocation("/varsity", { replace: true });
  };

  if (activeSport) {
    return <SportView sport={activeSport} onBack={handleBack} />;
  }

  return (
    <div className="flex-1 bg-background animate-in fade-in duration-400">
      {throwingSport && <SportThrowOverlay sport={throwingSport} onDone={onThrowDone} />}
      {/* Hero */}
      <div
        className="relative overflow-hidden pt-10 pb-8 px-4 md:px-8"
        style={{ background: "radial-gradient(ellipse 120% 100% at 50% 0%, #00B4E012 0%, #6366f108 40%, transparent 70%)" }}
      >
        {/* Left bolt watermark */}
        <Bolt style={{ position:"absolute", top:0, left:"-20px", width:240, height:480, color:"#00B4E0", opacity:0.07, transform:"rotate(-15deg)", pointerEvents:"none" }} />
        {/* Right bolt watermark */}
        <Bolt style={{ position:"absolute", top:0, right:"-20px", width:180, height:360, color:"#6366f1", opacity:0.06, transform:"rotate(16deg) scaleX(-1)", pointerEvents:"none" }} />

        <div className="max-w-5xl mx-auto flex items-start justify-between gap-6 flex-wrap relative">
          <div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-none mb-3">
              <span className="text-foreground block">The</span>
              <span style={{ color: "#ffffff", textShadow: "0 0 40px #00B4E0aa, 0 0 80px #00B4E050" }}>Varsity.</span>
            </h1>
            <p className="text-muted-foreground text-base mb-4">
              Inter-university sports of Ahmedabad. Represent your campus, battle it out.
            </p>
            {/* Stats pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full px-3 py-1 text-xs font-bold border" style={{ borderColor:"#00B4E040", color:"#00B4E0", background:"#00B4E010", boxShadow:"0 0 10px #00B4E020" }}>
                {UNIVERSITIES.length} Universities
              </span>
              <span className="rounded-full px-3 py-1 text-xs font-bold border" style={{ borderColor:"#6366f140", color:"#818cf8", background:"#6366f110", boxShadow:"0 0 10px #6366f120" }}>
                {VARSITY_CLASHES.length} Clashes
              </span>
              <span className="rounded-full px-3 py-1 text-xs font-bold border" style={{ borderColor:"#6366f140", color:"#818cf8", background:"#6366f110", boxShadow:"0 0 10px #6366f120" }}>
                {UNIVERSITIES.reduce((sum, u) => sum + u.athletes.length, 0)} Athletes
              </span>
            </div>
          </div>
          <Button
            className="gap-2 font-black text-base text-white shrink-0"
            style={{ background:"linear-gradient(135deg, #00B4E0, #6366f1)", boxShadow:"0 0 30px #00B4E040", padding:"24px 32px" }}
            onClick={() => setShowRegister(v => !v)}
          >
            <GraduationCap className="w-5 h-5" />
            {showRegister ? "Close" : "Register as Athlete"}
          </Button>
        </div>
        {showRegister && (
          <div className="mt-5 max-w-xl mx-auto relative">
            <RegisterForm sport="" onClose={() => setShowRegister(false)} />
          </div>
        )}
      </div>

      {/* Overall standings summary */}
      <div className="border-b border-border bg-card/40">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5" /> Overall University Rankings
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {UNIVERSITIES
              .map(u => ({
                uni: u,
                total: Object.values(u.records).reduce((sum, r) => sum + recordPoints(r), 0),
                wins:  Object.values(u.records).reduce((sum, r) => sum + r.w, 0),
              }))
              .sort((a, b) => b.total - a.total)
              .slice(0, 6)
              .map(({ uni, total, wins }, i) => (
                <div
                  key={uni.id}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 shrink-0 border"
                  style={{ background: `${uni.color}10`, borderColor: `${uni.color}25` }}
                >
                  <span className="text-sm font-black" style={{ color: ["#f59e0b", "#94a3b8", "#b45309", "#6b7280", "#6b7280", "#6b7280"][i] }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  <div className="text-lg">{uni.emoji}</div>
                  <div>
                    <div className="text-xs font-black" style={{ color: uni.color }}>{uni.short}</div>
                    <div className="text-[9px] text-muted-foreground">{wins}W · {total}pts</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Sport grid */}
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">
          Pick a Sport
        </div>
        <SportGrid onSelect={handleSelect} />
      </div>
    </div>
  );
}
