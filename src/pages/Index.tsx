import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  LogIn,
  CreditCard,
  IdCard,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import Reveal from "@/components/Reveal";
import ExecutiveCard from "@/components/ExecutiveCard";
import EventCard from "@/components/EventCard";
import LoginModal from "@/components/LoginModal";
import { fetchApi } from "@/lib/api";
import BlogCard from "@/components/BlogCard";
import heroBg from "@/assets/Events/bootcamp_onboarding/PHOTO-2026-04-29-19-36-06.jpg";
import nacosLogo from "@/assets/nacos_logo.png";
import lasustechLogo from "@/assets/lasustech_logo.png";
import { executives as staticExecutives } from "@/data/executives";
import { events as staticEvents } from "@/data/events";

// Latest Chapter Moments
import moment1 from "@/assets/Events/nacos-day/Nacos 2026.jpg";
import moment2 from "@/assets/Events/nacos-day/Nacos 2026-7.jpg";
import moment3 from "@/assets/Events/nacos-day/Nacos 2026-14.jpg";
import moment4 from "@/assets/Events/nacos-day/Nacos 2026-19.jpg";

const quickActions = [
  { icon: LogIn, label: "Login", path: "#", action: "login", targetTab: "overview", desc: "Access your member portal" },
  { icon: CreditCard, label: "Pay Dues", path: "#", action: "login", targetTab: "dues", desc: "Pay your NACOS dues" },
  { icon: IdCard, label: "ID Card", path: "#", action: "login", targetTab: "idcard", desc: "Register for your NACOS ID" },
  { icon: BookOpen, label: "Constitution", path: "/constitution", desc: "Read the chapter constitution" },
];

const galleryImages = [moment1, moment2, moment3, moment4];

