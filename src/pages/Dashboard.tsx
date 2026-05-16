import { useState, useEffect, useRef } from "react";
import { Copy, Check, ExternalLink, CreditCard, IdCard as IdIcon, LayoutDashboard, LogOut, User, AlertCircle, Save, Calendar, Home, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Layout from "@/components/Layout";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { fetchApi, API_BASE_URL } from "@/lib/api";
import { events as staticEvents } from "@/data/events";

import nacosLogo from "@/assets/nacos_logo.png";
import lasustechLogo from "@/assets/lasustech_logo.png";

const ACCOUNT_NUMBER = "1234567890";

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // 1. ALL HOOKS AT THE TOP
  const [activeTab, setActiveTab] = useState<"overview" | "dues" | "idcard" | "profile">(() => {
    try {
      const saved = localStorage.getItem("dashboard_active_tab");
      if (location.state?.tab) return location.state.tab;
      const validTabs = ["overview", "dues", "idcard", "profile"];
      if (saved && validTabs.includes(saved)) return saved as any;
    } catch (e) {
      console.error("Tab state error", e);
    }
    return "overview";
  });

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [initialEmailSet, setInitialEmailSet] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [amountOwing, setAmountOwing] = useState(2000);
  const [activities, setActivities] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    fullName: "",
    matricNumber: "",
    level: "",
    birthday: "",
    email: "",
    whatsappNumber: "",
    gender: "",
    post: "",
    duesStatus: "Pending",
    idCardStatus: "Not Registered",
    attendance: 0,
    resources: 0,
    profileImage: null as string | null
  });

  const API_BASE = "https://nacosid.tmb.it.com/";


  const getProfileImage = (img: string | null) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    const cleanPath = img.startsWith('/') ? img.substring(1) : img;
    return `${API_BASE}${cleanPath}`;
  };


  // Helper to hash email for privacy
  const hashEmail = (email: string) => {
    if (!email) return "Not set up";
    const [name, domain] = email.split("@");
    if (name.length <= 3) return `${name.substring(0, 1)}***@${domain}`;
    const visibleName = name.substring(0, 3);
    const domainParts = domain.split(".");
    const tld = domainParts.pop();
    const domainName = domainParts.join(".");
    const maskedDomain = domainName.length > 2 ? `${domainName.substring(0, 2)}***` : "***";
    return `${visibleName}*******@${maskedDomain}.${tld}`;
  };


  const handleRequestOtp = async () => {
    if (!profile.email) {
      toast({ 
        title: "Email Missing", 
        description: "You haven't set up your email yet. Please contact the admin on WhatsApp at +234 802 632 2742.", 
        variant: "destructive" 
      });
      return;
    }
    
    try {
      await fetchApi('/auth/request-otp', {
        method: 'POST',
        body: JSON.stringify({ matric_number: profile.matricNumber })
      });
      setOtpSent(true);
      toast({ title: "OTP Sent", description: `A verification code has been sent to ${hashEmail(profile.email)}` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    localStorage.setItem("dashboard_active_tab", activeTab);
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showMobileMenu && mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showMobileMenu]);

  useEffect(() => {
    // Instant Loading from Cache
    const cached = localStorage.getItem('dashboard_data');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const p = parsed.profile || parsed.data?.profile || {};
        const rawImg = p.profile_image || p.image_path || null;
        const roleVal = String(p.post || p.role || p.position || p.rank || p.title || "");
        
        setProfile(prev => ({
          ...prev,
          fullName: String(p.full_name || p.name || ""),
          matricNumber: String(p.matric_number || p.matric_no || ""),
          level: String(p.level || ""),
          email: String(p.email || ""),
          whatsappNumber: String(p.whatsapp_number || ""),
          gender: String(p.gender || ""),
          post: (roleVal.toLowerCase() !== 'student' && roleVal !== "") ? roleVal : "Student",
          birthday: String(p.birthday || ""),
          duesStatus: 'Paid',
          idCardStatus: 'Ready',
          attendance: Number(p.attendance_percentage || 0),
          resources: Number(p.resources_count || 0),
          profileImage: getProfileImage(rawImg)
        }));
        if (Array.isArray(parsed.activities)) {
          setActivities(parsed.activities);
        }
        setLoading(false);
      } catch (e) {
        console.error("Cache Parse Error:", e);
      }
    }

    const fetchDashboardData = async () => {
      try {
        const [dashData, payData] = await Promise.all([
          fetchApi('/student/dashboard'),
          fetchApi('/student/payments')
        ]);

        console.log("🔍 DEBUG: DASH DATA:", dashData);

        // --- AGGRESSIVE ROLE DETECTION ---
        // Look everywhere for 'post' or leadership titles
        const rootPost = dashData?.post || dashData?.role || dashData?.position || (dashData?.data && (dashData.data.post || dashData.data.role || dashData.data.position));
        const profilePost = (dashData?.profile && (dashData.profile.post || dashData.profile.role)) || 
                           (dashData?.data && dashData.data.profile && (dashData.data.profile.post || dashData.data.profile.role));
        const dataPost = dashData?.data && (dashData.data.post || dashData.data.role);
        
        const rawRole = rootPost || profilePost || dataPost || "";
        const roleTitle = (rawRole && typeof rawRole === 'string' && rawRole.toLowerCase() !== 'student') ? rawRole : "Student";

        // Normalize profile data (handle both {profile} and {data: {profile}})
        const student = dashData?.profile || (dashData?.data && dashData.data.profile) || dashData?.data || {};
        const rawImgUrl = student.profile_image || student.image_path || null;
        const finalImgUrl = getProfileImage(rawImgUrl);

        // Save to cache
        localStorage.setItem('dashboard_data', JSON.stringify(dashData));
        
        // Update the 'user' object for the Navbar too
        try {
          const userStr = localStorage.getItem("user");
          const user = (userStr && userStr !== "null") ? JSON.parse(userStr) : {};
          if (user && typeof user === 'object') {
            user.profile_image = finalImgUrl;
            user.post = String(roleTitle);
            localStorage.setItem("user", JSON.stringify(user));
          }
        } catch (e) {
          console.error("User storage update error:", e);
        }

        const sessionPayment = {
          payment_type: '2025/2026 Session Dues',
          created_at: new Date().toISOString(),
          amount: 2000 * 100 // Convert to Kobo so UI can /100 it
        };

        setProfile(prev => ({
          ...prev,
          fullName: String(student.full_name || student.name || ""),
          matricNumber: String(student.matric_number || student.matric_no || ""),
          level: String(student.level || ""),
          email: String(student.email || ""),
          whatsappNumber: String(student.whatsapp_number || ""),
          gender: String(student.gender || ""),
          post: String(roleTitle),
          birthday: String(student.birthday || ""),
          duesStatus: 'Paid',
          idCardStatus: 'Ready',
          attendance: Number(student.attendance_percentage || 0),
          resources: Number(student.resources_count || 0),
          profileImage: getProfileImage(student.profile_image || student.image_path)
        }));
        setActivities(Array.isArray(dashData?.activities) ? dashData.activities : []);
        setPayments([sessionPayment, ...(Array.isArray(payData) ? payData : [])]);
        setAmountOwing(0);
      } catch (error: any) {
        console.error("Dashboard Sync Error:", error);
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          localStorage.clear();
          navigate("/");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const isProfileIncomplete = !profile.fullName || !profile.matricNumber || !profile.level || !profile.birthday;

  const handleLogout = () => {
    localStorage.clear();
    toast({ title: "Logged out", description: "You have been successfully logged out." });
    navigate("/");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(ACCOUNT_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  useEffect(() => {
    if (profile.email && !initialEmailSet) {
      setInitialEmailSet(true);
    }
  }, [profile.email]);

  const handleUploadProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await fetchApi('/student/profile', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: profile.fullName,
          level: profile.level,
          email: profile.email,
          whatsapp_number: profile.whatsappNumber,
          gender: profile.gender,
          birthday: profile.birthday
        })
      });

      if (result.status === 'success' || result.message?.includes('success') || result.id) {
        toast({ title: "Profile Updated", description: "Your changes have been saved successfully." });
        setIsDirty(false); // Reset dirty state
        
        // Update Local User storage for Navbar and persistence
        try {
          const userStr = localStorage.getItem("user");
          const user = (userStr && userStr !== "null") ? JSON.parse(userStr) : {};
          if (user && typeof user === 'object') {
            user.name = String(profile.fullName);
            user.email = String(profile.email);
            user.post = String(profile.post);
            localStorage.setItem("user", JSON.stringify(user));
          }
        } catch (e) {
          console.error("Local storage update error:", e);
        }

        // fetchDashboardData(); // Force refresh everything from cloud
        setActiveTab("overview");
      } else {
        toast({ 
          title: "Update Failed", 
          description: result.message || "The central system could not save your changes.", 
          variant: "destructive" 
        });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update profile.", variant: "destructive" });
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      toast({ title: "Uploading...", description: "Compressing and saving your photo." });
      const data = await fetchApi('/student/profile-image', {
        method: 'PUT',
        headers: { 'Content-Type': 'undefined' }, // Let browser set boundary for FormData
        body: formData
      });
      
      const newImage = data.imageUrl;
      setProfile({ ...profile, profileImage: newImage });

      // Update User storage for Navbar sync
      try {
        const userStr = localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : {};
        user.profile_image = newImage;
        localStorage.setItem("user", JSON.stringify(user));
      } catch (e) {
        console.error("Local storage update error:", e);
      }

      toast({ title: "Success", description: "Profile picture updated successfully!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to upload image.", variant: "destructive" });
    }
  };

  const handlePayment = async () => {
    try {
      toast({ title: "Processing...", description: "Opening payment portal." });
      const data = await fetchApi('/payments/initialize', {
        method: 'POST',
        body: JSON.stringify({
          email: profile.email || `${profile.matricNumber}@lasustech.edu.ng`,
          amount: 2000,
          payment_type: 'nacos_dues'
        })
      });
      
      if (data.data?.authorization_url) {
        window.location.href = data.data.authorization_url;
      } else {
        throw new Error(data.message || "Could not initialize payment.");
      }
    } catch (err: any) {
      toast({ title: "Payment Error", description: err.message || "Could not initialize payment.", variant: "destructive" });
    }
  };

  const handleIdCardRequest = async () => {
    try {
      toast({ title: "Processing...", description: "Opening payment portal for ID replacement." });
      const data = await fetchApi('/payments/initialize', {
        method: 'POST',
        body: JSON.stringify({
          email: profile.email || `${profile.matricNumber}@lasustech.edu.ng`,
          amount: 500, // Replacement fee
          payment_type: 'id_replacement'
        })
      });
      
      if (data.data?.authorization_url) {
        window.location.href = data.data.authorization_url;
      } else {
        throw new Error(data.message || "Could not initialize replacement request.");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to initialize replacement request.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <Layout noReveal>
        <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading Dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout noReveal>
      <div className="flex min-h-screen flex-col bg-background lg:flex-row">
        {/* Mobile Sticky Header */}
        <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-border bg-background/80 px-6 py-4 backdrop-blur-md lg:hidden">
          <div className="flex items-center gap-3">
            <img src={nacosLogo} alt="NACOS" className="h-8 w-auto" />
            <div className="h-6 w-px bg-border/60 mx-1" />
            <img src={lasustechLogo} alt="LASUSTECH" className="h-8 w-auto" />
          </div>
          <div className="flex items-center gap-3 relative" ref={mobileMenuRef}>
             <div className="text-right">
                <p className="text-[10px] font-bold text-foreground leading-none">
                  {String(profile.fullName || 'Member').split(' ')[0]}
                </p>
                <p className="text-[8px] text-muted-foreground uppercase tracking-wider mt-1">
                  {String(profile.post || 'Student')}
                </p>
             </div>
             <button 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="relative h-10 w-10 rounded-full border-2 border-primary/20 shadow-sm overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {(() => {
                  let user: any = {};
                  try {
                    const userStr = localStorage.getItem("user");
                    user = (userStr && userStr !== "null") ? JSON.parse(userStr) : {};
                    if (!user || typeof user !== 'object') user = {};
                  } catch (e) {
                    console.error("Header user parse error", e);
                  }
                  
                  const rawProfileImage = user.profile_image || user.profileImage || profile.profileImage;
                  if (rawProfileImage && typeof rawProfileImage === 'string') {
                    const src = rawProfileImage.startsWith('http') 
                      ? rawProfileImage 
                      : `${API_BASE}${rawProfileImage.startsWith('/') ? rawProfileImage.substring(1) : rawProfileImage}`;
                    return <img src={src} className="h-full w-full object-cover" alt="Profile" />;
                  }
                  return (
                    <div className="h-full w-full bg-primary/10 flex items-center justify-center">
                       <User className="h-5 w-5 text-primary" />
                    </div>
                  );
               })()}
             </button>

             {/* Mobile Profile Dropdown */}
             {showMobileMenu && (
               <>
                 <div 
                   className="fixed inset-0 z-40 bg-black/5" 
                   onClick={() => setShowMobileMenu(false)}
                 />
                 <div className="absolute right-0 top-full mt-2 z-50 w-48 rounded-2xl border border-border bg-white p-2 shadow-xl animate-reveal-fast">
                    <Link 
                      to="/" 
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
                    >
                      <Home className="h-4 w-4" />
                      Back to Website
                    </Link>
                    <div className="my-1 h-px bg-border/60" />
                    <button 
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-all"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                 </div>
               </>
             )}
          </div>
        </header>

        {/* Sidebar / Desktop Nav */}
        <aside className="hidden border-r border-border bg-muted/20 lg:block lg:w-64 shrink-0 h-screen sticky top-0 overflow-y-auto">
          <div className="p-8">
            <div className="mb-10 flex items-center gap-4">
              <div className="flex items-center gap-3">
                <img src={nacosLogo} alt="NACOS" className="h-10 w-auto drop-shadow-sm" />
                <div className="h-8 w-px bg-border/60 mx-1" />
                <img src={lasustechLogo} alt="LASUSTECH" className="h-10 w-auto drop-shadow-sm" />
              </div>
            </div>
            <h2 
              className={`font-display font-bold text-foreground animate-reveal whitespace-nowrap overflow-hidden text-ellipsis ${
                (String(profile.fullName || "")).length > 20 ? "text-base" : 
                (String(profile.fullName || "")).length > 15 ? "text-lg" : "text-xl"
              }`}
            >
              {String(profile.fullName || "Member")}
            </h2>
            <div className="flex flex-col mt-1 animate-reveal-delay-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">NACOS LASUSTECH</p>
              {profile.post && String(profile.post).toLowerCase() !== 'student' && (
                <p className="text-[10px] text-primary uppercase tracking-widest font-black mt-1 drop-shadow-sm">{String(profile.post)}</p>
              )}
            </div>
          </div>
          <nav className="flex flex-col gap-1 px-3 pb-6">
            <Link
              to="/"
              className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 text-muted-foreground hover:bg-white hover:text-foreground"
            >
              <Home className="h-4 w-4" />
              Back to Website
            </Link>
            <div className="h-px bg-border my-2 mx-3" />
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
                activeTab === "overview" 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:bg-white hover:text-foreground"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
                activeTab === "profile" 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:bg-white hover:text-foreground"
              }`}
            >
              <User className="h-4 w-4" />
              My Profile
            </button>
            <button
              onClick={() => setActiveTab("dues")}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
                activeTab === "dues" 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:bg-white hover:text-foreground"
              }`}
            >
              <CreditCard className="h-4 w-4" />
              Dues & Fees
            </button>
            <button
              onClick={() => setActiveTab("idcard")}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
                activeTab === "idcard" 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:bg-white hover:text-foreground"
              }`}
            >
              <IdIcon className="h-4 w-4" />
              ID Card
            </button>
            
            <div className="pt-4 mt-4 border-t border-border">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-all duration-300"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </nav>
        </aside>


        {/* Main Content */}
        <main 
          ref={mainScrollRef}
          className="flex-1 px-6 py-8 md:px-10 md:py-12 pb-24 lg:pb-12 h-screen overflow-y-auto"
        >
          {/* Incomplete Profile Warning */}
          {isProfileIncomplete && (
            <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800 animate-reveal sm:flex-row sm:items-center sm:justify-between w-full">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">Profile Incomplete</p>
                  <p className="text-xs opacity-80">Add your email and details to receive chapter updates and dues alerts.</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setActiveTab("profile")}
                className="w-full border-amber-200 bg-white text-amber-800 hover:bg-amber-100 sm:w-auto"
              >
                Update Details
              </Button>
            </div>
          )}

          {activeTab === "overview" && (
            <div className="space-y-8 animate-reveal">
              <div className="max-w-2xl">
                <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="mt-2 text-muted-foreground">
                  Welcome back, <span className="text-primary font-semibold">{String(profile.fullName || "Member")}</span>. Here's what's happening today.
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Membership Dues</h3>
                      <p className="text-xs text-muted-foreground">Status: <span className="text-green-600 font-bold">Paid</span></p>
                    </div>
                  </div>
                  <Button onClick={() => setActiveTab("dues")} className="mt-6 w-full rounded-xl" variant="outline">View Dues History</Button>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <IdIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">ID Card Status</h3>
                      <p className="text-xs text-muted-foreground">Status: <span className="text-blue-600 font-bold">Ready</span></p>
                    </div>
                  </div>
                  <Button onClick={() => setActiveTab("idcard")} className="mt-6 w-full rounded-xl" variant="outline">Manage ID Card</Button>
                </div>
              </div>

              <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
                <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display text-lg font-bold">Upcoming Event</h3>
                    <Button onClick={() => navigate("/events")} variant="ghost" size="sm" className="text-primary text-xs font-bold">View History</Button>
                  </div>
                  <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-muted/30 border border-dashed border-border">
                    <Calendar className="h-8 w-8 text-muted-foreground/30 mb-3" />
                    <h4 className="font-bold text-foreground text-sm">No Upcoming Events</h4>
                    <p className="text-[11px] text-muted-foreground mt-1 text-center">
                      The session events have concluded. Stay tuned for the next session's schedule!
                    </p>
                  </div>

                  <h3 className="font-display text-lg font-bold mt-8 mb-6">Recent Activities</h3>
                  <div className="space-y-4">
                    {activities.map((activity, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                        <div>
                          <p className="text-sm font-semibold">{String(activity.type || 'Activity')}</p>
                          <p className="text-[11px] text-muted-foreground">{activity.activity_date ? new Date(activity.activity_date).toLocaleDateString() : 'Recent'}</p>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 bg-green-100 text-green-700">
                          {String(activity.status || 'Success')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-primary/10 bg-primary/5 p-8 shadow-sm flex flex-col justify-center text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-primary shadow-sm mb-6">
                    <LayoutDashboard className="h-8 w-8" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-primary">Member Status</h3>
                  <p className="mt-2 text-sm text-muted-foreground">You are a fully verified member of NACOS LASUSTECH for the 2025/2026 session.</p>
                  
                  <div className="mt-8 p-4 rounded-2xl bg-white border border-primary/10">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Resources Accessed</p>
                    <p className="mt-1 font-display text-3xl font-bold text-primary">{String(profile.resources || 0)}</p>
                  </div>

                  <p className="mt-8 text-xs leading-relaxed text-muted-foreground italic">
                    "Innovation is the heart of computing. Keep building the future."
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="max-w-3xl animate-reveal pb-12">
              <h2 className="font-display text-3xl font-bold text-foreground">My Profile</h2>
              <p className="mt-2 text-muted-foreground">Manage your personal information and chapter membership details.</p>

              <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
                <div className="h-32 bg-gradient-to-r from-primary/30 via-primary/20 to-secondary/20" />
                <div className="px-8 pb-8">
                  <div className="relative -mt-16 flex items-end justify-between">
                    <div className="relative">
                      <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-card bg-muted shadow-xl flex items-center justify-center">
                        {profile.profileImage && typeof profile.profileImage === 'string' ? (
                          <img 
                            src={profile.profileImage.startsWith('http') 
                              ? profile.profileImage 
                              : `${API_BASE}${profile.profileImage.startsWith('/') ? profile.profileImage.substring(1) : profile.profileImage}`
                            } 
                            alt="Profile" 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted/50">
                            <User className="h-12 w-12 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef} 
                        onChange={handleImageChange} 
                        className="hidden" 
                      />
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="mb-4 gap-2 rounded-xl text-xs">
                        Update Photo
                      </Button>
                    </div>
                  </div>

                  <form onSubmit={handleUploadProfile} className="mt-8 space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                        <Input 
                          value={profile.fullName} 
                          onChange={(e) => {
                            setProfile({ ...profile, fullName: e.target.value });
                            setIsDirty(true);
                          }}
                          className="rounded-xl border-border/60"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Matric Number</label>
                        <Input 
                          value={profile.matricNumber} 
                          onChange={(e) => setProfile({ ...profile, matricNumber: e.target.value })}
                          className="rounded-xl border-border/60 bg-muted/30"
                          disabled
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                        <Input 
                          type="email"
                          value={initialEmailSet ? hashEmail(profile.email) : profile.email} 
                          onChange={(e) => {
                            if (!initialEmailSet) {
                              setProfile({ ...profile, email: e.target.value });
                              setIsDirty(true);
                            }
                          }}
                          className={`rounded-xl border-border/60 ${initialEmailSet ? "bg-muted/50 cursor-not-allowed" : "border-primary/40 ring-1 ring-primary/10"}`}
                          disabled={initialEmailSet}
                        />
                        {!initialEmailSet && (
                          <p className="text-[10px] text-primary font-medium italic mt-1 animate-pulse">
                            ⚠️ Note: You cannot easily change your email once added.
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">WhatsApp Number *</label>
                        <Input 
                          placeholder="+234..."
                          value={profile.whatsappNumber} 
                          onChange={(e) => {
                            setProfile({ ...profile, whatsappNumber: e.target.value });
                            setIsDirty(true);
                          }}
                          className={`rounded-xl border-border/60 ${!profile.whatsappNumber ? "border-red-300 ring-2 ring-red-50" : ""}`}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gender</label>
                        <select 
                          value={profile.gender} 
                          onChange={(e) => {
                            setProfile({ ...profile, gender: e.target.value });
                            setIsDirty(true);
                          }}
                          className="flex h-10 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chapter Role</label>
                        <Input 
                          value={profile.post || "Student"} 
                          className="rounded-xl border-border/60 bg-muted/30 font-bold text-primary"
                          disabled
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Level</label>
                        <Input 
                          value={profile.level} 
                          onChange={(e) => {
                            setProfile({ ...profile, level: e.target.value });
                            setIsDirty(true);
                          }}
                          className="rounded-xl border-border/60"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Birthday</label>
                        <Input 
                          type="date"
                          value={profile.birthday} 
                          onChange={(e) => {
                            setProfile({ ...profile, birthday: e.target.value });
                            setIsDirty(true);
                          }}
                          className={`rounded-xl border-border/60 ${!profile.birthday ? "border-amber-300 ring-2 ring-amber-100" : ""}`}
                        />
                        {!profile.birthday && (
                          <p className="text-[10px] text-amber-600 font-medium italic">Required so we can celebrate you on your birthday!</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-border mt-8 flex justify-between items-center">
                      <p className="text-[10px] text-muted-foreground max-w-[300px]">
                        <strong>Note:</strong> We send important chapter updates and payment receipts to your email. Ensure it is correct. 
                        Check your <strong>inbox and spam folder</strong> for our messages.
                      </p>
                      <Button type="submit" className="gap-2 rounded-xl px-8 shadow-xl shadow-primary/30">
                        <Save className="h-4 w-4" />
                        {isDirty ? "Save All Changes" : "Update Details"}
                      </Button>
                    </div>
                  </form>

                  {/* Account Security Section */}
                  <div className="mt-12 pt-8 border-t border-border">
                    <h3 className="font-display text-lg font-bold text-foreground">Account Security</h3>
                    <p className="text-xs text-muted-foreground mt-1">Protect your account by regularly updating your credentials.</p>
                    
                    <div className="mt-6">
                      <PasswordResetDialog matricNumber={profile.matricNumber} />
                      <p className="mt-3 text-[10px] text-muted-foreground">
                        This will send a secure 6-digit OTP to your registered email address.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "dues" && (
            <div className="max-w-4xl animate-reveal pb-12">
              <h2 className="font-display text-3xl font-bold text-foreground">Membership Dues</h2>
              <p className="mt-2 text-sm text-muted-foreground">Complete your NACOS LASUSTECH membership dues payment below.</p>
              
              <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
                  <div className="flex items-center justify-between border-b border-border pb-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Amount Owing</p>
                      <p className="mt-1 font-display text-3xl font-bold text-foreground">₦{String(amountOwing.toLocaleString())}</p>
                    </div>
                    <div className={`rounded-xl px-4 py-2 text-xs font-bold ${profile.duesStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {profile.duesStatus}
                    </div>
                  </div>

                  <div className="mt-8">
                    <h3 className="font-display text-lg font-bold text-foreground">Payment History</h3>
                    <div className="mt-4 space-y-4">
                      {payments.length > 0 ? (
                        payments.map((pay, i) => (
                          <div key={i} className="flex items-center justify-between rounded-2xl bg-muted/30 p-4">
                            <div className="flex items-center gap-4">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm text-primary">
                                <Check className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-sm font-bold capitalize">{String(pay.payment_type || 'Payment').replace('_', ' ')}</p>
                                <p className="text-[11px] text-muted-foreground">{pay.created_at ? new Date(pay.created_at).toLocaleDateString() : 'Recent'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-foreground">₦{(pay.amount / 100).toLocaleString()}</p>
                              <p className="text-[10px] font-medium text-green-600">Successful</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <CreditCard className="h-10 w-10 text-muted-foreground/30" />
                          <p className="mt-4 text-xs text-muted-foreground">No payment records found.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                    <h3 className="font-display text-lg font-bold text-foreground">Online Payment</h3>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      Instant verification. Skip the wait and pay your ₦2,000 session dues via Korapay.
                    </p>
                    <Button 
                      onClick={handlePayment} 
                      className="mt-6 w-full rounded-xl shadow-lg shadow-primary/20"
                      disabled={profile.duesStatus === 'Paid'}
                    >
                      {profile.duesStatus === 'Paid' ? 'Dues Already Paid' : 'Pay Now with Korapay'}
                    </Button>
                    <p className="mt-4 text-center text-[10px] text-muted-foreground">
                      Powered by <strong>Korapay</strong>. All transactions are secure.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "idcard" && (
            <div className="max-w-3xl animate-reveal pb-12">
              <h2 className="font-display text-3xl font-bold text-foreground">ID Card Management</h2>
              <p className="mt-2 text-sm text-muted-foreground">Your official NACOS LASUSTECH identification card is just a few steps away.</p>

              <div className="mt-8">
                <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
                  <div className="flex flex-col items-center text-center border-b border-border pb-10">
                    <div className={`relative flex h-20 w-20 items-center justify-center rounded-full border-4 ${profile.profileImage ? 'border-green-500 bg-green-50' : 'border-amber-500 bg-amber-50'}`}>
                      <IdIcon className={`h-10 w-10 ${profile.profileImage ? 'text-green-500' : 'text-amber-500'}`} />
                    </div>
                    <h3 className="mt-4 font-display text-2xl font-bold">Registration Checklist</h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                      Complete the requirements below to receive your digital and physical ID card.
                    </p>
                  </div>

                  <div className="mt-10 space-y-6">
                    <div className="flex items-center justify-between p-2">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${profile.fullName && profile.level ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                          {profile.fullName && profile.level ? <Check className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold">Profile Information</p>
                          <p className="text-[10px] text-muted-foreground">Name, Level, and Matric Number</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${profile.fullName && profile.level ? 'text-green-600' : 'text-amber-600'}`}>
                        {profile.fullName && profile.level ? 'Verified' : 'Incomplete'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${profile.profileImage ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                          {profile.profileImage ? <Check className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold">Passport Photo</p>
                          <p className="text-[10px] text-muted-foreground">Professional clear background image</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${profile.profileImage ? 'text-green-600' : 'text-amber-600'}`}>
                        {profile.profileImage ? 'Uploaded' : 'Missing'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground`}>
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">ID Card Processing Fee</p>
                          <p className="text-[10px] text-muted-foreground">Standard processing & printing fee</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                        Required (₦500)
                      </span>
                    </div>
                  </div>

                  <div className="mt-10 p-6 rounded-2xl bg-primary/5 border border-primary/10">
                    <p className="text-xs text-center text-muted-foreground leading-relaxed">
                      Once payment is verified, your ID card will be processed and available for digital download and physical collection.
                    </p>
                    <Button 
                      onClick={handleIdCardRequest}
                      className="mt-6 w-full rounded-2xl py-6 text-lg font-bold shadow-xl shadow-primary/20"
                    >
                      Pay for ID Card (₦500)
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Mobile Bottom Navigation - Moved to absolute bottom for visibility */}
        <nav className="fixed bottom-0 left-0 right-0 z-[100] flex w-full items-center justify-around border-t border-border bg-background/95 px-2 py-3 pb-safe backdrop-blur-lg lg:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex flex-col items-center gap-1 px-3 py-1 transition-all duration-300 ${
              activeTab === "overview" ? "text-primary scale-110" : "text-muted-foreground"
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px] font-bold">Home</span>
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center gap-1 px-3 py-1 transition-all duration-300 ${
              activeTab === "profile" ? "text-primary scale-110" : "text-muted-foreground"
            }`}
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] font-bold">Profile</span>
          </button>
          <button
            onClick={() => setActiveTab("dues")}
            className={`flex flex-col items-center gap-1 px-3 py-1 transition-all duration-300 ${
              activeTab === "dues" ? "text-primary scale-110" : "text-muted-foreground"
            }`}
          >
            <CreditCard className="h-5 w-5" />
            <span className="text-[10px] font-bold">Dues</span>
          </button>
          <button
            onClick={() => setActiveTab("idcard")}
            className={`flex flex-col items-center gap-1 px-3 py-1 transition-all duration-300 ${
              activeTab === "idcard" ? "text-primary scale-110" : "text-muted-foreground"
            }`}
          >
            <IdIcon className="h-5 w-5" />
            <span className="text-[10px] font-bold">ID Card</span>
          </button>
        </nav>
      </div>
    </Layout>
  );
};
const PasswordResetDialog = ({ matricNumber }: { matricNumber: string }) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"email" | "otp" | "password">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleRequestOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      await fetchApi('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ matric_number: matricNumber, email }),
      });
      toast({ title: "OTP Sent", description: "Check your email (and spam folder) for the code." });
      setStep("otp");
      setCountdown(60); // Start 60s countdown
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Email verification failed.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetchApi('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ matric_number: matricNumber, otp }),
      });
      toast({ title: "Verified", description: "Identity confirmed. Set your new password." });
      setStep("password");
    } catch (err: any) {
      toast({ title: "Error", description: "Invalid or expired OTP.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetchApi('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ matric_number: matricNumber, otp, new_password: newPassword }),
      });
      toast({ title: "Success", description: "Password changed successfully!" });
      setOpen(false);
      setStep("email");
      setOtp("");
      setNewPassword("");
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to reset password.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) {
        setStep("email");
        setCountdown(0);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-xl h-10 gap-2 px-6 border-primary/20 hover:bg-primary/5 text-primary">
          <Lock className="h-4 w-4" />
          Request Password Change
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] border-border/50 shadow-2xl">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="font-display text-2xl font-bold">
            {step === "email" ? "Verify Identity" : step === "otp" ? "Enter OTP" : "New Password"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {step === "email" 
              ? "Type in your email to change your password." 
              : step === "otp" 
                ? "Enter the 6-digit code sent to your email. Check your spam folder if you don't see it."
                : "Create a strong new password for your account."}
          </DialogDescription>
        </DialogHeader>

        {step === "email" && (
          <form onSubmit={handleRequestOTP} className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Registered Email</label>
              <Input 
                type="email" 
                placeholder="Enter your email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-xl border-border/50 bg-muted/30"
              />
            </div>
            <Button type="submit" className="w-full rounded-xl" disabled={loading}>
              {loading ? "Sending..." : "Get Verification Code"}
            </Button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOTP} className="mt-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-foreground">6-Digit OTP</label>
                <button 
                  type="button" 
                  onClick={() => handleRequestOTP()}
                  disabled={loading || countdown > 0}
                  className={`text-[10px] font-bold uppercase tracking-wider ${countdown > 0 ? "text-muted-foreground" : "text-primary hover:underline"}`}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend Email"}
                </button>
              </div>
              <Input 
                placeholder="123456" 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                className="rounded-xl border-border/50 bg-muted/30 text-center font-mono text-lg tracking-widest"
              />
              <p className="text-[10px] text-muted-foreground text-center italic mt-2">
                Can't find it? Please check your **Spam/Junk** folder.
              </p>
            </div>
            <Button type="submit" className="w-full rounded-xl" disabled={loading}>
              {loading ? "Verifying..." : "Verify Code"}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full text-xs" 
              onClick={() => setStep("email")}
            >
              Back to Email
            </Button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">New Password</label>
              <Input 
                type="password" 
                placeholder="Enter new password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoFocus
                className="rounded-xl border-border/50 bg-muted/30"
              />
            </div>
            <Button type="submit" className="w-full rounded-xl" disabled={loading}>
              {loading ? "Saving..." : "Save New Password"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default Dashboard;
