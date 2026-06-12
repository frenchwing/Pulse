import { Link, useLocation } from "wouter";
import { Plus, Map, List, Home, Users, GraduationCap, UserCircle } from "lucide-react";
import { Bolt } from "@/components/bolt";
import { Button } from "@/components/ui/button";
import { getSessionProfileId } from "@/hooks/use-session";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const profileId = getSessionProfileId();

  const navItem = (href: string, icon: React.ReactNode, label: string) => {
    const active = location === href || (href !== "/" && location.startsWith(href));
    return (
      <Link href={href} className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5 px-1 py-0.5 rounded shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`}>
        {icon}{label}
      </Link>
    );
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background text-foreground dark">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur">
        <div className="container flex h-14 items-center px-4 md:px-6">
          <Link href="/" className="mr-4 flex items-center gap-1.5 shrink-0">
            <Bolt className="w-4 h-7 text-primary drop-shadow-[0_0_10px_rgba(0,180,224,0.9)] -skew-x-6" />
            <span className="font-bold text-xl text-primary tracking-tight">Pulse</span>
          </Link>
          <nav className="flex items-center space-x-1 flex-1 overflow-x-auto scrollbar-none">
            {navItem("/feed", <Home className="w-4 h-4"/>, "Feed")}
            {navItem("/map", <Map className="w-4 h-4"/>, "Map")}
            {navItem("/browse", <List className="w-4 h-4"/>, "Browse")}
            {navItem("/corps", <Users className="w-4 h-4"/>, "Corps")}
            {navItem("/varsity", <GraduationCap className="w-4 h-4"/>, "Varsity")}
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            {profileId ? (
              <Link href={`/profile/${profileId}`}>
                <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground hover:text-primary font-medium px-2">
                  <UserCircle className="w-5 h-5" />
                  <span className="hidden md:inline">Profile</span>
                </Button>
              </Link>
            ) : (
              <Link href="/onboarding">
                <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground hover:text-primary font-medium px-2">
                  <UserCircle className="w-5 h-5" />
                  <span className="hidden md:inline">Join</span>
                </Button>
              </Link>
            )}
            <Link href="/create">
              <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create</span>
                <span className="sm:hidden">+</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col relative">
        {children}
      </main>
    </div>
  );
}
