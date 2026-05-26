import { useLocation, useParams } from "wouter";
import { 
  useGetProfile, 
  useListCrews, 
  useSubmitKyc,
  getGetProfileQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Flame, Star, Trophy, Target, ShieldCheck, MapPin, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";

const kycSchema = z.object({
  docType: z.string().min(1, "Document type is required"),
  docNumber: z.string().min(5, "Document number is required")
});

export default function ProfilePage() {
  const params = useParams();
  const id = parseInt(params.id || "1", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [kycOpen, setKycOpen] = useState(false);

  const { data: profile, isLoading } = useGetProfile(id);

  const { data: crews = [] } = useListCrews();
  
  const submitKyc = useSubmitKyc({
    mutation: {
      onSuccess: () => {
        toast({ title: "Verification pending — review within 24 hours" });
        setKycOpen(false);
        queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey(id) });
      },
      onError: (err: any) => {
        toast({ title: "Verification failed", description: err.message, variant: "destructive" });
      }
    }
  });

  const form = useForm<z.infer<typeof kycSchema>>({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      docType: "",
      docNumber: ""
    }
  });

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!profile) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground">Profile not found</div>;
  }

  const userCrews = crews.filter(c => c.hostName.toLowerCase() === profile.name.toLowerCase() || (c.memberNames as string[]).some((m: string) => m.toLowerCase() === profile.name.toLowerCase()));
  
  const kycColor = profile.kycStatus === 'verified' ? 'bg-green-500/20 text-green-400' : profile.kycStatus === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-500/20 text-gray-400';

  return (
    <div className="flex-1 bg-background animate-in fade-in duration-500 max-w-3xl mx-auto w-full p-4 md:p-8 pb-20">
      {/* Top Section */}
      <div className="flex flex-col md:flex-row gap-8 items-start md:items-center mb-10">
        <div className="relative">
          <Avatar className="w-32 h-32 border-4 border-card shadow-2xl">
            <AvatarImage src={profile.avatarUrl ?? undefined} />
            <AvatarFallback className="text-4xl bg-secondary text-secondary-foreground font-black">
              {profile.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {profile.isVerified && (
            <div className="absolute bottom-0 right-0 bg-background rounded-full p-1 shadow-lg">
              <BadgeCheck className="w-8 h-8 text-blue-400 fill-blue-400/20" />
            </div>
          )}
        </div>
        
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-black text-foreground tracking-tight">{profile.name}</h1>
            <Badge className={`${kycColor} border-transparent capitalize`}>
              {profile.kycStatus || 'Not Verified'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="font-medium">{profile.locationArea || 'Ahmedabad'}, {profile.locationCity || 'Gujarat'}</span>
          </div>

          {profile.bio && (
            <p className="text-muted-foreground max-w-lg leading-relaxed">{profile.bio}</p>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            {profile.sports?.map((s, i) => {
              const skill = s.skillLevel?.toLowerCase();
              let sColor = "bg-secondary text-muted-foreground";
              if (skill === 'beginner') sColor = "bg-green-500/10 text-green-400 border-green-500/20";
              else if (skill === 'intermediate') sColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
              else if (skill === 'advanced') sColor = "bg-red-500/10 text-red-400 border-red-500/20";
              else if (skill === 'pro') sColor = "bg-purple-500/10 text-purple-400 border-purple-500/20";
              
              return (
                <Badge key={i} variant="outline" className={`gap-1.5 capitalize py-1 px-3 ${sColor}`}>
                  {s.sport} <span className="opacity-50 text-[10px]">•</span> {s.skillLevel}
                </Badge>
              )
            })}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Card className="bg-card border-border shadow-md">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-1">
            <Trophy className="w-5 h-5 text-primary mb-1" />
            <span className="text-2xl font-black">{profile.gamesPlayed || 0}</span>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Games Played</span>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-md">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-1">
            <Target className="w-5 h-5 text-primary mb-1" />
            <span className="text-2xl font-black">{profile.gamesHosted || 0}</span>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Games Hosted</span>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-md">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-1">
            <Flame className="w-5 h-5 text-orange-500 mb-1" />
            <span className="text-2xl font-black">{profile.streakWeeks || 0} wks</span>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Streak</span>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-md">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-1">
            <Star className="w-5 h-5 text-primary mb-1 fill-primary/20" />
            <span className="text-2xl font-black">—</span>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Avg Rating</span>
          </CardContent>
        </Card>
      </div>

      {/* Reputation Tags */}
      {profile.reputationTags && profile.reputationTags.length > 0 && (
        <div className="mb-10">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Reputation
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.reputationTags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="bg-secondary text-secondary-foreground font-medium py-1.5 px-4 rounded-full">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Crews */}
      {userCrews.length > 0 && (
        <div className="mb-10">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Crews
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {userCrews.map(crew => (
              <Card key={crew.id} className="bg-card border-border shadow-sm hover:border-primary/30 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                    <Users className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{crew.name}</h4>
                    <p className="text-xs text-muted-foreground">{crew.memberCount || 0} members</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* eKYC Section */}
      {profile.kycStatus !== 'verified' && profile.kycStatus !== 'pending' && (
        <Collapsible open={kycOpen} onOpenChange={setKycOpen} className="bg-card border border-border rounded-xl overflow-hidden shadow-lg mt-8">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full flex items-center justify-between p-6 h-auto hover:bg-secondary/50 rounded-none">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                  <BadgeCheck className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Verify Your Identity (eKYC)</h3>
                  <p className="text-sm text-muted-foreground font-normal mt-0.5">Verified players get a blue checkmark, boosting trust</p>
                </div>
              </div>
              <div className={`transform transition-transform ${kycOpen ? 'rotate-180' : ''}`}>
                ▼
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-6 pt-0 border-t border-border bg-card/50">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(data => submitKyc.mutate({ id, data }))} className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="docType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select ID type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Aadhaar">Aadhaar</SelectItem>
                            <SelectItem value="PAN">PAN Card</SelectItem>
                            <SelectItem value="Driving License">Driving License</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="docNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter ID number" className="bg-background" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={submitKyc.isPending} className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 mt-2">
                    {submitKyc.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Submit Verification
                  </Button>
                </form>
              </Form>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
