import { useState } from "react";
import Layout from "@/components/Layout";
import { Heart, Send, HelpCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

const QUICK_AMOUNTS = [2000, 5000, 10000, 25000, 50000];

const Donate = () => {
  const [amount, setAmount] = useState<number | "">("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleQuickAmount = (val: number) => {
    setAmount(val);
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter or select a donation amount.",
        variant: "destructive",
      });
      return;
    }
    if (!email || !name) {
      toast({
        title: "Missing Information",
        description: "Please provide your name and email to proceed.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetchApi("/payments/donate", {
        method: "POST",
        body: JSON.stringify({
          email,
          amount: Number(amount),
          full_name: name,
        }),
      });

      if (res?.data?.checkout_url) {
        window.location.href = res.data.checkout_url;
      } else {
        throw new Error("Could not initialize payment secure portal.");
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Payment Error",
        description: err.message || "Failed to initialize payment gateway. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="relative min-h-screen bg-[#070e17] pt-28 pb-24 overflow-hidden font-sans">
        {/* Colorful backgrounds */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-600/15 rounded-full blur-[120px]" />
          <div className="absolute top-[30%] right-[10%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="container px-4 relative z-10">
          <div className="max-w-4xl mx-auto grid md:grid-cols-[1fr_480px] gap-12 items-center">
            
            {/* Left: Info + Envelope Illustration */}
            <div className="flex flex-col text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider mb-6 w-fit mx-auto md:mx-0">
                Support Our Vision
              </div>

              <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight uppercase tracking-tight">
                Empower <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">Computing</span> Innovation
              </h1>
              <p className="text-white/60 mt-4 leading-relaxed text-base sm:text-lg">
                Your kind donations enable us to host tech workshops, support brilliant student projects, organize computing bootcamps, and facilitate department infrastructure growth. Together, we are building the future!
              </p>

              {/* Beautiful Envelope Design */}
              <div className="relative mt-12 w-64 h-48 mx-auto md:mx-0 group cursor-pointer perspective">
                <motion.div 
                  whileHover={{ rotateY: 10, rotateX: 10 }}
                  className="relative w-full h-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-2xl flex flex-col justify-between overflow-hidden"
                >
                  {/* Decorative glowing lines */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl select-none pointer-events-none" />
                  
                  {/* Envelope Seal Icon */}
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <Heart className="h-6 w-6 fill-current animate-pulse" />
                  </div>

                  <div>
                    <h3 className="font-black text-white text-base leading-none">Support Fund</h3>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-1.5">
                      NACOS LASUSTECH Chapter
                    </p>
                  </div>

                  {/* Envelope Flap Accent Lines */}
                  <div className="absolute bottom-0 right-0 left-0 h-[4px] bg-gradient-to-r from-emerald-500 to-blue-500" />
                </motion.div>
              </div>
            </div>

            {/* Right: Donation Card Form */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden p-8 sm:p-10 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-md">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 leading-tight">Secure Donation</h2>
                  <p className="text-xs text-slate-400 font-medium">Any amount counts • Powered by Korapay</p>
                </div>
              </div>

              <form onSubmit={handleDonate} className="space-y-5">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-800 focus:border-primary focus:bg-white outline-none transition-all shadow-inner"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Your Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. sponsor@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-800 focus:border-primary focus:bg-white outline-none transition-all shadow-inner"
                  />
                </div>

                {/* Support Tiers Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Select Support Tier</label>
                  <div className="grid grid-cols-3 gap-2">
                    {QUICK_AMOUNTS.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleQuickAmount(val)}
                        className={`rounded-xl border py-2.5 text-xs font-black transition-all ${
                          amount === val
                            ? "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/20 scale-[1.03]"
                            : "border-slate-200 bg-white text-slate-600 hover:border-emerald-500/40 hover:bg-emerald-50/50"
                        }`}
                      >
                        ₦{val.toLocaleString()}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setAmount("")}
                      className={`rounded-xl border py-2.5 text-xs font-black transition-all ${
                        amount !== "" && !QUICK_AMOUNTS.includes(amount as number)
                          ? "border-emerald-500 bg-emerald-500 text-white shadow-md scale-[1.03]"
                          : "border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      Custom
                    </button>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Donation Amount (₦)</label>
                  <input
                    type="number"
                    min={100}
                    required
                    placeholder="Enter custom amount..."
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-800 focus:border-primary focus:bg-white outline-none transition-all shadow-inner"
                  />
                </div>

                {/* Secure checkout info */}
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-[10px] text-slate-400 leading-normal flex items-start gap-2 select-none">
                  <HelpCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                  Your donation is securely routed through the Korapay Checkout gateway. Receipts are issued automatically.
                </div>

                {/* CTA Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-base shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/45 transition-all flex items-center justify-center gap-2"
                >
                  <Heart className="h-5 w-5 fill-current" />
                  {loading ? "Preparing Secure Checkout..." : `Donate ₦${(amount || 0).toLocaleString()} Now`}
                </Button>
              </form>
            </motion.div>

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Donate;
