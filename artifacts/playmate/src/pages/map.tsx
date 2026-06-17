import { useState, useMemo, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useListActivities, useListEvents, useListProfiles } from "@/hooks/use-firestore";
type Profile = any;
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Calendar, Clock, MapPin, User, Crosshair, Map as MapIcon, Radio, Zap } from "lucide-react";
import { Link } from "wouter";
import L from "leaflet";
import { format } from "date-fns";
import { sportEmoji, sportHex, loyaltyBadge } from "@/lib/sport-meta";
import { Bolt } from "@/components/bolt";

// ── Hotspot data (Ahmedabad) ───────────────────────────────────────────────────

type HotspotIntensity = "low" | "medium" | "high";

interface Hotspot {
  id: number;
  lat: number;
  lng: number;
  sport: string;
  name: string;
  active: number;
  intensity: HotspotIntensity;
}

const HOTSPOTS: Hotspot[] = [
  { id: 1, lat: 23.0469, lng: 72.5151, sport: "cricket",    name: "SGVP Cricket Ground",     active: 12, intensity: "high"   },
  { id: 2, lat: 23.0285, lng: 72.5371, sport: "running",    name: "Vastrapur Lake Track",    active: 8,  intensity: "medium" },
  { id: 3, lat: 23.0414, lng: 72.5264, sport: "basketball", name: "Bodakdev Courts",         active: 6,  intensity: "medium" },
  { id: 4, lat: 23.0195, lng: 72.5087, sport: "cycling",    name: "SG Highway Strip",        active: 5,  intensity: "low"    },
  { id: 5, lat: 23.0553, lng: 72.5293, sport: "badminton",  name: "Satellite Badminton Hub", active: 9,  intensity: "high"   },
  { id: 6, lat: 23.0225, lng: 72.5633, sport: "tennis",     name: "Jodhpur Tennis Club",     active: 4,  intensity: "low"    },
  { id: 7, lat: 23.0305, lng: 72.5714, sport: "football",   name: "Navrangpura Ground",      active: 11, intensity: "high"   },
  { id: 8, lat: 23.0155, lng: 72.5521, sport: "swimming",   name: "Satellite Aqua Center",   active: 3,  intensity: "low"    },
  { id: 9, lat: 23.0642, lng: 72.5430, sport: "volleyball", name: "Chandkheda Courts",       active: 7,  intensity: "medium" },
];

// ── Sonar hotspot marker ───────────────────────────────────────────────────────

function createHotspotMarker(sport: string, intensity: HotspotIntensity) {
  const hex = sportHex(sport);
  const core = intensity === "high" ? 14 : intensity === "medium" ? 11 : 8;
  const wrap = core * 5;
  const dur  = intensity === "high" ? "1.8s" : intensity === "medium" ? "2.4s" : "3s";
  const gap  = intensity === "high" ? "0.6s" : intensity === "medium" ? "0.8s" : "1s";
  const gap2 = intensity === "high" ? "1.2s" : intensity === "medium" ? "1.6s" : "2s";
  const half = core / 2;

  const ring = (delay: string) => `
    <div style="
      position:absolute;
      width:${core}px;height:${core}px;
      top:50%;left:50%;
      margin-top:-${half}px;margin-left:-${half}px;
      border-radius:50%;
      border:1.5px solid ${hex.accent};
      animation:sonar-expand ${dur} ease-out ${delay} infinite;
    "></div>`;

  return L.divIcon({
    className: "hotspot-marker",
    html: `
      <div style="position:relative;width:${wrap}px;height:${wrap}px;">
        ${ring("0s")}${ring(gap)}${ring(gap2)}
        <div style="
          position:absolute;
          width:${core}px;height:${core}px;
          top:50%;left:50%;
          margin-top:-${half}px;margin-left:-${half}px;
          border-radius:50%;
          background:${hex.accent};
          box-shadow:0 0 ${core}px ${hex.glow}cc,0 0 ${core * 2}px ${hex.accent}40;
          z-index:2;
        "></div>
      </div>`,
    iconSize: [wrap, wrap],
    iconAnchor: [wrap / 2, wrap / 2],
    popupAnchor: [0, -wrap / 2 - 4],
  });
}

