import { useState, useMemo } from "react";
import { useListActivities, useListEvents, useGetSummaryStats } from "@/hooks/use-firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Users, Calendar, Clock, MapPin, Search } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Discover</h1>
          <p className="text-muted-foreground">
            {stats ? `Found ${stats.openActivities} open activities and ${stats.openEvents} events nearby.` : "Find pickup games and social events in your area."}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={filterType === "all" ? "default" : "outline"} 
            className={filterType === "all" ? "bg-primary text-primary-foreground font-bold" : ""}
            onClick={() => setFilterType("all")}
          >
            All
          </Button>
          <Button 
            variant={filterType === "activities" ? "default" : "outline"} 
            className={filterType === "activities" ? "bg-primary text-primary-foreground font-bold" : ""}
            onClick={() => setFilterType("activities")}
          >
            Sports
          </Button>
          <Button 
            variant={filterType === "events" ? "default" : "outline"} 
            className={filterType === "events" ? "bg-primary text-primary-foreground font-bold" : ""}
            onClick={() => setFilterType("events")}
          >
            Social
          </Button>
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
