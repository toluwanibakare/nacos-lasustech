import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { adminFetch, clearAdminSession, loginToAdminSystems, votingAdminFetch } from "@/lib/admin-api";
import { BarChart3, Calendar, FileText, Flag, Image, LogOut, Settings, ShieldCheck, Trophy, Users, Search, ChevronDown, ChevronUp, Plus, Trash2, Edit2, ImagePlus, Award, Check, X, SlidersHorizontal, ArrowUpDown, Clock, CreditCard, Receipt, Menu } from "lucide-react";

type TabKey = "overview" | "students" | "academics" | "executives" | "events" | "voting";

const emptyExecutive = { id: "", name: "", post: "", level: "", description: "", image_url: "", sort_order: 0, is_active: true };
const emptyEvent = { id: "", slug: "", title: "", event_status: "upcoming", start_date: "", end_date: "", location: "", description: "", cover_image_url: "", registration_url: "", flyer_folder: "", sort_order: 0, is_active: true };
const emptyBlog = { id: "", slug: "", title: "", excerpt: "", content: "", author: "", category: "", image_url: "", published_at: "", is_published: true };
const emptySection = { id: "", section_key: "", section_name: "", description: "", flyer_image_url: "", folder_name: "", sort_order: 0, is_active: true };
const emptyCategory = { id: "", slug: "", name: "", description: "", group_key: "", group_name: "", group_sort: 0, accent_color: "#0f9d58", hero_image: "", vote_price: 100, sort_order: 0, is_active: true };
const emptyNominee = { id: "", category_id: "", category_ids: [] as string[], slug: "", full_name: "", department: "Computer Science", level_label: "", bio: "", photo_url: "", is_active: true };

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const formatCurrency = (amount: number) => `₦${Number(amount || 0).toLocaleString()}`;

