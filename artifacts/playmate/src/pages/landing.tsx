import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useListActivities, useListEvents } from "@/hooks/use-firestore";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import { Bolt } from "@/components/bolt";
import { SPORT_HEX } from "@/lib/sport-meta";
import { GiSoccerBall, GiShuttlecock, GiBasketballBall, GiTennisBall, GiCricketBat, GiVolleyballBall, GiBicycling, GiSwimming, GiWeightLiftingUp, GiRunningNinja } from "react-icons/gi";
import type { IconType } from "react-icons";

// ── Floating orb data ─────────────────────────────────────────────────────────
const ORBS: { Icon: IconType; sport: string; size: number; x: number; y: number; dur: number; delay: number }[] = [
  { Icon: GiSoccerBall,      sport: "football",   size: 56, x: 12,  y: 18,  dur: 18, delay: 0   },
  { Icon: GiShuttlecock,     sport: "badminton",  size: 44, x: 78,  y: 12,  dur: 22, delay: 3   },
  { Icon: GiBasketballBall,  sport: "basketball", size: 60, x: 88,  y: 55,  dur: 20, delay: 1.5 },
  { Icon: GiTennisBall,      sport: "tennis",     size: 40, x: 65,  y: 80,  dur: 25, delay: 5   },
  { Icon: GiCricketBat,      sport: "cricket",    size: 48, x: 25,  y: 72,  dur: 17, delay: 2   },
  { Icon: GiVolleyballBall,  sport: "volleyball", size: 36, x: 48,  y: 8,   dur: 23, delay: 7   },
  { Icon: GiBicycling,       sport: "cycling",    size: 42, x: 5,   y: 48,  dur: 19, delay: 4   },
  { Icon: GiSwimming,        sport: "swimming",   size: 38, x: 92,  y: 28,  dur: 21, delay: 6   },
  { Icon: GiWeightLiftingUp, sport: "gym",        size: 34, x: 38,  y: 90,  dur: 24, delay: 8   },
  { Icon: GiRunningNinja,    sport: "running",    size: 46, x: 55,  y: 42,  dur: 16, delay: 1   },
];

// ── Sport chips ───────────────────────────────────────────────────────────────
const CHIPS = [
  "Football", "Badminton", "Cricket", "Basketball",
  "Tennis", "Volleyball", "Running", "Cycling", "Gym", "Swimming",
];

