import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateActivity, useCreateEvent, activitiesKey, eventsKey } from "@/hooks/use-firestore";
type ActivityInput = any;
type EventInput = any;
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useSessionProfile } from "@/hooks/use-session";
import { Loader2 } from "lucide-react";

const getRandomAhmedabadLocation = () => {
  const lat = 23.0225 + (Math.random() - 0.5) * 0.12;
  const lng = 72.5714 + (Math.random() - 0.5) * 0.12;
  return { lat, lng };
};

// A game/event must start in the future — items whose start time has
// already passed are filtered out of every feed by isExpired(), so a
// past date would be created "successfully" but never be seen.
const startsInFuture = (v: { date: string; time: string }) =>
  new Date(`${v.date}T${v.time}`).getTime() > Date.now();

const activitySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  type: z.string().min(1, "Sport type is required"),
  activityKind: z.enum(["sport", "fitness", "adventure", "hobby"]),
  skillLevel: z.enum(["beginner", "intermediate", "advanced", "pro"]),
  genderPref: z.enum(["open", "women_only"]),
  description: z.string().optional(),
  address: z.string().min(5, "Please provide an address"),
  venue: z.string().optional(),
  venueFee: z.coerce.number().min(0).default(0),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  maxPlayers: z.coerce.number().int("Whole number required").min(2, "Must allow at least 2 players").max(100, "Max 100 players"),
  hostName: z.string().min(2, "Name is required"),
}).refine(startsInFuture, { message: "Start time must be in the future", path: ["time"] });

const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  type: z.string().min(1, "Event type is required"),
  description: z.string().optional(),
  address: z.string().min(5, "Please provide an address"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  maxAttendees: z.coerce.number().int("Whole number required").min(2, "Must allow at least 2 attendees").max(500, "Max 500 attendees"),
  hostName: z.string().min(2, "Name is required"),
}).refine(startsInFuture, { message: "Start time must be in the future", path: ["time"] });

