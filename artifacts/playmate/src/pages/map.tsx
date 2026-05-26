import { useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useListActivities, useListEvents } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Calendar, Clock, MapPin, Activity as ActivityIcon } from "lucide-react";
import { Link } from "wouter";
import L from "leaflet";
import { format } from "date-fns";

// Use standard lucide icons mapped to leaflet divIcons
function createMarkerIcon(color: string, shape: "circle" | "square" = "circle") {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: ${shape === 'circle' ? '50%' : '4px'}; border: 2px solid #fff; box-shadow: 0 0 10px ${color}80;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8]
  });
}

const colors = {
  pickleball: "#10b981", // green
  basketball: "#f97316", // orange
  volleyball: "#3b82f6", // blue
  cricket: "#eab308", // yellow
  tennis: "#8b5cf6", // lighter blue
  museum: "#ec4899", // pink
  coffee: "#a8a29e", // brown/gray
  other: "#94a3b8" // gray
};

const activityIcons = {
  pickleball: createMarkerIcon(colors.pickleball),
  basketball: createMarkerIcon(colors.basketball),
  volleyball: createMarkerIcon(colors.volleyball),
  cricket: createMarkerIcon(colors.cricket),
  tennis: createMarkerIcon(colors.tennis)
};

const eventIcons = {
  museum: createMarkerIcon(colors.museum, "square"),
  coffee: createMarkerIcon(colors.coffee, "square"),
  other: createMarkerIcon(colors.other, "square")
};

export default function MapPage() {
  const [filterType, setFilterType] = useState<"all" | "activities" | "events">("all");
  
  const { data: activities, isLoading: loadingActivities } = useListActivities();
  const { data: events, isLoading: loadingEvents } = useListEvents();

  const filteredActivities = useMemo(() => {
    if (!activities) return [];
    if (filterType === "events") return [];
    return activities;
  }, [activities, filterType]);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    if (filterType === "activities") return [];
    return events;
  }, [events, filterType]);

  const isLoading = loadingActivities || loadingEvents;

  return (
    <div className="absolute inset-0 flex flex-col h-full w-full">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] flex gap-2 bg-card p-1.5 rounded-full border border-border shadow-lg">
        <Button 
          variant={filterType === "all" ? "default" : "ghost"} 
          size="sm" 
          className={`rounded-full ${filterType === "all" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => setFilterType("all")}
        >
          All
        </Button>
        <Button 
          variant={filterType === "activities" ? "default" : "ghost"} 
          size="sm" 
          className={`rounded-full ${filterType === "activities" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => setFilterType("activities")}
        >
          Sports
        </Button>
        <Button 
          variant={filterType === "events" ? "default" : "ghost"} 
          size="sm" 
          className={`rounded-full ${filterType === "events" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => setFilterType("events")}
        >
          Social
        </Button>
      </div>

      {isLoading && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      <MapContainer 
        center={[23.0225, 72.5714]} 
        zoom={13} 
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
        />
        
        {filteredActivities.map(activity => (
          <Marker 
            key={`act-${activity.id}`} 
            position={[activity.latitude, activity.longitude]}
            icon={activityIcons[activity.type as keyof typeof activityIcons] || activityIcons.tennis}
          >
            <Popup className="custom-popup">
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 uppercase text-[10px] tracking-wider">
                    {activity.type}
                  </Badge>
                  <Badge variant="outline" className={activity.status === 'open' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                    {activity.status}
                  </Badge>
                </div>
                <h3 className="font-bold text-base mb-1">{activity.title}</h3>
                <div className="space-y-1 mb-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {format(new Date(activity.date), "MMM d, yyyy")}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock className="w-3 h-3" /> {activity.time}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Users className="w-3 h-3" /> {activity.currentPlayers} / {activity.maxPlayers} players</p>
                </div>
                <Link href={`/activity/${activity.id}`}>
                  <Button size="sm" className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90">View Details</Button>
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}

        {filteredEvents.map(event => (
          <Marker 
            key={`evt-${event.id}`} 
            position={[event.latitude, event.longitude]}
            icon={eventIcons[event.type as keyof typeof eventIcons] || eventIcons.other}
          >
            <Popup className="custom-popup">
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-accent/10 text-accent-foreground border-accent/20 uppercase text-[10px] tracking-wider">
                    {event.type}
                  </Badge>
                  <Badge variant="outline" className={event.status === 'open' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                    {event.status}
                  </Badge>
                </div>
                <h3 className="font-bold text-base mb-1">{event.title}</h3>
                <div className="space-y-1 mb-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {format(new Date(event.date), "MMM d, yyyy")}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock className="w-3 h-3" /> {event.time}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Users className="w-3 h-3" /> {event.currentAttendees} / {event.maxAttendees} attending</p>
                </div>
                <Link href={`/event/${event.id}`}>
                  <Button size="sm" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">View Details</Button>
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
