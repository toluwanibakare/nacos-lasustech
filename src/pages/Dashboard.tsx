import { useState } from "react";
import { Copy, Check, ExternalLink, CreditCard, IdCard as IdIcon, LayoutDashboard, LogOut, User, AlertCircle, Save, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Layout from "@/components/Layout";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";

const ACCOUNT_NUMBER = "1234567890";

const Dashboard = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"overview" | "dues" | "idcard" | "profile">("overview");
  
  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState({
    fullName: "",
    matricNumber: "",
    level: "",
    birthday: "",
    email: "",
    duesStatus: "Pending",
    idCardStatus: "Not Registered",
    attendance: 0,
    resources: 0,
    profileImage: null as string | null
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activities, setActivities] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [amountOwing, setAmountOwing] = useState(5000);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      try {
        // Fetch dashboard and payments in parallel
        const [dashRes, payRes] = await Promise.all([
          fetch('http://localhost:5000/api/student/dashboard', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:5000/api/student/payments', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (dashRes.ok) {
          const dashData = await dashRes.json();
          setProfile({
            ...profile,
            fullName: dashData.profile.full_name,
            matricNumber: dashData.profile.matric_number,
            level: dashData.profile.level,
            duesStatus: dashData.profile.dues_status,
            idCardStatus: dashData.profile.id_card_status,
            attendance: dashData.profile.attendance_percentage,
            resources: dashData.profile.resources_count,
            profileImage: dashData.profile.profile_image
          });
          setActivities(dashData.activities || []);
          if (dashData.profile.dues_status === 'Paid') {
            setAmountOwing(0);
          }
        } else if (dashRes.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("isLoggedIn");
          toast({ title: "Session Expired", description: "Please login again.", variant: "destructive" });
          navigate("/");
        }

        if (payRes.ok) {
          const payData = await payRes.json();
          setPayments(Array.isArray(payData) ? payData : []);
        }
      } catch (error) {
        console.error("Fetch error:", error);
        toast({ 
          title: "Connection Error", 
          description: "Could not sync data with server. Check your connection.",
          variant: "destructive" 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate, toast]);

  const isProfileIncomplete = !profile.fullName || !profile.matricNumber || !profile.level || !profile.birthday;

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    toast({ title: "Logged out", description: "You have been successfully logged out." });
    navigate("/");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(ACCOUNT_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUploadProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const response = await fetch('http://localhost:5000/api/student/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: profile.fullName,
          level: profile.level,
          email: profile.email
        })
      });
      if (response.ok) {
        toast({ title: "Profile Updated", description: "Your changes have been saved successfully." });
        setActiveTab("overview");
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem("token");
    try {
      toast({ title: "Uploading...", description: "Compressing and saving your photo." });
      const response = await fetch('http://localhost:5000/api/student/profile-image', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (response.ok) {
        setProfile({ ...profile, profileImage: data.imageUrl });
        toast({ title: "Success", description: "Profile picture updated successfully!" });
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to upload image.", variant: "destructive" });
    }
  };

  const handlePayment = async () => {
    const token = localStorage.getItem("token");
    try {
      toast({ title: "Processing...", description: "Opening payment portal." });
      const response = await fetch('http://localhost:5000/api/payments/initialize', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: profile.email || `${profile.matricNumber}@lasustech.edu.ng`,
          amount: 5000,
          payment_type: 'nacos_dues'
        })
      });
      const data = await response.json();
      if (response.ok && data.data?.authorization_url) {
        window.location.href = data.data.authorization_url;
      } else {
        toast({ title: "Payment Error", description: data.message || "Could not initialize payment.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Payment Error", description: "Could not initialize payment.", variant: "destructive" });
    }
  };

  const handleIdCardRequest = async () => {
    const token = localStorage.getItem("token");
    if (profile.duesStatus !== 'Paid') {
      toast({ 
        title: "Dues Required", 
        description: "You must pay your NACOS dues before requesting an ID card.", 
        variant: "destructive" 
      });
      setActiveTab("dues");
      return;
    }

    try {
      toast({ title: "Submitting Request", description: "Sending your ID card request..." });
      const response = await fetch('http://localhost:5000/api/services/id-card/request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: profile.fullName,
          matric_number: profile.matricNumber,
          passport_url: profile.profileImage ? `http://localhost:5000${profile.profileImage}` : ""
        })
      });
      
      if (response.ok) {
        toast({ title: "Success", description: "ID card request submitted! We'll notify you when it's ready." });
        setProfile({ ...profile, idCardStatus: "Processing" });
      } else {
        const data = await response.json();
        toast({ title: "Request Failed", description: data.message, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to submit request.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm font-medium text-muted-foreground animate-pulse">Verifying session...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex min-h-[calc(100vh-64px)] flex-col lg:flex-row">
        {/* Sidebar / Mobile Nav */}
        <aside className="w-full border-r border-border bg-muted/20 lg:w-64">
          <div className="p-6 md:p-8">
            <h2 className="font-display text-xl font-bold text-foreground animate-reveal">Chapter Hub</h2>
            <p className="text-[11px] text-muted-foreground mt-1 text-black animate-reveal-delay-1">Member Portal</p>
          </div>
          <nav className="flex flex-row gap-1 overflow-x-auto px-4 pb-4 scrollbar-hide lg:flex-col lg:px-3 lg:pb-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 lg:w-full lg:gap-3 ${
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
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 lg:w-full lg:gap-3 ${
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
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 lg:w-full lg:gap-3 ${
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
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 lg:w-full lg:gap-3 ${
                activeTab === "idcard" 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:bg-white hover:text-foreground"
              }`}
            >
              <IdIcon className="h-4 w-4" />
              ID Card
            </button>
            
            <div className="hidden pt-4 mt-4 border-t border-border lg:block">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-all"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-10 text-black">
          {/* Incomplete Profile Warning */}
          {isProfileIncomplete && (
            <div className="mb-8 flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 animate-reveal">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold">Profile Incomplete!</p>
                <p className="text-xs">Please complete your profile details (including birthday) to access all features.</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setActiveTab("profile")}
                className="border-amber-200 bg-white text-amber-800 hover:bg-amber-100"
              >
                Fix Now
              </Button>
            </div>
          )}

          {activeTab === "overview" && (
            <div className="space-y-8 animate-reveal">
              <div className="max-w-2xl">
                <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="mt-2 text-muted-foreground">Welcome back, <span className="text-primary font-semibold">{profile.fullName || "Member"}</span>. Here's what's happening today.</p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Membership Dues</h3>
                      <p className="text-xs text-muted-foreground">Paid status: <span className={`${profile.duesStatus === 'Paid' ? 'text-green-600' : 'text-amber-600'} font-bold`}>{profile.duesStatus}</span></p>
                    </div>
                  </div>
                  <Button onClick={() => setActiveTab("dues")} className="mt-6 w-full rounded-xl" variant="outline">View Break-down</Button>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <IdIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">ID Card Status</h3>
                      <p className="text-xs text-muted-foreground">Status: <span className="text-blue-600 font-bold">{profile.idCardStatus}</span></p>
                    </div>

                  </div>
                  <Button onClick={() => setActiveTab("idcard")} className="mt-6 w-full rounded-xl" variant="outline">Start Registration</Button>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Upcoming Exam</h3>
                      <p className="text-xs text-muted-foreground">Next Event: <span className="text-foreground font-bold italic">Tech Summit '26</span></p>
                    </div>
                  </div>
                  <Button onClick={() => navigate("/events")} className="mt-6 w-full rounded-xl" variant="outline">Chapter Calendar</Button>
                </div>
              </div>

              {/* Stats & Activity */}
              <div className="grid gap-8 lg:grid-cols-2">
                <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
                  <h3 className="font-display text-lg font-bold">Recent Activities</h3>
                  <div className="mt-6 space-y-4">
                    {activities.map((activity, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                        <div>
                          <p className="text-sm font-semibold">{activity.type}</p>
                          <p className="text-[11px] text-muted-foreground">{new Date(activity.activity_date).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 ${
                          activity.status === "Done" || activity.status === "Attended" ? "bg-green-100 text-green-700" : 
                          activity.status === "Incomplete" ? "bg-amber-100 text-amber-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                    ))}
                    {activities.length === 0 && <p className="text-xs text-muted-foreground">No recent activities found.</p>}
                  </div>
                </div>

                <div className="rounded-3xl border border-[#169B2D]/10 bg-[#169B2D]/5 p-6 shadow-sm">
                  <h3 className="font-display text-lg font-bold text-primary">Member Quick Facts</h3>
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Attendance</p>
                      <p className="mt-1 font-display text-2xl font-bold">{profile.attendance}%</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Resources</p>
                      <p className="mt-1 font-display text-2xl font-bold">{profile.resources}</p>
                    </div>
                  </div>

                  <p className="mt-6 text-xs leading-relaxed text-muted-foreground italic">
                    "Computing is the language of the future. Keep learning and growing as a Computing Student."
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
                      <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-card bg-muted shadow-xl">
                        <img 
                          src={profile.profileImage ? `http://localhost:5000${profile.profileImage}` : "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=128&auto=format&fit=crop"} 
                          alt="Profile" 
                          className="h-full w-full object-cover"
                        />
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
                          onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
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
                          value={profile.email} 
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                          className="rounded-xl border-border/60"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Level</label>
                        <Input 
                          value={profile.level} 
                          onChange={(e) => setProfile({ ...profile, level: e.target.value })}
                          className="rounded-xl border-border/60"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Birthday</label>
                        <Input 
                          type="date"
                          value={profile.birthday} 
                          onChange={(e) => setProfile({ ...profile, birthday: e.target.value })}
                          className={`rounded-xl border-border/60 ${!profile.birthday ? "border-amber-300 ring-2 ring-amber-100" : ""}`}
                        />
                        {!profile.birthday && (
                          <p className="text-[10px] text-amber-600 font-medium">Required for Google Calendar integration</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-border mt-8 flex justify-end">
                      <Button type="submit" className="gap-2 rounded-xl px-8 shadow-xl shadow-primary/30">
                        <Save className="h-4 w-4" />
                        Save All Changes
                      </Button>
                    </div>
                  </form>
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
                      <p className="mt-1 font-display text-3xl font-bold text-foreground">₦{amountOwing.toLocaleString()}</p>
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
                                <p className="text-sm font-bold capitalize">{(pay.payment_type || 'Payment').replace('_', ' ')}</p>
                                <p className="text-[11px] text-muted-foreground">{new Date(pay.created_at).toLocaleDateString()}</p>
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
                      Instant verification. Skip the wait and pay your ₦5,000 session dues via Paystack.
                    </p>
                    <Button 
                      onClick={handlePayment} 
                      className="mt-6 w-full rounded-xl shadow-lg shadow-primary/20"
                      disabled={profile.duesStatus === 'Paid'}
                    >
                      {profile.duesStatus === 'Paid' ? 'Dues Already Paid' : 'Pay Now with Paystack'}
                    </Button>
                    <p className="mt-4 text-center text-[10px] text-muted-foreground">
                      Powered by <strong>Paystack</strong>. All transactions are secure.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-border bg-muted/20 p-6">
                    <h3 className="text-sm font-bold text-foreground">Manual Bank Transfer</h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">First Bank of Nigeria</p>
                        <p className="text-xs font-bold">NACOS LASUSTECH</p>
                        <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-white p-3 border border-border">
                          <span className="font-mono text-sm font-bold tracking-widest">{ACCOUNT_NUMBER}</span>
                          <button onClick={handleCopy} className="text-primary hover:text-primary/80">
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="rounded-xl bg-amber-50 p-3 border border-amber-100">
                        <p className="text-[10px] font-medium text-amber-800">
                          <strong>Note:</strong> Verification for manual transfers takes 24-48 hours. Use your matric number as reference.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "idcard" && (
            <div className="max-w-4xl animate-reveal pb-12">
              <h2 className="font-display text-3xl font-bold text-foreground">ID Card Registration</h2>
              <p className="mt-2 text-sm text-muted-foreground">Get your official NACOS LASUSTECH identification card.</p>

              <div className="mt-8 grid gap-8 lg:grid-cols-2">
                <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
                  <h3 className="font-display text-xl font-bold text-foreground">Registration Status</h3>
                  
                  <div className="mt-8 flex flex-col items-center text-center">
                    <div className={`relative flex h-24 w-24 items-center justify-center rounded-full border-4 ${
                      profile.idCardStatus === 'Ready' ? 'border-green-500 bg-green-50' : 
                      profile.idCardStatus === 'Processing' ? 'border-blue-500 bg-blue-50' :
                      'border-border bg-muted/30'
                    }`}>
                      <IdIcon className={`h-10 w-10 ${
                        profile.idCardStatus === 'Ready' ? 'text-green-500' : 
                        profile.idCardStatus === 'Processing' ? 'text-blue-500' :
                        'text-muted-foreground'
                      }`} />
                    </div>
                    <h4 className="mt-4 font-display text-lg font-bold">{profile.idCardStatus}</h4>
                    <p className="mt-2 text-xs text-muted-foreground max-w-[200px]">
                      {profile.idCardStatus === 'Not Registered' ? 'You haven\'t started your ID card registration yet.' : 
                       profile.idCardStatus === 'Processing' ? 'Our team is verifying your data and printing your card.' :
                       'Your ID card is ready for collection at the NACOS Secretariat.'}
                    </p>
                  </div>

                  <div className="mt-10 space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-border p-4">
                      <span className="text-xs font-medium text-muted-foreground">Payment Status</span>
                      <span className={`text-xs font-bold ${profile.duesStatus === 'Paid' ? 'text-green-600' : 'text-amber-600'}`}>
                        {profile.duesStatus === 'Paid' ? 'Verified' : 'Pending Dues'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border p-4">
                      <span className="text-xs font-medium text-muted-foreground">Biometrics & Photo</span>
                      <span className={`text-xs font-bold ${profile.profileImage ? 'text-green-600' : 'text-amber-600'}`}>
                        {profile.profileImage ? 'Uploaded' : 'Missing Photo'}
                      </span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleIdCardRequest}
                    disabled={profile.idCardStatus !== 'Not Registered'}
                    className="mt-8 w-full rounded-2xl shadow-lg shadow-primary/20"
                  >
                    {profile.idCardStatus === 'Not Registered' ? 'Request New ID Card' : 'Request Already Submitted'}
                  </Button>
                </div>

                <div className="rounded-3xl border border-primary/10 bg-primary/5 p-8 shadow-sm">
                  <h3 className="font-display text-xl font-bold text-primary">ID Card Portal</h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Our central ID system managed on cPanel allows you to manage your global NACOS profile.
                  </p>
                  
                  <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <ExternalLink className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Self-Service Portal</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Access <strong>nacosid.tmb.it.com</strong> to download digital copies or update your passport.
                        </p>
                      </div>
                    </div>
                    <a href="https://nacosid.tmb.it.com" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="mt-6 w-full rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50">
                        Visit External Portal
                      </Button>
                    </a>
                  </div>

                  <div className="mt-6 p-4 border-l-4 border-blue-500 bg-blue-50/50">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Notice</h5>
                    <p className="mt-1 text-[11px] text-blue-600 leading-relaxed font-medium">
                      Physical ID cards are printed in batches. Please allow 7-14 working days after request for processing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
};

export default Dashboard;
