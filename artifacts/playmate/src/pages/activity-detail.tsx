import { useState } from "react";
import { useParams, Link } from "wouter";
import { useGetActivity, useJoinActivity, getGetActivityQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Calendar, Clock, MapPin, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const activityId = Number(id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: activity, isLoading, isError } = useGetActivity(activityId, {
    query: {
      enabled: !!activityId,
      queryKey: getGetActivityQueryKey(activityId)
    }
  });

  const joinMutation = useJoinActivity({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetActivityQueryKey(activityId) });
        toast({
          title: "Joined successfully",
          description: "You're in! Have fun.",
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

  if (isError || !activity) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 space-y-4">
        <h2 className="text-2xl font-bold">Activity not found</h2>
        <Link href="/">
          <Button variant="outline">Back to Map</Button>
        </Link>
      </div>
    );
  }

  const isFull = activity.status === 'full' || activity.currentPlayers >= activity.maxPlayers;
  const isOpen = activity.status === 'open';

  return (
    <div className="max-w-3xl mx-auto w-full p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Map
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Badge className="bg-primary/20 text-primary border-primary/30 uppercase tracking-widest text-xs px-3 py-1">
                {activity.type}
              </Badge>
              <Badge variant="outline" className={isOpen ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                {activity.status}
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-foreground">
              {activity.title}
            </h1>
            <div className="flex flex-wrap gap-4 text-muted-foreground text-sm font-medium">
              <span className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-md">
                <Calendar className="w-4 h-4 text-primary" /> 
                {format(new Date(activity.date), "EEEE, MMMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-md">
                <Clock className="w-4 h-4 text-primary" /> 
                {activity.time}
              </span>
              <span className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-md">
                <MapPin className="w-4 h-4 text-primary" /> 
                {activity.address}
              </span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-3 border-b border-border pb-2">About this game</h3>
            <p className="text-muted-foreground leading-relaxed">
              {activity.description || "No description provided."}
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-xl border-2 border-primary/50">
              {activity.hostName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hosted by</p>
              <p className="font-bold">{activity.hostName}</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="bg-card border border-border rounded-xl p-6 shadow-xl sticky top-24">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">Players</span>
                <span className="text-sm font-medium text-muted-foreground">
                  {activity.currentPlayers} / {activity.maxPlayers}
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-primary h-2.5 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_var(--primary)]" 
                  style={{ width: `${Math.min(100, (activity.currentPlayers / activity.maxPlayers) * 100)}%` }}
                ></div>
              </div>
            </div>

            {hasJoined ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="font-bold text-green-500">You're in!</p>
                <p className="text-sm text-green-500/80">See you on the court.</p>
              </div>
            ) : isFull ? (
              <Button disabled className="w-full" size="lg" variant="secondary">
                Game is Full
              </Button>
            ) : !isOpen ? (
              <Button disabled className="w-full" size="lg" variant="secondary">
                Game Closed
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Your Name</label>
                  <Input 
                    placeholder="Enter your name to join" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="bg-background/50 border-input"
                  />
                </div>
                <Button 
                  className="w-full font-bold text-primary-foreground bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(245,230,66,0.3)] transition-all hover:shadow-[0_0_30px_rgba(245,230,66,0.5)]" 
                  size="lg"
                  disabled={!name.trim() || joinMutation.isPending}
                  onClick={() => {
                    joinMutation.mutate({ id: activityId, data: { name } });
                  }}
                >
                  {joinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Join Game
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
