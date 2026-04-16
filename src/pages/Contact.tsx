import { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Message sent", description: "Thank you for reaching out. We will get back to you soon." });
    setForm({ name: "", email: "", message: "" });
  };

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
                  { icon: Mail, label: "Email", value: "nacoslasustech@gmail.com" },
                  { icon: MapPin, label: "Address", value: "Lagos State University of Science and Technology, Ikorodu, Lagos State" },
                  { icon: Phone, label: "Phone", value: "+234 800 000 0000" },
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
              <div className="mt-3 flex gap-4">
                {[
                  { label: "Twitter", href: "https://twitter.com/nacoslasustech" },
                  { label: "Instagram", href: "https://instagram.com/nacoslasustech" },
                  { label: "WhatsApp", href: "https://wa.me/2348000000000" },
                ].map((link) => (
                  <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-secondary hover:underline">
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-display text-lg font-bold text-foreground">Send a Message</h3>
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-medium text-foreground">Full Name</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="mt-1"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Email Address</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="mt-1"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Message</label>
                  <Textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    required
                    className="mt-1 min-h-[120px]"
                    placeholder="How can we help?"
                  />
                </div>
                <Button type="submit" className="w-full font-semibold">
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
