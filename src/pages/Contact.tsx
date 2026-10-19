import { useLocation } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import Layout from "@/components/Layout";
import FeedbackForm, { FeedbackKind } from "@/components/FeedbackForm";

const Contact = () => {
  const { hash } = useLocation();
  const startKind: FeedbackKind = hash === "#complaint" ? "complaint" : hash === "#suggestion" ? "suggestion" : "message";

  return (
    <Layout>
      <section className="bg-foreground py-14 md:py-20">
        <div className="container">
          <div className="max-w-lg">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Contact</span>
            <h1 className="mt-2 font-display text-3xl font-bold text-white md:text-4xl">Get in Touch</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Have questions or want to get involved? Reach out to us.
            </p>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">Contact Information</h3>
              <div className="mt-6 space-y-4">
                {[
                  { icon: Mail, label: "Email", value: "nacoslasustech01@gmail.com" },
                  { icon: MapPin, label: "Address", value: "Lagos State University of Science and Technology, Ikorodu, Lagos State" },
                  { icon: Phone, label: "Phone", value: "+234 802 632 2742" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/8 text-primary">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="mt-8 font-display text-lg font-bold text-foreground">Follow Us</h3>
              <div className="mt-3 flex flex-wrap gap-4">
                {[
                  { label: "Facebook", href: "https://www.facebook.com/share/1ApD4QSPDW/?mibextid=wwXIfr" },
                  { label: "Instagram", href: "https://instagram.com/nacoslasustech" },
                  { label: "X (Twitter)", href: "https://x.com/nacoslasustech" },
                  { label: "TikTok", href: "https://www.tiktok.com/@nacoslasustech" },
                  { label: "LinkedIn", href: "https://www.linkedin.com/company/nacos-lasustech" },
                ].map((link) => (
                  <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-secondary hover:underline">
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div id="feedback" className="scroll-mt-24">
              <h3 className="font-display text-lg font-bold text-foreground">Message, Suggestion or Complaint</h3>
              <p className="mt-1 text-xs text-muted-foreground">Pick one below. Suggestions and complaints can be sent anonymously.</p>
              <FeedbackForm key={startKind} defaultKind={startKind} className="mt-5" />
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