// ── Corp member radar-blip marker ─────────────────────────────────────────────

function createCorpBlipMarker(profile: Profile) {
  const initial = profile.name.charAt(0).toUpperCase();
  const sports = profile.sports as { sport: string; skillLevel: string }[];
  const primarySport = sports[0]?.sport ?? "other";
  const hex = sportHex(primarySport);
  const lb  = loyaltyBadge(profile.streakWeeks, profile.gamesPlayed);

  return L.divIcon({
    className: "corp-blip",
    html: `
      <div style="position:relative;width:46px;height:46px;">
        <div style="
          position:absolute;inset:0;border-radius:50%;
          border:1px solid ${hex.accent}50;
          animation:blip-pulse 2s ease-in-out infinite;
        "></div>
        <div style="
          position:absolute;inset:4px;border-radius:50%;
          background:linear-gradient(135deg,${hex.accent}ee,${hex.glow});
          border:2.5px solid ${lb.color};
          display:flex;align-items:center;justify-content:center;
          font-size:14px;font-weight:900;color:${hex.dim};
          box-shadow:0 0 14px ${hex.glow}70,0 0 4px ${lb.color}60;
          font-family:system-ui,sans-serif;
        ">${initial}</div>
        <div style="
          position:absolute;bottom:1px;right:1px;
          width:11px;height:11px;border-radius:50%;
          background:#22c55e;border:2px solid #0d1117;
          box-shadow:0 0 5px #22c55e90;
        "></div>
      </div>`,
    iconSize: [46, 46],
    iconAnchor: [23, 23],
    popupAnchor: [0, -26],
  });
}

// ── Normal-map friend marker ───────────────────────────────────────────────────

