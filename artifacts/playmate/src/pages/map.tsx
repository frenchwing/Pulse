import { useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useListActivities, useListEvents, useListProfiles, Profile } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Calendar, Clock, MapPin, User } from "lucide-react";
import { Link } from "wouter";
import L from "leaflet";
import { format } from "date-fns";
import { sportEmoji, sportHex, loyaltyBadge } from "@/lib/sport-meta";

// ── Activity / Event markers ──────────────────────────────────────────────────

function createActivityMarker(sport: string) {
  const hex = sportHex(sport);
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width:14px; height:14px; border-radius:50%;
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
      width:12px; height:12px; border-radius:3px;
      background:${color};
      border:2px solid rgba(255,255,255,0.8);
      box-shadow:0 0 8px ${color}70;
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -8],
  });
}

// ── Friend / profile marker ───────────────────────────────────────────────────

function createFriendMarker(profile: Profile) {
  const initial = profile.name.charAt(0).toUpperCase();
  const sports = profile.sports as { sport: string; skillLevel: string }[];
  const primarySport = sports[0]?.sport ?? "other";
  const hex = sportHex(primarySport);
  const lb = loyaltyBadge(profile.streakWeeks, profile.gamesPlayed);

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
          background:${lb.color};
          border:2px solid #0d1117;
          display:flex;align-items:center;justify-content:center;
          font-size:9px;line-height:1;
        ">${lb.emoji}</div>
      </div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -24],
  });
}

// ── Friend popup content ──────────────────────────────────────────────────────

function FriendPopup({ profile }: { profile: Profile }) {
  const sports = profile.sports as { sport: string; skillLevel: string }[];
  const lb = loyaltyBadge(profile.streakWeeks, profile.gamesPlayed);

  return (
    <div className="min-w-[220px] p-1">
      {/* Header */}
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

      {/* Loyalty badge */}
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

      {/* Sports */}
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

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {[
          { label: "Games", value: profile.gamesPlayed },
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

// ── Main map page ─────────────────────────────────────────────────────────────

export default function MapPage() {
  const [filterType, setFilterType] = useState<"all" | "activities" | "events">("all");
  const [showFriends, setShowFriends] = useState(true);

  const { data: activities, isLoading: loadingActivities } = useListActivities();
  const { data: events, isLoading: loadingEvents } = useListEvents();
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

  return (
    <div className="absolute inset-0 flex flex-col h-full w-full">

      {/* ── Filter bar ── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] flex gap-1.5 bg-card/90 backdrop-blur p-1.5 rounded-full border border-border shadow-xl">
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

      {/* ── Loyalty legend ── */}
      {showFriends && (
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

        {/* Activity markers */}
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

        {/* Event markers */}
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

        {/* Friend / corps-mate markers */}
        {showFriends && friendsOnMap.map(profile => (
          <Marker
            key={`profile-${profile.id}`}
            position={[Number(profile.latitude), Number(profile.longitude)]}
            icon={createFriendMarker(profile)}
            zIndexOffset={1000}
          >
            <Popup className="custom-popup" maxWidth={260}>
              <FriendPopup profile={profile} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
