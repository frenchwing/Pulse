import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getProfileByPhone, createProfile } from "@/lib/firestore";
import { Phone, Shield, ArrowRight, CheckCircle2, Loader2, PlaySquare, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const phoneSchema = z.object({ phone: z.string().min(10, "Valid phone number required") });
const otpSchema = z.object({ code: z.string().length(6, "OTP must be 6 digits") });
const profileSchema = z.object({
  name: z.string().min(2, "Name is required"),
  gender: z.enum(["Man", "Woman", "Other"]),
  womenOnlyPref: z.boolean().default(false),
  locationArea: z.string().min(2, "Location is required"),
  bio: z.string().max(120, "Max 120 characters").optional(),
});

const SPORT_OPTIONS = [
  "Badminton", "Tennis", "Pickleball", "Football", "Basketball",
  "Cricket", "Volleyball", "Running", "Cycling", "Gym", "Swimming", "Other",
];

export default function OnboardingPage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedSports, setSelectedSports] = useState<{ sport: string; skill: string }[]>([]);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
    return () => { recaptchaRef.current?.clear(); };
  }, []);

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });
  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: "" },
  });
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", gender: "Man", womenOnlyPref: false, locationArea: "", bio: "" },
  });

  const onPhoneSubmit = async (values: z.infer<typeof phoneSchema>) => {
    setIsSending(true);
    try {
      const fullPhone = "+91" + values.phone.replace(/\s/g, "");
      setPhone(values.phone);
      const result = await signInWithPhoneNumber(auth, fullPhone, recaptchaRef.current!);
      setConfirmationResult(result);
      setShowOtp(true);
      toast({ title: "OTP sent", description: `Sent to +91 ${values.phone}` });
    } catch (err: any) {
      toast({ title: "Failed to send OTP", description: err.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const onOtpSubmit = async (values: z.infer<typeof otpSchema>) => {
    if (!confirmationResult) return;
    setIsVerifying(true);
    try {
      const credential = await confirmationResult.confirm(values.code);
      const uid = credential.user.uid;
      const existing = await getProfileByPhone("+91" + phone.replace(/\s/g, ""));
      if (existing) {
        toast({ title: "Welcome back!" });
        setLocation("/");
      } else {
        setStep(2);
      }
    } catch (err: any) {
      toast({ title: "Invalid OTP", description: err.message, variant: "destructive" });
    } finally {
      setIsVerifying(false);
    }
  };

  const onProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (selectedSports.length === 0) {
      toast({ title: "Select at least one sport", variant: "destructive" });
      return;
    }
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setIsCreating(true);
    try {
      await createProfile(uid, {
        name: values.name,
        phone: "+91" + phone.replace(/\s/g, ""),
        gender: values.gender,
        womenOnlyPref: values.womenOnlyPref,
        locationArea: values.locationArea,
        bio: values.bio ?? null,
        sports: selectedSports.map(s => ({ sport: s.sport, skillLevel: s.skill })),
      });
      setStep(3);
    } catch (err: any) {
      toast({ title: "Failed to create profile", description: err.message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const toggleSport = (sport: string) => {
    if (selectedSports.some(s => s.sport === sport)) {
      setSelectedSports(selectedSports.filter(s => s.sport !== sport));
    } else {
      setSelectedSports([...selectedSports, { sport, skill: "Beginner" }]);
    }
  };

  const updateSportSkill = (sport: string, skill: string) => {
    setSelectedSports(selectedSports.map(s => s.sport === sport ? { ...s, skill } : s));
  };

  return (
    <div className="flex-1 bg-background min-h-screen flex items-center justify-center p-4">
      {/* Invisible reCAPTCHA anchor */}
      <div id="recaptcha-container" />

      {step === 1 && (
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <PlaySquare className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-2">Join Pulse</h1>
            <p className="text-muted-foreground">Enter your phone number to get started</p>
          </div>

          {!showOtp ? (
            <Form {...phoneForm}>
              <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-6">
                <FormField
                  control={phoneForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <div className="relative flex">
                        <div className="flex items-center justify-center bg-secondary text-muted-foreground px-4 rounded-l-md border border-r-0 border-input font-medium">
                          +91
                        </div>
                        <FormControl>
                          <Input className="rounded-l-none text-lg" placeholder="98765 43210" {...field} />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" size="lg" className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-lg" disabled={isSending}>
                  {isSending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                  Send OTP
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground mb-4">Sent to +91 {phone}</p>
                </div>
                <FormField
                  control={otpForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-center">
                      <FormControl>
                        <InputOTP maxLength={6} {...field}>
                          <InputOTPGroup className="gap-2">
                            {[0, 1, 2, 3, 4, 5].map(i => (
                              <InputOTPSlot key={i} index={i} className="w-12 h-14 text-2xl font-bold bg-background border-input rounded-md" />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" size="lg" className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-lg mt-8" disabled={isVerifying}>
                  {isVerifying ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                  Verify
                </Button>
                <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={() => setShowOtp(false)}>
                  Wrong number? Go back
                </Button>
              </form>
            </Form>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="w-full max-w-2xl bg-card border border-border rounded-2xl p-6 md:p-10 shadow-2xl animate-in slide-in-from-bottom-8 duration-500 my-8">
          <div className="mb-8">
            <h2 className="text-3xl font-black tracking-tight mb-2">Build Your Profile</h2>
            <p className="text-muted-foreground">Tell us what you play so we can match you.</p>
          </div>

          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-8">
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="What should we call you?" className="text-lg bg-background py-6" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormLabel className="text-base block">What do you play?</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {SPORT_OPTIONS.map(sport => {
                    const isSelected = selectedSports.some(s => s.sport === sport);
                    return (
                      <Button
                        key={sport}
                        type="button"
                        variant="outline"
                        className={`h-auto py-3 justify-start font-medium transition-colors ${isSelected ? "bg-primary/10 border-primary text-primary hover:bg-primary/20" : "bg-background hover:bg-secondary"}`}
                        onClick={() => toggleSport(sport)}
                      >
                        {sport}
                      </Button>
                    );
                  })}
                </div>
                {selectedSports.length > 0 && (
                  <div className="p-4 bg-background rounded-lg border border-border mt-4 space-y-4 animate-in fade-in">
                    <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Set Skill Levels</h4>
                    {selectedSports.map(s => (
                      <div key={s.sport} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="font-bold">{s.sport}</span>
                        <div className="flex bg-secondary p-1 rounded-full overflow-hidden">
                          {["Beginner", "Intermediate", "Advanced", "Pro"].map(level => (
                            <button
                              key={level}
                              type="button"
                              className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${s.skill === level ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                              onClick={() => updateSportSkill(s.sport, level)}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={profileForm.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Gender</FormLabel>
                      <div className="flex bg-secondary p-1 rounded-lg">
                        {["Man", "Woman", "Other"].map(g => (
                          <button
                            key={g}
                            type="button"
                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${field.value === g ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                            onClick={() => field.onChange(g)}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="locationArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Your Area</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Navrangpura" className="bg-background py-5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {profileForm.watch("gender") === "Woman" && (
                <FormField
                  control={profileForm.control}
                  name="womenOnlyPref"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-pink-500/30 bg-pink-500/5 p-4 shadow-sm">
                      <div className="space-y-1">
                        <FormLabel className="text-base flex items-center gap-2 text-pink-500">
                          <Shield className="w-4 h-4" />
                          Women Only Mode
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">Only play with other women in the app.</p>
                      </div>
                      <FormControl>
                        <Button
                          type="button"
                          variant={field.value ? "default" : "outline"}
                          className={field.value ? "bg-pink-500 hover:bg-pink-600 text-white" : ""}
                          onClick={() => field.onChange(!field.value)}
                        >
                          {field.value ? "Active" : "Enable"}
                        </Button>
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={profileForm.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Sports Bio (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="What's your playing style?" className="bg-background resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" size="lg" className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-lg py-6" disabled={isCreating}>
                {isCreating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                Create Profile
              </Button>
            </form>
          </Form>
        </div>
      )}

      {step === 3 && (
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-2xl text-center animate-in zoom-in-95 duration-700">
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
            <CheckCircle2 className="w-12 h-12 text-green-500 relative z-10" />
          </div>
          <h2 className="text-3xl font-black tracking-tight mb-2">You are on Pulse</h2>
          <p className="text-muted-foreground mb-8">Your profile is ready. Time to get out there.</p>
          <div className="bg-background rounded-xl p-6 mb-8 text-left border border-border shadow-inner">
            <h3 className="font-bold text-lg mb-1">{profileForm.watch("name")}</h3>
            <p className="text-muted-foreground text-sm flex items-center gap-2 mb-4">
              <MapPin className="w-3.5 h-3.5" /> {profileForm.watch("locationArea")}
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedSports.slice(0, 3).map(s => (
                <span key={s.sport} className="text-xs font-bold bg-secondary text-foreground px-2 py-1 rounded-md">{s.sport}</span>
              ))}
              {selectedSports.length > 3 && (
                <span className="text-xs font-bold bg-secondary text-muted-foreground px-2 py-1 rounded-md">+{selectedSports.length - 3} more</span>
              )}
            </div>
          </div>
          <Button size="lg" className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-lg py-6 gap-2 shadow-[0_0_20px_rgba(0,180,224,0.3)]" onClick={() => setLocation("/")}>
            Explore Games Near You <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
