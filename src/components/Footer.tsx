import { useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Linkedin, Heart } from "lucide-react";
import nacosLogo from "@/assets/nacos_logo.png";
import lasustechLogo from "@/assets/lasustech_logo.png";
import LoginModal from "@/components/LoginModal";

// Real X (Twitter) Logo SVG
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// Real WhatsApp Logo SVG
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

// Real TikTok Logo SVG
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47-.13-.1-.23-.21-.35-.32-.01 2.34.02 4.67-.01 7-.04 1.61-.41 3.23-1.28 4.59-1.39 2.24-3.9 3.54-6.52 3.51-2.91-.03-5.63-1.87-6.73-4.57-1.12-2.73-.39-6.09 1.81-8.1 1.09-.99 2.52-1.6 4-1.74 v4.07c-1.33.15-2.6 1.01-2.99 2.3-.42 1.34.07 2.87 1.19 3.69 1.1 0.81 2.66 0.8 3.73-.02 0.83-0.63 1.25-1.65 1.25-2.68V.02z"/>
  </svg>
);

const quickLinks = [
  { label: "Home", path: "/" },
  { label: "Executives", path: "/executives" },
  { label: "Events", path: "/events" },
  { label: "Blog", path: "/blog" },
  { label: "Contact Us", path: "/contact" },
];

const resourceLinks = [
  { label: "Pay Dues", path: "#", action: "login" },
  { label: "ID Card", path: "#", action: "login" },
  { label: "Constitution", path: "/constitution" },
  { label: "Visit NACOS National", path: "https://nacos.ng", isExternal: true },
];

const Footer = () => {
  const [loginOpen, setLoginOpen] = useState(false);

  const handleResourceClick = (link: typeof resourceLinks[0]) => {
    if (link.action === "login") {
      setLoginOpen(true);
    }
  };

  return (
    <footer className="relative isolate overflow-hidden border-t border-white/10 bg-[#08111d]">
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      {/* subtle gradient */}
      <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(8,17,29,0.98)_0%,rgba(8,17,29,0.95)_40%,rgba(8,17,29,0.92)_100%)]" />

      {/* soft color lights */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-16 -left-16 h-56 w-56 rounded-full bg-[#169B2D]/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#1F5FAF]/10 blur-3xl" />
      </div>

      <div className="container relative z-10 py-10 md:py-12">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="text-black">
            <div className="flex items-center gap-3">
              <a 
                href="https://nacos.org.ng" 
                target="_blank" 
                rel="noopener noreferrer"
                title="NACOS NATIONAL"
                className="transition-opacity hover:opacity-80"
              >
                <img
                  src={nacosLogo}
                  alt="NACOS NATIONAL"
                  className="h-12 w-auto object-contain"
                />
              </a>

              <a 
                href="https://lasustech.edu.ng" 
                target="_blank" 
                rel="noopener noreferrer"
                title="LASUSTECH"
                className="transition-opacity hover:opacity-80"
              >
                <img
                  src={lasustechLogo}
                  alt="LASUSTECH"
                  className="h-11 w-auto object-contain"
                />
              </a>

              <Link to="/" className="ml-1 hidden flex-col leading-tight sm:flex cursor-pointer">
                <span className="font-display text-white font-bold tracking-tight text-foreground">
                  NACOS LASUSTECH
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  Chapter
                </span>
              </Link>
            </div>

            <p className="mt-5 max-w-xs text-sm leading-7 text-white/65">
              Nigeria Computer Society, LASUSTECH Chapter. Building the next generation of computing professionals through learning, innovation, and community.
            </p>
          </div>

          {/* Quick Links */}
          <div className="text-black">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
              Quick Links
            </h4>

            <ul className="mt-5 space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="text-black">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
              Resources
            </h4>

            <ul className="mt-5 space-y-3">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  {link.isExternal ? (
                    <a
                      href={link.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-white/60 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  ) : link.action === "login" ? (
                    <button
                      onClick={() => handleResourceClick(link)}
                      className="text-sm text-white/60 transition-colors hover:text-white text-left"
                    >
                      {link.label}
                    </button>
                  ) : (
                    <Link
                      to={link.path}
                      className="text-sm text-white/60 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="text-black">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
              Contact
            </h4>

            <ul className="mt-5 space-y-3 text-sm text-white/65">
              <li>
                <a 
                  href="mailto:nacoslasustech@gmail.com" 
                  className="transition-colors hover:text-white"
                >
                  nacoslasustech@gmail.com
                </a>
              </li>
              <li>LASUSTECH, Ikorodu, Lagos</li>
            </ul>

            <div className="mt-6 flex flex-wrap gap-4">
              <a
                href="https://www.facebook.com/share/1ApD4QSPDW/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-[#1877F2] hover:text-white"
                title="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>

              {/* <a
                href="https://twitter.com/nacoslasustech"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-black hover:text-white"
                title="X (Twitter)"
              >
                <XIcon className="h-3.5 w-3.5" />
              </a> */}

              <a
                href="https://instagram.com/nacoslasustech"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-[#E4405F] hover:text-white"
                title="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>

              <a
                href="https://www.tiktok.com/@nacoslasustech2"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-[#EE1D52] hover:text-white"
                title="TikTok"
              >
                <TikTokIcon className="h-3.5 w-3.5" />
              </a>

              <a
                href="https://www.linkedin.com/in/nacos-lasustech-3aa8833b3?trk=contact-info"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-[#0A66C2] hover:text-white"
                title="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>

              <a
                href="https://wa.me/2348144296322"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-[#25D366] hover:text-white"
                title="WhatsApp"
              >
                <WhatsAppIcon className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* bottom */}
        <div className="mt-10 border-t border-white/5 pt-6 text-center text-[10px]">
          <p className="text-white/30">
            © {new Date().getFullYear()} NACOS LASUSTECH Chapter. All rights reserved.
          </p>
          <div className="mt-3 flex flex-col items-center gap-2 text-white/30 md:flex-row md:justify-center md:gap-6">
            <p className="flex items-center gap-1">
              Built with <Heart className="h-3 w-3 fill-pink-500/40 text-pink-500/40" /> by{" "}
              <span className="text-white/50 space-x-1">
                <a href="https://tmb.it.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors underline underline-offset-4">TMB</a>,
                <a href="#" className="hover:text-white transition-colors underline underline-offset-4">Muqtech</a>,
                <a href="#" className="hover:text-white transition-colors underline underline-offset-4">DevMoh</a>,
                & <a href="#" className="hover:text-white transition-colors underline underline-offset-4">C'est BroCode</a>
              </span>
            </p>
            <p className="hidden md:block opacity-10">|</p>
            <p>Photo Credit: <a href="https://lasustech.edu.ng" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Newton Media</a></p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;