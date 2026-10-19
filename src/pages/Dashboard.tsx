import { useState, useEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { Check, CreditCard, IdCard as IdIcon, LayoutDashboard, LogOut, User, AlertCircle, Save, Calendar, Home, Lock, BookOpen, Users, X, Download } from "lucide-react";
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
import { fetchApi } from "@/lib/api";
import FeedbackForm from "@/components/FeedbackForm";
import { downloadReceipt, fetchReceipt, fetchReceiptStatus, ReceiptStatus } from "@/lib/receipt";
import IdCardApplication from "@/components/IdCardApplication";
import HocPanel from "@/components/HocPanel";
import MaterialsPanel from "@/components/MaterialsPanel";

import nacosLogo from "@/assets/nacos_logo.png";
import lasustechLogo from "@/assets/lasustech_logo.png";

const ACCOUNT_NUMBER = "1234567890";

type DashTab = "overview" | "dues" | "idcard" | "materials" | "hoc" | "profile";
const VALID_TABS: DashTab[] = ["overview", "dues", "idcard", "materials", "hoc", "profile"];

interface NavItem {
  id: DashTab;
  label: string;
  short: string;
  icon: LucideIcon;
}

interface Fees {
  session?: string;
  semester?: string;
  dues?: number | string;
  id_card_stalite?: number | string;
  id_card_fresher?: number | string;
  welcome_message?: string;
}

interface AcademicSettings {
  session: string;
  semester: string;
  welcomeMessage: string;
}

interface PaymentRow {
  id?: number | string;
  amount: number | string;
  reference?: string;
  status: string;
  payment_type: string;
  session?: string | null;
  hoc_item_id?: number | string | null;
  charge_reference?: string;
  created_at?: string;
}

interface IdCardInfo {
  request?: { status?: string } | null;
  card_issuable?: boolean;
}

interface DashData {
  profile?: Record<string, unknown>;
  activities?: unknown[];
  adminNotice?: unknown;
  academicSettings?: Partial<AcademicSettings> | null;
  fees?: Fees | null;
  idCard?: IdCardInfo | null;
}

const hasPaidDues = (payments: PaymentRow[], session?: string) =>
  !!session && payments.some(p => p.payment_type === 'dues' && p.status === 'success' && p.session === session);

const deriveIdCardStatus = (idCard: IdCardInfo | null | undefined, matric: string, fresher: boolean): string => {
  const status = idCard?.request?.status;
  if (!status) return "Not Registered";
  if (fresher && !matric && status !== 'awaiting_payment') return "Paid: card issued after matric assignment";
  switch (status) {
    case 'awaiting_payment': return "Awaiting payment";
    case 'pending':
    case 'processing': return "Processing";
    case 'ready': return "Ready";
    case 'collected': return "Collected";
    default: return "Processing";
  }
};

const paymentLabel = (p: PaymentRow): string => {
  switch (p.payment_type) {
    case 'dues': return "Membership dues";
    case 'id_card': return "ID card";
    case 'id_replacement': return "ID card replacement";
    case 'hoc_item': return `Course material${p.hoc_item_id ? ` (item #${p.hoc_item_id})` : ""}`;
    default: return String(p.payment_type || 'Payment').replace(/_/g, ' ');
  }
};

const idStatusColor = (label: string) =>
  label === "Ready" || label === "Collected" ? "text-green-600"
    : label === "Not Registered" ? "text-muted-foreground"
    : "text-blue-600";

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // 1. ALL HOOKS AT THE TOP
  const readStoredUser = (): Record<string, unknown> => {
    try {
      const raw = localStorage.getItem("user");
      const parsed = raw && raw !== "null" ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  };
  const isFresher = readStoredUser().account_type === "fresher";

  const [activeTab, setActiveTab] = useState<DashTab>(() => {
    try {
      const saved = localStorage.getItem("dashboard_active_tab");
      if (location.state?.tab) return location.state.tab;
      if (saved && VALID_TABS.includes(saved as DashTab)) return saved as DashTab;
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
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fees, setFees] = useState<Fees | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [adminNotice, setAdminNotice] = useState<any>(null);
  const [academicSettings, setAcademicSettings] = useState<AcademicSettings>({ session: "", semester: "", welcomeMessage: "" });
  const [welcomeHidden, setWelcomeHidden] = useState(false);
  const [hocPost, setHocPost] = useState<string | null>(null);
  const [hocChecked, setHocChecked] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  const mainScrollRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const returnRefHandled = useRef(false);

  const [profile, setProfile] = useState({
    fullName: "",
    matricNumber: "",
    level: "",
    department: "",
    birthday: "",
    email: "",
    whatsappNumber: "",
    gender: "",
    post: "",
    duesStatus: "Pending",
    duesExempt: false,
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

  const duesAmount = Number(fees?.dues ?? 0);
  const duesExempt = profile.duesExempt;
  const idAwaitingPayment = profile.idCardStatus === "Awaiting payment";
  const idCardFee = Number((isFresher ? fees?.id_card_fresher : fees?.id_card_stalite) ?? 0);
  const duesPaid = hasPaidDues(payments, fees?.session);
  const amountOwing = duesPaid || duesExempt ? 0 : duesAmount;


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

  // Map an API response (student or fresher) into component state.
  const applyData = (dash: DashData, pay: PaymentRow[]) => {
    const student = dash?.profile || {};
    const roleVal = String(student.post || student.role || "");
    const roleTitle = roleVal && roleVal.toLowerCase() !== 'student' ? roleVal : "Student";
    const feeInfo = dash?.fees || null;
    const matric = String(student.matric_number || student.matric_no || "");
    const payList = Array.isArray(pay) ? pay : [];
    const acad: AcademicSettings = {
      session: String(dash?.academicSettings?.session || feeInfo?.session || ""),
      semester: String(dash?.academicSettings?.semester || feeInfo?.semester || ""),
      welcomeMessage: String(dash?.academicSettings?.welcomeMessage || feeInfo?.welcome_message || ""),
    };

    setAdminNotice(dash?.adminNotice || null);
    setAcademicSettings(acad);
    setFees(feeInfo);
    setPayments(payList);
    setActivities(Array.isArray(dash?.activities) ? dash.activities : []);
    setProfile(prev => ({
      ...prev,
      fullName: String(student.full_name || student.name || ""),
      matricNumber: matric,
      level: String(student.level || ""),
      department: String(student.department || ""),
      email: String(student.email || ""),
      whatsappNumber: String(student.whatsapp_number || ""),
      gender: String(student.gender || ""),
      post: roleTitle,
      birthday: String(student.birthday || ""),
      duesStatus: hasPaidDues(payList, feeInfo?.session) ? 'Paid' : 'Pending',
      duesExempt: student.dues_exempt === true || student.dues_exempt === 1 || student.dues_exempt === '1',
      idCardStatus: deriveIdCardStatus(dash?.idCard, matric, isFresher),
      attendance: Number(student.attendance_percentage || 0),
      resources: Number(student.resources_count || 0),
      profileImage: getProfileImage(String(student.profile_image || student.image_path || "") || null)
    }));
    return { student, roleTitle };
  };

  const fetchDashboardData = async () => {
    try {
      let dash: DashData;
      let pay: PaymentRow[];
      if (isFresher) {
        const me = await fetchApi('/fresher/me');
        dash = {
          profile: me?.profile,
          fees: me?.fees,
          idCard: me?.idCard,
          activities: [],
          adminNotice: null,
        };
        pay = Array.isArray(me?.payments) ? me.payments : [];
      } else {
        const [d, p] = await Promise.all([
          fetchApi('/student/dashboard'),
          fetchApi('/student/payments')
        ]);
        dash = d;
        pay = Array.isArray(p) ? p : [];
      }

      const { student, roleTitle } = applyData(dash, pay);
      const finalImgUrl = getProfileImage(String(student.profile_image || student.image_path || "") || null);

      // Cache for an instant paint next time (always replaced by live data)
      const stored = readStoredUser();
      try {
        localStorage.setItem('dashboard_data', JSON.stringify({ v: 2, uid: stored.id ?? null, fresher: isFresher, dash, pay }));
      } catch (e) {
        console.error("Cache write error:", e);
      }

      // Update the 'user' object for the Navbar too
      try {
        stored.profile_image = finalImgUrl;
        stored.post = String(roleTitle);
        localStorage.setItem("user", JSON.stringify(stored));
      } catch (e) {
        console.error("User storage update error:", e);
      }
    } catch (error: any) {
      console.error("Dashboard Sync Error:", error);
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        localStorage.clear();
        navigate("/");
      }
    } finally {
      setLoading(false);
      setDataReady(true);
    }
  };

  useEffect(() => {
    // Instant paint from cache (values are derived, never hardcoded), then live data replaces it
    try {
      const cached = localStorage.getItem('dashboard_data');
      if (cached) {
        const parsed = JSON.parse(cached);
        const me = readStoredUser();
        if (parsed?.v === 2 && parsed.fresher === isFresher && parsed.uid === (me.id ?? null) && parsed.dash) {
          applyData(parsed.dash, Array.isArray(parsed.pay) ? parsed.pay : []);
          setLoading(false);
        }
      }
    } catch (e) {
      console.error("Cache Parse Error:", e);
    }

    // Payment return: ?reference=... from Korapay
    const params = new URLSearchParams(location.search);
    const reference = params.get('reference');
    if (reference && !returnRefHandled.current) {
      returnRefHandled.current = true;
      navigate('/dashboard', { replace: true, state: location.state });
      (async () => {
        try {
          const result = await fetchApi(`/payments/verify/${encodeURIComponent(reference)}`);
          const ok = result?.data?.status === 'success' || result?.status === 'success';
          toast(ok
            ? { title: "Payment successful", description: "Your payment has been confirmed." }
            : { title: "Payment not completed", description: "We could not confirm this payment. If you were debited, contact the admin.", variant: "destructive" });
        } catch (err: any) {
          toast({ title: "Payment check failed", description: err.message || "Could not verify the payment.", variant: "destructive" });
        }
        await fetchDashboardData();
      })();
    } else {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Quiet HOC check (non-freshers only)
  useEffect(() => {
    if (isFresher) {
      setHocChecked(true);
      return;
    }
    let cancelled = false;
    fetchApi('/hoc/me')
      .then((d) => { if (!cancelled) setHocPost(String(d?.post || 'HOC')); })
      .catch(() => { /* not an HOC: no tab */ })
      .finally(() => { if (!cancelled) setHocChecked(true); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Welcome card is dismissible per session
  useEffect(() => {
    if (!academicSettings.session) return;
    try {
      setWelcomeHidden(localStorage.getItem(`welcome_dismissed_${academicSettings.session}`) === "1");
    } catch {
      setWelcomeHidden(false);
    }
  }, [academicSettings.session]);

  const dismissWelcome = () => {
    setWelcomeHidden(true);
    try {
      localStorage.setItem(`welcome_dismissed_${academicSettings.session}`, "1");
    } catch {
      // storage unavailable
    }
  };

  // Fall back to Overview if the saved tab is not available for this account
  useEffect(() => {
    if (activeTab === "profile" && isFresher) setActiveTab("overview");
    if (activeTab === "hoc" && hocChecked && !hocPost) setActiveTab("overview");
  }, [activeTab, hocChecked, hocPost, isFresher]);

  const navItems: NavItem[] = [
    { id: "overview", label: "Overview", short: "Home", icon: LayoutDashboard },
    ...(isFresher ? [] : [{ id: "profile" as DashTab, label: "My Profile", short: "Profile", icon: User }]),
    { id: "dues", label: "Dues & Fees", short: "Dues", icon: CreditCard },
    { id: "idcard", label: "ID Card", short: "ID Card", icon: IdIcon },
    { id: "materials", label: "Course Materials", short: "Materials", icon: BookOpen },
    ...(hocPost ? [{ id: "hoc" as DashTab, label: hocPost, short: hocPost, icon: Users }] : []),
  ];

  const isProfileIncomplete = !isFresher && (!profile.fullName || !profile.matricNumber || !profile.level || !profile.birthday);

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

  const [receiptStatus, setReceiptStatus] = useState<ReceiptStatus | null>(null);
  const [receiptBusy, setReceiptBusy] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== "dues") return;
    let cancelled = false;
    fetchReceiptStatus().then((s) => { if (!cancelled) setReceiptStatus(s); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [activeTab, payments]);

  const getReceipt = async (pay: PaymentRow) => {
    const ref = pay.charge_reference || pay.reference;
    if (!ref) return;
    setReceiptBusy(ref);
    try {
      await downloadReceipt(await fetchReceipt(ref));
    } catch (err: any) {
      toast({ title: "Receipt not available", description: err.message || "Could not create the receipt.", variant: "destructive" });
    } finally {
      setReceiptBusy(null);
    }
  };

  const handlePayment = async (type: 'dues' | 'bundle' = 'dues') => {
    try {
      toast({ title: "Processing...", description: "Opening payment portal." });
      const data = await fetchApi('/payments/initialize', {
        method: 'POST',
        body: JSON.stringify({ payment_type: type })
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
              <p className="text-[10px] text-muted-foreground mt-1">
                {profile.matricNumber ? `Matric: ${profile.matricNumber}` : "Matric number pending"}
                {profile.level ? ` | ${profile.level}L` : ""}
              </p>
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
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
                  activeTab === id 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:bg-white hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
            
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
          {adminNotice && (
            <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-bold">{String(adminNotice.reason || "Account Notice")}</p>
                  <p className="text-xs text-red-700">This was added by the admin team and is visible only on your dashboard.</p>
                </div>
              </div>
              <p className="text-sm leading-6 text-red-800">{String(adminNotice.message || "")}</p>
            </div>
          )}

          {(academicSettings.session || academicSettings.semester) && (
            <div className="mb-6 flex flex-col gap-2 rounded-2xl border border-primary/15 bg-primary/5 p-5 text-foreground sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Current Academic Session</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {academicSettings.session || "Session not set"}{academicSettings.semester ? ` | ${academicSettings.semester}` : ""}
                </p>
              </div>
            </div>
          )}

          {academicSettings.welcomeMessage && !welcomeHidden && (
            <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-primary/15 bg-white p-5 text-foreground">
              <div>
                <p className="text-sm font-bold text-primary">Welcome to the new session{academicSettings.session ? ` ${academicSettings.session}` : ""}</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{academicSettings.welcomeMessage}</p>
              </div>
              <button
                type="button"
                onClick={dismissWelcome}
                aria-label="Dismiss welcome message"
                className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

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
                      <p className="text-xs text-muted-foreground">Status: <span className={`${duesPaid || duesExempt ? "text-green-600" : "text-amber-600"} font-bold`}>{duesExempt ? "Exempt" : duesPaid ? "Paid" : "Pending"}</span></p>
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
                      <p className="text-xs text-muted-foreground">Status: <span className={`${idStatusColor(profile.idCardStatus)} font-bold`}>{profile.idCardStatus}</span></p>
                    </div>
                  </div>
                  <Button onClick={() => setActiveTab("idcard")} className="mt-6 w-full rounded-xl" variant="outline">Manage ID Card</Button>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
                <h3 className="font-display text-lg font-bold text-foreground">Suggestion and Complaint Box</h3>
                <p className="mt-1 text-xs text-muted-foreground">Tell the executives what to improve, or report a problem. You can stay anonymous.</p>
                <FeedbackForm defaultKind="suggestion" className="mt-5 max-w-xl" />
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
                  <p className="mt-2 text-sm text-muted-foreground">You are a fully verified member of NACOS LASUSTECH {academicSettings.session ? `for the ${academicSettings.session} session` : "this session"}.</p>
                  
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

          {activeTab === "profile" && !isFresher && (
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
                          value={profile.level ? `${profile.level}L` : ""} 
                          className="rounded-xl border-border/60 bg-muted/30"
                          disabled
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
                      <p className="mt-1 font-display text-3xl font-bold text-foreground">{fees ? `₦${amountOwing.toLocaleString()}` : "..."}</p>
                    </div>
                    <div className={`rounded-xl px-4 py-2 text-xs font-bold ${duesPaid || duesExempt ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {duesExempt ? 'Exempt' : duesPaid ? 'Paid' : 'Pending'}
                    </div>
                  </div>

                  {(() => {
                    // Dues and the ID card are one receipt: one PDF covers both.
                    const paidRows = payments.filter((p) => p.status === 'success' && (p.payment_type === 'dues' || p.payment_type === 'id_card'));
                    if (paidRows.length === 0) return null;
                    const target = paidRows.find((p) => p.payment_type === 'dues') || paidRows[0];
                    const ref = target.charge_reference || target.reference || '';
                    const locked = receiptStatus?.locked_reason || null;
                    return (
                      <div className="mt-8 rounded-2xl border border-border bg-muted/30 p-4">
                        <p className="text-sm font-bold text-foreground">Dues and ID card receipt</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">One receipt covers your dues and your ID card, with a QR code anyone can scan to check it is genuine.</p>
                        <button
                          type="button"
                          disabled={!!locked || receiptBusy === ref}
                          onClick={() => getReceipt(target)}
                          className={`mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-bold transition-colors sm:h-11 ${
                            locked ? 'cursor-not-allowed bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70'
                          }`}
                        >
                          {locked ? <Lock className="h-5 w-5" /> : <Download className="h-5 w-5" />}
                          {receiptBusy === ref ? "Preparing receipt..." : locked ? "Receipt locked" : "Download receipt (PDF)"}
                        </button>
                        {locked && <p className="mt-2 text-center text-xs leading-relaxed text-amber-800">{locked}</p>}
                      </div>
                    );
                  })()}

                  <div className="mt-8">
                    <h3 className="font-display text-lg font-bold text-foreground">Payment History</h3>
                    <div className="mt-4 space-y-4">
                      {payments.length > 0 ? (
                        payments.map((pay, i) => {
                          const ok = pay.status === 'success';
                          const failed = pay.status === 'failed';
                          return (
                            <div key={pay.id ?? pay.reference ?? i} className="flex flex-wrap items-center justify-between gap-y-3 rounded-2xl bg-muted/30 p-4">
                              <div className="flex items-center gap-4">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ${ok ? 'text-primary' : failed ? 'text-red-600' : 'text-amber-600'}`}>
                                  {ok ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                                </div>
                                <div>
                                  <p className="text-sm font-bold">{paymentLabel(pay)}</p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {pay.created_at ? new Date(pay.created_at).toLocaleDateString() : 'Recent'}
                                    {pay.session ? ` | ${pay.session}` : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-foreground">₦{Number(pay.amount || 0).toLocaleString()}</p>
                                <p className={`text-[10px] font-medium capitalize ${ok ? 'text-green-600' : failed ? 'text-red-600' : 'text-amber-600'}`}>
                                  {ok ? 'Successful' : pay.status}
                                </p>
                              </div>
                              {ok && ['id_replacement', 'hoc_item'].includes(pay.payment_type) && (() => {
                                const locked: string | null = null;
                                const ref = pay.charge_reference || pay.reference || '';
                                return (
                                  <div className="basis-full">
                                    <button
                                      type="button"
                                      disabled={!!locked || receiptBusy === ref}
                                      onClick={() => getReceipt(pay)}
                                      className={`flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-bold transition-colors sm:h-11 ${
                                        locked ? 'cursor-not-allowed bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70'
                                      }`}
                                    >
                                      {locked ? <Lock className="h-5 w-5" /> : <Download className="h-5 w-5" />}
                                      {receiptBusy === ref ? "Preparing receipt..." : locked ? "Receipt locked" : "Download receipt (PDF)"}
                                    </button>
                                    {locked && <p className="mt-2 text-center text-xs leading-relaxed text-amber-800">{locked}</p>}
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        })
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
                      {duesExempt
                        ? `As ${profile.post}, you do not pay dues. Nothing is owed on your account.`
                        : <>Instant verification. Skip the wait and pay your {fees ? `₦${duesAmount.toLocaleString()} ` : ""}session dues via Korapay.</>}
                    </p>
                    <Button 
                      onClick={() => handlePayment('dues')} 
                      className="mt-6 w-full rounded-full"
                      disabled={duesPaid || duesExempt || !fees}
                    >
                      {duesExempt ? 'Exempt from Dues' : duesPaid ? 'Dues Already Paid' : 'Pay Dues with Korapay'}
                    </Button>
                    {!duesPaid && !duesExempt && idAwaitingPayment && fees && (
                      <div className="mt-3">
                        <Button onClick={() => handlePayment('bundle')} variant="outline" className="w-full rounded-full">
                          Pay Dues and ID Card Together
                        </Button>
                        <p className="mt-2 text-center text-[10px] text-muted-foreground">
                          One payment of ₦{(duesAmount + idCardFee).toLocaleString()} covers both.
                        </p>
                      </div>
                    )}
                    {receiptStatus?.locked_reason && payments.some((p) => p.status === 'success' && (p.payment_type === 'dues' || p.payment_type === 'id_card')) && (
                      <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-center text-[11px] leading-relaxed text-amber-800">
                        Dues and your ID card go together. {receiptStatus.locked_reason}
                      </p>
                    )}
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
              <IdCardApplication />
            </div>
          )}

          {activeTab === "materials" && (
            <div className="max-w-4xl animate-reveal pb-12">
              <MaterialsPanel />
            </div>
          )}

          {activeTab === "hoc" && hocPost && (
            <div className="max-w-4xl animate-reveal pb-12">
              <HocPanel />
            </div>
          )}
        </main>

        {/* Mobile Bottom Navigation - Moved to absolute bottom for visibility */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex w-full items-center gap-1 overflow-x-auto border-t border-border bg-background/95 px-2 py-3 pb-safe backdrop-blur-lg lg:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          {navItems.map(({ id, short, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex min-w-[52px] flex-1 shrink-0 flex-col items-center gap-1 px-1 py-1 transition-all duration-300 ${
                activeTab === id ? "text-primary scale-110" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="whitespace-nowrap text-[10px] font-bold">{short}</span>
            </button>
          ))}
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
    if (newPassword.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
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
      toast({ title: "Error", description: err.message || "Failed to reset password.", variant: "destructive" });
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
                Can't find it? Please check your <strong>Spam/Junk</strong> folder.
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
                minLength={8}
                autoFocus
                className="rounded-xl border-border/50 bg-muted/30"
              />
              <p className="text-[10px] text-muted-foreground">At least 8 characters.</p>
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