function createFriendMarker(profile: Profile) {
  const initial = profile.name.charAt(0).toUpperCase();
  const sports = profile.sports as { sport: string; skillLevel: string }[];
  const primarySport = sports[0]?.sport ?? "other";
  const hex = sportHex(primarySport);
  const lb  = loyaltyBadge(profile.streakWeeks, profile.gamesPlayed);

  return L.divIcon({
    className: "friend-marker",
    html: `
      <div style="position:relative;width:42px;height:42px;">
        <div style="
          width:38px;height:38px;border-radius:50%;
          background:linear-gradient(135deg,${hex.accent}dd,${hex.glow});
          border:3px solid ${lb.color};
          display:flex;align-items:center;justify-content:center;
          font-size:17px;font-weight:900;color:#0d1117;
          box-shadow:0 0 16px ${hex.glow}60,0 0 4px ${lb.color}80;
          font-family:system-ui,sans-serif;
        ">${initial}</div>
        <div style="
          position:absolute;bottom:-1px;right:-1px;
          width:16px;height:16px;border-radius:50%;
          background:${lb.color};border:2px solid #0d1117;
          display:flex;align-items:center;justify-content:center;
          font-size:9px;line-height:1;
        ">${lb.emoji}</div>
      </div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -24],
  });
}

function createActivityMarker(sport: string) {
  const hex = sportHex(sport);
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width:14px;height:14px;border-radius:50%;
      background:${hex.accent};
      border:2px solid rgba(255,255,255,0.8);
      box-shadow:0 0 10px ${hex.glow}90;
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -9],
  });
}

function createEventMarker(color = "#94a3b8") {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width:12px;height:12px;border-radius:3px;
      background:${color};
      border:2px solid rgba(255,255,255,0.8);
      box-shadow:0 0 8px ${color}70;
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -8],
  });
}

// ── Hotspot popup ─────────────────────────────────────────────────────────────

function HotspotPopup({ spot }: { spot: Hotspot }) {
  const hex = sportHex(spot.sport);
  const intensityLabel = spot.intensity === "high" ? "High Activity" : spot.intensity === "medium" ? "Active" : "Light Activity";
  const intensityColor = spot.intensity === "high" ? "#ef4444" : spot.intensity === "medium" ? "#f59e0b" : "#22c55e";

  return (
    <div className="min-w-[210px] p-1">
      <div className="flex items-center gap-2 mb-2.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: `${hex.accent}20`, border: `1.5px solid ${hex.accent}40` }}
        >
          {sportEmoji(spot.sport)}
        </div>
        <div>
          <div className="font-black text-sm text-foreground leading-tight">{spot.name}</div>
          <div className="text-[10px] capitalize" style={{ color: hex.accent }}>{spot.sport} hotspot</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 mb-2.5">
        <div className="rounded-lg bg-secondary/40 py-2 text-center">
          <div className="text-lg font-black" style={{ color: hex.accent }}>{spot.active}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Corps Active</div>
        </div>
        <div className="rounded-lg bg-secondary/40 py-2 text-center">
          <div className="text-sm font-black" style={{ color: intensityColor }}>{intensityLabel}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Intensity</div>
        </div>
      </div>

      <div
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs"
        style={{ background: `${hex.accent}12`, border: `1px solid ${hex.accent}30`, color: hex.accent }}
      >
        <Radio className="w-3 h-3 shrink-0" />
        <span className="font-medium">Sonar ping active — {spot.active} blips detected</span>
      </div>
    </div>
  );
}

// ── Friend popup (normal map) ─────────────────────────────────────────────────

function FriendPopup({ profile }: { profile: Profile }) {
  const sports = profile.sports as { sport: string; skillLevel: string }[];
  const lb = loyaltyBadge(profile.streakWeeks, profile.gamesPlayed);

  return (
    <div className="min-w-[220px] p-1">
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-black shrink-0"
          style={{ background: `linear-gradient(135deg,${lb.color}40,${lb.color}20)`, border: `2px solid ${lb.color}` }}
        >
          {profile.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="font-black text-sm text-foreground leading-tight flex items-center gap-1">
            {profile.name}
            {profile.isVerified && <span className="text-primary text-xs">✓</span>}
          </div>
          {profile.locationArea && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5" />
              {profile.locationArea}
            </div>
          )}
        </div>
      </div>

      <div
        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 mb-3"
        style={{ background: `${lb.color}15`, border: `1px solid ${lb.color}40` }}
      >
        <span className="text-base">{lb.emoji}</span>
        <div>
          <div className="text-xs font-black" style={{ color: lb.color }}>{lb.label}</div>
          <div className="text-[10px] text-muted-foreground leading-tight">{lb.desc}</div>
        </div>
      </div>

      {sports.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {sports.map((s, i) => (
            <span key={i} className="text-xs flex items-center gap-0.5 bg-secondary/60 rounded px-1.5 py-0.5 text-muted-foreground capitalize">
              {sportEmoji(s.sport)} {s.sport}
              <span className="text-[9px] opacity-60 ml-0.5">· {s.skillLevel}</span>
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {[
          { label: "Games",  value: profile.gamesPlayed },
          { label: "Hosted", value: profile.gamesHosted },
          { label: "Streak", value: `${profile.streakWeeks}w` },
        ].map(s => (
          <div key={s.label} className="text-center rounded bg-secondary/40 py-1">
            <div className="text-sm font-black text-foreground">{s.value}</div>
            <div className="text-[9px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <Link href={`/profile/${profile.id}`}>
        <Button size="sm" className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-xs h-7">
          View Profile
        </Button>
      </Link>
    </div>
  );
}

function createBoltSparkMarker(color: string, glow: string) {
  return L.divIcon({
    className: "bolt-spark-marker",
    html: `
      <div style="position:relative;width:56px;height:64px;">
        <div style="position:absolute;top:0;left:50%;animation:bolt-drop-in 1.2s ease-out 1 forwards;pointer-events:none;">
          <svg width="20" height="36" viewBox="0 0 20 36" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 0 8px ${color})">
            <polygon points="12,0 4,16 9,16 2,36 18,14 12,14" fill="${color}" />
          </svg>
        </div>
        <div style="position:absolute;bottom:6px;left:50%;width:14px;height:14px;margin-left:-7px;">
          <div style="position:absolute;inset:0;border-radius:50%;border:2px solid ${color};animation:spark-ring-once 0.55s ease-out 0.25s 1 forwards;opacity:0;"></div>
          <div style="position:absolute;inset:-5px;border-radius:50%;border:1.5px solid ${color}70;animation:spark-ring-once 0.65s ease-out 0.38s 1 forwards;opacity:0;"></div>
        </div>
        <div style="position:absolute;bottom:2px;left:50%;width:32px;height:32px;margin-left:-16px;border-radius:50%;background:${glow};animation:bolt-ground-flash 0.6s ease-out 0.15s 1 forwards;opacity:0;filter:blur(8px);"></div>
      </div>`,
    iconSize: [56, 64],
    iconAnchor: [28, 58],
    popupAnchor: [0, -62],
  });
}

// ── Main map page ─────────────────────────────────────────────────────────────

type MapMode = "normal" | "corp";

export default function MapPage() {
  const [mapMode, setMapMode]       = useState<MapMode>("normal");
  const [filterType, setFilterType] = useState<"all" | "activities" | "events">("all");
  const [showFriends, setShowFriends] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);

  const { data: activities, isLoading: loadingActivities } = useListActivities();
  const { data: events,     isLoading: loadingEvents }     = useListEvents();
  const { data: profiles = [], isLoading: loadingProfiles } = useListProfiles();

  const friendsOnMap = useMemo(
    () => profiles.filter(p => p.latitude && p.longitude),
    [profiles]
  );

  const filteredActivities = useMemo(() => {
    if (!activities || filterType === "events") return [];
    return activities;
  }, [activities, filterType]);

  const filteredEvents = useMemo(() => {
    if (!events || filterType === "activities") return [];
    return events;
  }, [events, filterType]);

  const isLoading = loadingActivities || loadingEvents || loadingProfiles;
  const totalCorpActive = HOTSPOTS.reduce((sum, h) => sum + h.active, 0);

  // Corp mode: randomly spark hotspots to simulate live activity
  const [sparkingHotspotId, setSparkingHotspotId] = useState<number | null>(null);
  const [sparkKey, setSparkKey] = useState(0);

  useEffect(() => {
    if (mapMode !== "corp") { setSparkingHotspotId(null); return; }
    // Immediately spark one on mode entry
    const first = HOTSPOTS[Math.floor(Math.random() * HOTSPOTS.length)];
    setSparkingHotspotId(first.id);
    setSparkKey(k => k + 1);
    const clearFirst = setTimeout(() => setSparkingHotspotId(null), 1800);

    const clearTimeouts: ReturnType<typeof setTimeout>[] = [];
    const interval = setInterval(() => {
      const spot = HOTSPOTS[Math.floor(Math.random() * HOTSPOTS.length)];
      setSparkingHotspotId(spot.id);
      setSparkKey(k => k + 1);
      const t = setTimeout(() => setSparkingHotspotId(null), 1800);
      clearTimeouts.push(t);
    }, 5500);

    return () => { clearInterval(interval); clearTimeout(clearFirst); clearTimeouts.forEach(clearTimeout); };
  }, [mapMode]);

  // Normal mode: track genuinely new Firestore markers
  const seenIds = useRef<Set<string> | null>(null);
  const [newMarkerIds, setNewMarkerIds] = useState(new Set<string>());
  const clearMarkersTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const allCurrent = [
      ...(activities || []).map((a: any) => `act-${a.id}`),
      ...(events || []).map((e: any) => `evt-${e.id}`),
    ];
    if (seenIds.current === null) {
      seenIds.current = new Set(allCurrent);
      return;
    }
    const fresh: string[] = [];
    for (const id of allCurrent) {
      if (!seenIds.current.has(id)) { fresh.push(id); seenIds.current.add(id); }
    }
    if (fresh.length > 0) {
      setNewMarkerIds(prev => new Set([...prev, ...fresh]));
      // Cancel any pending clear so rapid updates don't wipe recently-added markers
      if (clearMarkersTimeout.current) clearTimeout(clearMarkersTimeout.current);
      clearMarkersTimeout.current = setTimeout(() => setNewMarkerIds(new Set()), 2200);
    }
  }, [activities, events]);

  return (
    <>
    <style>{`
  @keyframes bolt-drop-in {
    0%   { transform: translateX(-50%) translateY(-36px) scaleY(0.2); opacity: 0; }
    35%  { transform: translateX(-50%) translateY(0) scaleY(1); opacity: 1; filter: brightness(3) drop-shadow(0 0 10px currentColor); }
    65%  { transform: translateX(-50%) translateY(0) scaleY(1); opacity: 0.7; }
    100% { transform: translateX(-50%) translateY(0) scaleY(1); opacity: 0; }
  }
  @keyframes spark-ring-once {
    0%   { transform: scale(1); opacity: 1; }
    100% { transform: scale(3.5); opacity: 0; }
  }
  @keyframes bolt-ground-flash {
    0%   { opacity: 0; transform: scale(0.5); }
    25%  { opacity: 0.7; transform: scale(1.5); }
    60%  { opacity: 0.3; transform: scale(2.5); }
    100% { opacity: 0; transform: scale(3.5); }
  }
  @keyframes sonar-expand {
    0%   { transform: scale(1); opacity: 0.8; }
    100% { transform: scale(4); opacity: 0; }
  }
  @keyframes blip-pulse {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50%       { opacity: 0.8; transform: scale(1.1); }
  }
`}</style>
    <div className="absolute inset-0 flex flex-col h-full w-full">

      {/* ── Corp mode: rotating radar sweep overlay ── */}
      {mapMode === "corp" && (
        <>
          <style>{`
            @keyframes radar-rotate { to { transform: rotate(360deg); } }
            @keyframes corp-scanline {
              0%   { background-position: 0 0; }
              100% { background-position: 0 100px; }
            }
          `}</style>
          {/* Radar sweep */}
          <div className="absolute inset-0 z-[399] pointer-events-none overflow-hidden">
            <div style={{
              position: "absolute",
              top: "50%", left: "50%",
              width: "220vmax", height: "220vmax",
              marginLeft: "-110vmax", marginTop: "-110vmax",
              background: "conic-gradient(from 0deg, transparent 0%, transparent 88%, #00B4E005 93%, #00B4E018 97%, #00B4E008 100%)",
              animation: "radar-rotate 5s linear infinite",
            }} />
          </div>
          {/* Scanline vignette */}
          <div className="absolute inset-0 z-[398] pointer-events-none" style={{
            background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,180,224,0.015) 3px, rgba(0,180,224,0.015) 4px)",
            animation: "corp-scanline 4s linear infinite",
          }} />
          {/* Corner vignette */}
          <div className="absolute inset-0 z-[398] pointer-events-none" style={{
            background: "radial-gradient(ellipse at center, transparent 55%, #00B4E008 100%)",
          }} />
        </>
      )}

      {/* ── Mode toggle ── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[401] flex items-center gap-0 rounded-full border shadow-2xl overflow-hidden"
        style={{ background: "rgba(10,14,20,0.95)", backdropFilter: "blur(12px)", borderColor: mapMode === "corp" ? "#00B4E040" : "#ffffff15" }}
      >
        <button
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B4E0] focus-visible:ring-inset"
          style={mapMode === "normal"
            ? { background: "#00B4E0", color: "#0d1117" }
            : { color: "#666", background: "transparent" }}
          onClick={() => setMapMode("normal")}
        >
          <MapIcon className="w-3.5 h-3.5" /> Normal
        </button>
        <div className="w-px h-5 bg-white/10 shrink-0" />
        <button
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-inset"
          style={mapMode === "corp"
            ? { background: "linear-gradient(135deg,#00B4E0,#6366f1)", color: "#fff", boxShadow: "inset 0 0 20px #00B4E020" }
            : { color: "#666", background: "transparent" }}
          onClick={() => setMapMode("corp")}
        >
          <Crosshair className="w-3.5 h-3.5" />
          Corp Radar
          {mapMode === "corp" && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse ml-0.5" style={{ boxShadow: "0 0 4px #22c55e" }} />}
        </button>
      </div>

      {/* ── Normal mode filter bar ── */}
      {mapMode === "normal" && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[400] flex gap-1.5 bg-card/90 backdrop-blur p-1.5 rounded-full border border-border shadow-xl">
          {(["all", "activities", "events"] as const).map(f => (
            <Button
              key={f}
              variant={filterType === f ? "default" : "ghost"}
              size="sm"
              className={`rounded-full text-xs ${filterType === f ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setFilterType(f)}
            >
              {f === "all" ? "All" : f === "activities" ? "Sports" : "Social"}
            </Button>
          ))}
          <div className="w-px h-5 bg-border self-center mx-0.5" />
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-full text-xs gap-1.5 transition-all ${showFriends ? "text-primary font-bold bg-primary/10" : "text-muted-foreground"}`}
            onClick={() => setShowFriends(v => !v)}
          >
            <User className="w-3.5 h-3.5" />
            Corps Mates
            {showFriends && friendsOnMap.length > 0 && (
              <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[9px] font-black ml-0.5">
                {friendsOnMap.length}
              </span>
            )}
          </Button>
        </div>
      )}

      {/* ── Corp mode controls ── */}
      {mapMode === "corp" && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[400] flex gap-1.5 bg-card/90 backdrop-blur p-1.5 rounded-full border shadow-xl" style={{ borderColor: "#00B4E030" }}>
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-full text-xs gap-1.5 transition-all ${showHotspots ? "font-bold" : "text-muted-foreground"}`}
            style={showHotspots ? { color: "#00B4E0", background: "#00B4E015" } : {}}
            onClick={() => setShowHotspots(v => !v)}
          >
            <Radio className="w-3.5 h-3.5" />
            Hotspots
            {showHotspots && (
              <span className="rounded-full px-1.5 py-0.5 text-[9px] font-black ml-0.5" style={{ background: "#00B4E0", color: "#0d1117" }}>
                {HOTSPOTS.length}
              </span>
            )}
          </Button>
          <div className="w-px h-5 bg-border self-center mx-0.5" />
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-full text-xs gap-1.5 transition-all ${showFriends ? "font-bold" : "text-muted-foreground"}`}
            style={showFriends ? { color: "#22c55e", background: "#22c55e15" } : {}}
            onClick={() => setShowFriends(v => !v)}
          >
            <Zap className="w-3.5 h-3.5" />
            Active Members
            {showFriends && friendsOnMap.length > 0 && (
              <span className="rounded-full px-1.5 py-0.5 text-[9px] font-black ml-0.5" style={{ background: "#22c55e", color: "#0d1117" }}>
                {friendsOnMap.length}
              </span>
            )}
          </Button>
        </div>
      )}

      {/* ── Corp Intel panel (top-right) ── */}
      {mapMode === "corp" && (
        <div className="absolute top-4 right-4 z-[401] rounded-xl p-3 shadow-2xl" style={{
          background: "rgba(6,10,16,0.92)",
          backdropFilter: "blur(14px)",
          border: "1px solid #00B4E030",
          boxShadow: "0 0 30px #00B4E010, inset 0 0 20px #00B4E005",
          minWidth: 160,
        }}>
          {/* Header */}
          <div className="flex items-center gap-1.5 mb-3 pb-2" style={{ borderBottom: "1px solid #00B4E020" }}>
            <Bolt style={{ width: 14, height: 20, color: "#00B4E0", filter: "drop-shadow(0 0 4px #00B4E0)" }} />
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#00B4E0" }}>Corp Radar</span>
            <span className="ml-auto flex items-center gap-1 text-[8px] font-black text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" style={{ boxShadow: "0 0 4px #22c55e" }} />
              LIVE
            </span>
          </div>
          {/* Stats */}
          <div className="space-y-2">
            {[
              { dot: "#22c55e", label: "members active",    val: friendsOnMap.length },
              { dot: "#00B4E0", label: "hotspots pinging",  val: HOTSPOTS.length },
              { dot: "#f97316", label: "corps playing now",  val: totalCorpActive },
            ].map(({ dot, label, val }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dot, boxShadow: `0 0 5px ${dot}` }} />
                <span className="text-[10px] text-muted-foreground flex-1">{label}</span>
                <span className="text-[11px] font-black text-foreground">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Normal map legend (bottom-right) ── */}
      {mapMode === "normal" && showFriends && (
        <div className="absolute bottom-4 right-4 z-[400] bg-card/90 backdrop-blur border border-border rounded-xl p-3 shadow-xl">
          <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">Loyalty</div>
          {[
            { emoji: "🔥", label: "Blazing",   color: "#00B4E0" },
            { emoji: "👑", label: "Legend",    color: "#f59e0b" },
            { emoji: "⭐", label: "Veteran",   color: "#94a3b8" },
            { emoji: "✅", label: "Regular",   color: "#22c55e" },
            { emoji: "🌱", label: "New Blood", color: "#6b7280" },
          ].map(t => (
            <div key={t.label} className="flex items-center gap-2 mb-1 last:mb-0">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: t.color }} />
              <span className="text-[10px] text-muted-foreground">{t.emoji} {t.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Hotspot legend (corp map, bottom-right) ── */}
      {mapMode === "corp" && showHotspots && (
        <div className="absolute bottom-4 right-4 z-[400] bg-card/95 backdrop-blur border rounded-xl p-3 shadow-xl" style={{ borderColor: "#00B4E020" }}>
          <div className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: "#00B4E0" }}>Hotspot Key</div>
          {[
            { label: "High",   color: "#ef4444", desc: "12+ active" },
            { label: "Medium", color: "#f59e0b", desc: "5–11 active" },
            { label: "Low",    color: "#22c55e", desc: "1–4 active" },
          ].map(t => (
            <div key={t.label} className="flex items-center gap-2 mb-1 last:mb-0">
              <div className="relative w-3 h-3 flex items-center justify-center shrink-0">
                <div className="w-2 h-2 rounded-full" style={{ background: t.color, boxShadow: `0 0 4px ${t.color}` }} />
              </div>
              <span className="text-[10px] text-muted-foreground"><span className="text-foreground font-bold">{t.label}</span> · {t.desc}</span>
            </div>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      <MapContainer
        center={[23.0225, 72.5714]}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
        />

        {/* ── Normal map layers ── */}
        {mapMode === "normal" && (
          <>
            {filteredActivities.map(activity => (
              <Marker
                key={`act-${activity.id}`}
                position={[activity.latitude, activity.longitude]}
                icon={createActivityMarker(activity.type)}
              >
                <Popup className="custom-popup">
                  <div className="p-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 uppercase text-[10px] tracking-wider">
                        {sportEmoji(activity.type)} {activity.type}
                      </Badge>
                      <Badge variant="outline" className={activity.status === "open" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                        {activity.status}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-sm mb-2">{activity.title}</h3>
                    <div className="space-y-1 mb-3 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {format(new Date(activity.date), "MMM d, yyyy")}</p>
                      <p className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {activity.time}</p>
                      <p className="flex items-center gap-1.5"><Users className="w-3 h-3" /> {activity.currentPlayers} / {activity.maxPlayers} players</p>
                    </div>
                    <Link href={`/activity/${activity.id}`}>
                      <Button size="sm" className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-xs h-7">View Details</Button>
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}

            {filteredEvents.map(event => (
              <Marker
                key={`evt-${event.id}`}
                position={[event.latitude, event.longitude]}
                icon={createEventMarker("#a78bfa")}
              >
                <Popup className="custom-popup">
                  <div className="p-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/20 uppercase text-[10px] tracking-wider">
                        {event.type}
                      </Badge>
                      <Badge variant="outline" className={event.status === "open" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                        {event.status}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-sm mb-2">{event.title}</h3>
                    <div className="space-y-1 mb-3 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {format(new Date(event.date), "MMM d, yyyy")}</p>
                      <p className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {event.time}</p>
                      <p className="flex items-center gap-1.5"><Users className="w-3 h-3" /> {event.currentAttendees} / {event.maxAttendees} attending</p>
                    </div>
                    <Link href={`/event/${event.id}`}>
                      <Button size="sm" className="w-full bg-violet-600 text-white font-bold hover:bg-violet-700 text-xs h-7">View Details</Button>
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}

            {showFriends && friendsOnMap.map(profile => (
              <Marker
                key={`friend-${profile.id}`}
                position={[Number(profile.latitude), Number(profile.longitude)]}
                icon={createFriendMarker(profile)}
                zIndexOffset={1000}
              >
                <Popup className="custom-popup" maxWidth={260}>
                  <FriendPopup profile={profile} />
                </Popup>
              </Marker>
            ))}

            {/* Bolt sparks on new real-time markers */}
            {[...newMarkerIds].map(nid => {
              const isAct = nid.startsWith("act-");
              const id = nid.slice(4);
              const item = isAct
                ? (activities || []).find((a: any) => a.id === id)
                : (events || []).find((e: any) => e.id === id);
              if (!item) return null;
              const hex = sportHex(item.type);
              return (
                <Marker
                  key={`spark-${nid}`}
                  position={[item.latitude, item.longitude]}
                  icon={createBoltSparkMarker(hex.accent, hex.glow)}
                  zIndexOffset={2000}
                />
              );
            })}
          </>
        )}

        {/* ── Corp map layers ── */}
        {mapMode === "corp" && (
          <>
            {/* Hotspots with sonar ping */}
            {showHotspots && HOTSPOTS.map(spot => (
              <Marker
                key={`hotspot-${spot.id}`}
                position={[spot.lat, spot.lng]}
                icon={createHotspotMarker(spot.sport, spot.intensity)}
                zIndexOffset={0}
              >
                <Popup className="custom-popup" maxWidth={240}>
                  <HotspotPopup spot={spot} />
                </Popup>
              </Marker>
            ))}

            {/* Bolt spark on active hotspot */}
            {sparkingHotspotId !== null && (() => {
              const spot = HOTSPOTS.find(h => h.id === sparkingHotspotId);
              if (!spot) return null;
              const hex = sportHex(spot.sport);
              return (
                <Marker
                  key={`spark-${spot.id}-${sparkKey}`}
                  position={[spot.lat, spot.lng]}
                  icon={createBoltSparkMarker(hex.accent, hex.glow)}
                  zIndexOffset={2000}
                />
              );
            })()}

            {/* Corps member radar blips */}
            {showFriends && friendsOnMap.map(profile => (
              <Marker
                key={`corp-${profile.id}`}
                position={[Number(profile.latitude), Number(profile.longitude)]}
                icon={createCorpBlipMarker(profile)}
                zIndexOffset={1000}
              >
                <Popup className="custom-popup" maxWidth={260}>
                  <FriendPopup profile={profile} />
                </Popup>
              </Marker>
            ))}
          </>
        )}
      </MapContainer>
    </div>
    </>
  );
}
