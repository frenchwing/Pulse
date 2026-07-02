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
import { Phone, Shield, ArrowRight, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { Bolt } from "@/components/bolt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

// Normalize to the bare 10-digit Indian mobile: strip spaces/dashes,
// a leading +91/91, or a leading 0 — "+91 98765 43210" would otherwise
// become "+91+919876543210" and Firebase would reject it cryptically.
const normalizePhone = (raw: string) => {
  let d = raw.replace(/\D/g, "");
  if (d.length > 10 && d.startsWith("91")) d = d.slice(-10);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d;
};
const phoneSchema = z.object({
  phone: z.string()
    .transform(normalizePhone)
    .refine((v) => /^[6-9]\d{9}$/.test(v), "Enter a valid 10-digit mobile number"),
});
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

// ── Bouncing button with physics ──────────────────────────────────────────────
function FloatingBtn({
  containerRef,
  speed = 0.65,
  startFx = 0.25,
  startFy = 0.2,
  children,
  className,
  style,
  onClick,
  disabled,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  speed?: number;
  startFx?: number;
  startFy?: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const pos = useRef({ x: 0, y: 0, vx: speed, vy: speed * 0.7 });
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    const btn = ref.current;
    const box = containerRef.current;
    if (!btn || !box) return;

    const cw = box.clientWidth;
    const ch = box.clientHeight;
    const ang = Math.random() * Math.PI * 2;
    pos.current = {
      x: Math.max(8, Math.min(cw - (btn.offsetWidth || 220) - 8, startFx * cw)),
      y: Math.max(8, Math.min(ch - (btn.offsetHeight || 52) - 8, startFy * ch)),
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
    };
    btn.style.position = "absolute";
    btn.style.left = `${pos.current.x}px`;
    btn.style.top  = `${pos.current.y}px`;

    // Respect reduced-motion: place the button statically, no bouncing.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const tick = () => {
      const cw = box.clientWidth;
      const ch = box.clientHeight;
      const bw = btn.offsetWidth;
      const bh = btn.offsetHeight;
      let { x, y, vx, vy } = pos.current;
      x += vx; y += vy;
      if (x <= 0)       { x = 0;       vx =  Math.abs(vx); }
      if (x + bw >= cw) { x = cw - bw; vx = -Math.abs(vx); }
      if (y <= 0)       { y = 0;       vy =  Math.abs(vy); }
      if (y + bh >= ch) { y = ch - bh; vy = -Math.abs(vy); }
      pos.current = { x, y, vx, vy };
      btn.style.left = `${x}px`;
      btn.style.top  = `${y}px`;
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, []);

  return (
    <button
      ref={ref}
      type="button"
      className={className}
      style={{ ...style, zIndex: 10, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}
      onClick={disabled ? undefined : onClick}
    >
      {children}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
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
  const signedInUidRef = useRef<string | null>(null);
  const floatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
    return () => { recaptchaRef.current?.clear(); };
  }, []);

  // Firebase requires a fresh reCAPTCHA after a failed or consumed
  // signInWithPhoneNumber — without this, every retry fails.
  const resetRecaptcha = () => {
    try { recaptchaRef.current?.clear(); } catch { /* already cleared */ }
    recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
  };

  useEffect(() => {
    getRedirectResult(auth).then(async (credential) => {
      if (!credential) return;
      const uid = credential.user.uid;
      signedInUidRef.current = uid;
      const existing = await getProfile(uid);
      if (existing) { toast({ title: "Welcome back!" }); setLocation("/"); }
      else setStep(2);
    }).catch((err) => {
      if (err.code !== "auth/null-user")
        toast({ title: "Google sign-in failed", description: err.message, variant: "destructive" });
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
      if (existing) { toast({ title: "Welcome back!" }); setLocation("/"); }
      else setStep(2);
    } catch (err: any) {
      if (err.code === "auth/popup-blocked" || err.code === "auth/popup-closed-by-user") {
        await signInWithRedirect(auth, new GoogleAuthProvider());
        return;
      }
      toast({ title: "Google sign-in failed", description: err.message, variant: "destructive" });
    }
  };

  const onPhoneSubmit = async (values: z.infer<typeof phoneSchema>) => {
    setIsSending(true);
    try {
      const fullPhone = "+91" + values.phone;
      setPhone(values.phone);
      const result = await signInWithPhoneNumber(auth, fullPhone, recaptchaRef.current!);
      setConfirmationResult(result);
      setShowOtp(true);
      toast({ title: "OTP sent", description: `Sent to +91 ${values.phone}` });
    } catch (err: any) {
      resetRecaptcha();
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
      if (existing) { toast({ title: "Welcome back!" }); setLocation("/"); }
      else setStep(2);
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
    const uid = signedInUidRef.current ?? auth.currentUser?.uid;
    if (!uid) {
      toast({ title: "Session lost", description: "Please sign in again.", variant: "destructive" });
      setStep(1);
      return;
    }
    setIsCreating(true);
    try {
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
    if (selectedSports.some(s => s.sport === sport))
      setSelectedSports(selectedSports.filter(s => s.sport !== sport));
    else
      setSelectedSports([...selectedSports, { sport, skill: "Beginner" }]);
  };

  const updateSportSkill = (sport: string, skill: string) =>
    setSelectedSports(selectedSports.map(s => s.sport === sport ? { ...s, skill } : s));

  // ── Step 1: full-screen sign-in ──────────────────────────────────────────
  if (step === 1) return (
    <div
      className="flex-1 flex flex-col md:flex-row overflow-hidden"
      style={{ background: "radial-gradient(ellipse 80% 60% at 28% 50%, #00B4E010 0%, transparent 65%)" }}
    >
      <div id="recaptcha-container" />

      {/* Left: campaign hero */}
      <div className="md:w-1/2 flex flex-col justify-center px-8 md:px-16 py-12 md:py-20 relative overflow-hidden border-b md:border-b-0 md:border-r border-border">
        <Bolt className="absolute pointer-events-none text-primary opacity-[0.07]"
          style={{ width: 280, height: 560, left: "-8%", top: "-8%", transform: "rotate(-14deg)" }} />
        <Bolt className="absolute pointer-events-none text-primary opacity-[0.04]"
          style={{ width: 180, height: 360, right: "-4%", bottom: "-4%", transform: "rotate(12deg) scaleX(-1)" }} />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-10">
            <Bolt className="w-4 h-7 text-primary drop-shadow-[0_0_10px_rgba(0,180,224,0.9)] -skew-x-6" />
            <span className="font-black text-xl text-primary tracking-tight">Pulse</span>
          </div>
          <h1 className="text-5xl md:text-[5.5rem] font-black tracking-tight leading-[0.88] mb-6">
            Join the
            <br />
            <span style={{
              background: "linear-gradient(90deg, #00B4E0 0%, #38bdf8 55%, #00B4E0 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Pulse.
            </span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xs">
            Ahmedabad's sport scene,<br />one tap away.
          </p>
        </div>
      </div>

      {/* Right: bouncing buttons + fixed form */}
      <div className="md:w-1/2 flex flex-col">

        {/* Bounce zone */}
        <div
          ref={floatRef}
          className="relative overflow-hidden flex-1 min-h-[260px] md:min-h-0"
          style={{ background: "rgba(0,180,224,0.015)" }}
        >
          {/* Subtle bolt watermark in bounce zone */}
          <Bolt className="absolute pointer-events-none text-primary opacity-[0.04]"
            style={{ width: 160, height: 320, right: "5%", top: "5%", transform: "rotate(10deg)" }} />

          {!showOtp ? (
            <>
              <FloatingBtn
                containerRef={floatRef}
                speed={0.6}
                startFx={0.1}
                startFy={0.12}
                className="flex items-center gap-3 px-5 py-3 rounded-xl font-semibold text-gray-800 bg-white border border-gray-200 whitespace-nowrap select-none"
                style={{ boxShadow: "0 4px 24px rgba(255,255,255,0.12), 0 0 0 1px rgba(255,255,255,0.08)" }}
                onClick={onGoogleSignIn}
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </FloatingBtn>

              <FloatingBtn
                containerRef={floatRef}
                speed={0.48}
                startFx={0.55}
                startFy={0.55}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white whitespace-nowrap select-none"
                style={{
                  background: "linear-gradient(135deg, #00B4E0, #0891b2)",
                  boxShadow: "0 0 24px #00B4E055, 0 4px 16px rgba(0,0,0,0.3)",
                }}
                disabled={isSending}
                onClick={() => phoneForm.handleSubmit(onPhoneSubmit)()}
              >
                {isSending
                  ? <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  : <Phone className="w-4 h-4 shrink-0" />}
                {isSending ? "Sending…" : "Send OTP"}
              </FloatingBtn>
            </>
          ) : (
            <FloatingBtn
              containerRef={floatRef}
              speed={0.55}
              startFx={0.3}
              startFy={0.3}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white whitespace-nowrap select-none"
              style={{
                background: "linear-gradient(135deg, #00B4E0, #0891b2)",
                boxShadow: "0 0 24px #00B4E055, 0 4px 16px rgba(0,0,0,0.3)",
              }}
              disabled={isVerifying}
              onClick={() => otpForm.handleSubmit(onOtpSubmit)()}
            >
              {isVerifying
                ? <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              {isVerifying ? "Verifying…" : "Verify OTP"}
            </FloatingBtn>
          )}
        </div>

        {/* Fixed form zone */}
        <div className="px-8 py-6 border-t border-border bg-card/60 backdrop-blur">
          {!showOtp ? (
            <Form {...phoneForm}>
              <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground font-medium">or enter your number</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <FormField
                  control={phoneForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex">
                        <div className="flex items-center justify-center bg-secondary text-muted-foreground px-4 rounded-l-md border border-r-0 border-input font-medium text-sm shrink-0">
                          +91
                        </div>
                        <FormControl>
                          <Input className="rounded-l-none text-base" placeholder="98765 43210" {...field} />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          ) : (
            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">OTP sent to +91 {phone}</p>
                <FormField
                  control={otpForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-center">
                      <FormControl>
                        <InputOTP maxLength={6} {...field}>
                          <InputOTPGroup className="gap-2">
                            {[0,1,2,3,4,5].map(i => (
                              <InputOTPSlot key={i} index={i} className="w-11 h-13 text-xl font-bold bg-background border-input rounded-md" />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <button
                  type="button"
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => { setShowOtp(false); resetRecaptcha(); }}
                >
                  Wrong number? Go back
                </button>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  );

  // ── Step 2: profile builder ───────────────────────────────────────────────
  if (step === 2) return (
    <div className="flex-1 flex items-start justify-center p-4 py-8">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl p-6 md:p-10 shadow-2xl animate-in slide-in-from-bottom-8 duration-500 my-4">
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
                  <label className="text-base font-semibold block mb-1">Full Name</label>
                  <FormControl>
                    <Input placeholder="What should we call you?" className="text-lg bg-background py-6" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <label className="text-base font-semibold block">What do you play?</label>
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
                    <label className="text-base font-semibold block mb-1">Gender</label>
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
                    <label className="text-base font-semibold block mb-1">Your Area</label>
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
                      <label className="text-base font-semibold flex items-center gap-2 text-pink-500">
                        <Shield className="w-4 h-4" /> Women Only Mode
                      </label>
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
                  <label className="text-base font-semibold block mb-1">Sports Bio <span className="text-muted-foreground font-normal">(Optional)</span></label>
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
    </div>
  );

  // ── Step 3: welcome ───────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex items-center justify-center p-4">
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
        <Button
          size="lg"
          className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-lg py-6 gap-2 shadow-[0_0_20px_rgba(0,180,224,0.3)]"
          onClick={() => setLocation("/")}
        >
          Explore Games Near You <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
