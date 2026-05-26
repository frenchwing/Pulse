import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetEvent, useJoinEvent, getGetEventQueryKey,
  useGetEventRatings, useRateEventPlayer, getGetEventRatingsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Calendar, Clock, MapPin, ArrowLeft, CheckCircle2, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

const FUNNY_LABELS: Record<number, string> = {
  1: "Barely touched the ball — we're concerned",
  2: "Showed up. That's something, I guess",
  3: "Watched way too many YouTube tutorials",
  4: "Has potential. Deep, buried potential",
  5: "Perfectly average. Neither threat nor joke",
  6: "Solid. Won't embarrass you at a party",
  7: "Actually kinda good. Suspicious.",
  8: "Showoff. We hate-love this person",
  9: "Future national team. We're not worthy",
  10: "An absolute god. How are they even here?",
};

function RatingBadge({ score }: { score: number }) {
  const color =
    score <= 3 ? "text-red-400 border-red-400/30 bg-red-400/10" :
    score <= 5 ? "text-orange-400 border-orange-400/30 bg-orange-400/10" :
    score <= 7 ? "text-yellow-400 border-yellow-400/30 bg-yellow-400/10" :
    "text-green-400 border-green-400/30 bg-green-400/10";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>
      <Star className="w-3 h-3 fill-current" /> {score}/10
    </span>
  );
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: event, isLoading, isError } = useGetEvent(eventId, {
    query: { enabled: !!eventId, queryKey: getGetEventQueryKey(eventId) }
  });

  const { data: ratings } = useGetEventRatings(eventId, {
    query: { enabled: !!eventId, queryKey: getGetEventRatingsQueryKey(eventId) }
  });

  const joinMutation = useJoinEvent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetEventQueryKey(eventId) });
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
        queryClient.invalidateQueries({ queryKey: getGetEventRatingsQueryKey(eventId) });
        toast({ title: "Rating submitted!", description: FUNNY_LABELS[rateScore] });
        setRateStep("done");
      },
      onError: (err: any) => {
        toast({ title: "Rating failed", description: err?.message || "Try again.", variant: "destructive" });
      }
    }
  });

  const [name, setName] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [rateStep, setRateStep] = useState<"idle" | "form" | "done">("idle");
  const [rateTo, setRateTo] = useState("");
  const [rateFrom, setRateFrom] = useState("");
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
        <Link href="/"><Button variant="outline">Back to Map</Button></Link>
      </div>
    );
  }

  const isFull = event.status === "full" || event.currentAttendees >= event.maxAttendees;
  const isOpen = event.status === "open";
  const avgRating = ratings && ratings.length > 0
    ? (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1)
    : null;

  return (
    <div className="max-w-3xl mx-auto w-full p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
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
                <Calendar className="w-4 h-4 text-primary" />{format(new Date(event.date), "EEEE, MMMM d, yyyy")}
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
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                    <Star className="w-3 h-3 fill-primary" /> {avgRating}
                  </span>
                )}
              </div>
            </div>
          </div>

          {ratings && ratings.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold border-b border-border pb-2">Player Ratings</h3>
              {ratings.map(r => (
                <div key={r.id} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">
                      <span className="text-muted-foreground">{r.fromName}</span>
                      <span className="text-muted-foreground mx-2">rated</span>
                      <span className="text-foreground">{r.toName}</span>
                    </p>
                    <p className="text-xs text-muted-foreground italic mt-0.5">{FUNNY_LABELS[r.score]}</p>
                  </div>
                  <RatingBadge score={r.score} />
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

            {hasJoined ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="font-bold text-green-500">You're attending!</p>
                <p className="text-sm text-green-500/80">Check your calendar.</p>
              </div>
            ) : isFull ? (
              <Button disabled className="w-full" size="lg" variant="secondary">Event is Full</Button>
            ) : !isOpen ? (
              <Button disabled className="w-full" size="lg" variant="secondary">Event Closed</Button>
            ) : (
              <div className="space-y-3">
                <label className="text-sm font-medium block">Your Name</label>
                <Input
                  placeholder="Enter your name to attend"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="bg-background/50 border-input"
                />
                <Button
                  className="w-full font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(245,230,66,0.3)] transition-all hover:shadow-[0_0_30px_rgba(245,230,66,0.5)]"
                  size="lg"
                  disabled={!name.trim() || joinMutation.isPending}
                  onClick={() => joinMutation.mutate({ id: eventId, data: { name } })}
                >
                  {joinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Attend Event
                </Button>
              </div>
            )}

            <div className="border-t border-border pt-4">
              {rateStep === "idle" && (
                <Button variant="outline" size="sm" className="w-full" onClick={() => setRateStep("form")}>
                  <Star className="w-4 h-4 mr-2" /> Rate someone
                </Button>
              )}

              {rateStep === "form" && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <p className="text-sm font-bold text-foreground">Rate someone from this event</p>
                  <Input
                    placeholder="Your name"
                    value={rateFrom}
                    onChange={e => setRateFrom(e.target.value)}
                    className="bg-background/50 text-sm"
                  />
                  <Input
                    placeholder="Their name"
                    value={rateTo}
                    onChange={e => setRateTo(e.target.value)}
                    className="bg-background/50 text-sm"
                  />
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs text-muted-foreground">Score: {rateScore}/10</label>
                    </div>
                    <input
                      type="range" min={1} max={10} value={rateScore}
                      onChange={e => setRateScore(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <p className="text-xs italic text-primary mt-1">{FUNNY_LABELS[rateScore]}</p>
                  </div>
                  <Button
                    size="sm"
                    className="w-full bg-primary text-primary-foreground font-bold"
                    disabled={!rateFrom.trim() || !rateTo.trim() || rateMutation.isPending}
                    onClick={() => rateMutation.mutate({ id: eventId, data: { fromName: rateFrom, toName: rateTo, score: rateScore } })}
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
    </div>
  );
}
