import { Link, useLocation } from "wouter";
import { Plus, Map, List, Home, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItem = (href: string, icon: React.ReactNode, label: string) => {
    const active = location === href || (href !== "/" && location.startsWith(href));
    return (
      <Link href={href} className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5 px-1 py-0.5 rounded ${active ? "text-primary" : "text-muted-foreground"}`}>
        {icon}{label}
      </Link>
    );
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background text-foreground dark">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur">
        <div className="container flex h-14 items-center px-4 md:px-6">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl text-primary tracking-tight">Pulse</span>
          </Link>
          <nav className="flex items-center space-x-1 flex-1 overflow-x-auto">
            {navItem("/", <Home className="w-4 h-4"/>, "Feed")}
            {navItem("/map", <Map className="w-4 h-4"/>, "Map")}
            {navItem("/browse", <List className="w-4 h-4"/>, "Browse")}
            {navItem("/clubs", <Users className="w-4 h-4"/>, "Clubs")}
          </nav>
          <div className="flex items-center justify-end shrink-0">
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