export default function CreatePage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"activity" | "event">("activity");
  const { uid, profile } = useSessionProfile();

  const createActivity = useCreateActivity({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: activitiesKey() });
        toast({ title: "Activity created successfully!" });
        setLocation(`/activity/${data.id}`);
      },
      onError: (err: any) => {
        toast({ title: "Failed to create activity", description: err.message, variant: "destructive" });
      }
    }
  });

  const createEvent = useCreateEvent({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: eventsKey() });
        toast({ title: "Event created successfully!" });
        setLocation(`/event/${data.id}`);
      },
      onError: (err: any) => {
        toast({ title: "Failed to create event", description: err.message, variant: "destructive" });
      }
    }
  });

  const activityForm = useForm<z.infer<typeof activitySchema>>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: "", type: "Pickleball", activityKind: "sport", skillLevel: "beginner", genderPref: "open", description: "", address: "", venue: "", venueFee: 0, date: new Date().toISOString().split('T')[0], time: "18:00", maxPlayers: 4, hostName: ""
    }
  });

  const eventForm = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "", type: "coffee", description: "", address: "", date: new Date().toISOString().split('T')[0], time: "18:00", maxAttendees: 10, hostName: ""
    }
  });

  // Prefill host name from the signed-in profile — but never clobber
  // something the user already typed.
  useEffect(() => {
    if (profile?.name) {
      if (!activityForm.getValues("hostName")) activityForm.setValue("hostName", profile.name);
      if (!eventForm.getValues("hostName")) eventForm.setValue("hostName", profile.name);
    }
  }, [profile?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmitActivity = (values: z.infer<typeof activitySchema>) => {
    const loc = getRandomAhmedabadLocation();
    const payload: ActivityInput = {
      ...values,
      // Respect the (editable) name field; fall back to the profile name
      hostName: values.hostName || profile?.name || "",
      hostProfileId: uid ?? null,
      latitude: loc.lat,
      longitude: loc.lng
    };
    createActivity.mutate({ data: payload });
  };

  const onSubmitEvent = (values: z.infer<typeof eventSchema>) => {
    const loc = getRandomAhmedabadLocation();
    const payload: EventInput = {
      ...values,
      hostName: values.hostName || profile?.name || "",
      hostProfileId: uid ?? null,
      latitude: loc.lat,
      longitude: loc.lng
    };
    createEvent.mutate({ data: payload });
  };

  const venueFee = activityForm.watch("venueFee");
  const maxPlayers = activityForm.watch("maxPlayers");
  const estimatedCost = venueFee > 0 && maxPlayers > 0 ? Math.round(venueFee / maxPlayers) : 0;

  return (
    <div className="max-w-3xl mx-auto w-full p-4 md:p-8 animate-in fade-in duration-500 pb-20">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 text-primary">Host Something</h1>
        <p className="text-muted-foreground text-lg">Post a game or event and connect with others in your city.</p>
      </div>

      <Tabs defaultValue="activity" className="w-full" onValueChange={(v) => setMode(v as any)}>
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-card border border-border h-14 rounded-xl p-1">
          <TabsTrigger value="activity" className="font-bold rounded-lg text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Sports Activity</TabsTrigger>
          <TabsTrigger value="event" className="font-bold rounded-lg text-base data-[state=active]:bg-accent data-[state=active]:text-accent-foreground transition-all">Social Event</TabsTrigger>
        </TabsList>

        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-xl">
          <TabsContent value="activity" className="mt-0 outline-none">
            <Form {...activityForm}>
              <form onSubmit={activityForm.handleSubmit(onSubmitActivity)} className="space-y-8">
                <FormField
                  control={activityForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Sunday Morning Pickleball" className="text-lg py-6 bg-background" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-6 bg-background p-6 rounded-xl border border-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={activityForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sport / Activity Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-card">
                                <SelectValue placeholder="Select sport" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Pickleball">Pickleball</SelectItem>
                              <SelectItem value="Basketball">Basketball</SelectItem>
                              <SelectItem value="Football">Football</SelectItem>
                              <SelectItem value="Badminton">Badminton</SelectItem>
                              <SelectItem value="Cricket">Cricket</SelectItem>
                              <SelectItem value="Tennis">Tennis</SelectItem>
                              <SelectItem value="Running">Running</SelectItem>
                              <SelectItem value="Cycling">Cycling</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={activityForm.control}
                      name="maxPlayers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Spots (Including you)</FormLabel>
                          <FormControl>
                            <Input type="number" className="bg-card" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={activityForm.control}
                    name="activityKind"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <div className="flex flex-wrap bg-card p-1 rounded-lg border border-border">
                          {['sport', 'fitness', 'adventure', 'hobby'].map(k => (
                            <button
                              key={k}
                              type="button"
                              className={`flex-1 min-w-[80px] py-2 text-sm font-bold rounded-md transition-colors capitalize ${field.value === k ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                              onClick={() => field.onChange(k)}
                            >
                              {k}
                            </button>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={activityForm.control}
                      name="skillLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Required Skill Level</FormLabel>
                          <div className="flex flex-col gap-2">
                            {['beginner', 'intermediate', 'advanced', 'pro'].map(l => (
                              <button
                                key={l}
                                type="button"
                                className={`py-2 px-3 text-sm font-bold rounded-md text-left transition-colors capitalize border ${field.value === l ? 'bg-secondary border-border text-foreground' : 'bg-transparent border-transparent text-muted-foreground hover:bg-secondary/50'}`}
                                onClick={() => field.onChange(l)}
                              >
                                {l}
                              </button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={activityForm.control}
                      name="genderPref"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Who can join?</FormLabel>
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              className={`py-3 px-4 text-sm font-bold rounded-md text-left transition-colors border ${field.value === 'open' ? 'bg-secondary border-border text-foreground' : 'bg-transparent border-transparent text-muted-foreground hover:bg-secondary/50'}`}
                              onClick={() => field.onChange('open')}
                            >
                              Open to All
                            </button>
                            <button
                              type="button"
                              className={`py-3 px-4 text-sm font-bold rounded-md text-left transition-colors border ${field.value === 'women_only' ? 'bg-pink-500/10 border-pink-500/30 text-pink-500' : 'bg-transparent border-transparent text-muted-foreground hover:bg-secondary/50'}`}
                              onClick={() => field.onChange('women_only')}
                            >
                              Women Only
                            </button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-background p-6 rounded-xl border border-border">
                  <FormField
                    control={activityForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" className="bg-card" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={activityForm.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <FormControl>
                          <Input type="time" className="bg-card" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-6 bg-background p-6 rounded-xl border border-border">
                  <FormField
                    control={activityForm.control}
                    name="venue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Venue / Court Name (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. SG Sports Arena" className="bg-card" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={activityForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Full street address" className="bg-card" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={activityForm.control}
                    name="venueFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Venue Booking Cost (Rs. Total)</FormLabel>
                        <FormControl>
                          <Input type="number" className="bg-card" {...field} />
                        </FormControl>
                        {estimatedCost > 0 && (
                          <p className="text-sm font-bold text-primary mt-2 flex items-center gap-2">
                            Estimated <span className="bg-primary/20 px-2 py-0.5 rounded-sm">~Rs.{estimatedCost}/person</span>
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-6">
                  <FormField
                    control={activityForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Optional Note</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Any specific rules, what to bring, etc." className="bg-background min-h-[100px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={activityForm.control}
                    name="hostName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                          <Input placeholder="How should players identify you?" className="bg-background" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" size="lg" className="w-full font-bold bg-primary text-primary-foreground hover:bg-primary/90 py-6 text-lg shadow-[0_0_20px_rgba(0,180,224,0.25)]" disabled={createActivity.isPending}>
                  {createActivity.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  Post Activity
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="event" className="mt-0 outline-none">
            <Form {...eventForm}>
              <form onSubmit={eventForm.handleSubmit(onSubmitEvent)} className="space-y-8">
                <FormField
                  control={eventForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Sunday Board Games" className="text-lg py-6 bg-background" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-background p-6 rounded-xl border border-border">
                  <FormField
                    control={eventForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-card">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="social">Social Mixer</SelectItem>
                            <SelectItem value="coffee">Coffee Run</SelectItem>
                            <SelectItem value="museum">Museum/Art</SelectItem>
                            <SelectItem value="food">Food/Dining</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={eventForm.control}
                    name="maxAttendees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Attendees</FormLabel>
                        <FormControl>
                          <Input type="number" className="bg-card" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-background p-6 rounded-xl border border-border">
                  <FormField
                    control={eventForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" className="bg-card" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={eventForm.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <FormControl>
                          <Input type="time" className="bg-card" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-6">
                  <FormField
                    control={eventForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location / Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Where are we meeting?" className="bg-background" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={eventForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="What are we doing?" className="bg-background min-h-[100px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={eventForm.control}
                    name="hostName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                          <Input placeholder="What should we call you?" className="bg-background" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" size="lg" className="w-full font-bold bg-accent text-accent-foreground hover:bg-accent/90 py-6 text-lg" disabled={createEvent.isPending}>
                  {createEvent.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  Post Event
                </Button>
              </form>
            </Form>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
