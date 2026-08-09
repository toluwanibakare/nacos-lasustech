import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Trophy, ArrowRight, Award, Users, Camera, Medal, Star, Timer, ChevronRight, Vote, UserCircle2, BarChart2, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCountdown } from "@/hooks/useCountdown";
import { useToast } from "@/hooks/use-toast";
import { fetchVotingApi, resolveImageUrl } from "@/lib/api";

interface Nominee {
  id: string | number;
  slug: string;
  name: string;
  categoryId: number;
  categorySlug: string;
  categoryName: string;
  groupKey: string;
  department: string;
  level: string;
  bio: string;
  photo: string;
  voteCount: number;
}

interface Category {
  id: number;
  slug: string;
  name: string;
  description: string;
  groupKey: string;
  groupName: string;
  accentColor: string;
  heroImage: string;
  votePrice: number;
  nomineeCount: number;
}

interface Section {
  id: number;
  section_key: string;
  section_name: string;
  description: string;
  flyer_image_url: string;
  folder_name: string;
}

const DEFAULT_VOTING_END_DATE = new Date("2026-06-04T23:59:59+01:00");
const DEFAULT_PRICE_PER_VOTE = 100;

const groupMetadata: { [key: string]: { icon: any, gradient: string, bg: string, text: string, border: string } } = {
  "tech-digital": {
    icon: Star,
    gradient: "from-blue-600 to-cyan-400",
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
  },
  "leadership-impact": {
    icon: Award,
    gradient: "from-amber-500 to-orange-400",
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-200",
  },
  "social-personality": {
    icon: Users,
    gradient: "from-pink-500 to-rose-400",
    bg: "bg-pink-50",
    text: "text-pink-600",
    border: "border-pink-200",
  },
  "creative-brands": {
    icon: Camera,
    gradient: "from-purple-600 to-fuchsia-400",
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-200",
  },
  "sports": {
    icon: Trophy,
    gradient: "from-emerald-500 to-teal-400",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200",
  },
  "special-recognition": {
    icon: Medal,
    gradient: "from-indigo-500 to-violet-400",
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    border: "border-indigo-200",
  },
};

const getGroupMeta = (groupKey: string) => {
  return groupMetadata[groupKey] || {
    icon: Medal,
    gradient: "from-slate-500 to-slate-400",
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
  };
};

