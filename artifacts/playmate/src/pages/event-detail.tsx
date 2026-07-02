import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import {
  useGetEvent, useJoinEvent, eventKey,
  useGetEventRatings, useRateEventPlayer,
} from "@/hooks/use-firestore";
import { useSessionProfile } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Calendar, Clock, MapPin, ArrowLeft, CheckCircle2, Shield, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { parseLocalDate } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { dopeLevel, DOPE_LEVELS } from "@/lib/sport-meta";

function DopeBadge({ score }: { score: number }) {
  const dl = dopeLevel(score);
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl border shrink-0"
      style={{ borderColor: `${dl.color}40`, background: `${dl.color}12` }}
    >
      <span className="text-lg leading-none">{dl.emoji}</span>
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: dl.color }}>
          Dope Lv.{score}
        </span>
        <span className="text-[10px] text-muted-foreground">{dl.name}</span>
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { uid, profile } = useSessionProfile();

  const { data: event, isLoading, isError } = useGetEvent(eventId);
  const { data: ratings } = useGetEventRatings(eventId);

  const joinMutation = useJoinEvent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: eventKey(eventId) });
        toast({ title: "You're attending!", description: "Check your schedule and don't be late." });
        setHasJoined(true);
      },
      onError: (err: any) => {
        toast({ title: "Could not join", description: err?.message || "Something went wrong.", variant: "destructive" });
      }
    }
  });

  const rateMutation = useRateEventPlayer({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["eventRatings", eventId] });
        toast({ title: "Rating submitted!", description: dopeLevel(rateScore).name });
        setRateStep("done");
      },
      onError: (err: any) => {
        toast({ title: "Rating failed", description: err?.message || "Try again.", variant: "destructive" });
      }
    }
  });

  const [hasJoined, setHasJoined] = useState(false);
  const [rateStep, setRateStep] = useState<"idle" | "form" | "done">("idle");
  const [rateTo, setRateTo] = useState("");
  const [rateScore, setRateScore] = useState(5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 space-y-4">
        <h2 className="text-2xl font-bold">Event not found</h2>
        <Link href="/map"><Button variant="outline">Back to Map</Button></Link>
      </div>
    );
  }

  const isFull = event.status === "full" || event.currentAttendees >= event.maxAttendees;
  const isOpen = event.status === "open";
  const avgRating = ratings && ratings.length > 0
    ? (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1)
    : null;

  const participants: { profileId: string | null; name: string }[] = (event as any).participants ?? [];
  const alreadyJoined = hasJoined || (!!uid && participants.some(p => p.profileId === uid));
  const rateablePlayers = participants.filter(p => p.profileId && p.profileId !== uid);
  const canRate = alreadyJoined && !!profile && rateablePlayers.length > 0;

  return (
    <div className="max-w-3xl mx-auto w-full p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/feed" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Map
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Badge className="bg-accent/20 text-accent-foreground border-accent/30 uppercase tracking-widest text-xs px-3 py-1">
                {event.type}
              </Badge>
              <Badge variant="outline" className={isOpen ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                {event.status}
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-foreground">{event.title}</h1>
            <div className="flex flex-wrap gap-4 text-muted-foreground text-sm font-medium">
              <span className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-md">
                <Calendar className="w-4 h-4 text-primary" />{format(parseLocalDate(event.date, event.time), "EEEE, MMMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-md">
                <Clock className="w-4 h-4 text-primary" />{event.time}
              </span>
              <span className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-md">
                <MapPin className="w-4 h-4 text-primary" />{event.address}
              </span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-3 border-b border-border pb-2">About this event</h3>
            <p className="text-muted-foreground leading-relaxed">{event.description || "No description provided."}</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-xl border-2 border-accent/50">
              {event.hostName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Hosted by</p>
              <div className="flex items-center gap-2">
                <p className="font-bold">{event.hostName}</p>
                {avgRating && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-primary" title="Average player rating for this event">
                    <Star className="w-3 h-3 fill-primary" /> {avgRating}
                    <span className="text-muted-foreground font-medium">avg player rating</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {ratings && ratings.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold border-b border-border pb-2">Player Ratings</h3>
              {ratings.map(r => (
                <div key={r.id} className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold">
                    <span className="text-muted-foreground">{r.fromName}</span>
                    <span className="text-muted-foreground mx-2">rated</span>
                    <span className="text-foreground">{r.toName}</span>
                  </p>
                  <DopeBadge score={r.score} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-1 space-y-4">
          <div className="bg-card border border-border rounded-xl p-6 shadow-xl sticky top-24 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">Attendees</span>
                <span className="text-sm font-medium text-muted-foreground">{event.currentAttendees} / {event.maxAttendees}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_var(--primary)]"
                  style={{ width: `${Math.min(100, (event.currentAttendees / event.maxAttendees) * 100)}%` }}
                />
              </div>
            </div>

            {alreadyJoined ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="font-bold text-green-500">You're attending!</p>
                <p className="text-sm text-green-500/80">Check your calendar.</p>
              </div>
            ) : isFull ? (
              <Button disabled className="w-full" size="lg" variant="secondary">Event is Full</Button>
            ) : !isOpen ? (
              <Button disabled className="w-full" size="lg" variant="secondary">Event Closed</Button>
            ) : !uid || !profile ? (
              <div className="space-y-2">
                <Button
                  className="w-full font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(0,180,224,0.3)]"
                  size="lg"
                  onClick={() => setLocation("/onboarding")}
                >
                  Sign in to Attend
                </Button>
                <p className="text-xs text-center text-muted-foreground">Attending is tied to your Pulse profile.</p>
              </div>
            ) : (
              <Button
                className="w-full font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(0,180,224,0.3)] transition-all hover:shadow-[0_0_30px_rgba(0,180,224,0.5)]"
                size="lg"
                disabled={joinMutation.isPending}
                onClick={() => joinMutation.mutate({ id: eventId, data: { profileId: uid, name: profile.name } })}
              >
                {joinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Attend as {profile.name}
              </Button>
            )}

            {/* Who's coming */}
            {participants.length > 0 && (
              <div className="border-t border-border pt-4">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Who's coming</p>
                <div className="space-y-1.5">
                  {participants.map((p: any, i: number) => (
                    <div key={p.profileId ?? `${p.name}-${i}`} className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-black text-secondary-foreground">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={p.profileId === uid ? "font-bold text-primary" : "text-foreground"}>
                        {p.name}{p.profileId === uid ? " (you)" : ""}
                      </span>
                      {p.name === event.hostName && <span className="text-[10px] text-muted-foreground uppercase tracking-wider ml-auto">Host</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-border pt-4">
              {rateStep === "idle" && (
                canRate ? (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setRateStep("form")}>
                    <Star className="w-4 h-4 mr-2" /> Rate someone
                  </Button>
                ) : (
                  <p className="text-xs text-center text-muted-foreground">
                    {!alreadyJoined ? "Attend the event to rate people." : "No other tracked attendees to rate yet."}
                  </p>
                )
              )}

              {rateStep === "form" && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <p className="text-sm font-bold text-foreground">Rate someone from this event</p>
                  <div className="space-y-1.5">
                    {rateablePlayers.map(p => (
                      <button
                        key={p.profileId}
                        type="button"
                        onClick={() => setRateTo(p.profileId!)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${rateTo === p.profileId ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:border-primary/40"}`}
                      >
                        <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-black">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        {p.name}
                      </button>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs text-muted-foreground">Score: {rateScore}/10</label>
                    </div>
                    <input
                      type="range" min={1} max={10} value={rateScore}
                      onChange={e => setRateScore(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <p className="text-xs italic mt-1" style={{ color: dopeLevel(rateScore).color }}>{dopeLevel(rateScore).emoji} {dopeLevel(rateScore).name} — {dopeLevel(rateScore).desc}</p>
                  </div>
                  <Button
                    size="sm"
                    className="w-full bg-primary text-primary-foreground font-bold"
                    disabled={!rateTo || rateMutation.isPending}
                    onClick={() => {
                      const target = rateablePlayers.find(p => p.profileId === rateTo);
                      if (!target) return;
                      rateMutation.mutate({ id: eventId, data: {
                        fromProfileId: uid, fromName: profile.name,
                        toProfileId: target.profileId, toName: target.name,
                        score: rateScore,
                      }});
                    }}
                  >
                    {rateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                    Submit Rating
                  </Button>
                </div>
              )}

              {rateStep === "done" && (
                <p className="text-sm text-center text-green-500 font-medium">Rating submitted. They know.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dope Scale Legend */}
      <div className="max-w-3xl mx-auto w-full px-4 md:px-8 pb-12 mt-8">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">The Dope Level Scale</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(DOPE_LEVELS).map(([lvl, dl]) => (
              <div
                key={lvl}
                className="rounded-xl p-3 flex flex-col items-center text-center gap-1 border"
                style={{ borderColor: `${dl.color}30`, background: `${dl.color}08` }}
              >
                <span className="text-2xl">{dl.emoji}</span>
                <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: dl.color }}>
                  Lv.{lvl}
                </span>
                <span className="text-[11px] font-bold text-foreground leading-tight">{dl.name}</span>
                <span className="text-[10px] text-muted-foreground leading-tight">{dl.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
