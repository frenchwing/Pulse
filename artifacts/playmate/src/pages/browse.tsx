import { useState, useMemo } from "react";
import { useListActivities, useListEvents, useGetSummaryStats } from "@/hooks/use-firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Users, Calendar, Clock, MapPin, Search } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Bolt } from "@/components/bolt";

export default function BrowsePage() {
  const [filterType, setFilterType] = useState<"all" | "activities" | "events">("all");
  const [search, setSearch] = useState("");
  
  const { data: activities, isLoading: loadingActivities } = useListActivities();
  const { data: events, isLoading: loadingEvents } = useListEvents();
  const { data: stats } = useGetSummaryStats();

  const combinedItems = useMemo(() => {
    const list = [];
    if (activities && filterType !== "events") {
      list.push(...activities.map(a => ({ ...a, kind: 'activity' as const })));
    }
    if (events && filterType !== "activities") {
      list.push(...events.map(e => ({ ...e, kind: 'event' as const })));
    }
    
    // Sort by date mostly
    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (search) {
      const q = search.toLowerCase();
      return list.filter(item => 
        item.title.toLowerCase().includes(q) || 
        item.type.toLowerCase().includes(q) ||
        item.address.toLowerCase().includes(q)
      );
    }
    
    return list;
  }, [activities, events, filterType, search]);

  const isLoading = loadingActivities || loadingEvents;

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      {/* Hero */}
      <div className="relative overflow-hidden pt-10 pb-8 px-0 -mx-4 md:-mx-8 mb-8" style={{ background: "radial-gradient(ellipse 120% 100% at 50% 0%, #00B4E012 0%, #6366f108 40%, transparent 70%)" }}>
        <Bolt style={{ position:"absolute", top:0, left:"-20px", width:220, height:440, color:"#00B4E0", opacity:0.07, transform:"rotate(-15deg)", pointerEvents:"none" }} />
        <Bolt style={{ position:"absolute", top:0, right:"-20px", width:160, height:320, color:"#6366f1", opacity:0.06, transform:"rotate(16deg) scaleX(-1)", pointerEvents:"none" }} />
        <div className="relative px-4 md:px-8">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-3">
            <span className="text-foreground block">Find</span>
            <span style={{ color:"#ffffff", textShadow:"0 0 40px #00B4E0aa, 0 0 80px #00B4E050" }}>Your Game.</span>
          </h1>
          <p className="text-muted-foreground text-sm mb-5">
            {stats
              ? <><span className="text-foreground font-black">{stats.openActivities}</span> open activities · <span className="text-foreground font-black">{stats.openEvents}</span> events near you</>
              : "Pickup games and social events in Ahmedabad."}
          </p>
          <div className="flex gap-2 flex-wrap">
            {(["all", "activities", "events"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className="rounded-full px-4 py-1.5 text-sm font-bold border transition-all"
                style={filterType === f
                  ? { background:"linear-gradient(135deg,#00B4E0,#6366f1)", color:"#fff", border:"none", boxShadow:"0 0 20px #00B4E040" }
                  : { background:"transparent", borderColor:"#ffffff20", color:"#888" }}
              >
                {f === "all" ? "All" : f === "activities" ? "Sports" : "Social"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input 
          className="pl-10 h-12 bg-card border-border shadow-sm text-base"
          placeholder="Search by name, sport, location..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : combinedItems.length === 0 ? (
        <div className="text-center py-20 bg-card/50 rounded-xl border border-border border-dashed">
          <p className="text-muted-foreground mb-4">No activities or events found.</p>
          <Button variant="outline" onClick={() => setSearch("")}>Clear Filters</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {combinedItems.map((item, index) => {
            const isActivity = item.kind === 'activity';
            const isOpen = item.status === 'open';
            const currentCount = isActivity ? (item as any).currentPlayers : (item as any).currentAttendees;
            const maxCount = isActivity ? (item as any).maxPlayers : (item as any).maxAttendees;
            const linkHref = isActivity ? `/activity/${item.id}` : `/event/${item.id}`;
            
            return (
              <Card 
                key={`${item.kind}-${item.id}`} 
                className="overflow-hidden flex flex-col group hover:border-primary/50 transition-colors bg-card animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
              >
                <div className="p-5 flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className={isActivity ? "bg-primary/10 text-primary border-primary/20" : "bg-accent/10 text-accent-foreground border-accent/20"}>
                      {item.type}
                    </Badge>
                    <Badge variant="outline" className={isOpen ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                      {item.status}
                    </Badge>
                  </div>
                  
                  <h3 className="font-bold text-xl mb-3 line-clamp-2">{item.title}</h3>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> 
                      {format(new Date(item.date), "MMM d, yyyy")} at {item.time}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0" /> 
                      <span className="line-clamp-1">{item.address}</span>
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Users className="w-4 h-4" /> 
                      {currentCount} / {maxCount} {isActivity ? 'players' : 'attending'}
                    </p>
                  </div>
                </div>
                
                <div className="p-4 border-t border-border/50 bg-secondary/20 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs">
                      {item.hostName.charAt(0).toUpperCase()}
                    </div>
                    {item.hostName}
                  </div>
                  <Link href={linkHref}>
                    <Button size="sm" variant={isActivity ? "default" : "secondary"} className={isActivity ? "font-bold" : ""}>
                      Details
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
