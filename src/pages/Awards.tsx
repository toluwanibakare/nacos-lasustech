import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowRight, Award, Users, Search, CreditCard, CheckSquare, ChevronRight, BarChart3, Medal, Crown, Camera, Star, Timer, Coins, ShieldCheck, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useCountdown } from "@/hooks/useCountdown";
import { fetchVotingApi, resolveImageUrl } from "@/lib/api";

const defaultCategoryGroups = [
  {
    title: "Tech and Digital",
    icon: Star,
    categories: ["Best Programmer of the Year", "Most Innovative Student", "Tech Influencer of the Year", "Best Tech Content Creator", "AI/Tech Enthusiast Award", "Most Creative Developer", "Best Creative Designer"]
  },
  {
    title: "Leadership and Impact",
    icon: Award,
    categories: ["HOC of the Year", "Assistant HOC of the Year", "Most Outstanding Leader", "Best Executive of the Year", "Best Team Player"]
  },
  {
    title: "Social and Personality",
    icon: Users,
    categories: ["Social Influencer of the Year", "Social Personality of the Year", "Most Popular Student", "Mr. Money of the Year", "Fashion Icon of the Department"]
  },
  {
    title: "Creative and Brands",
    icon: Camera,
    categories: ["Artist of the Year", "Content Creator of the Year", "CEO of the Year", "Tech Entrepreneur/Student Founder", "Best Brand of the Year"]
  },
  {
    title: "Sports",
    icon: Trophy,
    categories: ["Best Male Footballer of the Year", "Best Female Footballer of the Year", "Best Football Team of the Year"]
  },
  {
    title: "Special Recognition",
    icon: Medal,
    categories: ["FX Trader of the Year", "Best Lecturer of the Year"]
  }
];

const fallbackTopCandidates = [
  { id: "1", name: "Best Programmer Nominees", category: "Tech and Digital", rank: 1 },
  { id: "2", name: "HOC of the Year Nominees", category: "Leadership and Impact", rank: 2 },
  { id: "3", name: "Social Influencer Nominees", category: "Social and Personality", rank: 3 },
];

const DEFAULT_AWARDS_DATE = new Date("2026-06-17T18:00:00+01:00");

