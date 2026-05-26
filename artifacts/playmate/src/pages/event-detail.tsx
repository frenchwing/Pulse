import { useState } from "react";
import { useParams, Link } from "wouter";
import { useGetEvent, useJoinEvent, getGetEventQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Calendar, Clock, MapPin, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: event, isLoading, isError } = useGetEvent(eventId, {
    query: {
      enabled: !!eventId,
      queryKey: getGetEventQueryKey(eventId)
    }
  });

  const joinMutation = useJoinEvent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetEventQueryKey(eventId) });
        toast({
          title: "Joined successfully",
          description: "You're attending! Check your schedule.",
        });
        setHasJoined(true);
      },
      onError: (err: any) => {
        toast({
          title: "Could not join",
          description: err?.message || "Something went wrong.",
          variant: "destructive"
        });
      }
    }
  });

  const [name, setName] = useState("");
  const [hasJoined, setHasJoined] = useState(false);

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
        <Link href="/">
          <Button variant="outline">Back to Map</Button>
        </Link>
      </div>
    );
  }

  const isFull = event.status === 'full' || event.currentAttendees >= event.maxAttendees;
  const isOpen = event.status === 'open';

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
              <Badge variant="outline" className={isOpen ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                {event.status}
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-foreground">
              {event.title}
            </h1>
            <div className="flex flex-wrap gap-4 text-muted-foreground text-sm font-medium">
              <span className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-md">
                <Calendar className="w-4 h-4 text-accent-foreground" /> 
                {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-md">
                <Clock className="w-4 h-4 text-accent-foreground" /> 
                {event.time}
              </span>
              <span className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-md">
                <MapPin className="w-4 h-4 text-accent-foreground" /> 
                {event.address}
              </span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-3 border-b border-border pb-2">About this event</h3>
            <p className="text-muted-foreground leading-relaxed">
              {event.description || "No description provided."}
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-xl border-2 border-accent/50">
              {event.hostName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hosted by</p>
              <p className="font-bold">{event.hostName}</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="bg-card border border-border rounded-xl p-6 shadow-xl sticky top-24">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">Attendees</span>
                <span className="text-sm font-medium text-muted-foreground">
                  {event.currentAttendees} / {event.maxAttendees}
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-accent-foreground h-2.5 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_var(--accent-foreground)]" 
                  style={{ width: `${Math.min(100, (event.currentAttendees / event.maxAttendees) * 100)}%` }}
                ></div>
              </div>
            </div>

            {hasJoined ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="font-bold text-green-500">You're attending!</p>
                <p className="text-sm text-green-500/80">Check your calendar.</p>
              </div>
            ) : isFull ? (
              <Button disabled className="w-full" size="lg" variant="secondary">
                Event is Full
              </Button>
            ) : !isOpen ? (
              <Button disabled className="w-full" size="lg" variant="secondary">
                Event Closed
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Your Name</label>
                  <Input 
                    placeholder="Enter your name to attend" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="bg-background/50 border-input"
                  />
                </div>
                <Button 
                  className="w-full font-bold bg-accent text-accent-foreground hover:bg-accent/90 transition-all" 
                  size="lg"
                  disabled={!name.trim() || joinMutation.isPending}
                  onClick={() => {
                    joinMutation.mutate({ id: eventId, data: { name } });
                  }}
                >
                  {joinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Attend Event
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
