import Layout from "@/components/Layout";
import { Heart, Landmark, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";

const Donate = () => {
  return (
    <Layout>
      <section className="relative isolate overflow-hidden bg-[#08111d] py-14 md:py-20">
        <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(8,17,29,0.98)_0%,rgba(8,17,29,0.95)_40%,rgba(8,17,29,0.92)_100%)]" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -left-16 h-56 w-56 rounded-full bg-[#169B2D]/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#1F5FAF]/10 blur-3xl" />
        </div>

        <div className="container relative z-10 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
              <Heart className="h-6 w-6 fill-primary/10" />
            </div>
            <span className="block text-xs font-semibold uppercase tracking-widest text-primary">Support Our Chapter</span>
            <h1 className="mt-2 font-display text-3xl font-bold text-white md:text-5xl">
              Donate & Empower Future Tech Leaders
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/70">
              Your generous donations help NACOS LASUSTECH fund tech bootcamps, purchase lab resources, and support student innovation initiatives.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-background text-foreground">
        <div className="container max-w-4xl">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Bank Transfer Details */}
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1F5FAF]/10 text-[#1F5FAF] mb-6">
                <Landmark className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Direct Bank Transfer</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                You can support us directly by transferring your donation to the official chapter bank account.
              </p>

              <div className="mt-6 space-y-4 rounded-xl bg-muted p-5">
                <div>
                  <span className="block text-xs text-muted-foreground uppercase font-semibold">Bank Name</span>
                  <span className="font-semibold text-sm">Providus Bank</span>
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground uppercase font-semibold">Account Name</span>
                  <span className="font-semibold text-sm">NACOS LASUSTECH</span>
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground uppercase font-semibold">Account Number</span>
                  <span className="font-mono font-bold text-lg text-[#1F5FAF]">1024567890</span>
                </div>
              </div>
            </div>

            {/* Online Payment */}
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#169B2D]/10 text-[#169B2D] mb-6">
                  <Coins className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Donate Online</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Quickly send your donation securely online using your debit card or bank transfer.
                </p>
              </div>

              <div className="mt-8">
                <Button className="w-full h-12 rounded-xl bg-[#1F5FAF] font-bold text-white hover:bg-[#184d90] transition shadow-lg shadow-blue-500/20">
                  Proceed to Secure Pay
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Secured by Korapay / Paystack
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Donate;
