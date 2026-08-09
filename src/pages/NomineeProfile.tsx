import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { ArrowRight, CheckCircle2, Vote, Trophy, Heart, Copy, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchVotingApi, resolveImageUrl } from "@/lib/api";

const VOTE_OPTIONS = [20, 40, 60, 80, 100];
const PRICE_PER_VOTE = 100;


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
    normalized = "fresher_of the_year";
  } else if (normalized === "emerging_leader_of_the_year" || normalized === "emerging_leader") {
    normalized = "emerging_leader_of_the_year";
  } else if (normalized === "special_of_the_year" || normalized === "special_recognition") {
    normalized = "special_of_the_year";
  }

  try {
    return new URL(`../assets/voting/${normalized}.JPG`, import.meta.url).href;
  } catch (e) {
    return "/placeholder.svg";
  }
};

const rankLabelText = (rank: number) => {
  if (rank === 1) return "First Place";
  if (rank === 2) return "Second Place";
  if (rank === 3) return "Third Place";
  return `Rank ${rank}`;
};

const NomineeProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [nominee, setNominee] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [selectedVotes, setSelectedVotes] = useState<number | null>(null);
  const [customVotes, setCustomVotes] = useState("");
  const [voterName, setVoterName] = useState("NACOS Voter");
  const [voterEmail, setVoterEmail] = useState("voter@nacos.lasustech.edu.ng");
  const [copied, setCopied] = useState(false);
  const [initializingPayment, setInitializingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleBack = () => {
    if (nominee?.categorySlug) {
      navigate(`/voting/categories?category=${nominee.categorySlug}`);
    } else {
      navigate("/voting/categories");
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchVotingApi(`/nominees/${id}`)
      .then(async (data) => {
        let theNominee = data.nominee;
        
        // Fetch the category to get the real ranking since /nominees/:id returns ranking: 1 always
        try {
           const slug = theNominee.categorySlug || theNominee.category;
           if (slug) {
               const catData = await fetchVotingApi(`/categories/${slug}`);
               if (catData && catData.nominees) {
                   const realNominee = catData.nominees.find((n: any) => n.id === theNominee.id || n.slug === theNominee.slug);
                   if (realNominee) {
                       theNominee.ranking = realNominee.ranking;
                   }
               }
           }
        } catch (e) {
           console.error("Failed to fetch real ranking", e);
        }

        setNominee(theNominee);
        setSettings(data.settings);
      })
      .catch((err) => {
        console.error("Failed to load nominee:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!nominee) return;

    // Update document title dynamically
    document.title = `Vote for ${nominee.name} | NACOS Awards`;

    // Helper to set meta content safely
    const setMetaContent = (selector: string, content: string) => {
      const el = document.querySelector(selector);
      if (el) {
        el.setAttribute("content", content);
      } else {
        const isProperty = selector.includes("property");
        const newMeta = document.createElement("meta");
        if (isProperty) {
          const prop = selector.match(/property="([^"]+)"/)?.[1];
          if (prop) newMeta.setAttribute("property", prop);
        } else {
          const name = selector.match(/name="([^"]+)"/)?.[1];
          if (name) newMeta.setAttribute("name", name);
        }
        newMeta.setAttribute("content", content);
        document.head.appendChild(newMeta);
      }
    };

    const resolvedPhoto = resolveImageUrl(nominee.photo);
    
    // Set dynamic Open Graph and Twitter Card tags
    setMetaContent('meta[property="og:title"]', `Vote for ${nominee.name} | NACOS Awards`);
    setMetaContent('meta[property="og:description"]', `Support ${nominee.name} in the category of "${nominee.categoryName || nominee.category}"!`);
    setMetaContent('meta[property="og:image"]', resolvedPhoto);
    setMetaContent('meta[name="twitter:title"]', `Vote for ${nominee.name} | NACOS Awards`);
    setMetaContent('meta[name="twitter:description"]', `Support ${nominee.name} in the category of "${nominee.categoryName || nominee.category}"!`);
    setMetaContent('meta[name="twitter:image"]', resolvedPhoto);

    // Clean up to restore defaults when unmounted or changing candidates
    return () => {
      document.title = "NACOS LASUSTECH | Official Website";
      setMetaContent('meta[property="og:title"]', "NACOS LASUSTECH Website");
      setMetaContent('meta[property="og:description"]', "The official platform for computing students at LASUSTECH. Access resources, pay dues, and join our tech community.");
      setMetaContent('meta[property="og:image"]', "/og-image.png");
      setMetaContent('meta[name="twitter:title"]', "NACOS LASUSTECH Website");
      setMetaContent('meta[name="twitter:description"]', "Empowering the next generation of computing leaders at LASUSTECH.");
      setMetaContent('meta[name="twitter:image"]', "/og-image.png");
    };
  }, [nominee]);

  const effectiveVotes =
    selectedVotes === -1
      ? parseInt(customVotes || "0", 10)
      : selectedVotes ?? 0;

  const votePrice = settings?.votePrice ? Number(settings.votePrice) : PRICE_PER_VOTE;
  const totalCost = effectiveVotes * votePrice;

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl = encodeURIComponent(window.location.href);
  const rawShareText = `Vote for ${nominee?.name} contesting for ${nominee?.categoryName || nominee?.category || "NACOS Awards 2026"}.

5 Votes: ₦500
10 Votes: ₦1,000
50 Votes: ₦5,000
100 Votes: ₦10,000

Your support will be highly appreciated, and God bless you as you do so. Please help ${nominee?.name} win!`;

  const shareText = encodeURIComponent(rawShareText);

  const isClosed = (settings?.closedCategories || "").split(",").includes(String(nominee?.categoryId));

  const handleVote = async () => {
    if (isClosed) {
      setErrorMessage("Voting has been closed for this category.");
      return;
    }
    if (effectiveVotes < 1) {
      setErrorMessage("Please select or enter the number of votes.");
      return;
    }
    setErrorMessage("");
    setInitializingPayment(true);

    try {
      const response = await fetchVotingApi("/transactions/initialize", {
        method: "POST",
        body: JSON.stringify({
          nomineeId: nominee.id,
          voterName: voterName.trim(),
          voterEmail: voterEmail.trim(),
          votes: effectiveVotes,
          frontendUrl: window.location.origin,
        }),
      });

      if (response?.checkoutUrl) {
        // Redirect to Korapay Checkout
        window.location.href = response.checkoutUrl;
      } else {
        throw new Error("Could not initialize payment gateway.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to initialize payment. Please try again.");
      setInitializingPayment(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <p className="text-slate-400 font-bold text-lg">Loading profile...</p>
        </div>
      </Layout>
    );
  }

  if (!nominee) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-6">
          <Trophy className="h-16 w-16 text-slate-300" />
          <h2 className="text-2xl font-black text-slate-700">Nominee not found</h2>
          <button
            onClick={handleBack}
            className="rounded-full bg-primary px-6 py-3 text-sm font-black text-white shadow-lg hover:bg-primary/90 transition-all"
          >
            Go Back
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 pb-24">

        {/* ── Hero Banner ── */}
        <div className="relative h-[380px] sm:h-[440px] overflow-hidden bg-[#08111d]">
          {/* Category flyer backdrop */}
          <div className="absolute inset-0 z-0 select-none pointer-events-none">
            <img 
              src={getCategoryFlyer(nominee?.categorySlug || nominee?.category || "")} 
              alt={nominee?.categoryName || "Category Flyer"} 
              className="w-full h-full object-cover opacity-35"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            {/* Soft shadow vignette */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#08111d]/30 via-[#08111d]/70 to-[#08111d]" />
          </div>

          <div className="absolute inset-0 bg-[#08111d]/10 z-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#08111d]/40 via-[#08111d]/60 to-[#08111d] z-20" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/15 rounded-full blur-[100px] z-10 select-none pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px] z-10 select-none pointer-events-none" />

          {/* Back button — top left */}
          <div className="absolute top-8 left-0 right-0 container px-4 z-30">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-slate-900 font-black text-sm shadow-lg hover:bg-primary hover:text-white transition-all hover:-translate-x-1"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Go Back
            </button>
          </div>

          {/* Award category label — bottom of banner */}
          <div className="absolute bottom-0 left-0 right-0 container px-4 z-30 pb-20">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                <Trophy className="h-4 w-4 text-white" />
              </div>
              <span className="text-xs font-black text-primary uppercase tracking-[0.25em]">
                NACOS Awards Day 2026
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight max-w-2xl">
              {nominee.categoryName || nominee.categorySlug}
            </h2>
          </div>
        </div>

        {/* ── Profile card ── */}
        <div className="container px-4 mt-[-3rem] relative z-30">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden"
            >
              {/* ── Nominee identity strip ── */}
              <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6 p-8 sm:p-10 border-b border-slate-100">
                <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary via-blue-400 to-primary/30 rounded-l-[2.5rem]" />

                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="h-32 w-32 sm:h-36 sm:w-36 rounded-[1.8rem] border-4 border-white shadow-2xl overflow-hidden bg-slate-100 ring-4 ring-primary/10">
                    <img
                      src={resolveImageUrl(nominee.photo)}
                      alt={nominee.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(nominee.name)}&background=0ea5e9&color=fff&size=288&bold=true&font-size=0.4`;
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 h-9 w-9 rounded-xl bg-amber-400 flex items-center justify-center shadow-lg border-2 border-white">
                    <span className="text-white text-xs font-black">{nominee.ranking || "1"}</span>
                  </div>
                </div>

                {/* Text info */}
                <div className="flex-1 text-center sm:text-left sm:pl-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-primary uppercase tracking-[0.25em] bg-primary/8 px-3 py-1 rounded-full border border-primary/20 mb-3">
                    {rankLabelText(nominee.ranking || 1)}
                  </span>

                  <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
                    {nominee.name}
                  </h1>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                      {nominee.department}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {nominee.level}
                    </span>
                  </div>

                  <p className="text-slate-500 text-sm leading-relaxed mt-4 max-w-md">
                    {nominee.bio}
                  </p>
                </div>
              </div>

              {/* Share row */}
              <div className="px-8 sm:px-10 py-6 border-b border-slate-100 flex flex-wrap items-center gap-3">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest mr-auto">
                  Share and Support
                </span>

                {/* WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-sm px-5 py-2.5 transition-all hover:-translate-y-0.5 shadow-sm"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.557 4.118 1.533 5.845L0 24l6.335-1.652A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.374l-.358-.213-3.76.981.999-3.648-.232-.375A9.818 9.818 0 1112 21.818z" />
                  </svg>
                  WhatsApp
                </a>

                {/* Facebook */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#1877F2] hover:bg-[#1565d8] text-white font-bold text-sm px-5 py-2.5 transition-all hover:-translate-y-0.5 shadow-sm"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </a>

                {/* Twitter / X */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-black hover:bg-slate-900 text-white font-bold text-sm px-5 py-2.5 transition-all hover:-translate-y-0.5 shadow-sm"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Twitter / X
                </a>

                {/* Copy link */}
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm px-5 py-2.5 transition-all hover:-translate-y-0.5"
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>

              {/* ── Voting section ── */}
              <div className="px-8 sm:px-10 py-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Vote className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 leading-tight">Cast Your Votes</h2>
                    <p className="text-xs text-slate-400 font-medium">N{votePrice} per vote - Secure checkout powered by Korapay</p>
                  </div>
                </div>



                {/* Vote quantity selector */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-4">

                  {VOTE_OPTIONS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => { setSelectedVotes(v); setCustomVotes(""); }}
                      className={`rounded-2xl border-2 py-4 font-black text-lg transition-all ${
                        selectedVotes === v
                          ? "border-primary bg-primary text-white shadow-lg shadow-primary/20 scale-[1.04]"
                          : "border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:bg-primary/5"
                      }`}
                    >
                      {v}
                      <span className="block text-[10px] font-bold opacity-70 mt-0.5">
                        votes - N{(v * votePrice).toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Custom input */}
                <div
                  onClick={() => setSelectedVotes(-1)}
                  className={`flex items-center gap-3 rounded-2xl border-2 px-5 py-3.5 mb-6 cursor-text transition-all ${
                    selectedVotes === -1
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 bg-white hover:border-primary/30"
                  }`}
                >

                  <input
                    type="number"
                    min={1}
                    placeholder="Custom amount of votes..."
                    value={customVotes}
                    onChange={(e) => {
                      setCustomVotes(e.target.value);
                      setSelectedVotes(-1);
                    }}
                    className="flex-1 bg-transparent outline-none text-sm font-bold text-slate-800 placeholder:text-slate-400"
                  />
                  {selectedVotes === -1 && customVotes && (
                    <span className="text-xs font-black text-primary whitespace-nowrap">
                      N{(parseInt(customVotes || "0") * votePrice).toLocaleString()}
                    </span>
                  )}
                </div>

                {errorMessage && (
                  <div className="mb-4 rounded-xl bg-red-50 border border-red-100 p-4 text-xs font-bold text-red-600">
                    {errorMessage}
                  </div>
                )}

                {/* Summary + CTA */}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-1 w-full">
                    {isClosed ? (
                      <div className="rounded-2xl border-2 border-red-100 bg-red-50 p-6 flex flex-col items-center justify-center text-center">
                        <p className="text-red-500 font-bold mb-2">Voting Closed</p>
                        <p className="text-sm text-red-400">Voting has ended for this category.</p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border-2 border-slate-100 bg-white p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4">Payment Breakdown</h3>
                        <div className="space-y-3 mb-6">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Votes Selected</span>
                            <span className="font-bold text-slate-800">{effectiveVotes.toLocaleString()} votes</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Price per Vote</span>
                            <span className="font-bold text-slate-800">₦{votePrice.toLocaleString()}</span>
                          </div>
                          <div className="border-t border-slate-100 pt-3 flex justify-between">
                            <span className="text-slate-500 font-semibold">Total Amount</span>
                            <span className="font-black text-emerald-600 text-lg">₦{totalCost.toLocaleString()}</span>
                          </div>
                        </div>

                        <button
                          onClick={handleVote}
                          disabled={initializingPayment || effectiveVotes < 1}
                          className="w-full h-14 rounded-xl text-base font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 relative overflow-hidden group"
                        >
                          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                          <span className="relative flex items-center justify-center gap-2">
                            {initializingPayment ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Connecting...
                              </>
                            ) : (
                              <>
                                Pay ₦{totalCost.toLocaleString()} Now
                                <ArrowRight className="w-5 h-5 ml-1" />
                              </>
                            )}
                          </span>
                        </button>
                        <p className="mt-4 text-center text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center justify-center gap-1.5">
                          <Lock className="w-3 h-3" />
                          {settings?.paymentProviderDescription || "Secured Checkout"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-center text-[11px] text-slate-400 mt-4">
                  Payment is processed securely via Korapay. Votes are non-refundable.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NomineeProfile;
