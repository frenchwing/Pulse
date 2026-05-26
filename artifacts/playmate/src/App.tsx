import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import FeedPage from "@/pages/feed";
import MapPage from "@/pages/map";
import BrowsePage from "@/pages/browse";
import ActivityDetailPage from "@/pages/activity-detail";
import EventDetailPage from "@/pages/event-detail";
import CreatePage from "@/pages/create";
import ProfilePage from "@/pages/profile";
import OnboardingPage from "@/pages/onboarding";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={FeedPage} />
        <Route path="/map" component={MapPage} />
        <Route path="/browse" component={BrowsePage} />
        <Route path="/activity/:id" component={ActivityDetailPage} />
        <Route path="/event/:id" component={EventDetailPage} />
        <Route path="/create" component={CreatePage} />
        <Route path="/profile/:id" component={ProfilePage} />
        <Route path="/onboarding" component={OnboardingPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
