import { useState } from "react";
import { useLocation, Link } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import { useListActivities, useListEvents, useJoinActivity, activitiesKey } from "@/hooks/use-firestore";
import { useSessionProfile } from "@/hooks/use-session";
import { useQueryClient } from "@tanstack/react-query";
type Activity = any;
type Event = any;
import { Shield, MapPin, Clock, Users, ArrowRight } from "lucide-react";
import { Bolt } from "@/components/bolt";
import { sportEmoji, sportColor, dopeLevel, ghostFactor, skillToDope } from "@/lib/sport-meta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

type FeedItem = (Activity & { isEvent?: false }) | (Event & { isEvent: true });

export default function FeedPage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { uid, profile } = useSessionProfile();
  
  const [filterType, setFilterType] = useState<string>("All");
  const [filterSkill, setFilterSkill] = useState<string>("All Skills");
  const [womenOnly, setWomenOnly] = useState(false);
  
  const { data: activities = [], isLoading: isLoadingActivities } = useListActivities();
  const { data: events = [], isLoading: isLoadingEvents } = useListEvents();
  
  const joinActivity = useJoinActivity({
    mutation: {
      onSuccess: () => {
        toast({ title: "Joined successfully!" });
        queryClient.invalidateQueries({ queryKey: activitiesKey() });
      },
      onError: (error: any) => {
        toast({ title: "Failed to join", description: error.message, variant: "destructive" });
      }
    }
  });

  const handleJoin = (id: string) => {
    if (!uid || !profile) {
      toast({ title: "Sign in to join", description: "Joining is tied to your Pulse profile." });
      setLocation("/onboarding");
      return;
    }
    joinActivity.mutate({ id, data: { profileId: uid, name: profile.name } });
  };

  const isLoading = isLoadingActivities || isLoadingEvents;
  
  const feedItems: FeedItem[] = [
    ...activities.map(a => ({ ...a, isEvent: false as const })),
    ...events.map(e => ({ ...e, isEvent: true as const }))
  ].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`).getTime();
    const dateB = new Date(`${b.date}T${b.time}`).getTime();
    return dateA - dateB;
  });

  const filteredItems = feedItems.filter(item => {
    if (filterType !== "All") {
      if (filterType === "Sports") {
        if (item.isEvent) return false;
      } else if (filterType === "Social") {
        if (!item.isEvent) return false;
      } else {
        if (item.type.toLowerCase() !== filterType.toLowerCase() && 
            (item as any).activityKind?.toLowerCase() !== filterType.toLowerCase()) {
          return false;
        }
      }
    }
    
    if (filterSkill !== "All Skills" && !item.isEvent) {
      if ((item as any).skillLevel?.toLowerCase() !== filterSkill.toLowerCase()) {
        return false;
      }
    }
    
    if (womenOnly && !item.isEvent) {
      if ((item as any).genderPref !== "women_only") {
        return false;
      }
    }
    
    return true;
  });

  const openGames = activities.filter(a => a.status === "open").length;
  const openEvents = events.filter(e => e.status === "open").length;

  const renderCard = (item: FeedItem) => {
    const isEvent = item.isEvent;
    const dateStr = `${item.date}T${item.time}`;
    const dateObj = new Date(dateStr);
    
    const statusColor = item.status === "open" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400";
    const skill = (item as any).skillLevel?.toLowerCase();
    const dopeNum = skillToDope(skill, item.id);
    const dl = dopeLevel(dopeNum);
    const hostScore = (item as any).hostReliabilityScore ?? 85;
    const gf = ghostFactor(hostScore);
    const cost = (item as any).estimatedCostPerPerson || (item as any).venueFee
      ? ((item as any).estimatedCostPerPerson || ((item as any).venueFee / ((item as any).maxPlayers || 1)))
      : 0;
    
    return (
      <div key={`${isEvent ? 'evt' : 'act'}-${item.id}`} className="bg-card border border-border rounded-xl p-5 shadow-lg flex flex-col gap-4 relative overflow-hidden group hover:border-primary/50 transition-colors">
        {/* Top badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`capitalize font-bold border ${sportColor(item.type)}`}>
              {sportEmoji(item.type)} {item.type}
            </Badge>
            {!isEvent && (item as any).activityKind && (
              <Badge variant="outline" className="capitalize text-muted-foreground">
                {(item as any).activityKind}
              </Badge>
            )}
            {!isEvent && skill && (
              <div
                className="flex items-center gap-1 rounded-full px-2.5 py-0.5 border text-xs font-bold shrink-0"
                style={{ borderColor: `${dl.color}40`, background: `${dl.color}15`, color: dl.color }}
              >
                <span>{dl.emoji}</span>
                <span>Lv.{dopeNum}</span>
                <span className="opacity-60 text-[10px] hidden sm:inline">· {dl.name}</span>
              </div>
            )}
            {!isEvent && (item as any).genderPref === "women_only" && (
              <Badge variant="outline" className="bg-pink-500/10 text-pink-400 border-pink-500/20 gap-1">
                <Shield className="w-3 h-3" /> Women only
              </Badge>
            )}
          </div>
          <Badge className={`${statusColor} capitalize hover:${statusColor}`}>
            {item.status}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold leading-tight line-clamp-2">{item.title}</h3>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
            <span className="line-clamp-2">{(item as any).venue ? `${(item as any).venue}, ` : ''}{item.address}</span>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{format(dateObj, 'MMM d, h:mm a')}</span>
              {(item as any).expiresAt && (
                <span className="text-xs text-amber-400">Expires {formatDistanceToNow(new Date((item as any).expiresAt))}</span>
              )}
            </div>
          </div>
        </div>

        {/* Spots & Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm font-medium">
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-muted-foreground"/> Spots</span>
            <span>{isEvent ? (item as any).currentAttendees : (item as any).currentPlayers} / {isEvent ? (item as any).maxAttendees : (item as any).maxPlayers}</span>
          </div>
          <Progress 
            value={((isEvent ? (item as any).currentAttendees : (item as any).currentPlayers) / (isEvent ? (item as any).maxAttendees : (item as any).maxPlayers)) * 100} 
            className="h-2 bg-secondary"
          />
        </div>

        <div className="h-px bg-border my-1" />

        {/* Footer: Host & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-auto">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-10 h-10 border-2 border-background">
                <AvatarFallback className="bg-secondary text-secondary-foreground font-bold">
                  {item.hostName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {(item as any).isHostOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-card animate-pulse" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground">{item.hostName}</span>
              <div className="flex items-center gap-1.5">
                <span
                  className="flex items-center gap-0.5 text-[11px] font-black px-1.5 py-0.5 rounded border"
                  style={{ color: gf.color, borderColor: `${gf.color}40`, background: `${gf.color}15` }}
                  title={`Bolt Index ${gf.score} — ${gf.label}: ${gf.desc}`}
                >
                  {Array.from({ length: gf.ghosts }).map((_, i) => (
                    <span key={i}>⚡</span>
                  ))}
                  <span className="ml-0.5 uppercase tracking-wider">{gf.label}</span>
                </span>
                {cost > 0 && (
                  <Badge className="h-4 px-1 text-[10px] bg-primary/20 text-primary hover:bg-primary/30 border-transparent">
                    ~Rs.{Math.round(cost)}/person
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              className="flex-1 sm:flex-none border-border hover:bg-secondary"
              onClick={() => setLocation(isEvent ? `/event/${item.id}` : `/activity/${item.id}`)}
            >
              Details
            </Button>
            {item.status === "open" && !isEvent && (
              <Button 
                className="flex-1 sm:flex-none bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-[0_0_15px_rgba(0,180,224,0.25)]"
                onClick={() => handleJoin(item.id)}
                disabled={joinActivity.isPending}
              >
                Join Now
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-background animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="relative overflow-hidden pt-10 pb-6 px-4 md:px-8" style={{ background: "radial-gradient(ellipse 120% 100% at 50% 0%, #00B4E012 0%, #6366f108 40%, transparent 70%)" }}>
        <Bolt style={{ position:"absolute", top:0, left:"-20px", width:240, height:480, color:"#00B4E0", opacity:0.07, transform:"rotate(-15deg)", pointerEvents:"none" }} />
        <Bolt style={{ position:"absolute", top:0, right:"-20px", width:180, height:360, color:"#6366f1", opacity:0.06, transform:"rotate(16deg) scaleX(-1)", pointerEvents:"none" }} />
        <div className="max-w-4xl mx-auto relative">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-4">
            <span className="text-foreground block">What's</span>
            <span style={{ color:"#ffffff", textShadow:"0 0 40px #00B4E0aa, 0 0 80px #00B4E050" }}>Pulsing.</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium mb-5">
            <span className="text-foreground font-black">{openGames}</span> games · <span className="text-foreground font-black">{openEvents}</span> events open right now
          </p>
          
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex bg-secondary p-1 rounded-full">
              {['1km', '5km', '10km'].map(r => (
                <button key={r} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${r === '5km' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  {r}
                </button>
              ))}
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              <span className="text-foreground">{openGames}</span> games and <span className="text-foreground">{openEvents}</span> events open right now
            </p>
          </div>

          <ScrollArea className="w-full whitespace-nowrap pb-4">
            <div className="flex items-center gap-2">
              {['All', 'Sports', 'Social', 'Fitness', 'Coffee', 'Adventure', 'Hobby'].map(f => (
                <Button
                  key={f}
                  variant={filterType === f ? "default" : "outline"}
                  className={`rounded-full ${filterType === f ? 'bg-primary text-primary-foreground font-bold' : 'bg-transparent text-foreground hover:bg-secondary border-border'}`}
                  onClick={() => setFilterType(f)}
                >
                  {f}
                </Button>
              ))}
              <div className="w-px h-6 bg-border mx-2" />
              {['All Skills', 'Beginner', 'Intermediate', 'Advanced', 'Pro'].map(f => (
                <Button
                  key={f}
                  variant={filterSkill === f ? "secondary" : "outline"}
                  size="sm"
                  className={`rounded-full text-xs h-8 ${filterSkill === f ? 'bg-secondary text-foreground font-bold' : 'bg-transparent text-muted-foreground border-border border-dashed'}`}
                  onClick={() => setFilterSkill(f)}
                >
                  {f}
                </Button>
              ))}
              <div className="w-px h-6 bg-border mx-2" />
              <Button
                variant={womenOnly ? "default" : "outline"}
                size="sm"
                className={`rounded-full text-xs h-8 gap-1.5 ${womenOnly ? 'bg-pink-500 text-white hover:bg-pink-600 font-bold border-transparent' : 'bg-transparent text-muted-foreground border-border border-dashed'}`}
                onClick={() => setWomenOnly(!womenOnly)}
              >
                <Shield className="w-3 h-3" /> W Only
              </Button>
            </div>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>
        </div>
      </div>

      {/* Feed Area */}
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-card animate-pulse rounded-xl border border-border" />
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="space-y-6">
            {filteredItems.map(renderCard)}
          </div>
        ) : (
          <div className="text-center py-20 px-4">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No games near you right now</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              The map is clear in this area. Be the first to start something and get people playing!
            </p>
            <Button size="lg" className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 gap-2 shadow-[0_0_20px_rgba(0,180,224,0.3)]" onClick={() => setLocation("/create")}>
              Host an Activity <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
