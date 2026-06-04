import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/theme-context";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/home";
import Landing from "@/pages/landing";
import Auth from "@/pages/auth";
import Community from "@/pages/community";
import Rooms from "@/pages/rooms";
import RoomInterior from "@/pages/room-interior";
import Profile from "@/pages/profile";
import AdminPanel from "@/pages/admin";
import AdminSetup from "@/pages/admin-setup";
import HowToPlay from "@/pages/how-to-play";
import CommunityGuidelines from "@/pages/community-guidelines";
import FeaturedStories from "@/pages/featured-stories";
import HelpCenter from "@/pages/help-center";
import ReportContent from "@/pages/report-content";
import PrivacyPolicy from "@/pages/privacy-policy";
import NotFound from "@/pages/not-found";
import FallingAnimation from "@/components/falling-animation";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Debug logging
  console.log('Router - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'user:', user?.username, 'role:', user?.role);

  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      <Route path="/admin-setup" component={AdminSetup} />
      <Route path="/community" component={Community} />
      <Route path="/rooms" component={Rooms} />
      <Route path="/rooms/:roomId" component={RoomInterior} />
      <Route path="/profile" component={Profile} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/how-to-play" component={HowToPlay} />
      <Route path="/community-guidelines" component={CommunityGuidelines} />
      <Route path="/featured-stories" component={FeaturedStories} />
      <Route path="/help-center" component={HelpCenter} />
      <Route path="/report-content" component={ReportContent} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/" component={() => {
        if (isLoading) {
          console.log('Router - Showing landing due to loading');
          return <Landing />;
        }
        if (isAuthenticated) {
          console.log('Router - Showing home for authenticated user:', user?.username);
          return <Home />;
        }
        console.log('Router - Showing landing for unauthenticated user');
        return <Landing />;
      }} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <FallingAnimation />
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
