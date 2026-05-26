import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateActivity, useCreateEvent, getListActivitiesQueryKey, getListEventsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { ActivityInput, EventInput } from "@workspace/api-client-react";

// Randomize across Ahmedabad city bounds
const getRandomAhmedabadLocation = () => {
  const lat = 23.0225 + (Math.random() - 0.5) * 0.12;
  const lng = 72.5714 + (Math.random() - 0.5) * 0.12;
  return { lat, lng };
};

const activitySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  type: z.enum(["pickleball", "basketball", "volleyball", "cricket", "tennis"]),
  description: z.string().optional(),
  address: z.string().min(5, "Please provide an address"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  maxPlayers: z.coerce.number().min(2, "Must allow at least 2 players"),
  hostName: z.string().min(2, "Name is required"),
});

const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  type: z.enum(["museum", "coffee", "other"]),
  description: z.string().optional(),
  address: z.string().min(5, "Please provide an address"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  maxAttendees: z.coerce.number().min(2, "Must allow at least 2 attendees"),
  hostName: z.string().min(2, "Name is required"),
});

export default function CreatePage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"activity" | "event">("activity");

  const createActivity = useCreateActivity({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListActivitiesQueryKey() });
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
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
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
      title: "", type: "pickleball", description: "", address: "", date: new Date().toISOString().split('T')[0], time: "18:00", maxPlayers: 4, hostName: ""
    }
  });

  const eventForm = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "", type: "coffee", description: "", address: "", date: new Date().toISOString().split('T')[0], time: "18:00", maxAttendees: 10, hostName: ""
    }
  });

  const onSubmitActivity = (values: z.infer<typeof activitySchema>) => {
    const loc = getRandomAhmedabadLocation();
    const payload: ActivityInput = {
      ...values,
      latitude: loc.lat,
      longitude: loc.lng
    };
    createActivity.mutate({ data: payload });
  };

  const onSubmitEvent = (values: z.infer<typeof eventSchema>) => {
    const loc = getRandomAhmedabadLocation();
    const payload: EventInput = {
      ...values,
      latitude: loc.lat,
      longitude: loc.lng
    };
    createEvent.mutate({ data: payload });
  };

  return (
    <div className="max-w-2xl mx-auto w-full p-4 md:p-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight mb-2">Host Something</h1>
        <p className="text-muted-foreground">Post a game or event and connect with others in your city.</p>
      </div>

      <Tabs defaultValue="activity" className="w-full" onValueChange={(v) => setMode(v as any)}>
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-card border border-border">
          <TabsTrigger value="activity" className="font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Sports Activity</TabsTrigger>
          <TabsTrigger value="event" className="font-bold data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">Social Event</TabsTrigger>
        </TabsList>

        <div className="bg-card border border-border rounded-xl p-6 shadow-xl">
          <TabsContent value="activity">
            <Form {...activityForm}>
              <form onSubmit={activityForm.handleSubmit(onSubmitActivity)} className="space-y-6">
                <FormField
                  control={activityForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Afternoon Pickleball at Central Park" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={activityForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sport</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select sport" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pickleball">Pickleball</SelectItem>
                            <SelectItem value="basketball">Basketball</SelectItem>
                            <SelectItem value="volleyball">Volleyball</SelectItem>
                            <SelectItem value="cricket">Cricket</SelectItem>
                            <SelectItem value="tennis">Tennis</SelectItem>
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
                        <FormLabel>Max Players</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={activityForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={activityForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location / Address</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Central Park Courts" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={activityForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Skill level required, equipment needed, etc." {...field} />
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
                        <Input placeholder="What should we call you?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" size="lg" className="w-full font-bold bg-primary text-primary-foreground hover:bg-primary/90" disabled={createActivity.isPending}>
                  {createActivity.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Post Activity
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="event">
            <Form {...eventForm}>
              <form onSubmit={eventForm.handleSubmit(onSubmitEvent)} className="space-y-6">
                <FormField
                  control={eventForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. MoMA Visit & Coffee" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={eventForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="museum">Museum</SelectItem>
                            <SelectItem value="coffee">Coffee</SelectItem>
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
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={eventForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={eventForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location / Address</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. The Blue Bottle at 5th Ave" {...field} />
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
                        <Textarea placeholder="What are we doing?" {...field} />
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
                        <Input placeholder="What should we call you?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" size="lg" className="w-full font-bold bg-accent text-accent-foreground hover:bg-accent/90" disabled={createEvent.isPending}>
                  {createEvent.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
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
