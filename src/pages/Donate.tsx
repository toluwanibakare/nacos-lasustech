import { useState } from "react";
import Layout from "@/components/Layout";
import { Heart, Send, ShieldCheck, Sparkles, CheckCircle2, Award, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";

const QUICK_AMOUNTS = [2000, 5000, 10000, 25000, 50000];

const Donate = () => {
  const [amount, setAmount] = useState<number | "">("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
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

    if (!isAnonymous && (!email || !name)) {
      toast({
        title: "Missing Information",
        description: "Please provide your name and email, or select 'Donate Anonymously'.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const finalName = isAnonymous ? (name.trim() || "Anonymous Donor") : name;
    const finalEmail = isAnonymous ? (email.trim() || "anonymous@nacos-lasustech.org") : email;

    try {
      const res = await fetchApi("/payments/donate", {
        method: "POST",
        body: JSON.stringify({
          email: finalEmail,
          amount: Number(amount),
          full_name: finalName,
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
      {/* Page Header Banner matching other pages */}
      <section className="bg-foreground py-14 md:py-20">
        <div className="container">
          <div className="max-w-lg">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Support NACOS</span>
            <h1 className="mt-2 font-display text-3xl font-bold text-white md:text-4xl">Empower Computing Leaders</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Your contributions directly support student tech workshops, computing bootcamps, project grants, and department growth.
            </p>
          </div>
        </div>
      </section>

      {/* Main Section */}
      <section className="py-14 md:py-20 bg-background">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 items-start">
            
            {/* Left: Impact & Info */}
            <div className="space-y-8">
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">Why Your Support Matters</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  The NACOS LASUSTECH Chapter is focused on bridging the gap between classroom learning and real-world tech innovation. Every donation helps equip the next generation of software engineers, AI researchers, and tech leaders.
                </p>
              </div>

              {/* Impact Cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    icon: Sparkles,
                    title: "Tech Bootcamps",
                    desc: "Sponsor hands-on technical workshops, upscaling sessions, and industry mentorship."
                  },
                  {
                    icon: Award,
                    title: "Student Projects",
                    desc: "Fund innovative research, hackathon participation, and software development projects."
                  },
                  {
                    icon: Heart,
                    title: "Student Welfare",
                    desc: "Provide learning materials, tools, and technical resources to deserving students."
                  },
                  {
                    icon: ShieldCheck,
                    title: "Transparent Allocation",
                    desc: "Every naira donated is transparently accounted for and utilized directly for student growth."
                  }
                ].map((item, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/30">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h4 className="font-display text-sm font-bold text-foreground">{item.title}</h4>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-border bg-muted/30 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Instant Digital Receipt</h4>
                    <p className="text-xs text-muted-foreground">An automated receipt is generated and emailed to you immediately after transaction completion.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Donation Form Card */}
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 border-b border-border pb-5 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">Make a Secure Donation</h3>
                  <p className="text-xs text-muted-foreground">Powered by Korapay Secure Gateway</p>
                </div>
              </div>

              <form onSubmit={handleDonate} className="space-y-5">
                {/* Anonymous Donation Checkbox */}
                <div className="flex items-center space-x-2 rounded-xl border border-border bg-muted/30 p-3">
                  <Checkbox
                    id="anonymous"
                    checked={isAnonymous}
                    onCheckedChange={(checked) => setIsAnonymous(!!checked)}
                  />
                  <label
                    htmlFor="anonymous"
                    className="text-xs font-semibold text-foreground cursor-pointer select-none flex items-center gap-1.5"
                  >
                    <UserCheck className="h-3.5 w-3.5 text-primary" />
                    Donate Anonymously (Name & Email optional)
                  </label>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground flex justify-between">
                    <span>Full Name</span>
                    {isAnonymous && <span className="text-muted-foreground font-normal">(Optional)</span>}
                  </label>
                  <Input
                    type="text"
                    required={!isAnonymous}
                    placeholder={isAnonymous ? "Anonymous Donor" : "e.g. John Doe"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground flex justify-between">
                    <span>Email Address</span>
                    {isAnonymous && <span className="text-muted-foreground font-normal">(Optional)</span>}
                  </label>
                  <Input
                    type="email"
                    required={!isAnonymous}
                    placeholder={isAnonymous ? "Optional for receipt" : "e.g. john@example.com"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Select Support Tier</label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {QUICK_AMOUNTS.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleQuickAmount(val)}
                        className={`rounded-lg border py-2.5 text-xs font-semibold transition-all ${
                          amount === val
                            ? "border-primary bg-primary text-white shadow-sm"
                            : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        ₦{val.toLocaleString()}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setAmount("")}
                      className={`rounded-lg border py-2.5 text-xs font-semibold transition-all ${
                        amount !== "" && !QUICK_AMOUNTS.includes(amount as number)
                          ? "border-primary bg-primary text-white shadow-sm"
                          : "border-border bg-background text-foreground hover:border-primary/50"
                      }`}
                    >
                      Custom
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Donation Amount (₦)</label>
                  <Input
                    type="number"
                    min={100}
                    required
                    placeholder="Enter amount in Naira..."
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                    className="mt-1"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 font-semibold gap-2"
                >
                  <Heart className="h-4 w-4 fill-current" />
                  {loading ? "Initializing Payment..." : `Donate ₦${(amount || 0).toLocaleString()} Now`}
                </Button>

                <p className="text-center text-[11px] text-muted-foreground">
                  Transactions are encrypted and processed securely via Korapay.
                </p>
              </form>
            </div>

          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Donate;


