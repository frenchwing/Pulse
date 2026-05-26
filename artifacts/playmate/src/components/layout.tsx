import { Link, useLocation } from "wouter";
import { Plus, Map, List } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background text-foreground dark">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur">
        <div className="container flex h-14 items-center px-4 md:px-6">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl text-primary tracking-tight">Pulse</span>
          </Link>
          <nav className="flex items-center space-x-4 flex-1">
            <Link href="/" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/" ? "text-primary" : "text-muted-foreground"}`}>
              <span className="flex items-center gap-2"><Map className="w-4 h-4"/> Map</span>
            </Link>
            <Link href="/browse" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/browse" ? "text-primary" : "text-muted-foreground"}`}>
              <span className="flex items-center gap-2"><List className="w-4 h-4"/> Browse</span>
            </Link>
          </nav>
          <div className="flex items-center justify-end">
            <Link href="/create">
              <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
                <Plus className="w-4 h-4" />
                <span>Create</span>
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
