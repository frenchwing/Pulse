import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useListClubs, useSubmitClubInquiry, Club2 } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Lock, Users, MapPin, ChevronDown, ChevronUp, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { sportEmoji, sportColor, SPORT_LABELS } from "@/lib/sport-meta";

const COVER_FALLBACK = "#1e3a5f";

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function ClubCard({ club }: { club: Club2 }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const inquire = useSubmitClubInquiry({
    mutation: {
      onSuccess: () => {
        toast({ title: "Inquiry sent!", description: `${club.name} will review your request.` });
        setOpen(false);
        setName(""); setPhone(""); setMessage("");
      },
      onError: (e: any) => toast({ title: "Failed to send", description: e.message, variant: "destructive" }),
    },
  });

  const color = club.coverColor ?? COVER_FALLBACK;
  const rgb = color.startsWith("#") ? hexToRgb(color) : "30,58,95";
  const members = club.memberNames as string[];

  return (
    <div
      className="rounded-2xl border border-border overflow-hidden shadow-lg group hover:shadow-xl transition-shadow"
      style={{ background: `linear-gradient(160deg, rgba(${rgb},0.18) 0%, #0f1f3a 60%)` }}
    >
      {/* Top accent stripe */}
      <div className="h-1 w-full" style={{ background: color }} />

      <div className="p-5 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="outline" className={`text-xs font-bold capitalize border ${sportColor(club.sport)}`}>
                {sportEmoji(club.sport)} {club.sport}
              </Badge>
              {club.isExclusive && (
                <Badge variant="outline" className="text-xs gap-1 border-slate-600 text-slate-400">
                  <Lock className="w-2.5 h-2.5" /> By inquiry
                </Badge>
              )}
              {club.area && (
                <Badge variant="outline" className="text-xs gap-1 border-slate-700 text-slate-400">
                  <MapPin className="w-2.5 h-2.5" /> {club.area}
                </Badge>
              )}
            </div>
            <h3 className="text-xl font-black text-foreground tracking-tight leading-tight">{club.name}</h3>
            {club.tagline && (
              <p className="text-sm text-muted-foreground italic mt-0.5">&ldquo;{club.tagline}&rdquo;</p>
            )}
          </div>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 font-black"
            style={{ background: `rgba(${rgb},0.35)`, border: `1px solid rgba(${rgb},0.5)` }}
          >
            {sportEmoji(club.sport)}
          </div>
        </div>

        {/* Members preview */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {members.slice(0, 5).map((m, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-card"
                style={{ background: color, color: "#0a1628" }}
                title={m}
              >
                {m.charAt(0)}
              </div>
            ))}
            {members.length > 5 && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-card bg-secondary text-muted-foreground">
                +{members.length - 5}
              </div>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="text-foreground font-bold">{club.memberCount}</span>
            {club.maxMembers ? ` / ${club.maxMembers}` : ""} members
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          <span>Led by <span className="text-foreground font-medium">{club.leaderName}</span></span>
        </div>

        {/* CTA */}
        <div className="pt-1 border-t border-border/50">
          <Button
            variant="outline"
            size="sm"
            className="w-full border-border hover:border-primary/50 hover:bg-primary/5 font-medium gap-2 transition-colors"
            onClick={() => setOpen(v => !v)}
          >
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {open ? "Close" : "Request to Join"}
          </Button>
        </div>

        {/* Inquiry form — inline expand */}
        {open && (
          <div className="mt-1 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <p className="text-xs text-muted-foreground">Your request will be reviewed by the club leader before you're added.</p>
            <Input
              placeholder="Your name *"
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-background/60 border-border text-sm"
            />
            <Input
              placeholder="Phone (optional)"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="bg-background/60 border-border text-sm"
            />
            <Textarea
              placeholder="Why do you want to join? (optional)"
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="bg-background/60 border-border text-sm resize-none"
              rows={2}
            />
            <Button
              className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 gap-2"
              size="sm"
              disabled={!name.trim() || inquire.isPending}
              onClick={() => inquire.mutate({ id: club.id, data: { applicantName: name, applicantPhone: phone || undefined, message: message || undefined } })}
            >
              <Send className="w-3.5 h-3.5" />
              {inquire.isPending ? "Sending…" : "Send Request"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

const ALL_SPORTS = SPORT_LABELS.map(s => s.value);

export default function ClubsPage() {
  const params = useParams<{ sport?: string }>();
  const [activeSport, setActiveSport] = useState<string>(params.sport ?? "all");
  const [, setLocation] = useLocation();

  const { data: allClubs = [], isLoading } = useListClubs();

  // Collect which sports actually have clubs
  const sportsWithClubs = [...new Set(allClubs.map(c => c.sport))].sort();

  const filtered = activeSport === "all"
    ? allClubs
    : allClubs.filter(c => c.sport === activeSport);

  // Group by sport for "all" view
  const grouped: Record<string, Club2[]> = {};
  if (activeSport === "all") {
    for (const c of filtered) {
      if (!grouped[c.sport]) grouped[c.sport] = [];
      grouped[c.sport].push(c);
    }
  }

  return (
    <div className="flex-1 bg-background animate-in fade-in duration-500">
      {/* Hero header */}
      <div className="bg-card border-b border-border pt-8 pb-6 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end gap-3 mb-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-primary">The Clubs</h1>
            <span className="text-4xl mb-0.5">🏛️</span>
          </div>
          <p className="text-muted-foreground text-base mb-6">
            Exclusive sports communities in Ahmedabad. Find your people.
          </p>

          {/* Sport filter pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveSport("all")}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all border ${
                activeSport === "all"
                  ? "bg-primary text-primary-foreground border-primary shadow-[0_0_12px_rgba(0,180,224,0.3)]"
                  : "bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              }`}
            >
              All Sports
            </button>
            {sportsWithClubs.map(sport => (
              <button
                key={sport}
                onClick={() => setActiveSport(sport)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all border capitalize gap-1.5 flex items-center ${
                  activeSport === sport
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_12px_rgba(0,180,224,0.3)]"
                    : "bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {sportEmoji(sport)} {sport}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-64 bg-card animate-pulse rounded-2xl border border-border" />
            ))}
          </div>
        ) : activeSport === "all" ? (
          // Grouped by sport
          <div className="space-y-10">
            {Object.entries(grouped).map(([sport, clubs]) => (
              <div key={sport}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{sportEmoji(sport)}</span>
                  <h2 className="text-xl font-black capitalize text-foreground tracking-tight">{sport}</h2>
                  <div className="flex-1 h-px bg-border" />
                  <button
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => setActiveSport(sport)}
                  >
                    See all {clubs.length}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {clubs.map(c => <ClubCard key={c.id} club={c} />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Filtered single sport
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{sportEmoji(activeSport)}</span>
              <h2 className="text-2xl font-black capitalize text-foreground">{activeSport} clubs</h2>
              <Badge variant="outline" className="border-border text-muted-foreground ml-auto">
                {filtered.length} {filtered.length === 1 ? "club" : "clubs"}
              </Badge>
            </div>
            {filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <div className="text-5xl mb-4">{sportEmoji(activeSport)}</div>
                <p className="text-lg font-bold text-foreground mb-2">No clubs yet for {activeSport}</p>
                <p className="text-sm">Be the first to start one.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map(c => <ClubCard key={c.id} club={c} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