const Index = () => {
  const [loginOpen, setLoginOpen] = useState(false);
  const [redirectTab, setRedirectTab] = useState<string | undefined>(undefined);
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem("isLoggedIn") === "true");
  
  // Update login state if storage changes
  useEffect(() => {
    const checkLogin = () => {
      setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
    };
    window.addEventListener('storage', checkLogin);
    return () => window.removeEventListener('storage', checkLogin);
  }, []);

  // Using static data directly from your .ts files as requested
  const [data] = useState({ 
    executives: staticExecutives, 
    events: staticEvents 
  });
  const navigate = useNavigate();

  const handleAction = (item: typeof quickActions[0]) => {
    if (item.action === "login") {
      if (isLoggedIn) {
        navigate("/dashboard", { state: { tab: item.targetTab } });
      } else {
        setRedirectTab(item.targetTab);
        setLoginOpen(true);
      }
    }
  };

  const [isHoveringLogos, setIsHoveringLogos] = useState(false);
  
  // Drag-to-rotate state for logos
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-100, 100], [30, -30]), { stiffness: 100, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-100, 100], [-30, 30]), { stiffness: 100, damping: 30 });

  const handleDrag = (_: any, info: any) => {
    x.set(info.offset.x);
    y.set(info.offset.y);
  };

  const handleDragEnd = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <>
      <LoginModal 
        open={loginOpen} 
        onClose={() => { setLoginOpen(false); setRedirectTab(undefined); }} 
        redirectTab={redirectTab}
      />
      <Layout>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[#08111d]">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={heroBg}
            alt=""
            className="hero-zoom h-full w-full object-cover object-center"
          />
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(8,17,29,0.85)_0%,rgba(8,17,29,0.4)_50%,rgba(8,17,29,0.9)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(31,95,175,0.15),transparent_70%)]" />

        {/* slow drifting brand lights */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="animate-float-slow absolute -left-24 top-8 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="animate-float-slow absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#1F5FAF]/25 blur-3xl [animation-delay:-7s]" />
        </div>

        <div className="container relative z-10 py-24 md:py-36 lg:py-44">
          <div className="flex flex-col items-center text-center">
            <Reveal y={16}>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/85 backdrop-blur-md">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                Official chapter website
              </span>
            </Reveal>

            <Reveal delay={0.1} y={28}>
              <h1 className="mt-6 max-w-4xl font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-white md:text-6xl lg:text-7xl xl:text-8xl">
                NACOS{" "}
                <span className="bg-gradient-to-r from-[#4C8DDA] via-[#86b8f0] to-[#6fe08a] bg-clip-text text-transparent">LASUSTECH</span>{" "}
                Chapter
              </h1>
            </Reveal>

            <Reveal delay={0.22}>
              <p className="mt-8 max-w-2xl text-base leading-7 text-white/90 md:text-lg md:leading-8 drop-shadow-md">
                Building the next generation of computing leaders through learning, innovation, leadership, and community.
              </p>
            </Reveal>

            <Reveal delay={0.34} className="mt-10 flex w-full flex-col justify-center gap-4 px-4 sm:flex-row">
              <a href="https://portal.nacos.org.ng/register" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:min-w-[200px] bg-primary text-xs sm:text-base font-bold text-white hover:bg-primary/90 hover:-translate-y-0.5 p-6"
                >
                  Join NACOS National
                </Button>
              </a>

              <Button
                size="lg"
                onClick={() => {
                  if (isLoggedIn) {
                    navigate("/dashboard", { state: { tab: "overview" } });
                  } else {
                    setRedirectTab("overview");
                    setLoginOpen(true);
                  }
                }}
                className="w-full sm:w-auto sm:min-w-[200px] bg-[#1F5FAF] text-xs sm:text-base font-bold text-white hover:bg-[#184d90] hover:-translate-y-0.5 p-6"
              >
                {isLoggedIn ? "Visit Portal" : "Go to Portal"}
              </Button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Quick Access */}
      <section className="relative -mt-6 z-20">
        <div className="container">
          <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
            {quickActions.map((item, index) => (
              <Reveal key={item.label} delay={index * 0.08} y={20} className="h-full">
                {item.path !== "#" ? (
                  <Link
                    to={item.path}
                    className="group flex h-full flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 rounded-2xl border border-border bg-card p-3 sm:p-4 text-center sm:text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary/40"
                  >
                    <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <item.icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-[11px] sm:text-sm font-bold text-foreground">
                        {item.label}
                      </h3>
                      <p className="hidden sm:block mt-1 text-[11px] leading-5 text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>

                    <ChevronRight className="hidden sm:block h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-foreground" />
                  </Link>
                ) : (
                  <button
                    onClick={() => handleAction(item)}
                    className="w-full h-full group flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 rounded-2xl border border-border bg-card p-3 sm:p-4 text-center sm:text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary/40"
                  >
                    <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <item.icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-[11px] sm:text-sm font-bold text-foreground">
                        {item.action === "login" && isLoggedIn ? (item.targetTab === "overview" ? "Visit Portal" : item.label) : item.label}
                      </h3>
                      <p className="hidden sm:block mt-1 text-[11px] leading-5 text-muted-foreground">
                        {item.action === "login" && isLoggedIn ? (item.targetTab === "overview" ? "You are currently logged in" : item.desc) : item.desc}
                      </p>
                    </div>

                    <ChevronRight className="hidden sm:block h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-foreground" />
                  </button>
                )}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-16 md:py-24 lg:py-28">
        <div className="container">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <Reveal className="max-w-2xl">
              <SectionHeading
                label="About Our Chapter"
                title="Innovation at LASUSTECH"
                align="left"
              />
              <div className="mt-6 space-y-4 text-sm leading-7 text-muted-foreground md:text-[15px]">
                <p>
                  The LASUSTECH Chapter of NACOS (Nigeria Association of Computing Students) is a vibrant community of passionate learners and innovators. While we belong to the largest organized student body in Africa with over a million members nationwide, our local chapter is focused on building a specialized ecosystem for computer scientists at LASUSTECH.
                </p>
                <p>
                  Our mission is to bridge the gap between classroom theory and industry excellence. We provide our members with the resources, leadership opportunities, and technical workshops needed to thrive in the global tech landscape. From 100lvl to 400lvl, every student is integral to our vision of becoming a leading tech hub within the university and beyond.
                </p>
                <p>
                  Through mentorship, chapter-wide events, and a strong sense of community, we ensure that NACOS LASUSTECH is more than just an association, it's a home where future tech leaders are refined and empowered.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.15} y={32}>
            <div 
              className="relative flex items-center justify-center [perspective:1000px]"
              onMouseEnter={() => setIsHoveringLogos(true)}
              onMouseLeave={() => setIsHoveringLogos(false)}
            >
              <motion.div 
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0.1}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                className={`relative h-60 w-60 md:h-80 md:w-80 lg:h-96 lg:w-96 [transform-style:preserve-3d] ${!isHoveringLogos ? "animate-flip-horizontal" : ""}`}
                style={{ 
                  rotateX, 
                  rotateY,
                  animationPlayState: isHoveringLogos ? "paused" : "running"
                }}
              >
                {/* Front Side - NACOS Logo */}
                <a 
                  href="https://nacos.org.ng"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="NACOS NATIONAL"
                  className="absolute inset-0 [backface-visibility:hidden] flex items-center justify-center rounded-full border-4 border-primary/30 bg-gradient-to-br from-primary/30 to-primary/10 shadow-2xl transition-opacity hover:opacity-90"
                >
                  <img
                    src={nacosLogo}
                    alt="NACOS Logo"
                    loading="lazy"
                    className="h-40 w-40 object-contain md:h-60 md:w-60 lg:h-72 lg:w-72"
                  />
                </a>

                {/* Back Side - LASUSTECH Logo */}
                <a 
                  href="https://lasustech.edu.ng"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="LASUSTECH"
                  className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] flex items-center justify-center rounded-full border-4 border-primary/30 bg-gradient-to-br from-primary/30 to-primary/10 shadow-2xl transition-opacity hover:opacity-90"
                >
                  <img
                    src={lasustechLogo}
                    alt="LASUSTECH Logo"
                    loading="lazy"
                    className="h-40 w-40 object-contain md:h-60 md:w-60 lg:h-72 lg:w-72"
                  />
                </a>
              </motion.div>
            </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Executives Preview */}
      <section className="bg-muted py-16 md:py-24 lg:py-28">
        <div className="container">
          <SectionHeading
            label="Leadership"
            title="Executive Council"
            description="Meet the student leaders steering the chapter toward excellence."
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {data.executives.slice(0, 5).map((exec, index) => (
              <ExecutiveCard key={exec.id || exec.post} {...exec} revealDelay={index * 0.07} />
            ))}
          </div>
          <div className="mt-8 text-center text-black">
            <Link to="/executives" className="text-black">
              <Button variant="outline" className="gap-2 text-xs font-semibold">
                View All Executives <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Events Preview */}
      <section className="py-16 md:py-24 lg:py-28">
        <div className="container">
          <SectionHeading
            label="Happenings"
            title={data.events.some(e => e.upcoming !== false) ? "Upcoming Events" : "Recent Events"}
            description="Stay updated with the latest programs, workshops, and gatherings."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {data.events.slice(0, 3).map((event, index) => (
              <EventCard key={event.id} {...event} revealDelay={index * 0.09} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/events">
              <Button variant="outline" className="gap-2 text-xs font-semibold font-black text-black">
                View All Events <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>



      {/* Gallery Preview */}
      <section className="bg-muted py-16 md:py-24 lg:py-28">
        <div className="container">
          <SectionHeading
            label="Gallery"
            title="Chapter Moments"
            description="A curated look into our activities, events, and community."
          />
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {galleryImages.map((img, i) => (
              <Reveal key={i} delay={i * 0.08} y={20}>
                <div className="group overflow-hidden rounded-2xl">
                  <img
                    src={img}
                    alt={`Gallery ${i + 1}`}
                    loading="lazy"
                    className="aspect-square w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/gallery">
              <Button variant="outline" className="gap-2 text-xs font-semibold text-black">
                View Full Gallery <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Constitution Preview */}
      <section className="py-16 md:py-20 lg:py-24">
        <div className="container">
          <Reveal y={28}>
          <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card px-6 py-10 text-center md:px-10 md:py-14">
            <SectionHeading
              label="Document"
              title="Chapter Constitution"
              description="The official governing document of NACOS LASUSTECH Chapter. Read or download the full constitution."
            />
            <div className="mt-6">
              <Link to="/constitution">
                <Button className="gap-2 font-semibold">
                  Read Constitution <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
          </Reveal>
        </div>
      </section>

      {/* Call to action */}
      <section className="py-16 md:py-24">
        <div className="container">
          <Reveal y={32}>
            <div className="relative isolate overflow-hidden rounded-[2rem] bg-[#08111d] px-6 py-14 text-center md:rounded-[2.5rem] md:px-16 md:py-20">
              {/* colour wash, dot grid and drifting lights */}
              <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,#0c4a22_0%,#08111d_48%,#0d2d5c_100%)]" />
              <div
                className="absolute inset-0 -z-10 opacity-60 [background-image:radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,#000_0%,transparent_75%)]"
                aria-hidden="true"
              />
              <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
                <div className="animate-float-slow absolute -left-16 -top-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
                <div className="animate-float-slow absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-[#1F5FAF]/40 blur-3xl [animation-delay:-6s]" />
              </div>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/85">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Be part of it
              </span>

              <h2 className="mx-auto mt-6 max-w-3xl font-display text-3xl font-extrabold leading-tight tracking-tight text-white md:text-4xl lg:text-5xl">
                Empower our{" "}
                <span className="bg-gradient-to-r from-[#6fe08a] via-[#86b8f0] to-[#4C8DDA] bg-clip-text text-transparent">collective future</span>
              </h2>

              <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/75 md:text-base md:leading-8">
                Support your fellow computing students and stay active in the chapter to unlock new opportunities for growth and leadership.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {["Learn", "Build", "Lead"].map((word) => (
                  <span key={word} className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-white/80">
                    {word}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <a href="https://portal.nacos.org.ng/register" target="_blank" rel="noopener noreferrer">
                  <Button
                    size="lg"
                    className="group w-full gap-2 bg-white px-8 py-6 text-sm font-bold text-[#08111d] hover:-translate-y-0.5 hover:bg-white sm:w-auto sm:text-base"
                  >
                    Join NACOS National
                    <ArrowRight className="!size-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </a>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => (isLoggedIn ? navigate("/dashboard", { state: { tab: "overview" } }) : setLoginOpen(true))}
                  className="group w-full gap-2 border-white/30 bg-white/5 px-8 py-6 text-sm font-bold text-white backdrop-blur-sm hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/15 hover:text-white sm:w-auto sm:text-base"
                >
                  {isLoggedIn ? "Visit Portal" : "Member Portal"}
                  <ArrowRight className="!size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      </Layout>
    </>
  );
};

export default Index;
