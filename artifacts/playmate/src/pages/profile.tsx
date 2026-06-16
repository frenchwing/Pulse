import { useLocation, useParams } from "wouter";
import { useGetProfile, useListCrews, useSubmitKyc, profileKey } from "@/hooks/use-firestore";
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
import { Bolt } from "@/components/bolt";
import { sportHex, loyaltyBadge, skillToDope } from "@/lib/sport-meta";
import { PlayerCardModal } from "@/components/player-card";

const kycSchema = z.object({
  docType: z.string().min(1, "Document type is required"),
  docNumber: z.string().min(5, "Document number is required")
});

export default function ProfilePage() {
  const params = useParams();
  const id = params.id || "";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [kycOpen, setKycOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);

  const { data: profile, isLoading } = useGetProfile(id);

  const { data: crews = [] } = useListCrews();
  
  const submitKyc = useSubmitKyc({
    mutation: {
      onSuccess: () => {
        toast({ title: "Verification pending — review within 24 hours" });
        setKycOpen(false);
        queryClient.invalidateQueries({ queryKey: profileKey(String(id)) });
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

  const primarySport = profile.sports?.[0]?.sport ?? "other";
  const primarySkill = profile.sports?.[0]?.skillLevel ?? "intermediate";
  const hex = sportHex(primarySport);
  const lb = loyaltyBadge(profile.streakWeeks || 0, profile.gamesPlayed || 0);
  const dopeRating = skillToDope(primarySkill, id || profile.name || "");

  return (
    <div className="flex-1 bg-background animate-in fade-in duration-500 pb-20">
      {/* Hero */}
      <div
        className="relative overflow-hidden pt-12 pb-10 px-4 md:px-8"
        style={{ background: `radial-gradient(ellipse 120% 100% at 50% 0%, ${hex.accent}12 0%, #6366f108 40%, transparent 70%)` }}
      >
        <Bolt style={{ position:"absolute", top:0, left:"-20px", width:220, height:440, color:hex.accent, opacity:0.07, transform:"rotate(-15deg)", pointerEvents:"none" }} />
        <Bolt style={{ position:"absolute", top:0, right:"-20px", width:160, height:320, color:"#6366f1", opacity:0.06, transform:"rotate(16deg) scaleX(-1)", pointerEvents:"none" }} />

        <div className="max-w-3xl mx-auto relative flex flex-col md:flex-row gap-8 items-start md:items-center">
          <button
            type="button"
            onClick={() => setCardOpen(true)}
            className="relative shrink-0 cursor-pointer group focus:outline-none transition-transform hover:scale-[1.04] active:scale-[0.98]"
            aria-label="View player card"
          >
            <Avatar
              className="w-32 h-32 border-4 shadow-2xl transition-all group-hover:shadow-[0_0_60px_var(--avatar-glow)]"
              style={{
                borderColor: hex.accent,
                boxShadow: `0 0 40px ${hex.glow}50`,
                ["--avatar-glow" as any]: `${hex.glow}aa`,
              }}
            >
              <AvatarImage src={profile.avatarUrl ?? undefined} />
              <AvatarFallback
                className="text-4xl font-black"
                style={{ background: `linear-gradient(135deg,${hex.accent}40,${hex.accent}15)`, color: hex.accent }}
              >
                {profile.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {profile.isVerified && (
              <div className="absolute bottom-0 right-0 bg-background rounded-full p-1 shadow-lg">
                <BadgeCheck className="w-8 h-8 text-blue-400 fill-blue-400/20" />
              </div>
            )}
            <div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-[10px] font-black whitespace-nowrap border"
              style={{ background: "#0a0e14", borderColor: lb.color, color: lb.color, boxShadow: `0 0 10px ${lb.color}40` }}
            >
              {lb.emoji} {lb.label}
            </div>
            <span
              className="absolute -top-2 -right-2 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: hex.accent, color: "#0a0e14", boxShadow: `0 0 14px ${hex.accent}` }}
            >
              Tap
            </span>
          </button>

          <div className="flex-1 space-y-4 pt-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight" style={{ color: "#ffffff", textShadow: `0 0 30px ${hex.accent}70` }}>
                {profile.name}
              </h1>
              <Badge className={`${kycColor} border-transparent capitalize`}>
                {profile.kycStatus || 'Not Verified'}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" style={{ color: hex.accent }} />
              <span className="font-medium">{profile.locationArea || 'Ahmedabad'}, {profile.locationCity || 'Gujarat'}</span>
            </div>

            {profile.bio && (
              <p className="text-muted-foreground max-w-lg leading-relaxed">{profile.bio}</p>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              {profile.sports?.map((s, i) => {
                const sh = sportHex(s.sport);
                return (
                  <Badge
                    key={i}
                    variant="outline"
                    className="gap-1.5 capitalize py-1 px-3 border"
                    style={{ borderColor: `${sh.accent}40`, background: `${sh.accent}12`, color: sh.accent }}
                  >
                    {s.sport} <span className="opacity-50 text-[10px]">•</span> {s.skillLevel}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full px-4 md:px-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 mt-6">
          {[
            { icon: Trophy, value: profile.gamesPlayed || 0, label: "Games Played", color: hex.accent },
            { icon: Target, value: profile.gamesHosted || 0, label: "Games Hosted", color: hex.accent },
            { icon: Flame, value: `${profile.streakWeeks || 0} wks`, label: "Streak", color: "#f59e0b" },
            { icon: Star, value: "—", label: "Avg Rating", color: hex.accent },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-2xl border p-4 flex flex-col items-center justify-center text-center gap-1 transition-all hover:scale-[1.03]"
              style={{ background: `linear-gradient(160deg,${stat.color}14 0%,#0d1117 100%)`, borderColor: `${stat.color}30`, boxShadow: `0 0 16px ${stat.color}10` }}
            >
              <stat.icon className="w-5 h-5 mb-1" style={{ color: stat.color }} />
              <span className="text-2xl font-black text-foreground">{stat.value}</span>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Reputation Tags */}
        {profile.reputationTags && profile.reputationTags.length > 0 && (
          <div className="mb-10">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" style={{ color: hex.accent }} />
              Reputation
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.reputationTags.map((tag, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="font-bold py-1.5 px-4 rounded-full border"
                  style={{ borderColor: `${hex.accent}30`, background: `${hex.accent}10`, color: hex.accent }}
                >
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
              <Users className="w-5 h-5" style={{ color: hex.accent }} />
              Crews
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userCrews.map(crew => (
                <div
                  key={crew.id}
                  className="rounded-2xl border p-4 flex items-center gap-4 transition-all hover:scale-[1.02]"
                  style={{ background: `linear-gradient(160deg,${hex.accent}10 0%,#0d1117 100%)`, borderColor: `${hex.accent}25` }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${hex.accent}20`, border: `1.5px solid ${hex.accent}40` }}
                  >
                    <Users className="w-6 h-6" style={{ color: hex.accent }} />
                  </div>
                  <div>
                    <h4 className="font-black text-foreground">{crew.name}</h4>
                    <p className="text-xs text-muted-foreground">{crew.memberCount || 0} members</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* eKYC Section */}
        {profile.kycStatus !== 'verified' && profile.kycStatus !== 'pending' && (
          <Collapsible open={kycOpen} onOpenChange={setKycOpen} className="rounded-2xl border overflow-hidden shadow-lg mt-8" style={{ borderColor: `${hex.accent}25`, background: `linear-gradient(160deg,${hex.accent}08 0%,#0d1117 100%)` }}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full flex items-center justify-between p-6 h-auto hover:bg-secondary/50 rounded-none">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: `${hex.accent}15` }}>
                    <BadgeCheck className="w-5 h-5" style={{ color: hex.accent }} />
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
                    <Button type="submit" disabled={submitKyc.isPending} className="w-full font-bold mt-2 text-white" style={{ background: `linear-gradient(135deg,${hex.accent},#6366f1)` }}>
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

      <PlayerCardModal
        open={cardOpen}
        onOpenChange={setCardOpen}
        profile={profile as any}
        dopeRating={dopeRating}
      />
    </div>
  );
}
