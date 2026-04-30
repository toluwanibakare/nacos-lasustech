import { useState } from "react";
import { Copy, Check, ExternalLink, CreditCard, IdCard as IdIcon, LayoutDashboard, LogOut, User, AlertCircle, Save, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Layout from "@/components/Layout";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";

const ACCOUNT_NUMBER = "1234567890";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "dues" | "idcard" | "profile">("overview");
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/student/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok) {
          setProfile({
            ...profile,
            fullName: data.profile.full_name,
            matricNumber: data.profile.matric_number,
            level: data.profile.level,
            duesStatus: data.profile.dues_status,
            idCardStatus: data.profile.id_card_status,
            attendance: data.profile.attendance_percentage,
            resources: data.profile.resources_count,
            profileImage: data.profile.profile_image
          });
          setActivities(data.activities);
        } else {
          toast({ title: "Session Expired", description: "Please login again.", variant: "destructive" });
          navigate("/");
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

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
      const response = await fetch('http://localhost:5000/api/payments/initialize', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: profile.email || `${profile.matricNumber}@lasustech.edu.ng`,
          amount: 5000 // Example amount in Naira
        })
      });
      const data = await response.json();
      if (response.ok && data.data.authorization_url) {
        window.location.href = data.data.authorization_url;
      }
    } catch (err) {
      toast({ title: "Payment Error", description: "Could not initialize payment.", variant: "destructive" });
    }
  };

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
            <div className="max-w-2xl animate-reveal pb-12">
              <h2 className="font-display text-3xl font-bold text-foreground">Membership Dues</h2>
              <p className="mt-2 text-sm text-muted-foreground">Complete your NACOS LASUSTECH membership dues payment below.</p>
              
              <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
                <h3 className="font-display text-lg font-bold text-foreground text-black">Official Bank Details</h3>
                <div className="mt-6 space-y-3">
                  <div className="rounded-2xl bg-muted/40 p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Bank Name</p>
                    <p className="mt-1 font-display text-sm font-bold text-foreground">First Bank of Nigeria</p>
                  </div>
                  <div className="rounded-2xl bg-muted/40 p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Account Name</p>
                    <p className="mt-1 font-display text-sm font-bold text-foreground">NACOS LASUSTECH</p>
                  </div>
                  <div className="rounded-2xl bg-muted/40 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Account Number</p>
                        <p className="mt-1 font-display text-2xl font-bold tracking-widest text-foreground">{ACCOUNT_NUMBER}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleCopy} className="h-10 rounded-xl gap-2 text-xs font-bold">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-highlight">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Pay Online (Instant)
                  </h4>
                  <p className="mt-2 text-xs text-muted-foreground">Skip the bank queue and pay your ₦5,000 dues securely via Paystack.</p>
                  <Button 
                    onClick={handlePayment} 
                    className="mt-4 w-full rounded-xl shadow-lg shadow-primary/20"
                    disabled={profile.duesStatus === 'Paid'}
                  >
                    {profile.duesStatus === 'Paid' ? 'Dues Already Paid' : 'Pay Dues Online Now'}
                  </Button>
                </div>

                <div className="mt-6 rounded-2xl border border-border bg-muted/20 p-6">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    Bank Transfer Instructions
                  </h4>
                  <ul className="mt-4 space-y-3 text-xs text-muted-foreground font-medium">
                    <li className="flex gap-2"><span>1.</span> <span>Transfer the exact dues amount to the account above.</span></li>
                    <li className="flex gap-2"><span>2.</span> <span>Use your <strong>Full Name + Matric</strong> as payment reference.</span></li>
                    <li className="flex gap-2"><span>3.</span> <span>Upload your receipt to the Financial Secretary portal for verification.</span></li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === "idcard" && (
            <div className="max-w-2xl animate-reveal pb-12">
              <h2 className="font-display text-3xl font-bold text-foreground">ID Card Registration</h2>
              <p className="mt-2 text-sm text-muted-foreground">Get your official NACOS LASUSTECH identification card.</p>

              <div className="mt-8 rounded-3xl border border-border bg-card p-10 text-center shadow-lg">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 shadow-inner">
                  <IdIcon className="h-10 w-10 text-primary" />
                </div>
                <h3 className="mt-6 font-display text-2xl font-bold text-foreground text-black">
                  Secure Your Chapter ID
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground px-4">
                  The ID card serves as proof of membership and is mandatory for all students to participate in official chapter activities and workshops.
                </p>
                <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
                  <a href="https://nacosid.tmb.it.com" target="_blank" rel="noopener noreferrer">
                    <Button size="lg" className="w-full gap-2 rounded-2xl font-bold shadow-xl shadow-primary/30 sm:w-auto">
                      Access ID Portal <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                  <Button variant="outline" className="rounded-2xl font-bold sm:w-auto overflow-hidden text-black transition-all hover:bg-muted">
                    Learn Requirements
                  </Button>
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