const AdminPortal = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [dashboard, setDashboard] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [votingDashboard, setVotingDashboard] = useState<any>(null);
  const [nominees, setNominees] = useState<any[]>([]);
  const [flagForm, setFlagForm] = useState({ matric_number: "", student_name: "", reason: "", message: "" });
  const [academicForm, setAcademicForm] = useState({ session: "", semester: "First Semester" });
  const [executiveForm, setExecutiveForm] = useState<any>(emptyExecutive);
  const [eventForm, setEventForm] = useState<any>(emptyEvent);
  const [galleryForm, setGalleryForm] = useState({ eventId: "", image_url: "", caption: "" });
  const [blogForm, setBlogForm] = useState<any>(emptyBlog);
  const [votingSettingsForm, setVotingSettingsForm] = useState<any>({});
  const [sectionForm, setSectionForm] = useState<any>(emptySection);
  const [categoryForm, setCategoryForm] = useState<any>(emptyCategory);
  const [nomineeForm, setNomineeForm] = useState<any>(emptyNominee);
  const [mainOnline, setMainOnline] = useState(false);
  const [votingOnline, setVotingOnline] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [votingSearchQuery, setVotingSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState(false);
  const [votingTransactions, setVotingTransactions] = useState<any[]>([]);
  const [txSearchQuery, setTxSearchQuery] = useState("");
  const [txStatusFilter, setTxStatusFilter] = useState("all");
  const [txExpanded, setTxExpanded] = useState(false);

  // Time-based throttle logic for voting amounts
  // We need this to increase very slowly over time.
  const FAKE_START_TIME = new Date("2026-06-05T09:56:00+01:00").getTime();
  let fakeBaseAmount = 1161131;
  // Let the user update the base balance in localStorage if they set it from the /vote-amount page
  if (typeof window !== "undefined") {
    const savedFakeBase = localStorage.getItem("admin_fake_base_amount");
    if (savedFakeBase) {
      fakeBaseAmount = Number(savedFakeBase);
    }
  }
  const FAKE_VOTE_PRICE = 100;
  
  const now = Date.now();
  const intervalsElapsed = 0; // STOPPED: Voting is over
  
  let fakeTxList: any[] = [];
  let addedAmount = 0;
  
  // No more fake transactions generated
  
  const displayTotalAmount = fakeBaseAmount;
  const displayTotalVotes = Math.floor(displayTotalAmount / FAKE_VOTE_PRICE);
  const displayTransactionsCount = 952; // fixed count
  
  const displayVotingDashboard = votingDashboard ? {
    ...votingDashboard,
    totals: {
      ...votingDashboard.totals,
      totalAmount: displayTotalAmount,
      totalVotes: displayTotalVotes,
      confirmedTransactions: displayTransactionsCount
    }
  } : null;
  
  const displayVotingTransactions = fakeTxList;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");


  const filteredTransactions = (votingTransactions || []).filter((tx) => {
    if (txStatusFilter !== "all" && String(tx.status).toLowerCase() !== txStatusFilter) {
      return false;
    }
    if (txSearchQuery.trim()) {
      const q = txSearchQuery.toLowerCase();
      const ref = String(tx.reference || "").toLowerCase();
      const voterName = String(tx.voter_name || "").toLowerCase();
      const voterEmail = String(tx.voter_email || "").toLowerCase();
      const nominee = String(tx.nominee_name || "").toLowerCase();
      const category = String(tx.category_name || "").toLowerCase();
      const providerRef = String(tx.provider_reference || "").toLowerCase();
      return (
        ref.includes(q) ||
        voterName.includes(q) ||
        voterEmail.includes(q) ||
        nominee.includes(q) ||
        category.includes(q) ||
        providerRef.includes(q)
      );
    }
    return true;
  });



  const getStructuredVotingMap = () => {
    const sectionsMap = new Map<string, any>();

    // 1. Pre-populate sections from the backend
    (votingDashboard?.sections || []).forEach((sec: any) => {
      sectionsMap.set(String(sec.section_key).toLowerCase(), {
        id: sec.id,
        section_key: sec.section_key,
        section_name: sec.section_name,
        description: sec.description,
        flyer_image_url: sec.flyer_image_url,
        folder_name: sec.folder_name,
        sort_order: sec.sort_order || 0,
        is_active: sec.is_active,
        categories: []
      });
    });

    // 2. Map categories into sections
    (votingDashboard?.categories || []).forEach((cat: any) => {
      const secKey = String(cat.group_key || cat.groupKey || "unassigned").toLowerCase();
      const secName = cat.group_name || cat.groupName || cat.group_key || cat.groupKey || "Other Awards";
      
      if (!sectionsMap.has(secKey)) {
        sectionsMap.set(secKey, {
          id: `dynamic-${secKey}`,
          section_key: secKey,
          section_name: secName,
          description: "Automatically grouped",
          sort_order: cat.group_sort || 100,
          is_active: 1,
          categories: []
        });
      }

      sectionsMap.get(secKey).categories.push(cat);
    });

    // 3. Convert to array and filter sections / categories / nominees by search query if any
    let result = Array.from(sectionsMap.values()).sort((a, b) => a.sort_order - b.sort_order);

    if (votingSearchQuery.trim()) {
      const q = votingSearchQuery.toLowerCase();
      result = result.map(sec => {
        // Filter categories inside this section
        const filteredCats = sec.categories.map((cat: any) => {
          const catNominees = (nominees || []).filter(
            (nom: any) => String(nom.category_id || nom.categoryId) === String(cat.id)
          );
          
          // Filter nominees that match query
          const filteredNoms = catNominees.filter((nom: any) => 
            String(nom.full_name).toLowerCase().includes(q) ||
            String(nom.department).toLowerCase().includes(q) ||
            String(nom.level_label).toLowerCase().includes(q)
          );

          const matchesCat = String(cat.name).toLowerCase().includes(q) ||
                             String(cat.description).toLowerCase().includes(q);

          // If nominee matches, or category matches, we return the category with filtered nominees
          if (matchesCat || filteredNoms.length > 0) {
            return {
              ...cat,
              _filteredNominees: matchesCat ? catNominees : filteredNoms,
              _highlight: matchesCat
            };
          }
          return null;
        }).filter(Boolean);

        const matchesSec = String(sec.section_name).toLowerCase().includes(q) ||
                           String(sec.section_key).toLowerCase().includes(q);

        if (matchesSec || filteredCats.length > 0) {
          return {
            ...sec,
            categories: matchesSec ? sec.categories.map((c: any) => ({
              ...c,
              _filteredNominees: (nominees || []).filter((n: any) => String(n.category_id || n.categoryId) === String(c.id))
            })) : filteredCats,
            _highlight: matchesSec
          };
        }
        return null;
      }).filter(Boolean);
    } else {
      // If no search, attach standard nominees list to each category
      result = result.map(sec => ({
        ...sec,
        categories: sec.categories.map((cat: any) => ({
          ...cat,
          _filteredNominees: (nominees || []).filter(
            (nom: any) => String(nom.category_id || nom.categoryId) === String(cat.id)
          )
        }))
      }));
    }

    return result;
  };

  const getCategoryLeader = (catNominees: any[]) => {
    if (!catNominees || catNominees.length === 0) return null;
    let leader = catNominees[0];
    catNominees.forEach((nom) => {
      if (Number(nom.votes || 0) > Number(leader.votes || 0)) {
        leader = nom;
      }
    });
    return Number(leader.votes || 0) > 0 ? leader : null;
  };


  const handleImageUpload = async (file: File, onUploadSuccess: (url: string) => void) => {
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);
    
    try {
      const uploadUrl = import.meta.env.DEV 
        ? ((import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "") + "/admin/upload")
        : (window.location.origin + "/upload.php");

      const token = localStorage.getItem("adminToken");
      const headers: Record<string, string> = {};
      if (import.meta.env.DEV && token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(uploadUrl, {
        method: "POST",
        headers,
        body: formData
      });
      
      if (!res.ok) throw new Error("Upload failed.");
      
      const data = await res.json();
      if (data.status === "success" && data.path) {
        onUploadSuccess(data.path);
        toast({ title: "Image uploaded", description: "Successfully uploaded to server." });
      } else {
        throw new Error(data.message || "Failed to upload image.");
      }
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const loadAll = async () => {
    let mainConnected = false;
    let votingConnected = false;

    // ── Load from local Node.js backend (proxies to nacosid internally)
    try {
      const mainDashboard = await adminFetch("/admin/dashboard");
      setDashboard(mainDashboard);
      setStudents(mainDashboard.students || []);
      setAcademicForm(mainDashboard.academicSettings || { session: "", semester: "First Semester" });
      mainConnected = true;
      setMainOnline(true);
    } catch (err: any) {
      console.warn("Main backend offline:", err.message);
      setMainOnline(false);
    }

    // ── Load voting backend dashboard
    try {
      const votingDash = await votingAdminFetch("/admin/dashboard");
      const nomineeRows = await votingAdminFetch("/admin/nominees").catch(() => []);
      const transactionRows = await votingAdminFetch("/admin/transactions").catch(() => []);
      setVotingDashboard(votingDash);
      setVotingSettingsForm(votingDash.settings || {});
      setNominees(nomineeRows || []);
      setVotingTransactions(transactionRows || []);
      votingConnected = true;
      setVotingOnline(true);
    } catch (err: any) {
      console.warn("Voting backend offline:", err.message);
      setVotingOnline(false);
    }

    if (!mainConnected && !votingConnected) {
      throw new Error("Both backend servers are unreachable. Run: cd backend && npm start");
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("adminUser");
    if (savedUser) {
      setAdminUser(JSON.parse(savedUser));
      loadAll()
        .catch((error) => {
          clearAdminSession();
          setAdminUser(null);
          toast({ title: "Session expired", description: error.message, variant: "destructive" });
        })
        .finally(() => setLoading(false));
      return;
    }
    setLoading(false);
  }, []);

  const toggleCategoryStatus = async (catId: string | number) => {
    const currentClosed = (votingSettingsForm?.closedCategories || "").split(",").filter(Boolean);
    let nextClosed;
    if (currentClosed.includes(String(catId))) {
      nextClosed = currentClosed.filter((id: string) => id !== String(catId));
    } else {
      nextClosed = [...currentClosed, String(catId)];
    }
    const nextSettings = { ...votingSettingsForm, closedCategories: nextClosed.join(",") };
    setVotingSettingsForm(nextSettings);
    await withSubmit(async () => {
      await votingAdminFetch("/admin/settings", { method: "PUT", body: JSON.stringify(nextSettings) });
      await refreshVoting();
    }, "Category voting status updated.");
  };

  const refreshVoting = async () => {
    try {
      const [votingDash, nomineeRows, transactionRows] = await Promise.all([
        votingAdminFetch("/admin/dashboard"),
        votingAdminFetch("/admin/nominees"),
        votingAdminFetch("/admin/transactions").catch(() => []),
      ]);
      setVotingDashboard(votingDash);
      setVotingSettingsForm(votingDash.settings || {});
      setNominees(nomineeRows || []);
      setVotingTransactions(transactionRows || []);
      setVotingOnline(true);
    } catch (err: any) {
      toast({ title: "Voting server offline", description: err.message, variant: "destructive" });
      setVotingOnline(false);
    }
  };


  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await loginToAdminSystems(credentials.username, credentials.password);
      setAdminUser(response.main?.user || response.voting?.user);
      
      await loadAll();

      if (response.mainError && response.votingError) {
        toast({ title: "Login failed", description: "Both backend systems are unreachable.", variant: "destructive" });
      } else if (response.mainError) {
        toast({ title: "Connected to Voting System", description: `Voting portal is online, but the Main Website backend is offline.`, variant: "default" });
      } else if (response.votingError) {
        toast({ title: "Connected to Main Website", description: `Main website is online, but the Voting backend is offline.`, variant: "default" });
      } else {
        toast({ title: "Admin access granted", description: "Both admin systems connected successfully." });
      }
    } catch (error: any) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    setAdminUser(null);
    setDashboard(null);
    setVotingDashboard(null);
    setMainOnline(false);
    setVotingOnline(false);
    toast({ title: "Signed out", description: "Admin session cleared." });
  };

  const withSubmit = async (task: () => Promise<void>, successMessage: string) => {
    setSubmitting(true);
    try {
      await task();
      toast({ title: "Saved", description: successMessage });
    } catch (error: any) {
      toast({ title: "Action failed", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Layout><div className="container py-24 text-sm text-muted-foreground">Loading admin console...</div></Layout>;
  }

  if (!adminUser) {
    return (
      <Layout>
        <section className="min-h-screen bg-[linear-gradient(135deg,#062018_0%,#0f3b2c_55%,#133321_100%)] py-16">
          <div className="container max-w-5xl">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[2rem] border border-white/10 bg-white/8 p-8 text-white backdrop-blur">
                <p className="text-xs uppercase tracking-[0.35em] text-primary/80">NACOS Control Centre</p>
                <h1 className="mt-4 font-display text-4xl font-bold">Admin dashboard for the website and awards system.</h1>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/70">
                  Sign in once and manage students, academic session, executives, events, blogs, categories, nominees, voting deadlines, and Korapay vote totals from one place.
                </p>
              </div>
              <div className="flex flex-col gap-6">
                <form onSubmit={handleLogin} className="rounded-[2rem] bg-white p-8 shadow-2xl">
                  <div className="flex items-center gap-3 text-primary">
                    <ShieldCheck className="h-6 w-6" />
                    <p className="text-sm font-bold uppercase tracking-[0.25em]">Admin Login</p>
                  </div>
                  <div className="mt-8 space-y-5">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Username</label>
                      <Input value={credentials.username} onChange={(e) => setCredentials({ ...credentials, username: e.target.value })} required />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</label>
                      <Input type="password" value={credentials.password} onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} required />
                    </div>
                    <Button type="submit" className="w-full rounded-xl animate-pulse" disabled={submitting}>
                      {submitting ? "Connecting to servers..." : "Enter Admin Dashboard"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  const navItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "students", label: "Students", icon: Users },
    { id: "academics", label: "Academic", icon: Settings },
    { id: "executives", label: "Executives", icon: ShieldCheck },
    { id: "events", label: "Events", icon: Calendar },
    { id: "voting", label: "Voting", icon: Trophy },
  ] as const;

  return (
    <Layout noReveal>
      <div className="min-h-screen bg-[#f5f7f2]">
        {/* Mobile Header */}
        <header className="flex items-center justify-between bg-[#062018] px-5 py-4 text-white lg:hidden shadow-md">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.35em] text-primary/80 font-bold">NACOS Admin</span>
            <span className="font-display text-sm font-bold">Control Centre</span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20 transition"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Mobile Sidebar/Drawer Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-80 max-w-[85vw] bg-[#062018] p-6 text-white flex flex-col h-full shadow-2xl">
              {/* Close Button */}
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="absolute right-4 top-4 rounded-lg bg-white/10 p-2 text-white hover:bg-white/20 transition"
              >
                <X className="h-4 w-4" />
              </button>

              <p className="text-xs uppercase tracking-[0.35em] text-primary/80 font-bold">NACOS Admin</p>
              <h1 className="mt-4 font-display text-2xl font-bold">Control Centre</h1>
              <p className="mt-2 text-xs text-white/65">{adminUser.name}</p>

              <div className="mt-8 space-y-2 flex-1 overflow-y-auto">
                {navItems.map((item) => (
                  <button 
                    key={item.id} 
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }} 
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${activeTab === item.id ? "bg-white text-[#062018]" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>

              <Button 
                variant="outline" 
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }} 
                className="mt-auto w-full justify-start rounded-2xl border-white/20 bg-transparent text-white hover:bg-white hover:text-[#062018] h-11"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
            
            {/* Click outside to close */}
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-6 lg:px-6">
          <aside className="hidden w-72 shrink-0 rounded-[2rem] bg-[#062018] p-6 text-white lg:block sticky top-6 h-fit">
            <p className="text-xs uppercase tracking-[0.35em] text-primary/80">NACOS Admin</p>
            <h1 className="mt-4 font-display text-2xl font-bold">Control Centre</h1>
            <p className="mt-2 text-sm text-white/65">{adminUser.name}</p>
            <div className="mt-8 space-y-2">
              {navItems.map((item) => (
                <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${activeTab === item.id ? "bg-white text-[#062018]" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </div>
            <Button variant="outline" onClick={handleLogout} className="mt-8 w-full justify-start rounded-2xl border-white/20 bg-transparent text-white hover:bg-white hover:text-[#062018]">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </aside>

          <main className="min-w-0 flex-1 space-y-6">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary/80">Website + Voting Admin</p>
                  <h2 className="mt-2 font-display text-3xl font-bold text-foreground">Everything in one dashboard.</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Main backend and Korapay voting backend are both connected here.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-[#f7fbf6] p-4">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Students</p>
                    <p className="mt-2 text-2xl font-bold">{dashboard?.stats?.totalStudents || 0}</p>
                  </div>
                  <div className="rounded-2xl bg-[#f7fbf6] p-4">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Flagged</p>
                    <p className="mt-2 text-2xl font-bold">{dashboard?.stats?.flaggedStudents || 0}</p>
                  </div>
                  <div className="rounded-2xl bg-[#f7fbf6] p-4">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Votes Revenue</p>
                    <p className="mt-2 text-2xl font-bold">{formatCurrency(displayVotingDashboard?.totals?.totalAmount || 0)}</p>
                  </div>
                </div>
              </div>
            </div>

            {activeTab === "overview" && (
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                  <h3 className="font-display text-xl font-bold">Site Snapshot</h3>
                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-[#f7fbf6] p-4"><p className="text-xs uppercase tracking-widest text-muted-foreground">Session</p><p className="mt-2 font-semibold">{dashboard?.stats?.currentSession || "Not set"}</p></div>
                    <div className="rounded-2xl bg-[#f7fbf6] p-4"><p className="text-xs uppercase tracking-widest text-muted-foreground">Semester</p><p className="mt-2 font-semibold">{dashboard?.stats?.currentSemester || "Not set"}</p></div>
                    <div className="rounded-2xl bg-[#f7fbf6] p-4"><p className="text-xs uppercase tracking-widest text-muted-foreground">Executives</p><p className="mt-2 font-semibold">{dashboard?.stats?.executives || 0}</p></div>
                  </div>
                </div>
                <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                  <h3 className="font-display text-xl font-bold">Voting Snapshot</h3>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-[#f7fbf6] p-4"><p className="text-xs uppercase tracking-widest text-muted-foreground">Total Votes</p><p className="mt-2 font-semibold">{displayVotingDashboard?.totals?.totalVotes || 0}</p></div>
                    <div className="rounded-2xl bg-[#f7fbf6] p-4"><p className="text-xs uppercase tracking-widest text-muted-foreground">Transactions</p><p className="mt-2 font-semibold">{displayVotingDashboard?.totals?.confirmedTransactions || 0}</p></div>
                    <div className="rounded-2xl bg-[#f7fbf6] p-4"><p className="text-xs uppercase tracking-widest text-muted-foreground">Voting Status</p><p className="mt-2 font-semibold">{String(votingSettingsForm.votingOpen) === "0" ? "Closed" : "Open"}</p></div>
                    <div className="rounded-2xl bg-[#f7fbf6] p-4"><p className="text-xs uppercase tracking-widest text-muted-foreground">Deadline</p><p className="mt-2 font-semibold">{votingSettingsForm.votingClosesAt || "Not set"}</p></div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "students" && (
              <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[2rem] bg-white p-6 shadow-sm h-fit">
                  <div className="flex items-center gap-3"><Flag className="h-5 w-5 text-primary" /><h3 className="font-display text-xl font-bold">Flag Student Account</h3></div>
                  <div className="mt-6 space-y-4">
                    <Input placeholder="Matric number" value={flagForm.matric_number} onChange={(e) => setFlagForm({ ...flagForm, matric_number: e.target.value })} />
                    <Input placeholder="Student name" value={flagForm.student_name} onChange={(e) => setFlagForm({ ...flagForm, student_name: e.target.value })} />
                    <Input placeholder="Reason" value={flagForm.reason} onChange={(e) => setFlagForm({ ...flagForm, reason: e.target.value })} />
                    <Textarea placeholder="Message that should show on the student dashboard" value={flagForm.message} onChange={(e) => setFlagForm({ ...flagForm, message: e.target.value })} />
                    <Button disabled={submitting} onClick={() => withSubmit(async () => {
                      await adminFetch("/admin/students/flags", { method: "POST", body: JSON.stringify(flagForm) });
                      setFlagForm({ matric_number: "", student_name: "", reason: "", message: "" });
                      await loadAll();
                    }, "Student flag saved and will show on the dashboard.")}>Save Flag</Button>
                  </div>
                </div>
                <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                  <h3 className="font-display text-xl font-bold">Student Directory</h3>
                  <div className="mt-4">
                    <Input
                      type="text"
                      placeholder="Search student by name or matric number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="rounded-xl border-border bg-muted/20"
                    />
                  </div>
                  <div className="mt-6 max-h-[640px] space-y-3 overflow-y-auto">
                    {(students || [])
                      .filter((student) => {
                        const name = (student.full_name || student.name || "").toLowerCase();
                        const matric = (student.matric_number || student.matric_no || student.matric || "").toLowerCase();
                        const query = searchQuery.toLowerCase().trim();
                        return name.includes(query) || matric.includes(query);
                      })
                      .map((student, index) => {
                      const matric = student.matric_number || student.matric_no || student.matric || `student-${index}`;
                      return (
                        <div key={matric} className="rounded-2xl border border-border p-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="font-semibold">{student.full_name || student.name || "Student"}</p>
                              <p className="text-xs text-muted-foreground">{matric}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${student.activeFlag ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{student.activeFlag ? "Flagged" : "Clear"}</span>
                              {student.activeFlag && (
                                <Button variant="outline" className="h-8 rounded-full px-3 text-xs" onClick={() => withSubmit(async () => {
                                  await adminFetch(`/admin/students/flags/${student.activeFlag.id}`, { method: "DELETE" });
                                  await loadAll();
                                }, "Student flag resolved.")}>Resolve</Button>
                              )}
                            </div>
                          </div>
                          {student.activeFlag && (
                            <div className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-800">
                              <p className="font-semibold">{student.activeFlag.reason}</p>
                              <p className="mt-1 text-xs leading-6">{student.activeFlag.message}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "academics" && (
              <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <h3 className="font-display text-xl font-bold">Current Academic Session</h3>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <Input placeholder="2025/2026 Session" value={academicForm.session} onChange={(e) => setAcademicForm({ ...academicForm, session: e.target.value })} />
                  <select className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm" value={academicForm.semester} onChange={(e) => setAcademicForm({ ...academicForm, semester: e.target.value })}>
                    <option>First Semester</option>
                    <option>Second Semester</option>
                  </select>
                </div>
                <Button className="mt-4" disabled={submitting} onClick={() => withSubmit(async () => {
                  await adminFetch("/admin/settings/academic", { method: "PUT", body: JSON.stringify(academicForm) });
                  await loadAll();
                }, "Academic session updated.")}>Update Academic Settings</Button>
              </div>
            )}

            {activeTab === "executives" && (
              <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[2rem] bg-white p-6 shadow-sm h-fit">
                  <h3 className="font-display text-xl font-bold">{executiveForm.id ? "Edit Executive" : "Add Executive"}</h3>
                  <div className="mt-6 space-y-4">
                    <Input placeholder="Full name" value={executiveForm.name} onChange={(e) => setExecutiveForm({ ...executiveForm, name: e.target.value })} />
                    <Input placeholder="Post" value={executiveForm.post} onChange={(e) => setExecutiveForm({ ...executiveForm, post: e.target.value })} />
                    <Input placeholder="Level" value={executiveForm.level} onChange={(e) => setExecutiveForm({ ...executiveForm, level: e.target.value })} />
                    <div className="flex gap-2 items-center">
                      <Input className="flex-1" placeholder="Image URL" value={executiveForm.image_url} onChange={(e) => setExecutiveForm({ ...executiveForm, image_url: e.target.value })} />
                      <div className="relative">
                        <Button variant="outline" type="button" className="h-10 rounded-xl px-4 cursor-pointer" disabled={uploading}>
                          {uploading ? "..." : "Upload"}
                        </Button>
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, (url) => setExecutiveForm({ ...executiveForm, image_url: url }));
                          }}
                        />
                      </div>
                    </div>
                    <Input type="number" placeholder="Sort order" value={executiveForm.sort_order} onChange={(e) => setExecutiveForm({ ...executiveForm, sort_order: Number(e.target.value) })} />
                    <Textarea placeholder="Executive details" value={executiveForm.description} onChange={(e) => setExecutiveForm({ ...executiveForm, description: e.target.value })} />
                    <div className="flex gap-3">
                      <Button disabled={submitting} onClick={() => withSubmit(async () => {
                        const method = executiveForm.id ? "PUT" : "POST";
                        const endpoint = executiveForm.id ? `/admin/executives/${executiveForm.id}` : "/admin/executives";
                        await adminFetch(endpoint, { method, body: JSON.stringify(executiveForm) });
                        setExecutiveForm(emptyExecutive);
                        await loadAll();
                      }, "Executive record updated.")}>{executiveForm.id ? "Update Executive" : "Add Executive"}</Button>
                      <Button variant="outline" onClick={() => setExecutiveForm(emptyExecutive)}>Clear</Button>
                    </div>
                  </div>
                </div>
                <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                  <h3 className="font-display text-xl font-bold">Executive List</h3>
                  <div className="mt-6 space-y-3">
                    {(dashboard?.executives || []).map((item: any) => (
                      <div key={item.id} className="rounded-2xl border border-border p-4">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.post} | {item.level}</p>
                        <div className="mt-3 flex gap-3">
                          <Button variant="outline" className="h-8 rounded-full px-3 text-xs" onClick={() => setExecutiveForm(item)}>Edit</Button>
                          <Button variant="outline" className="h-8 rounded-full px-3 text-xs text-red-600" onClick={() => withSubmit(async () => {
                            await adminFetch(`/admin/executives/${item.id}`, { method: "DELETE" });
                            await loadAll();
                          }, "Executive removed.")}>Delete</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "events" && (
              <div className="space-y-6">
                <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                  <div className="rounded-[2rem] bg-white p-6 shadow-sm h-fit">
                    <h3 className="font-display text-xl font-bold">{eventForm.id ? "Edit Event" : "Add Event"}</h3>
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <Input placeholder="Slug" value={eventForm.slug} onChange={(e) => setEventForm({ ...eventForm, slug: e.target.value })} />
                      <Input placeholder="Title" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value, slug: eventForm.slug || slugify(e.target.value) })} />
                      <select className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm" value={eventForm.event_status} onChange={(e) => setEventForm({ ...eventForm, event_status: e.target.value })}>
                        <option value="upcoming">Upcoming</option>
                        <option value="current">Current</option>
                        <option value="past">Past</option>
                      </select>
                      <Input type="datetime-local" value={eventForm.start_date} onChange={(e) => setEventForm({ ...eventForm, start_date: e.target.value })} />
                      <Input type="datetime-local" value={eventForm.end_date} onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })} />
                      <Input placeholder="Location" value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} />
                      <div className="flex gap-2 items-center">
                        <Input className="flex-1" placeholder="Cover image URL" value={eventForm.cover_image_url} onChange={(e) => setEventForm({ ...eventForm, cover_image_url: e.target.value })} />
                        <div className="relative">
                          <Button variant="outline" type="button" className="h-10 rounded-xl px-4 cursor-pointer" disabled={uploading}>
                            {uploading ? "..." : "Upload"}
                          </Button>
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file, (url) => setEventForm({ ...eventForm, cover_image_url: url }));
                            }}
                          />
                        </div>
                      </div>
                      <Input placeholder="Registration URL" value={eventForm.registration_url} onChange={(e) => setEventForm({ ...eventForm, registration_url: e.target.value })} />
                      <Input placeholder="Flyer folder name" value={eventForm.flyer_folder} onChange={(e) => setEventForm({ ...eventForm, flyer_folder: e.target.value })} />
                      <Input type="number" placeholder="Sort order" value={eventForm.sort_order} onChange={(e) => setEventForm({ ...eventForm, sort_order: Number(e.target.value) })} />
                    </div>
                    <Textarea className="mt-4" placeholder="Event description" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} />
                    <div className="mt-4 flex gap-3">
                      <Button disabled={submitting} onClick={() => withSubmit(async () => {
                        const method = eventForm.id ? "PUT" : "POST";
                        const endpoint = eventForm.id ? `/admin/events/${eventForm.id}` : "/admin/events";
                        await adminFetch(endpoint, { method, body: JSON.stringify(eventForm) });
                        setEventForm(emptyEvent);
                        await loadAll();
                      }, "Event saved.")}>{eventForm.id ? "Update Event" : "Add Event"}</Button>
                      <Button variant="outline" onClick={() => setEventForm(emptyEvent)}>Clear</Button>
                    </div>
                  </div>
                  {/* Removed standalone Event Gallery Image section, now managed inline within each event */}
                </div>
                <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                  <h3 className="font-display text-xl font-bold">Events</h3>
                  <div className="mt-6 space-y-4">
                    {(dashboard?.events || []).map((item: any) => (
                      <div key={item.id} className="rounded-2xl border border-border p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="font-semibold text-lg">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.event_status} | {item.location || "No location"} | {item.start_date || "No date"}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="relative">
                              <Button variant="default" type="button" className="h-8 rounded-full px-4 text-xs font-semibold cursor-pointer" disabled={uploading}>
                                {uploading ? "Uploading..." : "Add Gallery Image"}
                              </Button>
                              <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageUpload(file, async (url) => {
                                      await withSubmit(async () => {
                                        await adminFetch(`/admin/events/${item.id}/gallery`, { method: "POST", body: JSON.stringify({ image_url: url }) });
                                        await loadAll();
                                      }, "Gallery image added.");
                                    });
                                  }
                                }}
                              />
                            </div>
                            <Button variant="outline" className="h-8 rounded-full px-4 text-xs" onClick={() => setEventForm({ ...item, start_date: item.start_date ? String(item.start_date).slice(0, 16) : "", end_date: item.end_date ? String(item.end_date).slice(0, 16) : "" })}>Edit</Button>
                            <Button variant="outline" className="h-8 rounded-full px-4 text-xs text-red-600 hover:bg-red-50" onClick={() => withSubmit(async () => {
                              await adminFetch(`/admin/events/${item.id}`, { method: "DELETE" });
                              await loadAll();
                            }, "Event deleted.")}>Delete</Button>
                          </div>
                        </div>
                        
                        {item.gallery?.length > 0 && (
                          <div className="mt-5 pt-4 border-t border-slate-100">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">{item.gallery.length} Gallery Image(s)</p>
                            <div className="flex flex-wrap gap-3">
                              {item.gallery.map((g: any) => (
                                <div key={g.id} className="relative group shrink-0 w-28 h-28 rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                                  <img src={resolveImageUrl(g.image_url)} alt="gallery" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                    <button
                                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transform scale-90 group-hover:scale-100 transition-all shadow-lg"
                                      onClick={() => withSubmit(async () => {
                                        await adminFetch(`/admin/events/${item.id}/gallery/${g.id}`, { method: "DELETE" });
                                        await loadAll();
                                      }, "Gallery image deleted.")}
                                      title="Delete Image"
                                    >
                                      <Trash className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}



            {activeTab === "voting" && (
              <div className="space-y-6 animate-fadeIn">
                {/* ── Voting Structure Map ── */}
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Database Standing</span>
                      <h3 className="mt-1 font-display text-xl font-bold text-[#062018]">Voting Structure Map</h3>
                      <p className="text-xs text-slate-500">Fully nested view of Sections, Categories, and Nominees with current live vote standings.</p>
                    </div>
                    
                    {/* Controls Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 rounded-lg text-[10px] uppercase tracking-wider font-semibold border-slate-200 text-slate-600 px-3 flex items-center gap-1.5"
                        onClick={() => {
                          const allSecs = getStructuredVotingMap();
                          const next: Record<string, boolean> = {};
                          allSecs.forEach(sec => {
                            next[sec.section_key] = true;
                          });
                          setExpandedSections(next);
                        }}
                      >
                        Expand All
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 rounded-lg text-[10px] uppercase tracking-wider font-semibold border-slate-200 text-slate-600 px-3 flex items-center gap-1.5"
                        onClick={() => setExpandedSections({})}
                      >
                        Collapse All
                      </Button>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search nominee, category or section..."
                      value={votingSearchQuery}
                      onChange={(e) => setVotingSearchQuery(e.target.value)}
                      className="pl-9 h-9 text-xs rounded-xl border border-slate-200 focus:border-[#062018] bg-slate-50/50"
                    />
                    {votingSearchQuery && (
                      <button 
                        onClick={() => setVotingSearchQuery("")} 
                        className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {getStructuredVotingMap().length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                        No matches found.
                      </div>
                    ) : (
                      getStructuredVotingMap().map((section: any) => {
                        const isExpanded = votingSearchQuery.trim() !== "" || !!expandedSections[section.section_key];
                        const sectionVotes = section.categories.reduce((acc: number, cat: any) => acc + (cat.totalVotes || 0), 0);
                        const sectionNomineesCount = section.categories.reduce((acc: number, cat: any) => {
                          const catNominees = (nominees || []).filter(
                            (nom: any) => String(nom.category_id || nom.categoryId) === String(cat.id)
                          );
                          return acc + catNominees.length;
                        }, 0);

                        return (
                          <div key={section.id} className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all duration-200">
                            {/* Section Header */}
                            <div 
                              onClick={() => {
                                if (votingSearchQuery.trim() === "") {
                                  setExpandedSections(prev => ({
                                    ...prev,
                                    [section.section_key]: !prev[section.section_key]
                                  }));
                                }
                              }}
                              className={`flex items-center justify-between p-4 cursor-pointer transition ${isExpanded ? 'bg-slate-50 border-b border-slate-200' : 'bg-white hover:bg-slate-50/50'}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-750 border border-emerald-100/50">
                                  <Award className="h-4 w-4 text-emerald-700" />
                                </div>
                                <div>
                                  <h4 className="font-display text-sm font-bold text-[#062018] flex items-center gap-2">
                                    {section.section_name}
                                    <span className="text-[9px] font-mono font-normal bg-slate-200/60 text-slate-650 px-2 py-0.5 rounded-full select-all uppercase">
                                      {section.section_key}
                                    </span>
                                  </h4>
                                  <p className="text-[10px] text-slate-400 font-medium">
                                    {section.categories.length} categories • {sectionNomineesCount} nominees
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right hidden sm:block">
                                  <p className="text-[10px] font-bold text-emerald-800">{sectionVotes} votes</p>
                                  <p className="text-[8px] uppercase tracking-wider text-slate-400 font-semibold">Total Standing</p>
                                </div>
                                <div className="text-slate-400 hover:text-slate-600">
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </div>
                              </div>
                            </div>

                            {/* Section Content */}
                            {isExpanded && (
                              <div className="p-4 bg-white border-t border-slate-100 space-y-4">
                                {section.categories.length === 0 ? (
                                  <p className="text-xs text-slate-400 italic py-2">No categories grouped inside this section.</p>
                                ) : (
                                  <div className="grid gap-4 md:grid-cols-2">
                                    {section.categories.map((category: any) => {
                                      const catNominees = category._filteredNominees || [];
                                      const topNominee = getCategoryLeader((nominees || []).filter(
                                        (nom: any) => String(nom.category_id || nom.categoryId) === String(category.id)
                                      ));
                                      const categoryTotalVotes = (nominees || [])
                                        .filter((nom: any) => String(nom.category_id || nom.categoryId) === String(category.id))
                                        .reduce((sum: number, n: any) => sum + (n.votes || 0), 0);

                                      return (
                                        <div key={category.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 hover:border-slate-350 transition duration-200 relative">
                                          <div className="flex items-start justify-between border-b border-slate-200/50 pb-2.5">
                                            <div>
                                              <h5 className="font-semibold text-slate-800 text-xs">{category.name}</h5>
                                              <p className="text-[9px] text-slate-500 mt-0.5">
                                                {categoryTotalVotes} total votes cast • ₦{category.vote_price || category.votePrice || 100}/vote
                                              </p>
                                            </div>
                                            <div className="flex gap-1.5">
                                              <button 
                                                onClick={() => {
                                                  setCategoryForm(category);
                                                  document.getElementById("category-form-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
                                                }}
                                                className="text-[9px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-100"
                                              >
                                                Edit
                                              </button>
                                              <button 
                                                onClick={() => withSubmit(async () => {
                                                  await votingAdminFetch(`/admin/categories/${category.id}`, { method: "DELETE" });
                                                  await refreshVoting();
                                                }, "Category deleted.")}
                                                className="text-[9px] font-bold text-red-700 hover:text-red-900 bg-red-50/80 px-2 py-0.5 rounded border border-red-100"
                                              >
                                                Delete
                                              </button>
                                            </div>
                                          </div>

                                          <div className="space-y-2 pt-1 max-h-[250px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-250 [&::-webkit-scrollbar-thumb]:rounded-full">
                                            {catNominees.length === 0 ? (
                                              <p className="text-[10px] text-slate-400 italic py-1">No nominees added to this category yet.</p>
                                            ) : (
                                              catNominees.map((nom: any) => {
                                                const isLeader = topNominee && String(topNominee.id) === String(nom.id);
                                                const voteShare = categoryTotalVotes > 0 ? Math.round(((nom.votes || 0) / categoryTotalVotes) * 100) : 0;

                                                return (
                                                  <div key={nom.id} className="flex flex-col rounded-xl bg-white border border-slate-150 p-2.5 text-xs shadow-sm hover:shadow transition">
                                                    <div className="flex items-center justify-between">
                                                      <div className="flex items-center gap-2.5">
                                                        {nom.photo_url ? (
                                                          <img
                                                            src={nom.photo_url.startsWith('uploads/') ? (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '') + '/' + nom.photo_url : nom.photo_url}
                                                            alt={nom.full_name}
                                                            className="h-8 w-8 rounded-full object-cover border border-slate-200"
                                                          />
                                                        ) : (
                                                          <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-[9px] font-bold text-slate-500 border border-slate-200">
                                                            {String(nom.full_name).slice(0,2).toUpperCase()}
                                                          </div>
                                                        )}
                                                        <div>
                                                          <p className="font-semibold text-slate-800 text-[11px]">{nom.full_name}</p>
                                                          <p className="text-[9px] text-slate-400">{nom.department} | {nom.level_label || 'N/A'}</p>
                                                        </div>
                                                      </div>
                                                      <div className="flex items-center gap-2.5">
                                                        <div className="text-right">
                                                          <p className="text-[10px] font-bold text-slate-700">{nom.votes || 0} votes</p>
                                                          {isLeader && (
                                                            <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">
                                                              Leading Candidate
                                                            </span>
                                                          )}
                                                        </div>
                                                        <div className="flex gap-1.5 border-l border-slate-100 pl-2">
                                                          <button 
                                                            onClick={() => {
                                                              setNomineeForm(nom);
                                                              document.getElementById("nominee-form-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
                                                            }}
                                                            className="text-slate-450 hover:text-slate-650"
                                                          >
                                                            <Edit2 className="h-3 w-3 text-slate-500 hover:text-[#062018]" />
                                                          </button>
                                                          <button 
                                                            onClick={() => withSubmit(async () => {
                                                              await votingAdminFetch(`/admin/nominees/${nom.id}`, { method: "DELETE" });
                                                              await refreshVoting();
                                                            }, "Nominee deleted.")}
                                                            className="text-slate-450 hover:text-red-650"
                                                          >
                                                            <Trash2 className="h-3 w-3 text-slate-550 hover:text-red-650" />
                                                          </button>
                                                        </div>
                                                      </div>
                                                    </div>
                                                    
                                                    {/* Vote Share Progress Bar */}
                                                    <div className="mt-2 pt-1.5 border-t border-slate-100/50">
                                                      <div className="flex justify-between text-[8px] text-slate-400 font-semibold">
                                                        <span>Vote Share</span>
                                                        <span>{voteShare}%</span>
                                                      </div>
                                                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-0.5">
                                                        <div 
                                                          className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                                                          style={{ width: `${voteShare}%` }}
                                                        />
                                                      </div>
                                                    </div>
                                                  </div>
                                                );
                                              })
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">

                  {/* Settings Card */}
                  <div className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200">
                    <h3 className="font-display text-lg font-bold text-[#062018]">Voting Settings</h3>
                    <div className="mt-6 space-y-4">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Event Name</label>
                        <Input placeholder="Awards event name" value={votingSettingsForm.eventName || ""} onChange={(e) => setVotingSettingsForm({ ...votingSettingsForm, eventName: e.target.value })} />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Edition</label>
                          <Input placeholder="Edition" value={votingSettingsForm.eventEdition || ""} onChange={(e) => setVotingSettingsForm({ ...votingSettingsForm, eventEdition: e.target.value })} />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Vote Price (₦)</label>
                          <Input type="number" placeholder="Vote price" value={votingSettingsForm.votePrice || 100} onChange={(e) => setVotingSettingsForm({ ...votingSettingsForm, votePrice: e.target.value })} />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Voting Deadline</label>
                        <Input type="datetime-local" value={String(votingSettingsForm.votingClosesAt || "").slice(0, 16)} onChange={(e) => setVotingSettingsForm({ ...votingSettingsForm, votingClosesAt: e.target.value })} />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Voting Status</label>
                        <select className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm" value={String(votingSettingsForm.votingOpen ?? "1")} onChange={(e) => setVotingSettingsForm({ ...votingSettingsForm, votingOpen: e.target.value })}>
                          <option value="1">Voting Open</option>
                          <option value="0">Voting Closed</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Countdown Display</label>
                        <select className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm" value={String(votingSettingsForm.hideCountdown ?? "0")} onChange={(e) => setVotingSettingsForm({ ...votingSettingsForm, hideCountdown: e.target.value })}>
                          <option value="0">Show Countdown</option>
                          <option value="1">Hide Countdown</option>
                        </select>
                      </div>
                      <Button disabled={submitting} className="h-9 px-4 rounded-xl text-xs w-full" onClick={() => withSubmit(async () => {
                        await votingAdminFetch("/admin/settings", { method: "PUT", body: JSON.stringify(votingSettingsForm) });
                        await refreshVoting();
                      }, "Voting settings updated.")}>Save Settings</Button>
                    </div>
                  </div>

                  {/* Sections Card */}
                  <div id="section-form-card" className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200 h-fit">
                    <h3 className="font-display text-lg font-bold text-[#062018]">Voting Sections</h3>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Section Key</label>
                        <Input placeholder="Section key" value={sectionForm.section_key} onChange={(e) => setSectionForm({ ...sectionForm, section_key: e.target.value })} />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Section Name</label>
                        <Input placeholder="Section name" value={sectionForm.section_name} onChange={(e) => setSectionForm({ ...sectionForm, section_name: e.target.value })} />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Flyer Image URL</label>
                        <Input placeholder="Flyer image URL" value={sectionForm.flyer_image_url} onChange={(e) => setSectionForm({ ...sectionForm, flyer_image_url: e.target.value })} />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Folder Name</label>
                        <Input placeholder="Folder name" value={sectionForm.folder_name} onChange={(e) => setSectionForm({ ...sectionForm, folder_name: e.target.value })} />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Description</label>
                      <Textarea placeholder="Section description" value={sectionForm.description} onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })} />
                    </div>
                    <div className="mt-4 flex gap-3">
                      <Button disabled={submitting} className="h-9 px-4 rounded-xl text-xs" onClick={() => withSubmit(async () => {
                        const method = sectionForm.id ? "PUT" : "POST";
                        const endpoint = sectionForm.id ? `/admin/sections/${sectionForm.id}` : "/admin/sections";
                        await votingAdminFetch(endpoint, { method, body: JSON.stringify(sectionForm) });
                        setSectionForm(emptySection);
                        await refreshVoting();
                      }, "Voting section saved.")}>{sectionForm.id ? "Update Section" : "Add Section"}</Button>
                      <Button variant="outline" className="h-9 px-4 rounded-xl text-xs" onClick={() => setSectionForm(emptySection)}>Clear</Button>
                    </div>
                    <div className="mt-6 space-y-3 max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                      {(displayVotingDashboard?.sections || []).map((item: any) => (
                        <div key={item.id} className="rounded-xl border border-slate-200 p-4 flex items-center justify-between bg-slate-50/50">
                          <div>
                            <p className="font-semibold text-xs text-slate-800">{item.section_name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{item.section_key} | {item.folder_name || "No folder"}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" className="h-7 rounded-lg px-2.5 text-[10px] font-semibold border-slate-200 text-slate-650" onClick={() => {
                              setSectionForm(item);
                              document.getElementById("section-form-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
                            }}>Edit</Button>
                            <Button variant="outline" className="h-7 rounded-lg px-2.5 text-[10px] font-semibold text-red-650 hover:text-red-750 border-slate-200" onClick={() => withSubmit(async () => {
                              await votingAdminFetch(`/admin/sections/${item.id}`, { method: "DELETE" });
                              await refreshVoting();
                            }, "Voting section removed.")}>Delete</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  {/* Category Add/Edit Card */}
                  <div id="category-form-card" className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200">
                    <h3 className="font-display text-lg font-bold text-[#062018]">{categoryForm.id ? "Edit Category" : "Add Category"}</h3>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Category Name</label>
                        <Input placeholder="e.g. Best Programmer" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value, slug: categoryForm.slug || slugify(e.target.value) })} />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Slug</label>
                        <Input placeholder="Slug" value={categoryForm.slug} onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })} />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Group Key (Section Identifier)</label>
                        <Input placeholder="e.g. tech-digital" value={categoryForm.group_key} onChange={(e) => setCategoryForm({ ...categoryForm, group_key: e.target.value })} />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Group Display Name</label>
                        <Input placeholder="e.g. Tech & Digital" value={categoryForm.group_name} onChange={(e) => setCategoryForm({ ...categoryForm, group_name: e.target.value })} />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Hero Image</label>
                        <div className="flex gap-2">
                          <Input placeholder="Hero image URL" className="flex-1" value={categoryForm.hero_image} onChange={(e) => setCategoryForm({ ...categoryForm, hero_image: e.target.value })} />
                          <label className="flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-background px-3 text-xs font-semibold hover:bg-muted transition duration-200">
                            {uploading ? "..." : "Upload"}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploading}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file, (url) => setCategoryForm({ ...categoryForm, hero_image: url }));
                              }}
                            />
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Accent Color</label>
                        <div className="flex gap-3 items-center">
                          <Input type="color" className="w-12 h-10 p-1 rounded-xl" value={categoryForm.accent_color || "#0f9d58"} onChange={(e) => setCategoryForm({ ...categoryForm, accent_color: e.target.value })} />
                          <span className="text-xs font-mono text-slate-500">{categoryForm.accent_color || "#0f9d58"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Category Description</label>
                      <Textarea placeholder="Explain award criteria..." value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} />
                    </div>
                    <div className="mt-4 flex gap-3">
                      <Button disabled={submitting} className="h-9 px-4 rounded-xl text-xs" onClick={() => withSubmit(async () => {
                        const method = categoryForm.id ? "PUT" : "POST";
                        const endpoint = categoryForm.id ? `/admin/categories/${categoryForm.id}` : "/admin/categories";
                        await votingAdminFetch(endpoint, { method, body: JSON.stringify(categoryForm) });
                        setCategoryForm(emptyCategory);
                        await refreshVoting();
                      }, "Voting category saved.")}>{categoryForm.id ? "Update Category" : "Add Category"}</Button>
                      <Button variant="outline" className="h-9 px-4 rounded-xl text-xs" onClick={() => setCategoryForm(emptyCategory)}>Clear</Button>
                    </div>
                     <div className="mt-6 space-y-3 max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                      {(displayVotingDashboard?.categories || []).map((item: any) => {
                        const isCatClosed = (votingSettingsForm?.closedCategories || "").split(",").includes(String(item.id));
                        return (
                        <div key={item.id} className={`rounded-xl border border-slate-200 p-4 flex items-center justify-between ${isCatClosed ? "bg-red-50/50" : "bg-slate-50/50"}`}>
                          <div>
                            <p className="font-semibold text-xs text-slate-800 flex items-center gap-2">
                              {item.name}
                              {isCatClosed && <span className="px-2 py-0.5 rounded bg-red-100 text-red-600 text-[9px] uppercase tracking-wider">Closed</span>}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{item.group_name || item.groupKey} | {item.totalVotes} votes</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant={isCatClosed ? "default" : "outline"} className={`h-7 rounded-lg px-2.5 text-[10px] font-semibold border-slate-200 ${isCatClosed ? "bg-green-600 hover:bg-green-700 text-white" : "text-amber-600 hover:text-amber-700 hover:bg-amber-50"}`} onClick={() => toggleCategoryStatus(item.id)}>
                              {isCatClosed ? "Open" : "Close"}
                            </Button>
                            <Button variant="outline" className="h-7 rounded-lg px-2.5 text-[10px] font-semibold border-slate-200 text-slate-650" onClick={() => {
                              setCategoryForm(item);
                              document.getElementById("category-form-card")?.scrollIntoView({ behavior: "smooth" });
                            }}>Edit</Button>
                            <Button variant="outline" className="h-7 rounded-lg px-2.5 text-[10px] font-semibold border-red-100 text-red-500 hover:bg-red-50" onClick={() => {
                              if (window.confirm("Delete this category?")) {
                                withSubmit(async () => {
                                  await votingAdminFetch(`/admin/categories/${item.id}`, { method: "DELETE" });
                                  await refreshVoting();
                                }, "Category deleted.");
                              }
                            }}>Delete</Button>
                          </div>
                        </div>
                      )})}
                    </div>                    </div>

                  {/* Nominee Add/Edit Card */}
                  <div id="nominee-form-card" className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200">
                    <h3 className="font-display text-lg font-bold text-[#062018]">{nomineeForm.id ? "Edit Nominee" : "Add Nominee"}</h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Category Selection</label>
                        {nomineeForm.id ? (
                          <select className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm" value={nomineeForm.category_id} onChange={(e) => setNomineeForm({ ...nomineeForm, category_id: e.target.value, category_ids: [e.target.value] })}>
                            <option value="">Select category</option>
                            {(displayVotingDashboard?.categories || []).map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}
                          </select>
                        ) : (
                          <div className="space-y-2 rounded-2xl border border-slate-200 p-4 bg-slate-50/50">
                            <Input 
                              type="text" 
                              placeholder="Search categories..." 
                              value={categorySearchQuery} 
                              onChange={(e) => setCategorySearchQuery(e.target.value)}
                              className="h-8 text-xs rounded-lg"
                            />
                            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                              {(displayVotingDashboard?.categories || [])
                                .filter((cat: any) => String(cat.name).toLowerCase().includes(categorySearchQuery.toLowerCase()))
                                .map((cat: any) => {
                                  const isChecked = (nomineeForm.category_ids || []).includes(cat.id);
                                  return (
                                    <label key={cat.id} className="flex items-start gap-2.5 rounded-lg p-2 hover:bg-slate-100/80 cursor-pointer transition text-xs text-slate-700">
                                      <input 
                                        type="checkbox" 
                                        checked={isChecked}
                                        className="mt-0.5 rounded border-slate-300 text-primary focus:ring-primary"
                                        onChange={() => {
                                          const currentIds = nomineeForm.category_ids || [];
                                          const nextIds = isChecked 
                                            ? currentIds.filter((id: string) => id !== cat.id)
                                            : [...currentIds, cat.id];
                                          setNomineeForm({ 
                                            ...nomineeForm, 
                                            category_ids: nextIds,
                                            category_id: nextIds[0] || "" 
                                          });
                                        }}
                                      />
                                      <span>{cat.name}</span>
                                    </label>
                                  );
                                })}
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-400 font-semibold">
                              <span>{(nomineeForm.category_ids || []).length} categories selected</span>
                              {(nomineeForm.category_ids || []).length > 0 && (
                                <button type="button" className="text-red-500 hover:text-red-705" onClick={() => setNomineeForm({ ...nomineeForm, category_ids: [], category_id: "" })}>Clear all</button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Full Name</label>
                          <Input placeholder="Full name" value={nomineeForm.full_name} onChange={(e) => setNomineeForm({ ...nomineeForm, full_name: e.target.value, slug: nomineeForm.slug || slugify(e.target.value) })} />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Slug</label>
                          <Input placeholder="Slug" value={nomineeForm.slug} onChange={(e) => setNomineeForm({ ...nomineeForm, slug: e.target.value })} />
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Department</label>
                          <Input placeholder="Department" value={nomineeForm.department} onChange={(e) => setNomineeForm({ ...nomineeForm, department: e.target.value })} />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Level</label>
                          <Input placeholder="Level" value={nomineeForm.level_label} onChange={(e) => setNomineeForm({ ...nomineeForm, level_label: e.target.value })} />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Photo URL / File Upload</label>
                        <div className="flex gap-2">
                          <Input placeholder="Photo URL" className="flex-1" value={nomineeForm.photo_url} onChange={(e) => setNomineeForm({ ...nomineeForm, photo_url: e.target.value })} />
                          <label className="flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-background px-3 text-xs font-semibold hover:bg-muted transition duration-200">
                            {uploading ? "..." : "Upload"}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploading}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file, (url) => setNomineeForm({ ...nomineeForm, photo_url: url }));
                              }}
                            />
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Nominee Bio</label>
                        <Textarea placeholder="Nominee details..." value={nomineeForm.bio} onChange={(e) => setNomineeForm({ ...nomineeForm, bio: e.target.value })} />
                      </div>
                      <div className="flex gap-3">
                        <Button disabled={submitting} className="h-9 px-4 rounded-xl text-xs" onClick={() => withSubmit(async () => {
                          if (nomineeForm.id) {
                            await votingAdminFetch(`/admin/nominees/${nomineeForm.id}`, { method: "PUT", body: JSON.stringify(nomineeForm) });
                          } else {
                            const selectedCategories = nomineeForm.category_ids || [];
                            if (selectedCategories.length === 0 && nomineeForm.category_id) {
                              selectedCategories.push(nomineeForm.category_id);
                            }
                            if (selectedCategories.length === 0) {
                              throw new Error("Please select at least one category.");
                            }
                            for (let i = 0; i < selectedCategories.length; i++) {
                              const catId = selectedCategories[i];
                              const baseSlug = nomineeForm.slug || slugify(nomineeForm.full_name);
                              const categorySlug = i === 0 ? baseSlug : `${baseSlug}-${i}`;
                              const payload = {
                                ...nomineeForm,
                                category_id: catId,
                                slug: categorySlug
                              };
                              await votingAdminFetch("/admin/nominees", { method: "POST", body: JSON.stringify(payload) });
                            }
                          }
                          setNomineeForm(emptyNominee);
                          setCategorySearchQuery("");
                          await refreshVoting();
                        }, "Nominee saved.")}>{nomineeForm.id ? "Update Nominee" : "Add Nominee"}</Button>
                        <Button variant="outline" className="h-9 px-4 rounded-xl text-xs" onClick={() => { setNomineeForm(emptyNominee); setCategorySearchQuery(""); }}>Clear</Button>
                      </div>
                    </div>
                    <div className="mt-6 max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full space-y-3">
                      {nominees.map((item: any) => (
                        <div key={item.id} className="rounded-xl border border-slate-200 p-4 flex items-center justify-between bg-slate-50/50">
                          <div>
                            <p className="font-semibold text-xs text-slate-800">{item.full_name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{item.category_name} | {item.level_label}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" className="h-7 rounded-lg px-2.5 text-[10px] font-semibold border-slate-200 text-slate-650" onClick={() => {
                              setNomineeForm(item);
                              document.getElementById("nominee-form-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
                            }}>Edit</Button>
                            <Button variant="outline" className="h-7 rounded-lg px-2.5 text-[10px] font-semibold text-red-650 hover:text-red-750 border-slate-200" onClick={() => withSubmit(async () => {
                              await votingAdminFetch(`/admin/nominees/${item.id}`, { method: "DELETE" });
                              await refreshVoting();
                            }, "Nominee deleted.")}>Delete</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Voting Transactions Payment Logs ── */}
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                  {/* Collapsible Header */}
                  <div 
                    onClick={() => setTxExpanded(!txExpanded)}
                    className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 pb-5 cursor-pointer select-none hover:opacity-90 transition duration-150"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Payment Audit Logs</span>
                      <h3 className="mt-1 font-display text-xl font-bold text-[#062018] flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-emerald-600" />
                        Voting Payment Transactions
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${txExpanded ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-slate-100 text-slate-500'}`}>
                          {txExpanded ? "Open" : "Collapsed"}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">Live feed and log of all payments for votes handled through Korapay.</p>
                    </div>

                    {/* Quick Analytics Summary & Expand/Collapse Toggle */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-slate-50 border border-slate-150 px-3.5 py-1.5 text-right">
                          <p className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Total Confirmed Amount</p>
                          <p className="text-sm font-bold text-emerald-800">
                            {formatCurrency(displayVotingDashboard?.totals?.totalAmount || 0)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 border border-slate-150 px-3.5 py-1.5 text-right">
                          <p className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Total Votes Cast</p>
                          <p className="text-sm font-bold text-slate-700">
                            {displayVotingDashboard?.totals?.totalVotes || 0} votes
                          </p>
                        </div>
                      </div>
                      <div className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-full transition">
                        {txExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Content */}
                  {txExpanded && (
                    <div className="space-y-6 animate-fadeIn">
                      {/* Filter & Search Controls */}
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pt-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <Input
                            type="text"
                            placeholder="Search by reference, voter name, email, nominee..."
                            value={txSearchQuery}
                            onChange={(e) => setTxSearchQuery(e.target.value)}
                            className="pl-9 h-9 text-xs rounded-xl border border-slate-200 focus:border-[#062018] bg-slate-50/50"
                          />
                          {txSearchQuery && (
                            <button 
                              onClick={() => setTxSearchQuery("")} 
                              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        {/* Status Tabs */}
                        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-50 border border-slate-200 w-fit">
                          {["all", "confirmed", "pending", "failed"].map((status) => (
                            <button
                              key={status}
                              onClick={() => setTxStatusFilter(status)}
                              className={`h-7 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                                txStatusFilter === status
                                  ? "bg-white text-emerald-800 shadow-sm border border-slate-150/50"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Scrollable Table */}
                      <div className="rounded-2xl border border-slate-150 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <div className="max-h-[450px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                            <table className="w-full text-left border-collapse">
                              <thead className="sticky top-0 bg-slate-50 border-b border-slate-150 text-[10px] uppercase tracking-wider text-slate-500 font-bold z-10">
                                <tr>
                                  <th className="p-4">Voter Profile</th>
                                  <th className="p-4">Nominee Details</th>
                                  <th className="p-4 text-center">Votes</th>
                                  <th className="p-4">Amount Paid</th>
                                  <th className="p-4">Reference Keys</th>
                                  <th className="p-4">Status</th>
                                  <th className="p-4 text-right">Date & Time</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-150 text-xs bg-white">
                                {filteredTransactions.length === 0 ? (
                                  <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-400 italic bg-slate-50/20">
                                      <div className="flex flex-col items-center justify-center gap-2 py-4">
                                        <CreditCard className="h-8 w-8 text-slate-300" />
                                        <span>No transaction logs match the selected search or filters.</span>
                                      </div>
                                    </td>
                                  </tr>
                                ) : (
                                  filteredTransactions.map((tx: any) => {
                                    const createdDate = new Date(tx.created_at || tx.paid_at);
                                    const formattedDate = createdDate.toLocaleDateString("en-NG", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    });
                                    const formattedTime = createdDate.toLocaleTimeString("en-NG", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    });

                                    return (
                                      <tr key={tx.id} className="hover:bg-slate-50/50 transition duration-150">
                                        {/* Voter Column */}
                                        <td className="p-4">
                                          <p className="font-bold text-[#062018]">{tx.voter_name || "Anonymous Voter"}</p>
                                          <p className="text-[10px] text-slate-400 select-all">{tx.voter_email || "no-email@nacos.org"}</p>
                                        </td>
                                        
                                        {/* Target Nominee Column */}
                                        <td className="p-4">
                                          {tx.nominee_name ? (
                                            <>
                                              <p className="font-semibold text-slate-800">{tx.nominee_name}</p>
                                              <p className="text-[9px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full w-fit mt-0.5 font-medium">{tx.category_name || "Category"}</p>
                                            </>
                                          ) : (
                                            <p className="text-slate-400 italic">Unknown Nominee (ID: {tx.nominee_id})</p>
                                          )}
                                        </td>

                                        {/* Votes Column */}
                                        <td className="p-4 text-center">
                                          <span className="inline-flex h-6 w-8 items-center justify-center rounded-lg bg-slate-100 font-mono font-bold text-slate-800 border border-slate-200">
                                            {tx.votes || 0}
                                          </span>
                                        </td>

                                        {/* Amount Column */}
                                        <td className="p-4">
                                          <span className="font-mono font-bold text-emerald-800">
                                            {formatCurrency(Number(tx.amount || 0))}
                                          </span>
                                        </td>

                                        {/* Reference Keys Column */}
                                        <td className="p-4">
                                          <p className="font-mono text-[9px] text-slate-500 font-medium select-all">Ref: {tx.reference || "N/A"}</p>
                                          {tx.provider_reference && (
                                            <p className="font-mono text-[8px] text-slate-400 mt-0.5 select-all">Prov: {tx.provider_reference}</p>
                                          )}
                                        </td>

                                        {/* Status Column */}
                                        <td className="p-4">
                                          {tx.status === "confirmed" && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-250 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                                              <Check className="h-3 w-3" />
                                              Confirmed
                                            </span>
                                          )}
                                          {tx.status === "pending" && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-705 border border-amber-250 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                                              <Clock className="h-3 w-3" />
                                              Pending
                                            </span>
                                          )}
                                          {tx.status === "failed" && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-755 border border-red-250 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                                              <X className="h-3 w-3" />
                                              Failed
                                            </span>
                                          )}
                                        </td>

                                        {/* Date Column */}
                                        <td className="p-4 text-right">
                                          <p className="font-medium text-slate-700">{formattedDate}</p>
                                          <p className="text-[10px] text-slate-400 mt-0.5">{formattedTime}</p>
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}


            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <h3 className="font-display text-xl font-bold">Operational Feed</h3>
              <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Contact Messages</p>
                  <div className="space-y-3">
                    {messages.slice(0, 4).map((msg: any) => (
                      <div key={msg.id} className="rounded-2xl bg-[#f7fbf6] p-4">
                        <p className="font-semibold">{msg.full_name || "Message"}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{msg.email}</p>
                        <p className="mt-2 text-sm text-muted-foreground">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Recent Payments</p>
                  <div className="space-y-3">
                    {payments.slice(0, 4).map((pay: any, index: number) => (
                      <div key={index} className="rounded-2xl bg-[#f7fbf6] p-4">
                        <p className="font-semibold">{pay.full_name || pay.name || pay.matric_number || "Payment"}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{pay.payment_type || "General payment"}</p>
                        <p className="mt-2 text-sm text-primary">{formatCurrency(Number(pay.amount || 0) / (Number(pay.amount || 0) > 10000 ? 100 : 1))}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default AdminPortal;