const Awards = () => {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVotingApi("/overview")
      .then((data) => {
        setOverview(data);
      })
      .catch((err) => {
        console.warn("Using local voting fallback data:", err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // User requested exact date: June 17th 2026 00:00
  const DEFAULT_AWARDS_DATE = new Date("2026-06-17T00:00:00+01:00");
  const awardsTargetDate = DEFAULT_AWARDS_DATE;

  const awardCountdown = useCountdown(awardsTargetDate);

  // Group fetched categories by group name
  const categoryGroups = (() => {
    if (!overview?.categories || overview.categories.length === 0) {
      return defaultCategoryGroups;
    }
    
    // Group categories by groupKey
    const groups: { [key: string]: string[] } = {};
    overview.categories.forEach((cat: any) => {
      const gName = cat.groupName || cat.groupKey || "Special Recognition";
      if (!groups[gName]) {
        groups[gName] = [];
      }
      groups[gName].push(cat.name);
    });

    const iconMap: { [key: string]: any } = {
      "Tech & Digital": Star,
      "Tech and Digital": Star,
      "Leadership & Impact": Award,
      "Leadership and Impact": Award,
      "Social & Personality": Users,
      "Social and Personality": Users,
      "Creative & Brands": Camera,
      "Creative and Brands": Camera,
      "Sports": Trophy,
      "Special Recognition": Medal,
    };

    return Object.entries(groups).map(([title, categories]) => ({
      title,
      icon: iconMap[title] || Medal,
      categories,
    }));
  })();

  const topCandidates = overview?.featuredNominees || overview?.leaderboard?.slice(0, 5) || fallbackTopCandidates;

  return (
    <Layout>
      <div className="bg-background min-h-screen pb-20">
        <section className="relative min-h-[92vh] w-full flex items-center justify-center overflow-hidden py-12 bg-[#08111d]">
          <div className="absolute inset-0 z-0">
            <img
              src="/awards_gala_night_bg_1778965666277.png"
              alt="NACOS Day Awards"
              className="h-full w-full object-cover opacity-20 transition-transform duration-1000 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-[#08111d]/90 to-[#08111d]" />
          </div>

          <div className="container relative z-10">
            <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(350px,0.8fr)]">
              <div className="max-w-4xl text-center lg:text-left">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary-500/40 bg-primary-500/30 px-4 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-md uppercase tracking-widest"
                >
                  <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-pulse" />
                  VOTING IS LIVE
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="max-w-4xl text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-[6.5rem] lg:leading-[1] mb-6 uppercase font-display"
                >
                  NACOS AWARDS
                  <span className="block text-primary italic normal-case text-4xl sm:text-5xl lg:text-7xl font-black">Day 2026</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="max-w-2xl text-lg leading-relaxed text-white/70 mb-10 mx-auto lg:mx-0 font-medium"
                >
                  Celebrating excellence, innovation, and leadership in our tech community. Support your peers with your votes.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center lg:items-start gap-4 sm:flex-row sm:justify-center lg:justify-start mb-10"
                >
                  <Link to="/voting/categories">
                    <Button size="lg" className="rounded-full bg-primary px-10 py-7 text-lg font-bold text-white shadow-2xl shadow-primary/30 hover:bg-primary/90 transition-all hover:-translate-y-1">
                      Start Voting
                    </Button>
                  </Link>
                  <Link to="/voting/leaderboard">
                    <Button size="lg" variant="outline" className="rounded-full border-white/10 bg-white/5 px-8 py-7 text-lg font-semibold text-white backdrop-blur-md hover:bg-white/10 transition-all hover:-translate-y-1">
                      <BarChart3 className="mr-2 h-5 w-5" />
                      View Leaderboard
                    </Button>
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-2 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl p-6 max-w-lg"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Timer className="h-4 w-4 text-primary animate-pulse" />
                    <span className="text-xs font-black text-primary uppercase tracking-[0.3em]">Awards Day Countdown</span>
                  </div>
                  {awardCountdown.expired ? (
                    <p className="text-white font-black text-xl">It is Awards Day!</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { value: awardCountdown.days, label: "Days" },
                        { value: awardCountdown.hours, label: "Hours" },
                        { value: awardCountdown.minutes, label: "Mins" },
                        { value: awardCountdown.seconds, label: "Secs" },
                      ].map(({ value, label }) => (
                        <div key={label} className="bg-white/10 border border-white/20 rounded-2xl py-4 flex flex-col items-center">
                          <span className="text-2xl sm:text-3xl font-black text-white tabular-nums leading-none drop-shadow">
                            {String(value).padStart(2, "0")}
                          </span>
                          <span className="mt-1.5 text-[10px] font-black text-white uppercase tracking-[0.2em]">{label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-4 text-white/70 text-[11px] font-bold">
                    NACOS Awards Day - <span className="text-primary font-black">17th June 2026</span>
                  </p>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="hidden lg:block"
              >
                <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-10 backdrop-blur-2xl shadow-2xl">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-white/5 shadow-inner">
                      <Crown className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white uppercase">Today's Spotlight</p>
                      <p className="text-xs text-white/40">Real-time voting activity</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {topCandidates.slice(0, 3).map((cand: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-black text-white/20">#{i + 1}</span>
                          <div>
                            <p className="text-sm font-bold text-white leading-tight">{cand.name || cand.full_name}</p>
                            <p className="text-[10px] text-primary uppercase font-bold tracking-widest">{cand.categoryName || cand.category}</p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-white/40">#{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <div className="container px-4 relative z-20 mt-[-4rem] mb-20">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Trophy, title: "Excellence", desc: "Recognizing academic and technical brilliance" },
              { icon: Users, title: "Community", desc: "Celebrating those who build and lead us" },
              { icon: Award, title: "Leadership", desc: "Spotlighting the next generation of tech leaders" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group rounded-[2rem] border border-border bg-white p-8 shadow-xl transition-all hover:shadow-2xl hover:border-primary/20 hover:-translate-y-2"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5 text-primary border border-primary-100 transition-transform group-hover:scale-110 duration-300">
                  <item.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground">{item.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 text-slate-900 uppercase tracking-tight">How to Vote</h2>
            <p className="text-slate-500 text-lg">Support your candidates in 4 easy steps</p>
          </div>

          <div className="flex justify-between items-start mb-16 max-w-3xl mx-auto relative px-2">
            {/* Connecting Line behind */}
            <div className="absolute top-6 left-[10%] right-[10%] h-[2px] bg-slate-100 hidden sm:block -z-10"></div>
            
            {[
              { icon: Search, title: "Category", desc: "Find the award category" },
              { icon: Users, title: "Nominee", desc: "Pick your favorite candidate" },
              { icon: CheckSquare, title: "Quantity", desc: "Select number of votes" },
              { icon: CreditCard, title: "Confirm", desc: "Secure payment to verify" },
            ].map((step, index, arr) => (
              <div key={index} className="flex-1 text-center group relative flex flex-col items-center">
                <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-500 shadow-sm relative z-10">
                  <step.icon className="h-5 w-5 md:h-6 md:w-6 text-slate-400 group-hover:text-white transition-colors" />
                </div>
                <div className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1 md:mb-2">Step {index + 1}</div>
                <h3 className="font-bold text-[11px] md:text-sm text-slate-900 leading-tight">{step.title}</h3>
                
                {/* Mobile connecting arrow */}
                {index < arr.length - 1 && (
                  <div className="absolute top-4 -right-3 text-slate-200 sm:hidden">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-[#08111d] rounded-[2.5rem] p-8 md:p-12 text-white border border-white/10 relative overflow-hidden shadow-2xl">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 grid gap-10 lg:grid-cols-[1fr_1.8fr]">
              <div className="flex flex-col justify-center items-center lg:items-start text-center lg:text-left border-b lg:border-b-0 lg:border-r border-white/10 pb-8 lg:pb-0 lg:pr-10">
                <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-6 border border-primary-500/30">
                  <Coins className="h-8 w-8" />
                </div>
                <h3 className="text-3xl font-black mb-3 tracking-tight uppercase">Official Pricing</h3>
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-black text-2xl shadow-xl shadow-primary/20 mb-4">
                  1 Vote = ₦100
                </div>
                <p className="text-sm text-white/60 font-medium max-w-sm">
                  Cast multiple votes to boost your candidate's score. Secure payments powered by Korapay.
                </p>
              </div>

              <div className="space-y-6 flex flex-col justify-center">
                <div className="flex items-center gap-3">
                  <Info className="h-5 w-5 text-primary" />
                  <h4 className="text-lg font-black uppercase tracking-wider">Voting Rules & Guidelines</h4>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      title: "Multiple Voting",
                      desc: "You can cast 1, 5, 10, 50, or any custom number of votes at once. There is no limit to total votes."
                    },
                    {
                      title: "Secure Transactions",
                      desc: "All payments are processed securely via Korapay. Do not refresh the checkout window while paying."
                    },
                    {
                      title: "Real-Time Leaderboard",
                      desc: "Vote tallies and public standing charts are updated instantly upon successful transaction verification."
                    },
                    {
                      title: "Selection Accuracy",
                      desc: "Double-check nominee names before completing payment. Votes are final and cannot be refunded or transferred."
                    }
                  ].map((rule, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                        <h5 className="font-bold text-sm text-white">{rule.title}</h5>
                      </div>
                      <p className="text-xs leading-relaxed text-white/60 font-medium">{rule.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-slate-50 rounded-[3rem] border border-slate-200 shadow-inner">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 text-slate-900 uppercase tracking-tight">Award Sections</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">Click a group to explore individual categories</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {categoryGroups.map((group, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedGroup(selectedGroup === group.title ? null : group.title)}
                className={`cursor-pointer group relative bg-white rounded-[2.5rem] p-10 border transition-all duration-300 ${
                  selectedGroup === group.title ? "border-primary shadow-xl ring-2 ring-primary/10" : "border-slate-200 shadow-sm hover:shadow-lg"
                }`}
              >
                <div className={`mb-8 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 ${
                  selectedGroup === group.title ? "bg-primary text-white" : "bg-primary/5 text-primary"
                }`}>
                  <group.icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">{group.title}</h3>
                <p className="text-slate-500 text-sm mb-6">{group.categories.length} Categories</p>
                <div className="flex items-center text-primary font-bold text-sm">
                  {selectedGroup === group.title ? "Hide List" : "View All Categories"}
                  <ChevronRight className={`ml-1 h-4 w-4 transition-transform ${selectedGroup === group.title ? "rotate-90" : ""}`} />
                </div>

                <AnimatePresence>
                  {selectedGroup === group.title && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <ul className="mt-8 space-y-3 border-t border-slate-100 pt-6">
                        {group.categories.map((cat, i) => (
                          <li key={i} className="flex items-start gap-2 text-slate-600 text-sm font-medium">
                            <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/20" />
                            {cat}
                          </li>
                        ))}
                      </ul>
                      <Link to="/voting/categories">
                        <Button className="w-full mt-6 rounded-full bg-primary text-white font-bold">
                          Go to Section
                        </Button>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link to="/voting/categories">
              <Button variant="outline" className="rounded-full border-slate-200 bg-white px-10 py-7 text-lg font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                Explore All Award Categories
              </Button>
            </Link>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 text-slate-900 uppercase tracking-tight">Today's <span className="text-primary">Leaders</span></h2>
            <p className="text-slate-500 text-lg">The current standings across the department</p>
          </div>

          <div className="grid gap-6">
            {topCandidates.slice(0, 5).map((cand: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col sm:flex-row items-center gap-6"
              >
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl font-black shadow-lg overflow-hidden border-[3px] ${
                  index === 0 ? "border-amber-400" :
                  index === 1 ? "border-slate-300" :
                  index === 2 ? "border-orange-500" :
                  "border-slate-100"
                }`}>
                  <img 
                    src={resolveImageUrl(cand.photo)} 
                    alt={cand.name || cand.full_name} 
                    className="h-full w-full object-cover" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(cand.name || cand.full_name || 'User')}&background=0ea5e9&color=fff`;
                    }}
                  />
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl font-black text-slate-900">{cand.name || cand.full_name}</h3>
                  <p className="text-sm font-bold text-primary uppercase tracking-widest">{cand.categoryName || cand.category}</p>
                </div>

                <div className="flex flex-col items-center sm:items-end">
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Position {index + 1}</p>
                </div>

                <Link to={`/voting/${cand.categorySlug || 'category'}/${cand.slug || cand.id}`}>
                  <Button className="rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all font-bold px-8">
                    Vote
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link to="/voting/leaderboard">
              <Button variant="outline" className="rounded-full border-slate-200 bg-white px-10 py-7 text-lg font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                View Full Leaderboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Awards;
