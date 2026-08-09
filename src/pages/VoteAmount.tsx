import { useState, useEffect } from "react";
import { fetchVotingApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, CreditCard, RefreshCw } from "lucide-react";
import Layout from "@/components/Layout";

const formatCurrency = (amount: number) => `₦${Number(amount || 0).toLocaleString()}`;

const VoteAmount = () => {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [stats, setStats] = useState<{ totalVotes: number; totalAmount: number; pricePerVote: number } | null>(null);
  
  // For updating the fake base balance
  const [newBaseAmount, setNewBaseAmount] = useState("");
  
  useEffect(() => {
    const saved = localStorage.getItem("admin_fake_base_amount");
    if (saved) {
      setNewBaseAmount(saved);
    } else {
      setNewBaseAmount("1161131");
    }
  }, []);

  const handleUpdateBase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBaseAmount || isNaN(Number(newBaseAmount))) {
      setError("Please enter a valid number");
      return;
    }
    localStorage.setItem("admin_fake_base_amount", newBaseAmount);
    setSuccess("Base balance updated successfully. The Admin dashboard will now use this value.");
    setTimeout(() => setSuccess(""), 3000);
  };

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchVotingApi("/leaderboard");
      const nominees = data?.nominees || [];
      const settings = data?.settings || {};
      
      const pricePerVote = settings.votePrice ? Number(settings.votePrice) : 100;
      
      let totalVotes = 0;
      nominees.forEach((nom: any) => {
        totalVotes += Number(nom.voteCount || 0);
      });

      setStats({
        totalVotes,
        totalAmount: totalVotes * pricePerVote,
        pricePerVote
      });
    } catch (err: any) {
      setError("Failed to load live data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "TMBisdbest@123") {
      setIsAuthenticated(true);
      fetchStats();
    } else {
      setError("Incorrect password");
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="flex min-h-[70vh] items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Lock className="h-8 w-8" />
            </div>
            <h1 className="mb-2 text-center text-2xl font-bold">Secure Access</h1>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Enter the passcode to view real-time vote revenue.
            </p>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl text-center text-lg tracking-widest"
              />
              {error && <p className="text-center text-sm text-red-500">{error}</p>}
              <Button type="submit" className="h-12 w-full rounded-xl text-lg font-semibold">
                Unlock
              </Button>
            </form>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display">Real-Time Revenue</h1>
            <p className="text-muted-foreground mt-1">Live un-throttled statistics from the voting system.</p>
          </div>
          <Button 
            onClick={fetchStats} 
            disabled={loading}
            variant="outline"
            className="rounded-xl gap-2 h-10"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="mb-8 rounded-2xl bg-red-50 p-4 text-red-600 border border-red-100">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[2rem] bg-gradient-to-br from-primary/10 to-primary/5 p-8 border border-primary/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-sm mb-6">
              <CreditCard className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary/80">Total Real Revenue</p>
            <p className="mt-2 text-4xl font-bold text-foreground">
              {stats ? formatCurrency(stats.totalAmount) : "..."}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Calculated at ₦{stats?.pricePerVote || 100} per vote
            </p>
          </div>
          
          <div className="rounded-[2rem] bg-white p-8 border shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 shadow-sm mb-6">
              <Lock className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Total Real Votes</p>
            <p className="mt-2 text-4xl font-bold text-foreground">
              {stats ? stats.totalVotes.toLocaleString() : "..."}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Aggregated across all nominees
            </p>
          </div>
        </div>

        {/* Form to update the Fake Base Amount for Admin Dashboard */}
        <div className="mt-12 rounded-[2rem] bg-white p-8 border shadow-sm">
           <h2 className="text-xl font-bold font-display mb-4">Admin Dashboard Configuration</h2>
           <p className="text-muted-foreground text-sm mb-6">
             Update the base revenue that appears on the public Admin Dashboard. It will increase slowly from this amount.
           </p>
           
           <form onSubmit={handleUpdateBase} className="flex flex-col sm:flex-row gap-4 max-w-lg">
             <div className="relative flex-1">
               <span className="absolute left-4 top-3 text-muted-foreground">₦</span>
               <Input 
                 type="number" 
                 value={newBaseAmount}
                 onChange={(e) => setNewBaseAmount(e.target.value)}
                 className="pl-8 h-12 rounded-xl"
                 placeholder="1161131"
               />
             </div>
             <Button type="submit" className="h-12 rounded-xl px-8">Update Base</Button>
           </form>
           
           {success && (
             <p className="mt-4 text-sm font-medium text-emerald-600">{success}</p>
           )}
        </div>
      </div>
    </Layout>
  );
};

export default VoteAmount;
