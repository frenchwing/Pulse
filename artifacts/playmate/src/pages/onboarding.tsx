import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  type ConfirmationResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getProfileByPhone, getProfile, createProfile } from "@/lib/firestore";
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
  // Stores the uid captured at sign-in time so onProfileSubmit doesn't
  // depend on auth.currentUser which may not have propagated yet.
  const signedInUidRef = useRef<string | null>(null);

  useEffect(() => {
    recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
    return () => { recaptchaRef.current?.clear(); };
  }, []);

  // Handle the result when Google redirect returns to this page
  useEffect(() => {
    getRedirectResult(auth).then(async (credential) => {
      if (!credential) return;
      const uid = credential.user.uid;
      signedInUidRef.current = uid;
      const existing = await getProfile(uid);
      if (existing) {
        toast({ title: "Welcome back!" });
        setLocation("/");
      } else {
        setStep(2);
      }
    }).catch((err) => {
      if (err.code !== "auth/null-user") {
        toast({ title: "Google sign-in failed", description: err.message, variant: "destructive" });
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const onGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const credential = await signInWithPopup(auth, provider);
      const uid = credential.user.uid;
      signedInUidRef.current = uid;
      const existing = await getProfile(uid);
      if (existing) {
        toast({ title: "Welcome back!" });
        setLocation("/");
      } else {
        setStep(2);
      }
    } catch (err: any) {
      // Popup was blocked — fall back to full-page redirect
      if (err.code === "auth/popup-blocked" || err.code === "auth/popup-closed-by-user") {
        await signInWithRedirect(auth, provider);
        return; // page will navigate away; getRedirectResult handles the return
      }
      toast({ title: "Google sign-in failed", description: err.message, variant: "destructive" });
    }
  };

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
      signedInUidRef.current = uid;
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
    // Use the uid captured at sign-in time — auth.currentUser may not have
    // propagated yet if onAuthStateChanged is still pending.
    const uid = signedInUidRef.current ?? auth.currentUser?.uid;
    if (!uid) {
      toast({ title: "Session lost", description: "Please sign in again.", variant: "destructive" });
      setStep(1);
      return;
    }
    setIsCreating(true);
    try {
      // phone is only set during the OTP flow; Google users don't have one.
      const phoneValue = phone ? "+91" + phone.replace(/\s/g, "") : null;
      await createProfile(uid, {
        name: values.name,
        phone: phoneValue,
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

          {!showOtp && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full mb-4 bg-white hover:bg-gray-50 text-gray-800 border-gray-300 font-semibold flex items-center gap-3"
              onClick={onGoogleSignIn}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
          )}

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">or use phone</span>
            <div className="flex-1 h-px bg-border" />
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
