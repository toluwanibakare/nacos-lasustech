import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Executives from "./pages/Executives.tsx";
import Events from "./pages/Events.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import VerifyReceipt from "./pages/VerifyReceipt";
import Contact from "./pages/Contact.tsx";
import Constitution from "./pages/Constitution.tsx";
import EventGallery from "./pages/EventGallery.tsx";
import Gallery from "./pages/Gallery.tsx";
import AdminPortal from "./pages/AdminPortal.tsx";
// import Awards from "./pages/Awards.tsx"; // voting disabled
// import VotingCategories from "./pages/VotingCategories.tsx"; // voting disabled
// import Leaderboard from "./pages/Leaderboard.tsx"; // voting disabled
// import NomineeProfile from "./pages/NomineeProfile.tsx"; // voting disabled
// import VoteAmount from "./pages/VoteAmount.tsx"; // voting disabled
import NotFound from "./pages/NotFound.tsx";
import Donate from "./pages/Donate.tsx";
import ScrollToTop from "./components/ScrollToTop";
import ScrollToTopButton from "./components/ScrollToTopButton";
import { isAwardsHost } from "@/lib/api";

import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();


// A short cross-fade between pages. Only opacity changes, so sticky and fixed elements are not affected.
const AnimatedRoutes = ({ awardsMode }: { awardsMode: boolean }) => {
  const location = useLocation();
  const reduce = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduce ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <Routes location={location}>
            <Route path="/" element={<Index />} />
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
            <Route path="/verify/:code" element={<VerifyReceipt />} />
            <Route path="/contact" element={awardsMode ? <NotFound /> : <Contact />} />
            <Route path="/constitution" element={awardsMode ? <NotFound /> : <Constitution />} />
            <Route path="/gallery" element={awardsMode ? <NotFound /> : <Gallery />} />
            <Route path="/events/:id/gallery" element={awardsMode ? <NotFound /> : <EventGallery />} />
            {/* Voting / awards is switched off for now (these routes fall through to NotFound).
            <Route path="/awards" element={<Awards />} />
            <Route path="/voting/categories" element={<VotingCategories />} />
            <Route path="/voting/leaderboard" element={<Leaderboard />} />
            <Route path="/voting/:category/:id" element={<NomineeProfile />} />
            <Route path="/vote-amount" element={<VoteAmount />} />
            */}
            <Route path="/donate" element={awardsMode ? <NotFound /> : <Donate />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const App = () => {
  const awardsMode = isAwardsHost();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <AnimatedRoutes awardsMode={awardsMode} />
          <ScrollToTopButton />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