const BarRaceChart = ({ nominees }: { nominees: Nominee[] }) => {
  const sorted = [...nominees].sort((a, b) => b.voteCount - a.voteCount);
  const maxVotes = sorted[0]?.voteCount || 1;
  const rankColors = [
    "from-amber-400 to-yellow-300",
    "from-slate-400 to-slate-300",
    "from-orange-500 to-amber-400",
  ];
  const defaultColor = "from-primary to-blue-400";

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <BarChart2 className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-black text-slate-900 text-lg leading-tight">Current Standings</h3>
          <p className="text-xs text-slate-400 font-medium">Position only - no vote counts shown</p>
        </div>
      </div>

      <div className="space-y-4">
        {sorted.map((nominee, i) => {
          const pct = maxVotes > 0 
            ? Math.max(12, (nominee.voteCount / maxVotes) * 100) 
            : 12;
          const color = rankColors[i] ?? defaultColor;
          return (
            <motion.div
              key={nominee.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3"
            >
              <div className={`h-8 w-8 shrink-0 rounded-xl flex items-center justify-center text-xs font-black shadow-sm
                ${i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-slate-300 text-white" : i === 2 ? "bg-orange-400 text-white" : "bg-slate-100 text-slate-500"}`}>
                {i + 1}
              </div>

              <div className="flex-1 relative h-12 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1.2, delay: i * 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                  className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${color} flex items-center`}
                >
                  <span className="pl-4 text-xs font-black text-white truncate max-w-[70%] drop-shadow">
                    {nominee.name}
                  </span>
                </motion.div>

                <motion.div
                  initial={{ left: "-24px" }}
                  animate={{ left: `calc(${pct}% - 26px)` }}
                  transition={{ duration: 1.2, delay: i * 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                  className="absolute top-1 bottom-1 w-10 rounded-full overflow-hidden border-2 border-white shadow-lg z-10 bg-slate-200"
                >
                  <img
                    src={resolveImageUrl(nominee.photo)}
                    alt={nominee.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nominee.name)}&background=0ea5e9&color=fff&size=80&bold=true&font-size=0.45`;
                    }}
                  />
                </motion.div>
              </div>

              <span className="shrink-0 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-slate-100 text-slate-500">
                {i === 0 ? "Leading" : i === 1 ? "2nd" : i === 2 ? "3rd" : `Rank ${i + 1}`}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const NomineeCard = ({ nominee, pricePerVote, isClosed }: { nominee: Nominee, pricePerVote: number, isClosed?: boolean }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/voting/${nominee.categorySlug || 'nominee'}/${nominee.slug || nominee.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied!",
      description: `Support link for ${nominee.name} copied to clipboard.`,
    });
  };

  return (
    <motion.div
      whileHover={isClosed ? {} : { y: -6, scale: 1.02 }}
      onClick={() => {
        if (!isClosed) navigate(`/voting/${nominee.categorySlug || 'nominee'}/${nominee.slug || nominee.id}`);
      }}
      className={`group ${isClosed ? "cursor-not-allowed opacity-75" : "cursor-pointer hover:shadow-2xl hover:border-primary/30"} bg-white rounded-[2rem] border border-slate-200 shadow-md transition-all duration-300 overflow-hidden flex flex-col`}
    >
      <div className="relative h-64 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden flex items-center justify-center">
        {/* Blurred background backup to fill margins beautifully */}
        <img
          src={resolveImageUrl(nominee.photo)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover blur-xl opacity-25 select-none pointer-events-none"
        />
        {/* Centered uncropped main image */}
        <img
          src={resolveImageUrl(nominee.photo)}
          alt={nominee.name}
          className="relative z-10 max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nominee.name)}&background=0ea5e9&color=fff&size=320&bold=true&font-size=0.35`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-20" />
        <div className="absolute bottom-3 left-3">
          <span className="text-[10px] font-black text-white/80 uppercase tracking-widest bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
            {nominee.level}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h4 className="font-black text-slate-900 text-base leading-tight group-hover:text-primary transition-colors">
          {nominee.name}
        </h4>
        <p className="text-xs text-slate-400 font-medium mt-1">{nominee.department}</p>
        <p className="text-xs text-slate-500 leading-relaxed mt-3 flex-1 line-clamp-2">{nominee.bio}</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-primary shrink-0">N{pricePerVote}/vote</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center justify-center h-8 w-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 shadow-sm transition-all shrink-0"
              title="Share Nominee"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
            {isClosed ? (
              <div className="flex items-center gap-1.5 bg-slate-200 text-slate-500 text-xs font-black px-4 py-2 rounded-full shadow-md">
                Closed
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-primary text-white text-xs font-black px-4 py-2 rounded-full shadow-md shadow-primary/30 group-hover:shadow-primary/50 group-hover:bg-primary/90 transition-all">
                <Vote className="h-3.5 w-3.5" />
                Vote
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const getCategoryFlyer = (slug: string) => {
  let normalized = slug
    .toLowerCase()
    .trim()
    .replace(/-/g, "_");
    
  if (normalized === "best_programmer_of_the_year" || normalized === "programmer_of_the_year") {
    normalized = "programmer_of_the_year";
  } else if (normalized === "most_innovative_student" || normalized === "most_innovative_student_of_the_year") {
    normalized = "most_innovative_student_of_the_year";
  } else if (normalized === "tech_influencer" || normalized === "tech_influencer_of_the_year") {
    normalized = "tech_influencer_of_the_year";
  } else if (normalized === "best_creative_designer" || normalized === "creative_designer_of_the_year" || normalized === "best_creative_designer_of_the_year") {
    normalized = "creative_designer_of_the_year";
  } else if (normalized === "hoc_of_the_year") {
    normalized = "hoc_of_the_year";
  } else if (normalized === "assistant_hoc_of_the_year" || normalized === "ass_hoc_of_the_year") {
    normalized = "ass_hoc_of_the_year";
  } else if (normalized === "ai_tech_enthusiast_of_the_year" || normalized === "ai_tech_enthusiast_award") {
    normalized = "ai_tech_enthusiast_of_the_year";
  } else if (normalized === "developer_of_the_year" || normalized === "best_developer" || normalized === "most_creative_developer") {
    normalized = "developer_of_the_year";
  } else if (normalized === "executive_of_the_year" || normalized === "best_executive_of_the_year") {
    normalized = "executive_of_the_year";
  } else if (normalized === "most_outstanding_leader_of_the_year" || normalized === "most_outstanding_leader") {
    normalized = "most_outstanding_leader_of_the_year";
  } else if (normalized === "student_founder_of_the_year" || normalized === "tech_entrepreneur_student_founder") {
    normalized = "student_founder_of_the_year";
  } else if (normalized === "ceo_of_the_year" || normalized === "ceo_of_the_year") {
    normalized = "ceo_of_the_year";
  } else if (normalized === "artist_of_the_year" || normalized === "best_artist_of_the_year") {
    normalized = "artist_of_the_year";
  } else if (normalized === "best_brand_of_the_year" || normalized === "brand_of_the_year") {
    normalized = "brand_of_the_year";
  } else if (normalized === "best_female_footballer_of_the_year" || normalized === "female_footballer_of_the_year") {
    normalized = "female_footballer_of_the_year";
  } else if (normalized === "best_football_team_of_the_year" || normalized === "football_team_of_the_year") {
    normalized = "football_team_of_the_year";
  } else if (normalized === "fx_trader_of_the_year" || normalized === "fx_trader") {
    normalized = "fx_trader_of_the_year";
  } else if (normalized === "best_male_footballer_of_the_year" || normalized === "male_footballer_of_the_year") {
    normalized = "male_footballer_of_the_year";
  } else if (normalized === "best_lecturer_of_the_year" || normalized === "lecturer_of_the_year") {
    normalized = "lecturer_of_the_year";
  } else if (normalized === "best_tech_content_creator" || normalized === "tech_content_creator_of_the_year" || normalized === "tech_content_creator") {
    normalized = "tech_content_creator_of_the_year";
  } else if (normalized === "most_popular_student" || normalized === "most_popular_student_of_the_year") {
    normalized = "most_popular_student_of_the_year";
  } else if (normalized === "best_team_player" || normalized === "team_player") {
    normalized = "best_team_player";
  } else if (normalized === "fashion_icon_of_the_year" || normalized === "fashion_icon_of_the_department" || normalized === "fashion_icon") {
    normalized = "fashion_icon_of_the_year";
  } else if (normalized === "mr_money_of_the_year" || normalized === "mr_money") {
    normalized = "mr_money_of_the_year";
  } else if (normalized === "social_influencer_of_the_year" || normalized === "social_influencer") {
    normalized = "social_influencer_of_the_year";
  } else if (normalized === "social_personality_of_the_year" || normalized === "social_personality") {
    normalized = "social_personality_of_the_year";
  } else if (normalized === "content_creator_of_the_year" || normalized === "content_creator") {
    normalized = "content_creator_of_the_year";
  } else if (normalized === "most_exceptional_character_of_the_year" || normalized === "exceptional_character_of_the_year" || normalized === "exceptional_character") {
    normalized = "most_exceptional_character_of_the_year";
  } else if (normalized === "male_tech_personality_of_the_year" || normalized === "male_tech_personality") {
    normalized = "male_tech_personality_of_the_year";
  } else if (normalized === "female_tech_personality_of_the_year" || normalized === "female_tech_personality") {
    normalized = "female_tech_personality_of_the_year";
  } else if (normalized === "fresher_of_the_year" || normalized === "fresher") {
    normalized = "fresher_of the_year"; // Notice the space to match filename
  } else if (normalized === "emerging_leader_of_the_year" || normalized === "emerging_leader") {
    normalized = "emerging_leader_of_the_year";
  } else if (normalized === "special_of_the_year" || normalized === "special_recognition") {
    normalized = "special_of_the_year"; // Fallback if image gets added later
  }
 
   try {
     return new URL(`../assets/voting/${normalized}.JPG`, import.meta.url).href;
   } catch (e) {
     return "/placeholder.svg";
   }
 };


const VotingCategories = () => {
  const [view, setView] = useState<View>("groups");
  const [categories, setCategories] = useState<Category[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null);
  const [activeSub, setActiveSub] = useState<Category | null>(null);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nomineesLoading, setNomineesLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    Promise.all([
      fetchVotingApi("/overview"),
      fetchVotingApi("/sections").catch(() => [])
    ])
      .then(([overviewData, sectionsData]) => {
        setCategories(overviewData.categories || []);
        setSettings(overviewData.settings || null);
        setSections(sectionsData || []);
      })
      .catch((err) => {
        console.error("Failed to load voting data from backend:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSelectSub = (sub: Category) => {
    setActiveSub(sub);
    setView("nominees");
    setNomineesLoading(true);
    fetchVotingApi(`/categories/${sub.slug}`)
      .then((res) => {
        setNominees(res.nominees || []);
      })
      .catch((err) => {
        console.error("Failed to load nominees:", err);
      })
      .finally(() => {
        setNomineesLoading(false);
      });
  };

  useEffect(() => {
    if (loading || categories.length === 0) return;

    const params = new URLSearchParams(location.search);
    const catSlug = params.get("category");
    if (catSlug) {
      const found = categories.find((c) => c.slug === catSlug);
      if (found) {
        setActiveGroupKey(found.groupKey);
        handleSelectSub(found);
      }
    }
  }, [loading, categories, location.search]);

  // User requested exact date: June 4th 2026 23:59:59
  const DEFAULT_VOTING_END_DATE = new Date("2026-06-04T23:59:59+01:00");
    
  // We ignore settings?.votingClosesAt here because of date format confusion in admin panel
  const countdown = useCountdown(DEFAULT_VOTING_END_DATE);
    
  const pricePerVote = settings?.votePrice ? Number(settings.votePrice) : DEFAULT_PRICE_PER_VOTE;

  // Process unique groups from dynamic categories list
  const groupsList = (() => {
    const uniqueGroups: { [key: string]: { key: string, name: string, count: number } } = {};
    categories.forEach((cat) => {
      const key = cat.groupKey || "special-recognition";
      const name = cat.groupName || "Special Recognition";
      if (!uniqueGroups[key]) {
        uniqueGroups[key] = { key, name, count: 0 };
      }
      uniqueGroups[key].count += 1;
    });
    return Object.values(uniqueGroups);
  })();

  const activeGroup = groupsList.find(g => g.key === activeGroupKey) || null;
  const activeSubcats = categories.filter((c) => c.groupKey === activeGroupKey);

  const goGroup = (groupKey: string) => { 
    setActiveGroupKey(groupKey); 
    setView("subcats"); 
  };
  
  const goBack = () => {
    if (view === "nominees") { 
      setView("subcats"); 
      setActiveSub(null); 
      setNominees([]);
    } else { 
      setView("groups"); 
      setActiveGroupKey(null); 
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <p className="text-slate-400 font-bold text-lg">Loading voting categories...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 pb-32 font-sans">
        <div className="relative pt-32 pb-24 overflow-hidden bg-[#0a0f18]">
          <div className="absolute inset-0 z-0">
            <img src="/awards_gala_night_bg_1778965666277.png" alt="" className="h-full w-full object-cover opacity-[0.12] mix-blend-screen" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0f18]/80 to-slate-50" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
          </div>

          <div className="container px-4 relative z-10 text-center">
            <Link to="/awards" className="inline-flex items-center gap-2 mb-8 px-5 py-2.5 rounded-full bg-white text-slate-900 font-black text-sm shadow-lg hover:bg-primary hover:text-white transition-all">
              <ArrowRight className="h-4 w-4 rotate-180" />
              Back to Awards
            </Link>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl sm:text-7xl font-black text-white uppercase tracking-tighter"
            >
              Cast Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">Vote</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-white/60 mt-4 text-lg max-w-xl mx-auto"
            >
              Select a category group, pick an award, then support your favorite nominee.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mt-12 w-full max-w-2xl mx-auto"
            >
              {settings?.hideCountdown !== "1" && (
                <>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Timer className="h-4 w-4 text-primary animate-pulse" />
                    <span className="text-xs font-black text-primary uppercase tracking-[0.3em]">Voting Closes In</span>
                  </div>
                  {countdown.expired ? (
                    <p className="text-white/60 font-bold text-xl">Voting has closed</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-3 sm:gap-5">
                      {[
                        { value: countdown.days, label: "Days" },
                        { value: countdown.hours, label: "Hours" },
                        { value: countdown.minutes, label: "Mins" },
                        { value: countdown.seconds, label: "Secs" },
                      ].map(({ value, label }) => (
                        <div key={label} className="relative group">
                          <div className="absolute -inset-1 bg-gradient-to-b from-primary/40 to-blue-500/20 rounded-[1.5rem] blur-md opacity-70" />
                          <div className="relative bg-white/5 border border-white/10 backdrop-blur-xl rounded-[1.5rem] py-5 sm:py-7 flex flex-col items-center shadow-2xl">
                            <span className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tabular-nums leading-none">
                              {String(value).padStart(2, "0")}
                            </span>
                            <span className="mt-2 text-[10px] font-black text-white uppercase tracking-[0.25em]">{label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-5 text-white/40 text-xs font-medium">
                    Ends <span className="text-white/70 font-bold">4th June 2026</span> - N{pricePerVote} per vote - Secured by Korapay
                  </p>
                </>
              )}
            </motion.div>
          </div>
        </div>

        <div className="container px-4 mt-[-2rem] relative z-10">
          <AnimatePresence>
            {view !== "groups" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 mb-8"
              >
                <button
                  onClick={goBack}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 font-black text-sm hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm"
                >
                  <ArrowRight className="h-4 w-4 rotate-180" />
                  Back
                </button>
                <span className="text-slate-400 font-medium text-sm flex items-center gap-1">
                  <span className="text-slate-300">Voting</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className={view === "nominees" ? "text-slate-300" : "text-slate-700 font-bold"}>{activeGroup?.name}</span>
                  {view === "nominees" && activeSub && (
                    <>
                      <ChevronRight className="h-3 w-3" />
                      <span className="text-slate-700 font-bold truncate max-w-[200px]">{activeSub.name}</span>
                    </>
                  )}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {view === "groups" && (
              <motion.div
                key="groups"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35 }}
              >
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Award Categories</h2>
                  <p className="text-slate-500 mt-2">Choose a group to explore individual awards</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupsList.map((group, i) => {
                    const meta = getGroupMeta(group.key);
                    const matchedSection = sections.find((s) => s.section_key === group.key);
                    const flyerUrl = matchedSection?.flyer_image_url || `/flyers/${group.key}.png`;

                    return (
                      <motion.div
                        key={group.key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        onClick={() => goGroup(group.key)}
                        className={`cursor-pointer group relative bg-white rounded-[2.5rem] p-8 border ${meta.border} shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden min-h-[280px] flex flex-col justify-end`}
                      >
                        {/* Flyer backdrop representation */}
                        <div className="absolute inset-0 z-0 bg-slate-900 overflow-hidden">
                          <img 
                            src={flyerUrl} 
                            alt={group.name} 
                            className="h-full w-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              // If flyer fails to load, keep background dark with meta gradient preview
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/20" />
                        </div>

                        <div className="relative z-10">
                          <div className={`mb-4 h-14 w-14 rounded-2xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-white shadow-lg`}>
                            <meta.icon className="h-7 w-7" />
                          </div>

                          <h3 className="text-2xl font-black text-white mb-1 group-hover:text-primary transition-colors">{group.name}</h3>
                          <p className="text-sm text-white/60 mb-4">{group.count} Award Categories</p>

                          <div className={`flex items-center gap-2 font-black text-sm ${meta.text}`}>
                            Explore
                            <ChevronRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {view === "subcats" && activeGroup && (
              <motion.div
                key="subcats"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35 }}
              >
                <div className="flex items-center gap-4 mb-10">
                  {(() => {
                    const meta = getGroupMeta(activeGroup.key);
                    return (
                      <>
                        <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-white shadow-lg`}>
                          <meta.icon className="h-7 w-7" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{activeGroup.name}</h2>
                          <p className="text-slate-500">{activeSubcats.length} awards - select one to see nominees</p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {activeSubcats.map((sub, i) => {
                    const meta = getGroupMeta(sub.groupKey);
                    return (
                      <motion.div
                        key={sub.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        whileHover={{ y: -6 }}
                        onClick={() => handleSelectSub(sub)}
                        className={`cursor-pointer group bg-white rounded-[2rem] p-7 border ${meta.border} shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden`}
                      >
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${meta.gradient}`} />
                        {/* Category Flyer preview container */}
                        <div className="mb-5 w-full rounded-2xl overflow-hidden border border-slate-150 bg-slate-50/50 flex items-center justify-center select-none shadow-sm relative z-10">
                          <img 
                            src={getCategoryFlyer(sub.slug)} 
                            alt={sub.name} 
                            className="w-full h-auto object-contain rounded-2xl group-hover:scale-[1.03] transition-transform duration-300"
                            onError={(e) => {
                              // Hide image and fall back to trophy beautifully if flyer isn't found
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextSibling as HTMLDivElement;
                              if (fallback) {
                                fallback.style.display = 'flex';
                                // Add class to make it flex center
                                fallback.className = fallback.className + " flex";
                              }
                            }}
                          />
                          <div 
                            style={{ display: 'none' }}
                            className={`h-11 w-11 rounded-xl bg-gradient-to-br ${meta.gradient} items-center justify-center text-white`}
                          >
                            <Trophy className="h-5 w-5" />
                          </div>
                        </div>
                        <h3 className="font-black text-slate-900 text-lg leading-tight mb-2">{sub.name}</h3>
                        <p className="text-slate-500 text-sm leading-relaxed mb-5">{sub.description}</p>
                        <div className={`flex items-center gap-2 font-black text-sm ${meta.text}`}>
                          View Nominees
                          <ChevronRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {view === "nominees" && activeSub && (
              <motion.div
                key="nominees"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35 }}
              >
                <div className="flex flex-col md:flex-row items-center gap-6 mb-10 bg-white p-6 border border-slate-200 rounded-[2rem] shadow-sm">
                  {/* Category Flyer preview banner */}
                  <div className="w-full md:w-44 shrink-0 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center shadow-inner select-none">
                    <img 
                      src={getCategoryFlyer(activeSub.slug)} 
                      alt={activeSub.name} 
                      className="w-full h-auto object-contain max-h-[160px]"
                      onError={(e) => {
                        // Hide flyer preview beautifully if not found
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none mb-3">{activeSub.name}</h2>
                    <p className="text-slate-500 text-sm leading-relaxed">{activeSub.description}</p>
                  </div>
                </div>

                {nomineesLoading ? (
                  <div className="py-20 text-center text-slate-400 font-bold">
                    Loading category nominees...
                  </div>
                ) : nominees.length > 0 ? (
                  <div className="grid lg:grid-cols-[1fr_420px] gap-8 items-start">
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5">
                        {nominees.length} Nominees - Click a card to vote
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {nominees.map((n) => (
                          <NomineeCard 
                            key={n.id} 
                            nominee={n} 
                            pricePerVote={pricePerVote} 
                            isClosed={(settings?.closedCategories || "").split(",").includes(String(activeSub?.id))}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="lg:sticky lg:top-32">
                      <BarRaceChart nominees={nominees} />
                      <p className="text-center text-xs text-slate-400 mt-4 font-medium">
                        N{pricePerVote} per vote - Standings update in real-time
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-[2.5rem] border border-slate-200 p-16 flex flex-col items-center gap-4 text-center shadow-sm">
                    <UserCircle2 className="h-16 w-16 text-slate-200" />
                    <h3 className="text-xl font-black text-slate-600">No Nominees Yet</h3>
                    <p className="text-slate-400 max-w-sm">Nominees for this category will appear here once added in the Admin Portal.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
};

export default VotingCategories;
