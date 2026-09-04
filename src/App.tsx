import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Executives from "./pages/Executives.tsx";
import Events from "./pages/Events.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Contact from "./pages/Contact.tsx";
import Constitution from "./pages/Constitution.tsx";
import EventGallery from "./pages/EventGallery.tsx";
import Gallery from "./pages/Gallery.tsx";
import AdminPortal from "./pages/AdminPortal.tsx";
import Awards from "./pages/Awards.tsx";
import VotingCategories from "./pages/VotingCategories.tsx";
import Leaderboard from "./pages/Leaderboard.tsx";
import NomineeProfile from "./pages/NomineeProfile.tsx";
import VoteAmount from "./pages/VoteAmount.tsx";
import NotFound from "./pages/NotFound.tsx";
import Donate from "./pages/Donate.tsx";
import ScrollToTop from "./components/ScrollToTop";
import ScrollToTopButton from "./components/ScrollToTopButton";
import { isAwardsHost } from "@/lib/api";

import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => {
  const awardsMode = isAwardsHost();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={awardsMode ? <Awards /> : <Index />} />
            <Route path="/executives" element={awardsMode ? <NotFound /> : <Executives />} />
            <Route path="/events" element={awardsMode ? <NotFound /> : <Events />} />
            <Route path="/dashboard" element={
              awardsMode ? <NotFound /> : (
                <ErrorBoundary>
                  <Dashboard />
                </ErrorBoundary>
              )
            } />
            <Route path="/admin" element={<AdminPortal />} />
            <Route path="/contact" element={awardsMode ? <NotFound /> : <Contact />} />
            <Route path="/constitution" element={awardsMode ? <NotFound /> : <Constitution />} />
            <Route path="/gallery" element={awardsMode ? <NotFound /> : <Gallery />} />
            <Route path="/events/:id/gallery" element={awardsMode ? <NotFound /> : <EventGallery />} />
            <Route path="/awards" element={<Awards />} />
            <Route path="/voting/categories" element={<VotingCategories />} />
            <Route path="/voting/leaderboard" element={<Leaderboard />} />
            <Route path="/voting/:category/:id" element={<NomineeProfile />} />
            <Route path="/vote-amount" element={<VoteAmount />} />
            <Route path="/donate" element={awardsMode ? <NotFound /> : <Donate />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ScrollToTopButton />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