// ── Floating orb component ────────────────────────────────────────────────────
function FloatingOrb({
  orb, mouseX, mouseY,
}: {
  orb: typeof ORBS[number];
  mouseX: number;
  mouseY: number;
}) {
  const hex = SPORT_HEX[orb.sport] ?? { accent: "#00B4E0", glow: "#0891b2", dim: "#031a20" };
  const { Icon } = orb;

  // Parallax: orbs nudge slightly toward the cursor
  const parallaxX = (mouseX - 50) * 0.06;
  const parallaxY = (mouseY - 50) * 0.06;

  return (
    <div
      className="absolute select-none pointer-events-none"
      style={{
        left: `calc(${orb.x}% + ${parallaxX}px)`,
        top:  `calc(${orb.y}% + ${parallaxY}px)`,
        transition: "left 0.8s ease-out, top 0.8s ease-out",
        animation: `floatOrb ${orb.dur}s ease-in-out ${orb.delay}s infinite alternate`,
        width: orb.size,
        height: orb.size,
      }}
    >
      <div
        className="w-full h-full rounded-full flex items-center justify-center"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${hex.accent}30, ${hex.accent}08)`,
          border: `1.5px solid ${hex.accent}25`,
          boxShadow: `0 0 ${orb.size * 0.6}px ${hex.glow}20`,
        }}
      >
        <Icon
          style={{
            width: orb.size * 0.52,
            height: orb.size * 0.52,
            color: hex.accent,
            filter: `drop-shadow(0 0 6px ${hex.glow}80)`,
          }}
        />
      </div>
    </div>
  );
}

// ── Sport chip ────────────────────────────────────────────────────────────────
function SportChip({ label, onClick }: { label: string; onClick: () => void }) {
  const [popped, setPopped] = useState(false);
  const hex = SPORT_HEX[label.toLowerCase()] ?? { accent: "#00B4E0", glow: "#0891b2", dim: "#031a20" };

  const handleClick = () => {
    setPopped(true);
    setTimeout(() => setPopped(false), 300);
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className="shrink-0 rounded-full px-4 py-2 text-sm font-bold border transition-all duration-150 cursor-pointer"
      style={{
        borderColor: `${hex.accent}40`,
        color: hex.accent,
        background: popped ? `${hex.accent}25` : `${hex.accent}10`,
        transform: popped ? "scale(0.93)" : "scale(1)",
        boxShadow: popped ? `0 0 18px ${hex.glow}60` : "none",
      }}
    >
      {label}
    </button>
  );
}

// ── Stat counter ──────────────────────────────────────────────────────────────
function AnimatedCount({ target }: { target: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let frame = 0;
    const steps = 40;
    const id = setInterval(() => {
      frame++;
      setVal(Math.round((frame / steps) * target));
      if (frame >= steps) clearInterval(id);
    }, 25);
    return () => clearInterval(id);
  }, [target]);
  return <span>{val}</span>;
}

// ── Main landing page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [mouseX, setMouseX] = useState(50);
  const [mouseY, setMouseY] = useState(50);
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const { data: activities = [] } = useListActivities();
  const { data: events = [] } = useListEvents();

  const openGames  = activities.filter(a => a.status === "open").length;
  const openEvents = events.filter(e => e.status === "open").length;
  const totalOpen  = openGames + openEvents;

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMouseX(((e.clientX - rect.left) / rect.width) * 100);
    setMouseY(((e.clientY - rect.top)  / rect.height) * 100);
  };

  const goToFeed = (sport?: string) => {
    setLocation(sport ? `/feed?type=${sport.toLowerCase()}` : "/feed");
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── Keyframes injected inline (avoids global CSS changes) ── */}
      <style>{`
        @keyframes floatOrb {
          0%   { transform: translateY(0px)  rotate(0deg); }
          100% { transform: translateY(-28px) rotate(8deg); }
        }
        @keyframes pulseBeacon {
          0%, 100% { transform: scale(1);    opacity: 1;   }
          50%       { transform: scale(1.15); opacity: 0.7; }
        }
        @keyframes scanLine {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes chipScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes boltFlicker {
          0%, 100% { opacity: 0.12; filter: drop-shadow(0 0 24px #00B4E070); }
          6%        { opacity: 0.38; filter: drop-shadow(0 0 80px #00B4E0) brightness(1.6); }
          7%        { opacity: 0.06; }
          9%        { opacity: 0.34; filter: drop-shadow(0 0 70px #00B4E0e0) brightness(1.5); }
          11%       { opacity: 0.12; }
          47%       { opacity: 0.12; }
          49%       { opacity: 0.30; filter: drop-shadow(0 0 60px #00B4E0c0) brightness(1.4); }
          50%       { opacity: 0.08; }
          52%       { opacity: 0.26; filter: drop-shadow(0 0 55px #00B4E0b0); }
          55%       { opacity: 0.12; }
        }
      `}</style>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden px-4 py-24"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 40%, #00B4E015 0%, transparent 70%)" }}
      >
        {/* Scan-line shimmer */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden opacity-10"
          aria-hidden
        >
          <div
            className="absolute left-0 right-0 h-px bg-primary"
            style={{ animation: "scanLine 6s linear infinite", top: 0 }}
          />
        </div>

        {/* Giant lightning bolts — jagged, strobing */}
        <Bolt
          className="absolute pointer-events-none text-primary"
          style={{
            width: 300, height: 600,
            left: "-3%", top: "-4%",
            transform: "rotate(-18deg) skewX(-6deg)",
            animation: "boltFlicker 6s linear infinite",
          }}
        />
        <Bolt
          className="absolute pointer-events-none text-primary"
          style={{
            width: 230, height: 460,
            right: "-2%", bottom: "-8%",
            transform: "rotate(16deg) scaleX(-1) skewX(-8deg)",
            animation: "boltFlicker 8s linear 2.5s infinite",
          }}
        />

        {/* Floating orbs */}
        {ORBS.map((orb, i) => (
          <FloatingOrb key={i} orb={orb} mouseX={mouseX} mouseY={mouseY} />
        ))}

        {/* Glow beacon */}
        <div
          className="absolute rounded-full pointer-events-none"
          aria-hidden
          style={{
            width: 480,
            height: 480,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle, #00B4E012 0%, transparent 70%)",
            animation: "pulseBeacon 4s ease-in-out infinite",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto gap-6">
          {/* Live badge */}
          <div
            className="flex items-center gap-2 rounded-full px-4 py-1.5 border text-xs font-bold uppercase tracking-widest"
            style={{
              borderColor: "#00B4E040",
              background: "#00B4E010",
              color: "#00B4E0",
              animation: "fadeUp 0.6s ease-out both",
            }}
          >
            <span
              className="w-2 h-2 rounded-full bg-primary"
              style={{ animation: "pulseBeacon 1.5s ease-in-out infinite" }}
            />
            {totalOpen > 0 ? (
              <><AnimatedCount target={totalOpen} /> games live right now in Ahmedabad</>
            ) : (
              <>Ahmedabad's sports social network</>
            )}
          </div>

          {/* Headline */}
          <h1
            className="text-6xl md:text-8xl font-black tracking-tight leading-none"
            style={{ animation: "fadeUp 0.6s ease-out 0.1s both" }}
          >
            <span className="text-foreground">Find your game.</span>
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, #00B4E0 0%, #38bdf8 50%, #00B4E0 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Run your city.
            </span>
          </h1>

          {/* Sub */}
          <p
            className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed"
            style={{ animation: "fadeUp 0.6s ease-out 0.2s both" }}
          >
            Pick up games, social events, elite corps — all of Ahmedabad's sport
            scene in one pulse. Show up. Level up.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row gap-3 mt-2"
            style={{ animation: "fadeUp 0.6s ease-out 0.3s both" }}
          >
            <Button
              size="lg"
              onClick={() => goToFeed()}
              className="gap-2 font-black text-base px-8 py-6 text-primary-foreground"
              style={{
                background: "linear-gradient(135deg, #00B4E0, #0891b2)",
                boxShadow: "0 0 32px #00B4E040",
              }}
            >
              Explore Games <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setLocation("/onboarding")}
              className="gap-2 font-bold text-base px-8 py-6"
              style={{ borderColor: "#00B4E040", color: "#00B4E0" }}
            >
              <Zap className="w-4 h-4" /> Join Pulse
            </Button>
          </div>

          {/* Stats row */}
          <div
            className="flex items-center gap-6 mt-4 text-sm"
            style={{ animation: "fadeUp 0.6s ease-out 0.4s both" }}
          >
            {[
              { label: "Open games",  value: openGames  },
              { label: "Live events", value: openEvents },
              { label: "Sports",      value: 12         },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <span className="text-2xl font-black text-primary">
                  <AnimatedCount target={value} />
                </span>
                <span className="text-muted-foreground text-xs uppercase tracking-wider">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
          <span className="text-xs text-muted-foreground uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-primary to-transparent" />
        </div>
      </section>

      {/* ── Scrolling sport chips ─────────────────────────────────────────── */}
      <div className="border-y border-border bg-card/50 py-5 overflow-hidden">
        <div
          className="flex gap-3 w-max"
          style={{ animation: "chipScroll 30s linear infinite" }}
        >
          {[...CHIPS, ...CHIPS].map((chip, i) => (
            <SportChip
              key={i}
              label={chip}
              onClick={() => {
                setActiveChip(chip);
                goToFeed(chip);
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Feature grid ─────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            emoji: "⚡",
            title: "Live pickup games",
            desc:  "See open games near you in real time. Join with one tap, no back-and-forth.",
            color: "#00B4E0",
          },
          {
            emoji: "⚔️",
            title: "The Corps",
            desc:  "Elite sport squads. Challenge rival corps. Build your win record.",
            color: "#f97316",
          },
          {
            emoji: "⭐",
            title: "Dope Level system",
            desc:  "Rate players after every game. Climb from Just Showed Up to Too Dope to Explain.",
            color: "#a78bfa",
          },
        ].map(({ emoji, title, desc, color }) => (
          <div
            key={title}
            className="rounded-2xl border border-border p-6 flex flex-col gap-3 hover:border-primary/30 transition-colors group"
            style={{ background: `${color}08` }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: `${color}18`, border: `1px solid ${color}30` }}
            >
              {emoji}
            </div>
            <h3 className="font-black text-lg text-foreground">{title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <section className="border-t border-border py-20 px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-black mb-4">
          The court is{" "}
          <span
            style={{
              background: "linear-gradient(90deg, #00B4E0, #38bdf8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            waiting.
          </span>
        </h2>
        <p className="text-muted-foreground mb-8 text-lg">Stop watching. Start playing.</p>
        <Button
          size="lg"
          onClick={() => goToFeed()}
          className="gap-2 font-black text-lg px-10 py-7 text-primary-foreground"
          style={{
            background: "linear-gradient(135deg, #00B4E0, #0891b2)",
            boxShadow: "0 0 40px #00B4E030",
          }}
        >
          See What's On Now <ArrowRight className="w-5 h-5" />
        </Button>
      </section>
    </div>
  );
}
