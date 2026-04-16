import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  LogIn,
  CreditCard,
  IdCard,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import ExecutiveCard from "@/components/ExecutiveCard";
import EventCard from "@/components/EventCard";
import LoginModal from "@/components/LoginModal";
import { executives } from "@/data/executives";
import { events } from "@/data/events";
import { blogs } from "@/data/blogs";
import BlogCard from "@/components/BlogCard";
import heroBg from "@/assets/hero-bg.jpg";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import nacosLogo from "@/assets/nacos_logo.png";
import lasustechLogo from "@/assets/lasustech_logo.png";

const quickActions = [
  { icon: LogIn, label: "Login", path: "#", action: "login", desc: "Access your member portal" },
  { icon: CreditCard, label: "Pay Dues", path: "#", action: "login", desc: "Pay your NACOS dues" },
  { icon: IdCard, label: "ID Card", path: "#", action: "login", desc: "Register for your NACOS ID" },
  { icon: BookOpen, label: "Constitution", path: "/constitution", desc: "Read the chapter constitution" },
];

const galleryImages = [gallery1, gallery2, gallery3, gallery4];

const Index = () => {
  const [loginOpen, setLoginOpen] = useState(false);

  const handleAction = (item: typeof quickActions[0]) => {
    if (item.action === "login") {
      setLoginOpen(true);
    }
  };

  const [isHoveringLogos, setIsHoveringLogos] = useState(false);

  return (
    <Layout>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[#08111d]">
        <div className="absolute inset-0">
          <img
            src={heroBg}
            alt=""
            className="h-full w-full object-cover object-center"
          />
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(8,17,29,0.95)_0%,rgba(8,17,29,0.88)_42%,rgba(8,17,29,0.72)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(31,95,175,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(22,155,45,0.12),transparent_24%)]" />

        <div className="container relative z-10 py-16 md:py-24 lg:py-28">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7 xl:col-span-6">
              <h1 className="max-w-4xl font-display text-4xl font-extrabold leading-[0.95] tracking-tight text-white md:text-5xl lg:text-6xl xl:text-7xl animate-reveal">
                NACOS <span className="text-[#4C8DDA]">LASUSTECH</span> Chapter
              </h1>

              <p className="mt-6 max-w-2xl text-sm leading-7 text-white/85 md:text-base md:leading-8 animate-reveal-delay-1">
                Building the next generation of computing leaders through learning, innovation, leadership, and community.
              </p>

              <div className="mt-8 flex flex-row gap-2 sm:gap-3 animate-reveal-delay-2">
                <Link to="https://portal.nacos.org.ng/register" className="flex-1 sm:flex-initial">
                  <Button
                    size="lg"
                    className="w-full sm:min-w-[150px] bg-primary text-[10px] xs:text-xs sm:text-base font-bold text-white hover:bg-primary/90 shadow-lg shadow-primary/20 p-2 sm:p-6"
                  >
                    Join NACOS National
                  </Button>
                </Link>

                <Button
                  size="lg"
                  onClick={() => setLoginOpen(true)}
                  className="flex-1 sm:flex-initial sm:min-w-[150px] bg-[#1F5FAF] text-[10px] xs:text-xs sm:text-base font-bold text-white hover:bg-[#184d90] shadow-lg shadow-blue-500/20 p-2 sm:p-6"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5 xl:col-span-6">
              <div className="mx-auto max-w-[520px] overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm">
                <div className="grid gap-3 p-3 grid-cols-1 sm:grid-cols-[1.15fr_0.85fr]">
                  <img
                    src={gallery1}
                    alt="NACOS group photo"
                    className="h-[240px] w-full rounded-2xl object-cover sm:h-[360px]"
                  />

                  <div className="hidden flex-col gap-3 sm:flex">
                    <img
                      src={gallery2}
                      alt="NACOS seminar"
                      className="h-[132px] w-full rounded-2xl object-cover sm:h-[172px]"
                    />
                    <div className="flex-1 rounded-2xl border border-[#4C8DDA]/20 bg-[#1F5FAF]/14 p-5">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[#9fc3f1]">
                        LASUSTECH Chapter
                      </p>
                      <h2 className="mt-2 text-lg font-semibold leading-snug text-primary md:text-xl">
                        A digital home for the chapter
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-[#9fc3f1]">
                        Executives, events, and chapter activities in one space.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access */}
      <section className="relative -mt-6 z-20">
        <div className="container">
          <div className="grid gap-3 grid-cols-2 xl:grid-cols-4 animate-reveal-delay-2">
            {quickActions.map((item) => (
              <div key={item.label}>
                {item.path !== "#" ? (
                  <Link
                    to={item.path}
                    className="group flex h-full items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <item.icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-foreground">
                        {item.label}
                      </h3>
                      <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>

                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-foreground" />
                  </Link>
                ) : (
                  <button
                    onClick={() => handleAction(item)}
                    className="w-full h-full group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm text-left"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <item.icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-foreground">
                        {item.label}
                      </h3>
                      <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>

                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-foreground" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-16 md:py-24 lg:py-28">
        <div className="container">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div className="max-w-2xl">
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
                  Through mentorship, chapter-wide events, and a strong sense of community, we ensure that NACOS LASUSTECH is more than just an association—it's a home where future tech leaders are refined and empowered.
                </p>
              </div>
            </div>

            <div 
              className="relative flex items-center justify-center [perspective:1000px]"
              onMouseEnter={() => setIsHoveringLogos(true)}
              onMouseLeave={() => setIsHoveringLogos(false)}
            >
              <div 
                className="relative h-64 w-64 md:h-80 md:w-80 lg:h-96 lg:w-96 [transform-style:preserve-3d] animate-flip-horizontal"
                style={{ animationPlayState: isHoveringLogos ? "paused" : "running" }}
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
                    className="h-48 w-48 object-contain md:h-60 md:w-60 lg:h-72 lg:w-72"
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
                    className="h-48 w-48 object-contain md:h-60 md:w-60 lg:h-72 lg:w-72"
                  />
                </a>
              </div>
            </div>
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
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {executives.slice(0, 4).map((exec) => (
              <ExecutiveCard key={exec.post} {...exec} />
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
            title="Upcoming Events"
            description="Stay updated with the latest programs, workshops, and gatherings."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {events.slice(0, 3).map((event) => (
              <EventCard key={event.id} {...event} />
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

      {/* Blog Preview */}
      <section className="py-16 md:py-24 lg:py-28">
        <div className="container">
          <SectionHeading
            label="News & Updates"
            title="Latest from the Blog"
            description="Insights, tutorials, and chapter news from our tech community."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {blogs.slice(0, 3).map((blog) => (
              <BlogCard key={blog.id} {...blog} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/blog">
              <Button variant="outline" className="gap-2 text-xs font-semibold text-black">
                View All Posts <ArrowRight className="h-3.5 w-3.5" />
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
              <div key={i} className="overflow-hidden rounded-2xl">
                <img
                  src={img}
                  alt={`Gallery ${i + 1}`}
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/events#gallery">
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
          <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card px-6 py-10 text-center shadow-sm md:px-10 md:py-14">
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
        </div>
      </section>

      {/* Contact Strip */}
      <section className="relative isolate overflow-hidden bg-primary py-16 md:py-20 lg:py-24">
  {/* Subtle gradient overlay */}
  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(22,155,45,0.95)_0%,rgba(22,155,45,0.85)_50%,rgba(31,95,175,0.85)_100%)]" />

  {/* Soft “bubble” lights (very subtle, not childish) */}
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
    <div className="absolute top-1/2 -left-10 h-48 w-48 rounded-full bg-[#1F5FAF]/20 blur-3xl" />
    <div className="absolute bottom-0 right-1/3 h-36 w-36 rounded-full bg-white/5 blur-2xl" />
  </div>

  {/* Content */}
  <div className="container relative z-10 text-center">
    <h2 className="font-display text-2xl font-bold text-white md:text-3xl lg:text-4xl">
      Empower Our Collective Future
    </h2>

    <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/80 md:text-base">
      Support your fellow computing students and stay active in the chapter to unlock new opportunities for growth and leadership.
    </p>

          <div className="mt-10 flex flex-row justify-center gap-3">
            <Link to="https://portal.nacos.org.ng/register" className="flex-1 sm:flex-initial">
              <Button
                size="lg"
                className="w-full bg-white font-bold text-primary hover:bg-white/90 shadow-xl shadow-black/10 p-2 sm:p-6 text-[10px] sm:text-base"
              >
                Join NACOS National
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setLoginOpen(true)}
              className="flex-1 sm:flex-initial border-white/30 font-bold text-secondary hover:bg-white/10 p-2 sm:p-6 text-[10px] sm:text-base"
            >
              Member Dashboard
            </Button>
          </div>
    </div>
</section>
    </Layout>
  );
};

export default Index;
